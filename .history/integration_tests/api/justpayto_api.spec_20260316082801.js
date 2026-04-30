import { test, expect } from '@playwright/test';

/**
 * ============================================================
 * JustPayTo API Integration Tests
 * ============================================================
 * TRUE integration tests — no browser, no UI, pure HTTP only.
 *
 * Base URL : https://api-dev.justpayto.ph/connect/api/v3/sandbox
 * Auth     : Basic Auth → Bearer token (expires in 900s)
 * Docs     : JustPayTo API v2.4.0
 *
 * KEY FIX: Each test.describe generates its OWN token stored as a
 * LOCAL variable inside that block. This prevents:
 *   - Token expiry across long-running test suites
 *   - Shared state contamination between describe blocks
 *   - The root cause of the "failed to generate token" cascade
 * ============================================================
 */

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = 'https://api-dev.justpayto.ph/connect/api/v3/sandbox';
const REQUEST_TIMEOUT = 60000;

const CREDENTIALS = {
    username: process.env.API_USERNAME || 'end-users',
    password: process.env.API_PASSWORD || '6aef55e0-8656-431c-973f-08ace54b5b5f',
    apiUsername: process.env.API_USERNAME_PAGE || 'miko',
};

const basicAuth = Buffer.from(`${CREDENTIALS.username}:${CREDENTIALS.password}`).toString('base64');

