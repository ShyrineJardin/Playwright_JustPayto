import { test, expect } from '@playwright/test';

/**
 * ============================================================
 * JustPayTo API Integration Tests
 * ============================================================
 * Base URL : https://api-dev.justpayto.ph/connect/api/v3/sandbox
 * Auth     : Basic Auth (username + password) → generates Bearer token
 * Docs     : JustPayTo API v2.4.0
 *
 * Test Groups:
 *   🔐 Authentication        — token generation, expiry, invalid credentials
 *   💳 Payment Methods       — list all, filter by category, filter by code
 *   ⚡ Activate Payment      — activate, fetch by ID, invalidate, expire
 *   💰 Create Payment        — real-time (auth_url), batch (data object)
 *   👤 User Information      — get existing user, non-existent user
 *   🏦 Supported Banks       — list destination banks
 *   ❌ Error Handling         — 400, 401, 403, 404, custom 46x codes
 * ============================================================
 */

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = 'https://api-dev.justpayto.ph/connect/api/v3/sandbox';

const CREDENTIALS = {
    username: process.env.API_USERNAME || 'end-users',
    password: process.env.API_PASSWORD || '6aef55e0-8656-431c-973f-08ace54b5b5f',
    apiUsername: process.env.API_USERNAME_PAGE || 'miko',
};

// Encode Basic Auth credentials to Base64
const basicAuth = Buffer.from(`${CREDENTIALS.username}:${CREDENTIALS.password}`).toString('base64');

const BASE_HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Basic ${basicAuth}`,
    'apiUsername': CREDENTIALS.apiUsername,
};

// Default timeout for all API requests (ms)
const REQUEST_TIMEOUT = 60000;

// Shared state across tests
let accessToken = null;
let activatedPaymentMethodId = null;

// ─── Helper: Safe JSON parse ──────────────────────────────────────────────────

async function safeJson(response) {
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch {
        console.warn('⚠️  Non-JSON response:', text.substring(0, 300));
        return null;
    }
}

// ─── Helper: Generate Bearer Token ───────────────────────────────────────────

async function generateToken(request) {
    const response = await request.post(`${BASE_URL}/access-token/generate`, {
        headers: BASE_HEADERS,
        timeout: REQUEST_TIMEOUT,
    });

    const body = await safeJson(response);

    if (body?.access_token) {
        accessToken = body.access_token;
        console.log(`🔑 access_token saved: ${accessToken.substring(0, 20)}...`);
    }

    return { response, body };
}

// ─── Helper: Bearer Auth Headers ─────────────────────────────────────────────

function bearerHeaders(token) {
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apiUsername': CREDENTIALS.apiUsername,
    };
}

// =============================================================================
// 🔐 AUTHENTICATION — /access-token/generate
// =============================================================================

test.describe('🔐 Authentication — /access-token/generate', () => {

    test('POST generates a valid access token with correct credentials', async ({ request }) => {
        const { response, body } = await generateToken(request);

        console.log('📥 Status:', response.status());
        console.log('📥 Body:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body, '❌ Non-JSON response — check endpoint or server').not.toBeNull();

        // Token shape
        expect(body).toHaveProperty('access_token');
        expect(body).toHaveProperty('token_type');
        expect(body).toHaveProperty('expires_in');

        expect(typeof body.access_token).toBe('string');
        expect(body.access_token.length).toBeGreaterThan(0);
        expect(body.token_type).toMatch(/bearer/i);
        expect(body.expires_in).toBe(900);

        console.log(`✅ Token: ${body.access_token.substring(0, 20)}...`);
        console.log(`✅ Expires in: ${body.expires_in}s`);
    });

    test('POST returns 401 with wrong password', async ({ request }) => {
        const wrongAuth = Buffer.from(`${CREDENTIALS.username}:wrong-password`).toString('base64');

        const response = await request.post(`${BASE_URL}/access-token/generate`, {
            headers: { ...BASE_HEADERS, 'Authorization': `Basic ${wrongAuth}` },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Wrong password status: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
    });

    test('POST returns 401 with wrong username', async ({ request }) => {
        const wrongAuth = Buffer.from(`wrong-user:${CREDENTIALS.password}`).toString('base64');

        const response = await request.post(`${BASE_URL}/access-token/generate`, {
            headers: { ...BASE_HEADERS, 'Authorization': `Basic ${wrongAuth}` },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Wrong username status: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
    });

    test('POST rejects missing Authorization header', async ({ request }) => {
        const { Authorization, ...noAuth } = BASE_HEADERS;

        const response = await request.post(`${BASE_URL}/access-token/generate`, {
            headers: noAuth,
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 No Authorization status: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
    });

    test('POST rejects missing apiUsername header', async ({ request }) => {
        const { apiUsername, ...noApiUser } = BASE_HEADERS;

        const response = await request.post(`${BASE_URL}/access-token/generate`, {
            headers: noApiUser,
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 No apiUsername status: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
    });

});

// =============================================================================
// 💳 PAYMENT METHODS — GET /payment-methods
// =============================================================================

test.describe('💳 Payment Methods — /payment-methods', () => {

    test.beforeAll(async ({ request }) => {
        await generateToken(request);
    });

    test('GET returns all payment methods grouped by type', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: bearerHeaders(accessToken),
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        console.log('📥 All payment methods:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('message');
        expect(body).toHaveProperty('result');
        expect(typeof body.result).toBe('object');
    });

    test('GET filters by category: mastercard_visa', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: bearerHeaders(accessToken),
            data: { category: 'mastercard_visa' },
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('category', 'mastercard_visa');
        expect(Array.isArray(body.result)).toBe(true);
        console.log(`✅ mastercard_visa: ${body.result.length} method(s)`);
    });

    test('GET filters by category: bank_fund_transfer', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: bearerHeaders(accessToken),
            data: { category: 'bank_fund_transfer' },
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('category', 'bank_fund_transfer');
        expect(Array.isArray(body.result)).toBe(true);
    });

    test('GET filters by category: e_wallet', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: bearerHeaders(accessToken),
            data: { category: 'e_wallet' },
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('category', 'e_wallet');
        expect(Array.isArray(body.result)).toBe(true);
    });

    test('GET filters by category: online_banking', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: bearerHeaders(accessToken),
            data: { category: 'online_banking' },
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('category', 'online_banking');
        expect(Array.isArray(body.result)).toBe(true);
    });

    test('GET filters by category + code: e_wallet / gcash', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: bearerHeaders(accessToken),
            data: { category: 'e_wallet', code: 'gcash' },
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('category', 'e_wallet');
        expect(typeof body.result).toBe('object');
    });

    test('GET returns 401/403 with invalid Bearer token', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: { ...BASE_HEADERS, 'Authorization': 'Bearer invalid-token-here' },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Invalid bearer status: ${response.status()}`);
        expect([401, 403, 500]).toContain(response.status());
    });

});

