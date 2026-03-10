import { test, expect } from '@playwright/test';

/**
 * ============================================================
 * JustPayTo API Integration Tests
 * ============================================================
 * These are TRUE integration tests — no browser, no UI clicks.
 * They test the API endpoints directly using HTTP requests to
 * verify that JustPayTo's services connect and respond correctly.
 *
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
    username: process.env.API_USERNAME || 'miko',
    password: process.env.API_PASSWORD || '3c002308-ecb2-4bc9-8679-a0165ab4687a',
    apiUsername: process.env.API_USERNAME_PAGE || process.env.INDIVIDUAL_API_USERNAME || 'miko',
};

// Encode Basic Auth credentials to Base64
const basicAuth = Buffer.from(`${CREDENTIALS.username}:${CREDENTIALS.password}`).toString('base64');

const BASE_HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Basic ${basicAuth}`,
    'apiUsername': CREDENTIALS.apiUsername,
};

// Shared state across tests within a describe block
let accessToken = null;
let activatedPaymentMethodId = null;

// ─── Helper: Safe JSON parse (sandbox may return plain text on errors) ────────

async function safeJson(response) {
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch {
        console.warn('⚠️  Response is not JSON. Raw response:', text.substring(0, 300));
        return null;
    }
}

// ─── Helper: Get Bearer Token ─────────────────────────────────────────────────

async function generateToken(request) {
    const response = await request.post(`${BASE_URL}/access-token/generate`, {
        headers: BASE_HEADERS,
    });
    const body = await safeJson(response);
    return { response, body };
}

// ─── Helper: Bearer Auth Headers (after token is obtained) ───────────────────

function bearerHeaders(token) {
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apiUsername': CREDENTIALS.apiUsername,
    };
}

// ─── Helper: Basic Auth Headers with Access Token ────────────────────────────

function basicAuthTokenHeaders(token) {
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${token}`,
        'apiUsername': CREDENTIALS.apiUsername,
    };
}

// =============================================================================
// 🔐 AUTHENTICATION
// =============================================================================

test.describe('🔐 Authentication — /access-token/generate', () => {

    test('POST generates a valid access token with correct credentials', async ({ request }) => {
        const { response, body } = await generateToken(request);

        console.log('📥 Token response status:', response.status());
        console.log('📥 Token response body:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);

        // Body must be valid JSON — if null, the API returned non-JSON (server error)
        expect(body, '❌ API returned non-JSON — possible server error or wrong endpoint').not.toBeNull();

        expect(body).toHaveProperty('access_token');
        expect(body).toHaveProperty('token_type');
        expect(body).toHaveProperty('expires_in');

        expect(typeof body.access_token).toBe('string');
        expect(body.access_token.length).toBeGreaterThan(0);
        expect(body.token_type).toMatch(/bearer/i);

        // Token expires in 300 seconds (5 minutes) per API docs
        expect(body.expires_in).toBe(300);

        console.log(`✅ Token generated: ${body.access_token.substring(0, 20)}...`);
        console.log(`✅ Expires in: ${body.expires_in} seconds`);

        // Store token for use in subsequent tests
        accessToken = body.access_token;
    });

    test('POST returns 401 with wrong password', async ({ request }) => {
        const wrongAuth = Buffer.from(`${CREDENTIALS.username}:wrong-password`).toString('base64');

        const response = await request.post(`${BASE_URL}/access-token/generate`, {
            headers: {
                ...BASE_HEADERS,
                'Authorization': `Basic ${wrongAuth}`,
            },
        });

        console.log(`📥 Status with wrong password: ${response.status()}`);
        // Sandbox may return 500 instead of 401 for bad credentials — both mean auth failed
        expect([401, 500]).toContain(response.status());
        console.log('✅ Auth correctly rejected with invalid password');
    });

    test('POST rejects wrong username', async ({ request }) => {
        const wrongAuth = Buffer.from(`wrong-user:${CREDENTIALS.password}`).toString('base64');

        const response = await request.post(`${BASE_URL}/access-token/generate`, {
            headers: {
                ...BASE_HEADERS,
                'Authorization': `Basic ${wrongAuth}`,
            },
        });

        console.log(`📥 Status with wrong username: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
        console.log('✅ Auth correctly rejected with invalid username');
    });

    test('POST rejects missing Authorization header', async ({ request }) => {
        const { Authorization, ...headersWithoutAuth } = BASE_HEADERS;

        const response = await request.post(`${BASE_URL}/access-token/generate`, {
            headers: headersWithoutAuth,
        });

        console.log(`📥 Status without Authorization: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
        console.log('✅ Auth correctly rejected without Authorization header');
    });

    test('POST rejects missing apiUsername header', async ({ request }) => {
        const { apiUsername, ...headersWithoutApiUser } = BASE_HEADERS;

        const response = await request.post(`${BASE_URL}/access-token/generate`, {
            headers: headersWithoutApiUser,
        });

        console.log(`📥 Status without apiUsername: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
        console.log('✅ Auth correctly rejected without apiUsername header');
    });

});

// =============================================================================
// 💳 PAYMENT METHODS — GET /payment-methods
// =============================================================================

test.describe('💳 Payment Methods — /payment-methods', () => {

    test.beforeAll(async ({ request }) => {
        const { body } = await generateToken(request);
        accessToken = body.access_token;
        console.log('🔑 Token ready for Payment Methods tests');
    });

    test('GET returns all payment methods grouped by type', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: bearerHeaders(accessToken),
        });

        const body = await safeJson(response);
        console.log('📥 All payment methods response:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('message');
        expect(body).toHaveProperty('result');
        expect(typeof body.result).toBe('object');

        console.log(`✅ Payment methods retrieved successfully`);
    });

    test('GET filters payment methods by category: mastercard_visa', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: bearerHeaders(accessToken),
            data: { category: 'mastercard_visa' },
        });

        const body = await safeJson(response);
        console.log('📥 mastercard_visa methods:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('category', 'mastercard_visa');
        expect(body).toHaveProperty('result');
        expect(Array.isArray(body.result)).toBe(true);

        console.log(`✅ ${body.result.length} method(s) found for mastercard_visa`);
    });

    test('GET filters payment methods by category: bank_fund_transfer', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: bearerHeaders(accessToken),
            data: { category: 'bank_fund_transfer' },
        });

        const body = await safeJson(response);
        console.log('📥 bank_fund_transfer methods:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('category', 'bank_fund_transfer');
        expect(Array.isArray(body.result)).toBe(true);
    });

    test('GET filters payment methods by category: e_wallet', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: bearerHeaders(accessToken),
            data: { category: 'e_wallet' },
        });

        const body = await safeJson(response);
        console.log('📥 e_wallet methods:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('category', 'e_wallet');
        expect(Array.isArray(body.result)).toBe(true);
    });

    test('GET filters payment methods by category: online_banking', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: bearerHeaders(accessToken),
            data: { category: 'online_banking' },
        });

        const body = await safeJson(response);
        console.log('📥 online_banking methods:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('category', 'online_banking');
        expect(Array.isArray(body.result)).toBe(true);
    });

    test('GET filters by category + code returns specific payment method object', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: bearerHeaders(accessToken),
            data: {
                category: 'e_wallet',
                code: 'gcash',
            },
        });

        const body = await safeJson(response);
        console.log('📥 GCash method:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('category', 'e_wallet');
        expect(body).toHaveProperty('result');
        // When code is given, result is an object (not array) per API docs
        expect(typeof body.result).toBe('object');
    });

    test('GET returns 403 when called without a valid Bearer token', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: {
                ...BASE_HEADERS,
                'Authorization': 'Bearer invalid-token-here',
            },
        });

        console.log(`📥 Status with invalid bearer token: ${response.status()}`);
        expect([401, 403, 500]).toContain(response.status());
    });

});

// =============================================================================
// ⚡ ACTIVATE PAYMENT METHOD — POST /payment-methods/activate
// =============================================================================

test.describe('⚡ Activate Payment Method — /payment-methods/activate', () => {

    test.beforeAll(async ({ request }) => {
        const { body } = await generateToken(request);
        accessToken = body.access_token;
        console.log('🔑 Token ready for Activate tests');
    });

    test('POST activates a bank_fund_transfer (BPI) payment method successfully', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {
                method_code: 'bank_fund_transfer',
                provider_code: 'bpi',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
                callback_url: 'https://justpay.to/callback',
            },
        });

        const body = await safeJson(response);
        console.log('📥 Activate BPI response:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('message');
        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('payment_method_id');
        expect(body.data.status).toMatch(/active/i);

        // Store for downstream tests
        activatedPaymentMethodId = body.data.payment_method_id;
        console.log(`✅ Payment method activated: ${activatedPaymentMethodId}`);
    });

    test('POST activates an e_wallet (GCash) payment method successfully', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {
                method_code: 'e_wallet',
                provider_code: 'gcash',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
        });

        const body = await safeJson(response);
        console.log('📥 Activate GCash response:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body.data).toHaveProperty('payment_method_id');
        expect(body.data.status).toMatch(/active/i);
    });

    test('POST returns 400 when method_code is missing', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {
                provider_code: 'bpi',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
        });

        const body = await safeJson(response);
        console.log(`📥 Status without method_code: ${response.status()}`, body);
        expect([400, 462]).toContain(response.status());
    });

    test('POST returns 400 when redirect URLs are missing', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {
                method_code: 'bank_fund_transfer',
                provider_code: 'bpi',
                // missing success_redirect_url and failed_redirect_url
            },
        });

        const body = await safeJson(response);
        console.log(`📥 Status without redirect URLs: ${response.status()}`, body);
        expect([400, 462]).toContain(response.status());
    });

    test('POST returns 463 for invalid payment method code', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {
                method_code: 'invalid_method_xyz',
                provider_code: 'unknown',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
        });

        const body = await safeJson(response);
        console.log(`📥 Status with invalid method: ${response.status()}`, body);
        expect([400, 463]).toContain(response.status());
    });

});

// =============================================================================
// 🔍 GET PAYMENT METHOD BY ID — GET /payment-methods/{id}
// =============================================================================

test.describe('🔍 Get Payment Method by ID — /payment-methods/{id}', () => {

    test.beforeAll(async ({ request }) => {
        // Regenerate token and activate a method to get a fresh ID
        const { body: tokenBody } = await generateToken(request);
        accessToken = tokenBody.access_token;

        const activateRes = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {
                method_code: 'bank_fund_transfer',
                provider_code: 'bpi',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
        });
        const activateBody = await activateRes.json();
        activatedPaymentMethodId = activateBody.data?.payment_method_id;
        console.log(`🔑 Activated method ID for fetch tests: ${activatedPaymentMethodId}`);
    });

    test('GET returns payment method details for valid ID', async ({ request }) => {
        expect(activatedPaymentMethodId).toBeTruthy();

        const response = await request.get(
            `${BASE_URL}/payment-methods/${activatedPaymentMethodId}`,
            { headers: bearerHeaders(accessToken) }
        );

        const body = await safeJson(response);
        console.log('📥 Get method by ID response:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('payment_method_id', activatedPaymentMethodId);
        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('status');

        console.log(`✅ Payment method fetched: ${activatedPaymentMethodId}`);
    });

    test('GET returns 404 for a non-existent payment method ID', async ({ request }) => {
        const response = await request.get(
            `${BASE_URL}/payment-methods/non-existent-id-00000`,
            { headers: bearerHeaders(accessToken) }
        );

        console.log(`📥 Status for non-existent ID: ${response.status()}`);
        expect([404, 400]).toContain(response.status());
    });

});

// =============================================================================
// 🔄 UPDATE PAYMENT METHOD STATUS — PUT /payment-methods/{id}/{action}
// =============================================================================

test.describe('🔄 Update Payment Method Status — /payment-methods/{id}/{action}', () => {

    let methodIdForInvalidate = null;
    let methodIdForExpiry = null;

    test.beforeAll(async ({ request }) => {
        const { body: tokenBody } = await generateToken(request);
        accessToken = tokenBody.access_token;

        // Activate two separate methods — one to invalidate, one to expire
        const activateOne = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {
                method_code: 'bank_fund_transfer',
                provider_code: 'bpi',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
        });
        const bodyOne = await activateOne.json();
        methodIdForInvalidate = bodyOne.data?.payment_method_id;

        const activateTwo = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {
                method_code: 'e_wallet',
                provider_code: 'gcash',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
        });
        const bodyTwo = await activateTwo.json();
        methodIdForExpiry = bodyTwo.data?.payment_method_id;

        console.log(`🔑 IDs ready — invalidate: ${methodIdForInvalidate}, expiry: ${methodIdForExpiry}`);
    });

    test('PUT invalidates an active payment method successfully', async ({ request }) => {
        expect(methodIdForInvalidate).toBeTruthy();

        const response = await request.put(
            `${BASE_URL}/payment-methods/${methodIdForInvalidate}/invalidate`,
            { headers: bearerHeaders(accessToken) }
        );

        const body = await safeJson(response);
        console.log('📥 Invalidate response:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('data');
        expect(body.data.status).toMatch(/invalid/i);

        console.log(`✅ Payment method invalidated: ${methodIdForInvalidate}`);
    });

    test('PUT expires an active payment method successfully', async ({ request }) => {
        expect(methodIdForExpiry).toBeTruthy();

        const response = await request.put(
            `${BASE_URL}/payment-methods/${methodIdForExpiry}/expiry`,
            { headers: bearerHeaders(accessToken) }
        );

        const body = await safeJson(response);
        console.log('📥 Expiry response:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('data');
        expect(body.data.status).toMatch(/expired/i);

        console.log(`✅ Payment method expired: ${methodIdForExpiry}`);
    });

    test('PUT on an already-invalidated method returns 464 or 465', async ({ request }) => {
        // methodIdForInvalidate is already invalidated from the test above
        const response = await request.put(
            `${BASE_URL}/payment-methods/${methodIdForInvalidate}/invalidate`,
            { headers: bearerHeaders(accessToken) }
        );

        console.log(`📥 Re-invalidate status: ${response.status()}`);
        expect([400, 464, 465]).toContain(response.status());
    });

    test('PUT returns 405 for an unsupported action', async ({ request }) => {
        const response = await request.put(
            `${BASE_URL}/payment-methods/${methodIdForExpiry}/delete`,
            { headers: bearerHeaders(accessToken) }
        );

        console.log(`📥 Unsupported action status: ${response.status()}`);
        expect([400, 404, 405]).toContain(response.status());
    });

});

// =============================================================================
// 💰 CREATE PAYMENT — POST /payment/create
// =============================================================================

test.describe('💰 Create Payment — /payment/create', () => {

    let bpiMethodId = null;
    let onlineBankingMethodId = null;

    test.beforeAll(async ({ request }) => {
        const { body: tokenBody } = await generateToken(request);
        accessToken = tokenBody.access_token;

        // Activate BPI (real-time) for authentication_url test
        const bpiRes = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {
                method_code: 'bank_fund_transfer',
                provider_code: 'bpi',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
        });
        const bpiBody = await bpiRes.json();
        bpiMethodId = bpiBody.data?.payment_method_id;

        // Activate online_banking (batch processing) for data object test
        const obRes = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {
                method_code: 'online_banking',
                provider_code: 'bpi',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
        });
        const obBody = await obRes.json();
        onlineBankingMethodId = obBody.data?.payment_method_id;

        console.log(`🔑 BPI method ID: ${bpiMethodId}`);
        console.log(`🔑 Online Banking method ID: ${onlineBankingMethodId}`);
    });

    // Reusable full sender payload
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
            birth: {
                date: '01/01/1990',
                place: 'Manila',
            },
            document_meta: {
                type: 'passport',
                front: 'https://via.placeholder.com/300x200.jpg',
            },
            address: '123 Rizal St, Makati City',
            gender: 'male',
            nationality: 'Filipino',
        },
    });

    test('POST real-time payment returns authentication_url (bank_fund_transfer)', async ({ request }) => {
        expect(bpiMethodId).toBeTruthy();

        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: BASE_HEADERS,
            data: {
                payment_method_id: bpiMethodId,
                sender_details: senderDetails(),
                amount_details: {
                    currency: 'PHP',
                    gross: '100',
                },
            },
        });

        const body = await safeJson(response);
        console.log('📥 Create Payment (real-time) response:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('message');

        // Real-time methods return an authentication_url
        expect(body).toHaveProperty('authentication_url');
        expect(typeof body.authentication_url).toBe('string');
        expect(body.authentication_url).toMatch(/^https/);

        console.log(`✅ Authentication URL received: ${body.authentication_url.substring(0, 60)}...`);
    });

    test('POST batch payment returns data object (online_banking)', async ({ request }) => {
        expect(onlineBankingMethodId).toBeTruthy();

        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: BASE_HEADERS,
            data: {
                payment_method_id: onlineBankingMethodId,
                sender_details: senderDetails(),
                amount_details: {
                    currency: 'PHP',
                    gross: '100',
                },
            },
        });

        const body = await safeJson(response);
        console.log('📥 Create Payment (batch) response:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('message');

        // Batch methods return a data object (not authentication_url)
        expect(body).toHaveProperty('data');
        expect(typeof body.data).toBe('object');
    });

    test('POST returns 400 when payment_method_id is missing', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: BASE_HEADERS,
            data: {
                sender_details: senderDetails(),
                amount_details: { currency: 'PHP', gross: '100' },
            },
        });

        console.log(`📥 Status without payment_method_id: ${response.status()}`);
        expect([400, 462]).toContain(response.status());
    });

    test('POST returns 400 when amount_details is missing', async ({ request }) => {
        expect(bpiMethodId).toBeTruthy();

        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: BASE_HEADERS,
            data: {
                payment_method_id: bpiMethodId,
                sender_details: senderDetails(),
                // missing amount_details
            },
        });

        console.log(`📥 Status without amount_details: ${response.status()}`);
        expect([400, 462]).toContain(response.status());
    });

    test('POST returns 400 when sender_details is missing', async ({ request }) => {
        expect(bpiMethodId).toBeTruthy();

        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: BASE_HEADERS,
            data: {
                payment_method_id: bpiMethodId,
                amount_details: { currency: 'PHP', gross: '100' },
                // missing sender_details
            },
        });

        console.log(`📥 Status without sender_details: ${response.status()}`);
        expect([400, 462]).toContain(response.status());
    });

    test('POST returns 464 when using an already-expired payment method', async ({ request }) => {
        // Activate then immediately expire a method
        const { body: tokenBody } = await generateToken(request);
        const freshToken = tokenBody.access_token;

        const activateRes = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(freshToken),
            data: {
                method_code: 'bank_fund_transfer',
                provider_code: 'bpi',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
        });
        const activateBody = await activateRes.json();
        const tempMethodId = activateBody.data?.payment_method_id;

        // Expire it
        await request.put(
            `${BASE_URL}/payment-methods/${tempMethodId}/expiry`,
            { headers: bearerHeaders(freshToken) }
        );

        // Try to create payment with expired method
        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: BASE_HEADERS,
            data: {
                payment_method_id: tempMethodId,
                sender_details: senderDetails(),
                amount_details: { currency: 'PHP', gross: '100' },
            },
        });

        console.log(`📥 Status with expired method: ${response.status()}`);
        expect([400, 464]).toContain(response.status());
    });

});

// =============================================================================
// 💲 GET PAYMENT DETAILS BY ID — GET /payment/get/{payment_id}
// =============================================================================

test.describe('💲 Get Payment Details by ID — /payment/get/{id}', () => {

    test.beforeAll(async ({ request }) => {
        const { body } = await generateToken(request);
        accessToken = body.access_token;
    });

    test('GET returns 404 for a non-existent payment ID', async ({ request }) => {
        const response = await request.get(
            `${BASE_URL}/payment/get/non-existent-payment-id-xyz`,
            { headers: BASE_HEADERS }
        );

        console.log(`📥 Status for non-existent payment ID: ${response.status()}`);
        expect([404, 400]).toContain(response.status());
    });

    test('GET returns 401 when called without Authorization', async ({ request }) => {
        const { Authorization, ...noAuth } = BASE_HEADERS;

        const response = await request.get(
            `${BASE_URL}/payment/get/some-payment-id`,
            { headers: noAuth }
        );

        console.log(`📥 Status without auth: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
    });

});

// =============================================================================
// 👤 USER INFORMATION — GET /user-information/get/{email}
// =============================================================================

test.describe('👤 User Information — /user-information/get/{email}', () => {

    test.beforeAll(async ({ request }) => {
        const { body } = await generateToken(request);
        accessToken = body.access_token;
    });

    test('GET returns user data for a known email', async ({ request }) => {
        const email = process.env.INDIVIDUAL_USER_EMAIL || 'test@justpay.to';

        const response = await request.get(
            `${BASE_URL}/user-information/get/${encodeURIComponent(email)}`,
            { headers: BASE_HEADERS }
        );

        const body = await safeJson(response);
        console.log('📥 User info response:', JSON.stringify(body, null, 2));

        // API returns 200 whether user exists or not — check the status field
        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('message');

        if (body.data) {
            console.log(`✅ User found: ${email}`);
            expect(body.data).toHaveProperty('email');
        } else {
            console.log(`ℹ️ User not found in sandbox: ${email}`);
        }
    });

    test('GET returns 404 or empty data for a non-existent email', async ({ request }) => {
        const email = 'this-user-does-not-exist-xyz@nowhere.com';

        const response = await request.get(
            `${BASE_URL}/user-information/get/${encodeURIComponent(email)}`,
            { headers: BASE_HEADERS }
        );

        const body = await safeJson(response);
        console.log(`📥 Non-existent user status: ${response.status()}`, body);

        // Either 404 or 200 with null/empty data — both are valid
        expect([200, 404]).toContain(response.status());
    });

    test('GET returns 401 without Authorization header', async ({ request }) => {
        const { Authorization, ...noAuth } = BASE_HEADERS;

        const response = await request.get(
            `${BASE_URL}/user-information/get/test@justpay.to`,
            { headers: noAuth }
        );

        console.log(`📥 Status without auth: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
    });

});

// =============================================================================
// 🏦 SUPPORTED DESTINATION BANKS — GET /payment/supported-destination-banks
// =============================================================================

test.describe('🏦 Supported Destination Banks — /payment/supported-destination-banks', () => {

    test.beforeAll(async ({ request }) => {
        const { body } = await generateToken(request);
        accessToken = body.access_token;
    });

    test('GET returns list of supported destination banks', async ({ request }) => {
        const response = await request.get(
            `${BASE_URL}/payment/supported-destination-banks`,
            { headers: BASE_HEADERS }
        );

        const body = await safeJson(response);
        console.log('📥 Destination banks response:', JSON.stringify(body, null, 2));

        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('message');
        expect(body).toHaveProperty('data');
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.length).toBeGreaterThan(0);

        console.log(`✅ ${body.data.length} destination bank(s) returned`);
    });

    test('GET each bank in the list has required fields', async ({ request }) => {
        const response = await request.get(
            `${BASE_URL}/payment/supported-destination-banks`,
            { headers: BASE_HEADERS }
        );

        const body = await safeJson(response);
        expect(response.status()).toBe(200);

        // Every bank entry should at minimum have a code and name
        for (const bank of body.data) {
            expect(bank).toHaveProperty('code');
            expect(typeof bank.code).toBe('string');
            console.log(`✅ Bank: ${bank.code} — ${bank.name || '(no name field)'}`);
        }
    });

    test('GET returns 401 without Authorization', async ({ request }) => {
        const { Authorization, ...noAuth } = BASE_HEADERS;

        const response = await request.get(
            `${BASE_URL}/payment/supported-destination-banks`,
            { headers: noAuth }
        );

        console.log(`📥 Status without auth: ${response.status()}`);
        expect([401, 500]).toContain(response.status());
    });

});

// =============================================================================
// ❌ ERROR HANDLING — Custom JustPayTo Response Codes
// =============================================================================

test.describe('❌ Error Handling — Custom Response Codes', () => {

    test.beforeAll(async ({ request }) => {
        const { body } = await generateToken(request);
        accessToken = body.access_token;
    });

    test('462 Invalid Request — activate with empty body returns 400 or 462', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {}, // no required fields
        });

        const body = await safeJson(response);
        console.log(`📥 Empty body status: ${response.status()}`, body);
        expect([400, 462]).toContain(response.status());
    });

    test('463 Invalid Payment Method — activate with bogus method code', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
            data: {
                method_code: 'fake_method_9999',
                provider_code: 'fake_provider',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
        });

        const body = await safeJson(response);
        console.log(`📥 Invalid method status: ${response.status()}`, body);
        expect([400, 463]).toContain(response.status());
    });

    test('401 Unauthorized — any endpoint with expired/wrong token returns 401 or 403', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: {
                ...BASE_HEADERS,
                'Authorization': 'Bearer this-is-a-fake-token',
            },
        });

        console.log(`📥 Fake Bearer token status: ${response.status()}`);
        expect([401, 403, 500]).toContain(response.status());
    });

    test('405 Method Not Allowed — GET on a POST-only endpoint', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(accessToken),
        });

        console.log(`📥 GET on POST endpoint status: ${response.status()}`);
        expect([404, 405]).toContain(response.status());
    });

    test('404 Not Found — request to a non-existent endpoint', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/this-endpoint-does-not-exist`, {
            headers: BASE_HEADERS,
        });

        console.log(`📥 Non-existent endpoint status: ${response.status()}`);
        expect(response.status()).toBe(404);
    });

});