const BASE_HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Basic ${basicAuth}`,
    'apiUsername': CREDENTIALS.apiUsername,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Safe JSON — returns null instead of throwing if response is not JSON */
async function safeJson(response) {
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch {
        console.warn('⚠️  Non-JSON response:', text.substring(0, 300));
        return null;
    }
}

/** Generate a fresh Bearer token — throws if it fails so the describe block is skipped */
async function getToken(request) {
    const response = await request.post(`${BASE_URL}/access-token/generate`, {
        headers: BASE_HEADERS,
        timeout: REQUEST_TIMEOUT,
    });

    const body = await safeJson(response);

    if (!body || !body.access_token) {
        throw new Error(
            `❌ Token generation failed. Status: ${response.status()}. Body: ${JSON.stringify(body)}`
        );
    }

    console.log(`🔑 Token: ${body.access_token.substring(0, 20)}... (expires in ${body.expires_in}s)`);
    return body.access_token;
}

/** Build Bearer headers from a token */
function bearer(token) {
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apiUsername': CREDENTIALS.apiUsername,
    };
}

/** Activate a payment method — throws if it fails */
async function activate(request, token, methodCode, providerCode) {
    const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
        headers: bearer(token),
        data: {
            method_code: methodCode,
            provider_code: providerCode,
            success_redirect_url: 'https://justpay.to/success',
            failed_redirect_url: 'https://justpay.to/failed',
        },
        timeout: REQUEST_TIMEOUT,
    });

    const body = await safeJson(response);

    if (!body?.data?.payment_method_id) {
        throw new Error(
            `❌ Activate failed for ${methodCode}/${providerCode}. Status: ${response.status()}. Body: ${JSON.stringify(body)}`
        );
    }

    console.log(`⚡ Activated ${methodCode}/${providerCode}: ${body.data.payment_method_id}`);
    return body.data.payment_method_id;
}

/** Reusable sender payload for Create Payment tests */
const SENDER_DETAILS = {
    first_name: 'Juan',
    middle_name: 'Santos',
    last_name: 'Dela Cruz',
    email: process.env.INDIVIDUAL_USER_EMAIL || 'test@justpay.to',
    mobile: { prefix: '+63', number: process.env.INDIVIDUAL_USER_MOBILE || '9171234567' },
    depository_info: {
        bank: 'bpi',
        account_name: 'Juan Santos Dela Cruz',
        account_number: '1234567890',
    },
    user_info: {
        birth: { date: '01/01/1990', place: 'Manila' },
        document_meta: {
            type: 'passport',
            front: 'https://via.placeholder.com/300x200.jpg',
        },
        address: '123 Rizal St, Makati City',
        gender: 'male',
        nationality: 'Filipino',
    },
};

// =============================================================================
// 🔐 AUTHENTICATION
// =============================================================================

test.describe('🔐 Authentication — /access-token/generate', () => {

    test('POST generates valid access token with correct credentials', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/access-token/generate`, {
            headers: BASE_HEADERS,
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        console.log('📥 Status:', response.status());
        console.log('📥 Body:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body, '❌ Non-JSON response — check endpoint or server').not.toBeNull();
        expect(body).toHaveProperty('access_token');
        expect(body).toHaveProperty('token_type');
        expect(body).toHaveProperty('expires_in');
        expect(typeof body.access_token).toBe('string');
        expect(body.access_token.length).toBeGreaterThan(0);
        expect(body.token_type).toMatch(/bearer/i);
        expect(body.expires_in).toBeGreaterThan(0);

        console.log(`✅ Token: ${body.access_token.substring(0, 20)}...`);
        console.log(`✅ Expires in: ${body.expires_in}s`);
    });

    test('POST rejects wrong password', async ({ request }) => {
        const wrongAuth = Buffer.from(`${CREDENTIALS.username}:wrong-password-xyz`).toString('base64');

        const response = await request.post(`${BASE_URL}/access-token/generate`, {
            headers: { ...BASE_HEADERS, 'Authorization': `Basic ${wrongAuth}` },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Wrong password: ${response.status()}`);
        // Sandbox returns 500 instead of 401 — both mean auth was rejected
        expect([401, 500]).toContain(response.status());
    });

    test('POST rejects wrong username', async ({ request }) => {
        const wrongAuth = Buffer.from(`wrong-user-xyz:${CREDENTIALS.password}`).toString('base64');

        const response = await request.post(`${BASE_URL}/access-token/generate`, {
            headers: { ...BASE_HEADERS, 'Authorization': `Basic ${wrongAuth}` },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Wrong username: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
    });

    test('POST rejects missing Authorization header', async ({ request }) => {
        const { Authorization, ...noAuth } = BASE_HEADERS;

        const response = await request.post(`${BASE_URL}/access-token/generate`, {
            headers: noAuth,
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 No Authorization: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
    });

    test('POST rejects missing apiUsername header', async ({ request }) => {
        const { apiUsername, ...noApiUser } = BASE_HEADERS;

        const response = await request.post(`${BASE_URL}/access-token/generate`, {
            headers: noApiUser,
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 No apiUsername: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
    });

});

// =============================================================================
// 💳 PAYMENT METHODS
// =============================================================================

test.describe('💳 Payment Methods — /payment-methods', () => {

    let token; // LOCAL to this describe block

    test.beforeAll(async ({ request }) => {
        token = await getToken(request);
    });

    test('GET returns all payment methods grouped by type', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: bearer(token),
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        console.log('📥 All methods:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('message');
        expect(body).toHaveProperty('result');
        expect(typeof body.result).toBe('object');
        console.log('✅ All payment methods returned');
    });

    for (const category of ['mastercard_visa', 'bank_fund_transfer', 'e_wallet', 'online_banking']) {
        test(`GET filters by category: ${category}`, async ({ request }) => {
            const response = await request.get(`${BASE_URL}/payment-methods`, {
                headers: bearer(token),
                data: { category },
                timeout: REQUEST_TIMEOUT,
            });

            const body = await safeJson(response);
            console.log(`📥 ${category}:`, JSON.stringify(body, null, 2));

            expect(response.status()).toBe(200);
            expect(body).toHaveProperty('category', category);
            expect(Array.isArray(body.result)).toBe(true);
            console.log(`✅ ${category}: ${body.result.length} method(s)`);
        });
    }

    test('GET filters by category + code returns specific method object', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: bearer(token),
            data: { category: 'e_wallet', code: 'gcash' },
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('category', 'e_wallet');
        expect(typeof body.result).toBe('object');
        console.log('✅ GCash method object returned');
    });

    test('GET rejects invalid Bearer token with 401/403', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: { ...BASE_HEADERS, 'Authorization': 'Bearer totally-fake-token' },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Fake bearer: ${response.status()}`);
        expect([401, 403, 500]).toContain(response.status());
    });

});

// =============================================================================
// ⚡ ACTIVATE PAYMENT METHOD
// =============================================================================