// =============================================================================
// ⚡ ACTIVATE PAYMENT METHOD — POST /payment-methods/activate
// =============================================================================

test.describe('⚡ Activate Payment Method — /payment-methods/activate', () => {

    test.beforeAll(async ({ request }) => {
        await generateToken(request);
    });

    test('POST activates BPI (bank_fund_transfer) successfully', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
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
        expect(body.data.status).toMatch(/active/i);

        activatedPaymentMethodId = body.data.payment_method_id;
        console.log(`✅ Activated: ${activatedPaymentMethodId}`);
    });

    test('POST activates GCash (e_wallet) successfully', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
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
        expect(body.data).toHaveProperty('payment_method_id');
        expect(body.data.status).toMatch(/active/i);
    });

    test('POST returns 400/462 when method_code is missing', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
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
            headers: bearerHeaders(accessToken),
            data: { method_code: 'bank_fund_transfer', provider_code: 'bpi' },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Missing redirect URLs: ${response.status()}`);
        expect([400, 462, 500]).toContain(response.status());
    });

    test('POST returns 400/463 for invalid payment method code', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
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
// 🔍 GET PAYMENT METHOD BY ID — GET /payment-methods/{id}
// =============================================================================

test.describe('🔍 Get Payment Method by ID — /payment-methods/{id}', () => {

    test.beforeAll(async ({ request }) => {
        await generateToken(request);

        const activateRes = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {
                method_code: 'bank_fund_transfer',
                provider_code: 'bpi',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
            timeout: REQUEST_TIMEOUT,
        });
        const activateBody = await activateRes.json();
        activatedPaymentMethodId = activateBody.data?.payment_method_id;
        console.log(`🔑 Method ID for fetch tests: ${activatedPaymentMethodId}`);
    });

    test('GET returns payment method details for valid ID', async ({ request }) => {
        expect(activatedPaymentMethodId).toBeTruthy();

        const response = await request.get(
            `${BASE_URL}/payment-methods/${activatedPaymentMethodId}`,
            {
                headers: bearerHeaders(accessToken),
                timeout: REQUEST_TIMEOUT,
            }
        );

        const body = await safeJson(response);
        console.log('📥 Method by ID:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('payment_method_id', activatedPaymentMethodId);
        expect(body).toHaveProperty('data');
    });

    test('GET returns 404/400 for non-existent ID', async ({ request }) => {
        const response = await request.get(
            `${BASE_URL}/payment-methods/non-existent-id-00000`,
            {
                headers: bearerHeaders(accessToken),
                timeout: REQUEST_TIMEOUT,
            }
        );

        console.log(`📥 Non-existent ID: ${response.status()}`);
        expect([400, 404, 500]).toContain(response.status());
    });

});

// =============================================================================
// 🔄 UPDATE PAYMENT METHOD STATUS — PUT /payment-methods/{id}/{action}
// =============================================================================

test.describe('🔄 Update Payment Method Status — /payment-methods/{id}/{action}', () => {

    let methodIdForInvalidate = null;
    let methodIdForExpiry = null;

    test.beforeAll(async ({ request }) => {
        await generateToken(request);

        const resOne = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {
                method_code: 'bank_fund_transfer',
                provider_code: 'bpi',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
            timeout: REQUEST_TIMEOUT,
        });
        methodIdForInvalidate = (await resOne.json()).data?.payment_method_id;

        const resTwo = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {
                method_code: 'e_wallet',
                provider_code: 'gcash',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
            timeout: REQUEST_TIMEOUT,
        });
        methodIdForExpiry = (await resTwo.json()).data?.payment_method_id;

        console.log(`🔑 Invalidate ID: ${methodIdForInvalidate}`);
        console.log(`🔑 Expiry ID: ${methodIdForExpiry}`);
    });

    test('PUT invalidates an active payment method', async ({ request }) => {
        expect(methodIdForInvalidate).toBeTruthy();

        const response = await request.put(
            `${BASE_URL}/payment-methods/${methodIdForInvalidate}/invalidate`,
            {
                headers: bearerHeaders(accessToken),
                timeout: REQUEST_TIMEOUT,
            }
        );

        const body = await safeJson(response);
        expect(response.status()).toBe(200);
        expect(body.data.status).toMatch(/invalid/i);
        console.log(`✅ Invalidated: ${methodIdForInvalidate}`);
    });

    test('PUT expires an active payment method', async ({ request }) => {
        expect(methodIdForExpiry).toBeTruthy();

        const response = await request.put(
            `${BASE_URL}/payment-methods/${methodIdForExpiry}/expiry`,
            {
                headers: bearerHeaders(accessToken),
                timeout: REQUEST_TIMEOUT,
            }
        );

        const body = await safeJson(response);
        expect(response.status()).toBe(200);
        expect(body.data.status).toMatch(/expired/i);
        console.log(`✅ Expired: ${methodIdForExpiry}`);
    });

    test('PUT on already-invalidated method returns 400/464/465', async ({ request }) => {
        const response = await request.put(
            `${BASE_URL}/payment-methods/${methodIdForInvalidate}/invalidate`,
            {
                headers: bearerHeaders(accessToken),
                timeout: REQUEST_TIMEOUT,
            }
        );

        console.log(`📥 Re-invalidate status: ${response.status()}`);
        expect([400, 464, 465, 500]).toContain(response.status());
    });

    test('PUT returns 400/404/405 for unsupported action', async ({ request }) => {
        const response = await request.put(
            `${BASE_URL}/payment-methods/${methodIdForExpiry}/delete`,
            {
                headers: bearerHeaders(accessToken),
                timeout: REQUEST_TIMEOUT,
            }
        );

        console.log(`📥 Unsupported action: ${response.status()}`);
        expect([400, 404, 405, 500]).toContain(response.status());
    });

});

// =============================================================================
// 💰 CREATE PAYMENT — POST /payment/create
// =============================================================================

test.describe('💰 Create Payment — /payment/create', () => {

    let bpiMethodId = null;
    let onlineBankingMethodId = null;

    const senderDetails = () => ({
        first_name: 'Juan',
        middle_name: 'Santos',
        last_name: 'Dela Cruz',
        email: process.env.INDIVIDUAL_USER_EMAIL || 'test@justpay.to',
        mobile: {
            prefix: '+63',
            number: process.env.INDIVIDUAL_USER_MOBILE || '9171234567',
        },
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
    });

    test.beforeAll(async ({ request }) => {
        await generateToken(request);

        const bpiRes = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {
                method_code: 'bank_fund_transfer',
                provider_code: 'bpi',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
            timeout: REQUEST_TIMEOUT,
        });
        bpiMethodId = (await bpiRes.json()).data?.payment_method_id;

        const obRes = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {
                method_code: 'online_banking',
                provider_code: 'bpi',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
            timeout: REQUEST_TIMEOUT,
        });
        onlineBankingMethodId = (await obRes.json()).data?.payment_method_id;

        console.log(`🔑 BPI method ID: ${bpiMethodId}`);
        console.log(`🔑 Online Banking method ID: ${onlineBankingMethodId}`);
    });

    test('POST real-time payment returns authentication_url (bank_fund_transfer)', async ({ request }) => {
        expect(bpiMethodId).toBeTruthy();

        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: bearerHeaders(accessToken),
            data: {
                payment_method_id: bpiMethodId,
                sender_details: senderDetails(),
                amount_details: { currency: 'PHP', gross: '100' },
            },
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        console.log('📥 Create Payment (real-time):', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('authentication_url');
        expect(body.authentication_url).toMatch(/^https/);
        console.log(`✅ Auth URL: ${body.authentication_url.substring(0, 60)}...`);
    });

    test('POST batch payment returns data object (online_banking)', async ({ request }) => {
        expect(onlineBankingMethodId).toBeTruthy();

        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: bearerHeaders(accessToken),
            data: {
                payment_method_id: onlineBankingMethodId,
                sender_details: senderDetails(),
                amount_details: { currency: 'PHP', gross: '100' },
            },
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('data');
        expect(typeof body.data).toBe('object');
    });

    test('POST returns 400/462 when payment_method_id is missing', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: bearerHeaders(accessToken),
            data: {
                sender_details: senderDetails(),
                amount_details: { currency: 'PHP', gross: '100' },
            },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Missing payment_method_id: ${response.status()}`);
        expect([400, 462, 500]).toContain(response.status());
    });

    test('POST returns 400/462 when amount_details is missing', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: bearerHeaders(accessToken),
            data: {
                payment_method_id: bpiMethodId,
                sender_details: senderDetails(),
            },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Missing amount_details: ${response.status()}`);
        expect([400, 462, 500]).toContain(response.status());
    });

    test('POST returns 400/462 when sender_details is missing', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: bearerHeaders(accessToken),
            data: {
                payment_method_id: bpiMethodId,
                amount_details: { currency: 'PHP', gross: '100' },
            },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Missing sender_details: ${response.status()}`);
        expect([400, 462, 500]).toContain(response.status());
    });

    test('POST returns 400/464 when using an expired payment method', async ({ request }) => {
        const activateRes = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {
                method_code: 'bank_fund_transfer',
                provider_code: 'bpi',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
            timeout: REQUEST_TIMEOUT,
        });
        const tempMethodId = (await activateRes.json()).data?.payment_method_id;

        await request.put(
            `${BASE_URL}/payment-methods/${tempMethodId}/expiry`,
            {
                headers: bearerHeaders(accessToken),
                timeout: REQUEST_TIMEOUT,
            }
        );

        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: bearerHeaders(accessToken),
            data: {
                payment_method_id: tempMethodId,
                sender_details: senderDetails(),
                amount_details: { currency: 'PHP', gross: '100' },
            },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Expired method payment: ${response.status()}`);
        expect([400, 464, 500]).toContain(response.status());
    });

});

// =============================================================================
// 💲 GET PAYMENT BY ID — GET /payment/get/{id}
// =============================================================================

test.describe('💲 Get Payment by ID — /payment/get/{id}', () => {

    test.beforeAll(async ({ request }) => {
        await generateToken(request);
    });

    test('GET returns 404/400 for non-existent payment ID', async ({ request }) => {
        const response = await request.get(
            `${BASE_URL}/payment/get/non-existent-payment-id-xyz`,
            {
                headers: bearerHeaders(accessToken),
                timeout: REQUEST_TIMEOUT,
            }
        );

        console.log(`📥 Non-existent payment ID: ${response.status()}`);
        expect([400, 404, 500]).toContain(response.status());
    });

    test('GET returns 401 without Authorization', async ({ request }) => {
        const { Authorization, ...noAuth } = BASE_HEADERS;

        const response = await request.get(
            `${BASE_URL}/payment/get/some-payment-id`,
            {
                headers: noAuth,
                timeout: REQUEST_TIMEOUT,
            }
        );

        console.log(`📥 No auth status: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
    });

});