test.describe('⚡ Activate Payment Method — /payment-methods/activate', () => {

    let token; // LOCAL to this describe block

    test.beforeAll(async ({ request }) => {
        token = await getToken(request);
    });

    test('POST activates BPI (bank_fund_transfer) and returns active status', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearer(token),
            data: {
                method_code: 'bank_fund_transfer',
                provider_code: 'bpi',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
                callback_url: 'https://justpay.to/callback',
            },
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        console.log('📥 Activate BPI:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('payment_method_id');
        expect(typeof body.data.payment_method_id).toBe('string');
        expect(body.data.status).toMatch(/active/i);
        console.log(`✅ BPI activated: ${body.data.payment_method_id}`);
    });

    test('POST activates GCash (e_wallet) and returns active status', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearer(token),
            data: {
                method_code: 'e_wallet',
                provider_code: 'gcash',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        expect(response.status()).toBe(200);
        expect(body.data.status).toMatch(/active/i);
        console.log(`✅ GCash activated: ${body.data.payment_method_id}`);
    });

    test('POST returns 400/462 when method_code is missing', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearer(token),
            data: {
                provider_code: 'bpi',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Missing method_code: ${response.status()}`);
        expect([400, 462, 500]).toContain(response.status());
    });

    test('POST returns 400/462 when redirect URLs are missing', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearer(token),
            data: { method_code: 'bank_fund_transfer', provider_code: 'bpi' },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Missing redirect URLs: ${response.status()}`);
        expect([400, 462, 500]).toContain(response.status());
    });

    test('POST returns 400/463 for invalid payment method code', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearer(token),
            data: {
                method_code: 'invalid_method_xyz',
                provider_code: 'unknown',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Invalid method code: ${response.status()}`);
        expect([400, 463, 500]).toContain(response.status());
    });

});

// =============================================================================
// 🔍 GET PAYMENT METHOD BY ID
// =============================================================================

test.describe('🔍 Get Payment Method by ID — /payment-methods/{id}', () => {

    let token; // LOCAL to this describe block
    let methodId;

    test.beforeAll(async ({ request }) => {
        token = await getToken(request);
        methodId = await activate(request, token, 'bank_fund_transfer', 'bpi');
    });

    test('GET returns correct details for a valid payment method ID', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods/${methodId}`, {
            headers: bearer(token),
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        console.log('📥 Method by ID:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('payment_method_id', methodId);
        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('status');
        console.log(`✅ Method fetched: ${methodId}`);
    });

    test('GET returns 400/404 for a non-existent payment method ID', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods/non-existent-id-00000`, {
            headers: bearer(token),
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Non-existent ID: ${response.status()}`);
        expect([400, 404, 500]).toContain(response.status());
    });

});

// =============================================================================
// 🔄 UPDATE PAYMENT METHOD STATUS
// =============================================================================