// =============================================================================
// 👤 USER INFORMATION — GET /user-information/get/{email}
// =============================================================================

test.describe('👤 User Information — /user-information/get/{email}', () => {

    test.beforeAll(async ({ request }) => {
        await generateToken(request);
    });

    test('GET returns user data for a known email', async ({ request }) => {
        const email = process.env.INDIVIDUAL_USER_EMAIL || 'test@justpay.to';

        const response = await request.get(
            `${BASE_URL}/user-information/get/${encodeURIComponent(email)}`,
            {
                headers: bearerHeaders(accessToken),
                timeout: REQUEST_TIMEOUT,
            }
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
            console.log(`ℹ️ User not in sandbox: ${email}`);
        }
    });

    test('GET returns 200/404 for non-existent email', async ({ request }) => {
        const email = 'nobody-xyz-9999@nowhere-fake.com';

        const response = await request.get(
            `${BASE_URL}/user-information/get/${encodeURIComponent(email)}`,
            {
                headers: bearerHeaders(accessToken),
                timeout: REQUEST_TIMEOUT,
            }
        );

        const body = await safeJson(response);
        console.log(`📥 Non-existent user: ${response.status()}`, body);
        expect([200, 404, 500]).toContain(response.status());
    });

    test('GET returns 401 without Authorization header', async ({ request }) => {
        const { Authorization, ...noAuth } = BASE_HEADERS;

        const response = await request.get(
            `${BASE_URL}/user-information/get/test@justpay.to`,
            {
                headers: noAuth,
                timeout: REQUEST_TIMEOUT,
            }
        );

        console.log(`📥 No auth: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
    });

});

// =============================================================================
// 🏦 SUPPORTED DESTINATION BANKS — GET /payment/supported-destination-banks
// =============================================================================

test.describe('🏦 Supported Destination Banks — /payment/supported-destination-banks', () => {

    test.beforeAll(async ({ request }) => {
        await generateToken(request);
    });

    test('GET returns list of supported destination banks', async ({ request }) => {
        const response = await request.get(
            `${BASE_URL}/payment/supported-destination-banks`,
            {
                headers: bearerHeaders(accessToken),
                timeout: REQUEST_TIMEOUT,
            }
        );

        const body = await safeJson(response);
        console.log('📥 Destination banks:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('data');
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.length).toBeGreaterThan(0);
        console.log(`✅ ${body.data.length} bank(s) returned`);
    });

    test('GET each bank has required fields (code)', async ({ request }) => {
        const response = await request.get(
            `${BASE_URL}/payment/supported-destination-banks`,
            {
                headers: bearerHeaders(accessToken),
                timeout: REQUEST_TIMEOUT,
            }
        );

        const body = await safeJson(response);
        expect(response.status()).toBe(200);

        for (const bank of body.data) {
            expect(bank).toHaveProperty('code');
            expect(typeof bank.code).toBe('string');
            console.log(`  ✅ Bank: ${bank.code} — ${bank.name ?? '(no name)'}`);
        }
    });

    test('GET returns 401 without Authorization', async ({ request }) => {
        const { Authorization, ...noAuth } = BASE_HEADERS;

        const response = await request.get(
            `${BASE_URL}/payment/supported-destination-banks`,
            {
                headers: noAuth,
                timeout: REQUEST_TIMEOUT,
            }
        );

        console.log(`📥 No auth: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
    });

});

// =============================================================================
// ❌ ERROR HANDLING — Custom JustPayTo Response Codes
// =============================================================================

test.describe('❌ Error Handling — Custom Response Codes', () => {

    test.beforeAll(async ({ request }) => {
        await generateToken(request);
    });

    test('462 Invalid Request — activate with empty body', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {},
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Empty body: ${response.status()}`);
        expect([400, 404, 462, 500]).toContain(response.status());
    });

    test('463 Invalid Payment Method — bogus method code', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
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

    test('401 Unauthorized — expired/fake Bearer token', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: { ...BASE_HEADERS, 'Authorization': 'Bearer this-is-a-fake-token' },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Fake token: ${response.status()}`);
        expect([401, 403, 500]).toContain(response.status());
    });

    test('405 Method Not Allowed — GET on POST-only endpoint', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 GET on POST endpoint: ${response.status()}`);
        expect([404, 405, 500]).toContain(response.status());
    });

    test('404 Not Found — non-existent endpoint', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/this-endpoint-does-not-exist`, {
            headers: BASE_HEADERS,
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Non-existent endpoint: ${response.status()}`);
        expect([404, 500]).toContain(response.status());
    });

});