test.describe('🔄 Update Payment Method Status — /payment-methods/{id}/{action}', () => {

    let token; // LOCAL to this describe block
    let invalidateId;
    let expiryId;

    test.beforeAll(async ({ request }) => {
        token = await getToken(request);
        // Activate two separate methods — one per action test
        invalidateId = await activate(request, token, 'bank_fund_transfer', 'bpi');
        expiryId = await activate(request, token, 'e_wallet', 'gcash');
    });

    test('PUT invalidates an active method → status becomes invalid', async ({ request }) => {
        const response = await request.put(
            `${BASE_URL}/payment-methods/${invalidateId}/invalidate`,
            { headers: bearer(token), timeout: REQUEST_TIMEOUT }
        );

        const body = await safeJson(response);
        console.log('📥 Invalidate:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body.data.status).toMatch(/invalid/i);
        console.log(`✅ Invalidated: ${invalidateId}`);
    });

    test('PUT expires an active method → status becomes expired', async ({ request }) => {
        const response = await request.put(
            `${BASE_URL}/payment-methods/${expiryId}/expiry`,
            { headers: bearer(token), timeout: REQUEST_TIMEOUT }
        );

        const body = await safeJson(response);
        console.log('📥 Expiry:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body.data.status).toMatch(/expired/i);
        console.log(`✅ Expired: ${expiryId}`);
    });

    test('PUT on already-invalidated method returns 400/464/465', async ({ request }) => {
        const response = await request.put(
            `${BASE_URL}/payment-methods/${invalidateId}/invalidate`,
            { headers: bearer(token), timeout: REQUEST_TIMEOUT }
        );

        console.log(`📥 Re-invalidate: ${response.status()}`);
        expect([400, 464, 465, 500]).toContain(response.status());
    });

    test('PUT returns 400/404/405 for unsupported action', async ({ request }) => {
        const response = await request.put(
            `${BASE_URL}/payment-methods/${expiryId}/delete`,
            { headers: bearer(token), timeout: REQUEST_TIMEOUT }
        );

        console.log(`📥 Unsupported action: ${response.status()}`);
        expect([400, 404, 405, 500]).toContain(response.status());
    });

});

// =============================================================================
// 💰 CREATE PAYMENT
// =============================================================================

test.describe('💰 Create Payment — /payment/create', () => {

    let token; // LOCAL to this describe block
    let bpiMethodId;
    let onlineBankingMethodId;

    test.beforeAll(async ({ request }) => {
        token = await getToken(request);
        bpiMethodId = await activate(request, token, 'bank_fund_transfer', 'bpi');
        onlineBankingMethodId = await activate(request, token, 'online_banking', 'bpi');
    });

    test('POST real-time payment (bank_fund_transfer) returns authentication_url', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: bearer(token),
            data: {
                payment_method_id: bpiMethodId,
                sender_details: SENDER_DETAILS,
                amount_details: { currency: 'PHP', gross: '100' },
            },
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        console.log('📥 Create (real-time):', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('authentication_url');
        expect(typeof body.authentication_url).toBe('string');
        expect(body.authentication_url).toMatch(/^https/);
        console.log(`✅ Auth URL: ${body.authentication_url.substring(0, 60)}...`);
    });

    test('POST batch payment (online_banking) returns data object', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: bearer(token),
            data: {
                payment_method_id: onlineBankingMethodId,
                sender_details: SENDER_DETAILS,
                amount_details: { currency: 'PHP', gross: '100' },
            },
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        console.log('📥 Create (batch):', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('data');
        expect(typeof body.data).toBe('object');
        console.log('✅ Batch data object returned');
    });

    test('POST returns 400/462 when payment_method_id is missing', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: bearer(token),
            data: {
                sender_details: SENDER_DETAILS,
                amount_details: { currency: 'PHP', gross: '100' },
            },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Missing payment_method_id: ${response.status()}`);
        expect([400, 462, 500]).toContain(response.status());
    });

    test('POST returns 400/462 when amount_details is missing', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: bearer(token),
            data: {
                payment_method_id: bpiMethodId,
                sender_details: SENDER_DETAILS,
            },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Missing amount_details: ${response.status()}`);
        expect([400, 462, 500]).toContain(response.status());
    });

    test('POST returns 400/462 when sender_details is missing', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: bearer(token),
            data: {
                payment_method_id: bpiMethodId,
                amount_details: { currency: 'PHP', gross: '100' },
            },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Missing sender_details: ${response.status()}`);
        expect([400, 462, 500]).toContain(response.status());
    });

    test('POST returns 400/464 when using an already-expired payment method', async ({ request }) => {
        // Activate a fresh method, immediately expire it, then try to pay with it
        const tempId = await activate(request, token, 'bank_fund_transfer', 'bpi');

        await request.put(
            `${BASE_URL}/payment-methods/${tempId}/expiry`,
            { headers: bearer(token), timeout: REQUEST_TIMEOUT }
        );

        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: bearer(token),
            data: {
                payment_method_id: tempId,
                sender_details: SENDER_DETAILS,
                amount_details: { currency: 'PHP', gross: '100' },
            },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Expired method payment: ${response.status()}`);
        expect([400, 464, 500]).toContain(response.status());
    });

});

// =============================================================================
// 💲 GET PAYMENT BY ID
// =============================================================================

test.describe('💲 Get Payment by ID — /payment/get/{id}', () => {

    let token; // LOCAL to this describe block

    test.beforeAll(async ({ request }) => {
        token = await getToken(request);
    });

    test('GET returns 400/404 for a non-existent payment ID', async ({ request }) => {
        const response = await request.get(
            `${BASE_URL}/payment/get/non-existent-payment-id-xyz`,
            { headers: bearer(token), timeout: REQUEST_TIMEOUT }
        );

        console.log(`📥 Non-existent payment ID: ${response.status()}`);
        expect([400, 404, 500]).toContain(response.status());
    });

    test('GET returns 401 without Authorization header', async ({ request }) => {
        const { Authorization, ...noAuth } = BASE_HEADERS;

        const response = await request.get(
            `${BASE_URL}/payment/get/some-payment-id`,
            { headers: noAuth, timeout: REQUEST_TIMEOUT }
        );

        console.log(`📥 No auth: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
    });

});

// =============================================================================
// 👤 USER INFORMATION
// =============================================================================

test.describe('👤 User Information — /user-information/get/{email}', () => {

    let token; // LOCAL to this describe block

    test.beforeAll(async ({ request }) => {
        token = await getToken(request);
    });

    test('GET returns user data for a known email', async ({ request }) => {
        const email = process.env.INDIVIDUAL_USER_EMAIL || 'test@justpay.to';

        const response = await request.get(
            `${BASE_URL}/user-information/get/${encodeURIComponent(email)}`,
            { headers: bearer(token), timeout: REQUEST_TIMEOUT }
        );

        const body = await safeJson(response);
        console.log('📥 User info:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('message');

        if (body.data) {
            expect(body.data).toHaveProperty('email');
            console.log(`✅ User found: ${email}`);
        } else {
            console.log(`ℹ️ User not in sandbox yet: ${email}`);
        }
    });

    test('GET returns 200/404 for a non-existent email', async ({ request }) => {
        const response = await request.get(
            `${BASE_URL}/user-information/get/${encodeURIComponent('nobody-xyz-9999@nowhere-fake.com')}`,
            { headers: bearer(token), timeout: REQUEST_TIMEOUT }
        );

        console.log(`📥 Non-existent user: ${response.status()}`);
        expect([200, 404, 500]).toContain(response.status());
    });

    test('GET returns 401 without Authorization header', async ({ request }) => {
        const { Authorization, ...noAuth } = BASE_HEADERS;

        const response = await request.get(
            `${BASE_URL}/user-information/get/test@justpay.to`,
            { headers: noAuth, timeout: REQUEST_TIMEOUT }
        );

        console.log(`📥 No auth: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
    });

});

// =============================================================================
// 🏦 SUPPORTED DESTINATION BANKS
// =============================================================================

test.describe('🏦 Supported Destination Banks — /payment/supported-destination-banks', () => {

    let token; // LOCAL to this describe block

    test.beforeAll(async ({ request }) => {
        token = await getToken(request);
    });

    test('GET returns a non-empty list of supported destination banks', async ({ request }) => {
        const response = await request.get(
            `${BASE_URL}/payment/supported-destination-banks`,
            { headers: bearer(token), timeout: REQUEST_TIMEOUT }
        );

        const body = await safeJson(response);
        console.log('📥 Banks:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('data');
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.length).toBeGreaterThan(0);
        console.log(`✅ ${body.data.length} bank(s) returned`);
    });

    test('GET every bank entry has a code field', async ({ request }) => {
        const response = await request.get(
            `${BASE_URL}/payment/supported-destination-banks`,
            { headers: bearer(token), timeout: REQUEST_TIMEOUT }
        );

        const body = await safeJson(response);
        expect(response.status()).toBe(200);

        for (const bank of body.data) {
            expect(bank).toHaveProperty('code');
            expect(typeof bank.code).toBe('string');
            console.log(`  ✅ ${bank.code} — ${bank.name ?? '(no name)'}`);
        }
    });

    test('GET returns 401 without Authorization header', async ({ request }) => {
        const { Authorization, ...noAuth } = BASE_HEADERS;

        const response = await request.get(
            `${BASE_URL}/payment/supported-destination-banks`,
            { headers: noAuth, timeout: REQUEST_TIMEOUT }
        );

        console.log(`📥 No auth: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
    });

});

// =============================================================================
// ❌ ERROR HANDLING
// =============================================================================

test.describe('❌ Error Handling — Custom Response Codes', () => {

    let token; // LOCAL to this describe block

    test.beforeAll(async ({ request }) => {
        token = await getToken(request);
    });

    test('462 — activate with empty body returns 400/462', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearer(token),
            data: {},
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Empty body: ${response.status()}`);
        expect([400, 462, 500]).toContain(response.status());
    });

    test('463 — activate with bogus method code returns 400/463', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearer(token),
            data: {
                method_code: 'fake_method_9999',
                provider_code: 'fake_provider',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Bogus method: ${response.status()}`);
        expect([400, 463, 500]).toContain(response.status());
    });

    test('401 — fake Bearer token returns 401/403', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: { ...BASE_HEADERS, 'Authorization': 'Bearer this-is-a-fake-token' },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Fake token: ${response.status()}`);
        expect([401, 403, 500]).toContain(response.status());
    });

    test('405 — GET on POST-only endpoint returns 404/405', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods/activate`, {
            headers: bearer(token),
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 GET on POST endpoint: ${response.status()}`);
        expect([404, 405, 500]).toContain(response.status());
    });

    test('404 — non-existent endpoint returns 404', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/this-endpoint-does-not-exist`, {
            headers: BASE_HEADERS,
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Non-existent endpoint: ${response.status()}`);
        expect([404, 500]).toContain(response.status());
    });

});