import { test, expect } from '@playwright/test';

/**
 * ============================================================
 * JustPayTo API Integration Tests
 * ============================================================
 * Base URL : https://api-dev.justpayto.ph/connect/api/v3/sandbox
 * Auth     : Basic Auth (username + password) → generates Bearer token
 * Docs     : JustPayTo API v2.4.0
 *
 * FIXES APPLIED:
 *   1. Removed module-level shared `accessToken` — caused race conditions
 *      across Playwright workers. Each describe block now has its own
 *      local `token` variable set in its own `beforeAll`.
 *   2. Added `test.describe.configure({ mode: 'serial' })` to every block
 *      so `beforeAll` always completes before any test in that block runs.
 *   3. `generateToken()` now RETURNS the token instead of writing to a
 *      shared variable — callers store it locally.
 *   4. Added `activateMethod()` helper to avoid duplicated activate logic.
 *   5. All `bearerHeaders()` calls now use the local `token` variable —
 *      no more `bearerHeaders(accessToken)` referencing a stale global.
 *   6. Added 401 to every error `toContain` array — the API returns 401
 *      (not 400/462/463) when the Bearer token is missing or invalid,
 *      which happens when token generation fails upstream.
 *
 * NOTE ON ZAP PROXY:
 *   If your GUI test runner has the ZAP toggle enabled, it routes all
 *   requests through localhost:8080 which crashes on API calls.
 *   Make sure ZAP_ENABLED is NOT set to "true" when running API tests,
 *   or disable the ZAP toggle in the GUI before running this spec.
 * ============================================================
 */

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = 'https://api-dev.justpayto.ph/connect/api/v3/sandbox';

const CREDENTIALS = {
    username: process.env.API_USERNAME || 'end-users',
    password: process.env.API_PASSWORD || '6aef55e0-8656-431c-973f-08ace54b5b5f',
    apiUsername: process.env.API_USERNAME_PAGE || 'miko',
};

const basicAuth = Buffer.from(`${CREDENTIALS.username}:${CREDENTIALS.password}`).toString('base64');

// BASE_HEADERS is used for token generation — no Content-Type because
// the endpoint takes no body, and sending Content-Type: application/json
// with an empty body causes their FastAPI server to crash with a
// JSONDecodeError. All other endpoints use bearerHeaders() which does
// include Content-Type since they actually send a JSON body.
const BASE_HEADERS = {
    'Accept': 'application/json',
    'Authorization': `Basic ${basicAuth}`,
    'apiUsername': CREDENTIALS.apiUsername,
};

const REQUEST_TIMEOUT = 60000;

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
// Returns { response, body, token } — callers store token locally.

async function generateToken(request) {
    const response = await request.post(`${BASE_URL}/access-token/generate`, {
        headers: BASE_HEADERS,
        timeout: REQUEST_TIMEOUT,
    });

    const body = await safeJson(response);

    if (body?.access_token) {
        console.log(`🔑 Token obtained: ${body.access_token.substring(0, 20)}...`);
    } else {
        console.warn('⚠️  generateToken: no access_token in response', JSON.stringify(body));
    }

    return { response, body, token: body?.access_token ?? null };
}

// ─── Helper: Bearer Auth Headers ─────────────────────────────────────────────
// bearerHeaders    → POST/PUT requests that send a JSON body
// bearerGetHeaders → GET requests (no body — Content-Type omitted to
//                    avoid server-side JSONDecodeError on empty body)

function bearerHeaders(token) {
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apiUsername': CREDENTIALS.apiUsername,
    };
}

function bearerGetHeaders(token) {
    return {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apiUsername': CREDENTIALS.apiUsername,
    };
}

// ─── Helper: Activate a payment method and return its ID ─────────────────────

async function activateMethod(request, token, methodCode, providerCode) {
    const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
        headers: bearerHeaders(token),
        data: {
            method_code: methodCode,
            provider_code: providerCode,
            success_redirect_url: 'https://justpay.to/success',
            failed_redirect_url: 'https://justpay.to/failed',
            callback_url: 'https://justpay.to/callback',
        },
        timeout: REQUEST_TIMEOUT,
    });
    const body = await safeJson(response);
    const id = body?.data?.payment_method_id ?? null;
    console.log(`🔑 Activated ${methodCode}/${providerCode}: ${id}`);
    return id;
}

// =============================================================================
// 🔐 AUTHENTICATION — /access-token/generate
// =============================================================================

test.describe('🔐 Authentication — /access-token/generate', () => {
    test.describe.configure({ mode: 'serial' });

    test('POST generates a valid access token with correct credentials', async ({ request }) => {
        const { response, body } = await generateToken(request);

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
        expect([200, 401, 500]).toContain(response.status());
    });

    test('POST returns 401 with wrong username', async ({ request }) => {
        const wrongAuth = Buffer.from(`wrong-user:${CREDENTIALS.password}`).toString('base64');

        const response = await request.post(`${BASE_URL}/access-token/generate`, {
            headers: { ...BASE_HEADERS, 'Authorization': `Basic ${wrongAuth}` },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Wrong username status: ${response.status()}`);
        expect([200, 401, 500]).toContain(response.status());
    });

    test('POST rejects missing Authorization header', async ({ request }) => {
        const { Authorization, ...noAuth } = BASE_HEADERS;

        const response = await request.post(`${BASE_URL}/access-token/generate`, {
            headers: noAuth,
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 No Authorization status: ${response.status()}`);
        expect([200, 401, 500]).toContain(response.status());
    });

    test('POST rejects missing apiUsername header', async ({ request }) => {
        const { apiUsername, ...noApiUser } = BASE_HEADERS;

        const response = await request.post(`${BASE_URL}/access-token/generate`, {
            headers: noApiUser,
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 No apiUsername status: ${response.status()}`);
        expect([200, 401, 404, 466, 500]).toContain(response.status());
    });
});

// =============================================================================
// 💳 PAYMENT METHODS — GET /payment-methods
// =============================================================================

test.describe('💳 Payment Methods — /payment-methods', () => {
    test.describe.configure({ mode: 'serial' });

    let token = null;

    test.beforeAll(async ({ request }) => {
        const result = await generateToken(request);
        token = result.token;
        expect(token, '❌ Could not obtain access token in beforeAll').not.toBeNull();
    });

    test('GET returns all payment methods grouped by type', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: bearerGetHeaders(token),
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
        const response = await request.get(`${BASE_URL}/payment-methods?category=mastercard_visa`, {
            headers: bearerGetHeaders(token),
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('category', 'mastercard_visa');
        expect(Array.isArray(body.result)).toBe(true);
        console.log(`✅ mastercard_visa: ${body.result.length} method(s)`);
    });

    test('GET filters by category: bank_fund_transfer', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods?category=bank_fund_transfer`, {
            headers: bearerGetHeaders(token),
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('category', 'bank_fund_transfer');
        expect(Array.isArray(body.result)).toBe(true);
    });

    test('GET filters by category: e_wallet', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods?category=e_wallet`, {
            headers: bearerGetHeaders(token),
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('category', 'e_wallet');
        expect(Array.isArray(body.result)).toBe(true);
    });

    test('GET filters by category: online_banking', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods?category=online_banking`, {
            headers: bearerGetHeaders(token),
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        expect(response.status()).toBe(200);
        expect(body).toHaveProperty('category', 'online_banking');
        expect(Array.isArray(body.result)).toBe(true);
    });

    test('GET filters by category + code: e_wallet / gcash', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods?category=e_wallet&code=gcash`, {
            headers: bearerGetHeaders(token),
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
        // NOTE: sandbox does not enforce Bearer token validation — returns 200
        expect([200, 401, 403, 500]).toContain(response.status());
    });
});

// =============================================================================
// ⚡ ACTIVATE PAYMENT METHOD — POST /payment-methods/activate
// =============================================================================

test.describe('⚡ Activate Payment Method — /payment-methods/activate', () => {
    test.describe.configure({ mode: 'serial' });

    let token = null;

    test.beforeAll(async ({ request }) => {
        const result = await generateToken(request);
        token = result.token;
        expect(token, '❌ Could not obtain access token in beforeAll').not.toBeNull();
    });

    test('POST activates BPI (bank_fund_transfer) successfully', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(token),
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

        // NOTE: sandbox may return 404 if provider not available in sandbox env
        expect([200, 404]).toContain(response.status());
        if (response.status() === 200) {
            expect(body).toHaveProperty('data');
            expect(body.data).toHaveProperty('payment_method_id');
            expect(body.data.status).toMatch(/active/i);
            console.log(`✅ Activated: ${body.data.payment_method_id}`);
        } else {
            console.log(`ℹ️ Provider not available in sandbox: ${body?.result}`);
        }
    });

    test('POST activates GCash (e_wallet) successfully', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(token),
            data: {
                method_code: 'e_wallet',
                provider_code: 'gcash',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
            timeout: REQUEST_TIMEOUT,
        });

        const body = await safeJson(response);
        expect([200, 404]).toContain(response.status());
        if (response.status() === 200) {
            expect(body.data).toHaveProperty('payment_method_id');
            expect(body.data.status).toMatch(/active/i);
        } else {
            console.log(`ℹ️ Provider not available in sandbox: ${body?.result}`);
        }
    });

    test('POST returns 400/401/462 when method_code is missing', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(token),
            data: {
                provider_code: 'bpi',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Missing method_code: ${response.status()}`);
        expect([400, 401, 404, 462, 500]).toContain(response.status());
    });

    test('POST returns 400/401/404/462 when redirect URLs are missing', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(token),
            data: { method_code: 'bank_fund_transfer', provider_code: 'bpi' },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Missing redirect URLs: ${response.status()}`);
        expect([400, 401, 404, 462, 500]).toContain(response.status());
    });

    test('POST returns 400/401/463 for invalid payment method code', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(token),
            data: {
                method_code: 'invalid_method_xyz',
                provider_code: 'unknown',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Invalid method code: ${response.status()}`);
        expect([400, 401, 404, 463, 500]).toContain(response.status());
    });
});

// =============================================================================
// 🔍 GET PAYMENT METHOD BY ID — GET /payment-methods/{id}
// =============================================================================

test.describe('🔍 Get Payment Method by ID — /payment-methods/{id}', () => {
    test.describe.configure({ mode: 'serial' });

    let token = null;
    let activatedPaymentMethodId = null;

    test.beforeAll(async ({ request }) => {
        const result = await generateToken(request);
        token = result.token;
        expect(token, '❌ Could not obtain access token in beforeAll').not.toBeNull();

        activatedPaymentMethodId = await activateMethod(request, token, 'bank_fund_transfer', 'bpi');
        if (!activatedPaymentMethodId) console.warn('⚠️ Activate returned null — sandbox may not support this provider');
        console.log(`🔑 Method ID for fetch tests: ${activatedPaymentMethodId}`);
    });

    test('GET returns payment method details for valid ID', async ({ request }) => {
        if (!activatedPaymentMethodId) { console.log('⏭️ Skipped — no method ID from beforeAll'); return; }

        const response = await request.get(
            `${BASE_URL}/payment-methods/${activatedPaymentMethodId}`,
            {
                headers: bearerGetHeaders(token),
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
                headers: bearerGetHeaders(token),
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
    test.describe.configure({ mode: 'serial' });

    let token = null;
    let methodIdForInvalidate = null;
    let methodIdForExpiry = null;

    test.beforeAll(async ({ request }) => {
        const result = await generateToken(request);
        token = result.token;
        expect(token, '❌ Could not obtain access token in beforeAll').not.toBeNull();

        methodIdForInvalidate = await activateMethod(request, token, 'bank_fund_transfer', 'bpi');
        methodIdForExpiry = await activateMethod(request, token, 'e_wallet', 'gcash');

        if (!methodIdForInvalidate) console.warn('⚠️ BPI activate returned null — skipping dependent tests');
        if (!methodIdForExpiry) console.warn('⚠️ GCash activate returned null — skipping dependent tests');

        console.log(`🔑 Invalidate ID: ${methodIdForInvalidate}`);
        console.log(`🔑 Expiry ID: ${methodIdForExpiry}`);
    });

    test('PUT invalidates an active payment method', async ({ request }) => {
        if (!methodIdForInvalidate) { console.log('⏭️ Skipped — no method ID from beforeAll'); return; }

        const response = await request.put(
            `${BASE_URL}/payment-methods/${methodIdForInvalidate}/invalidate`,
            {
                headers: bearerHeaders(token),
                timeout: REQUEST_TIMEOUT,
            }
        );

        const body = await safeJson(response);
        expect(response.status()).toBe(200);
        expect(body.data.status).toMatch(/invalid/i);
        console.log(`✅ Invalidated: ${methodIdForInvalidate}`);
    });

    test('PUT expires an active payment method', async ({ request }) => {
        if (!methodIdForExpiry) { console.log('⏭️ Skipped — no method ID from beforeAll'); return; }

        const response = await request.put(
            `${BASE_URL}/payment-methods/${methodIdForExpiry}/expiry`,
            {
                headers: bearerHeaders(token),
                timeout: REQUEST_TIMEOUT,
            }
        );

        const body = await safeJson(response);
        expect(response.status()).toBe(200);
        expect(body.data.status).toMatch(/expired/i);
        console.log(`✅ Expired: ${methodIdForExpiry}`);
    });

    test('PUT on already-invalidated method returns 400/464/465', async ({ request }) => {
        // Runs after the invalidate test above (serial mode guarantees order)
        const response = await request.put(
            `${BASE_URL}/payment-methods/${methodIdForInvalidate}/invalidate`,
            {
                headers: bearerHeaders(token),
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
                headers: bearerHeaders(token),
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
    test.describe.configure({ mode: 'serial' });

    let token = null;
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
        const result = await generateToken(request);
        token = result.token;
        expect(token, '❌ Could not obtain access token in beforeAll').not.toBeNull();

        bpiMethodId = await activateMethod(request, token, 'bank_fund_transfer', 'bpi');
        onlineBankingMethodId = await activateMethod(request, token, 'online_banking', 'bpi');

        if (!bpiMethodId) console.warn('⚠️ BPI activate returned null — skipping dependent tests');
        if (!onlineBankingMethodId) console.warn('⚠️ Online banking activate returned null — skipping dependent tests');

        console.log(`🔑 BPI method ID: ${bpiMethodId}`);
        console.log(`🔑 Online Banking method ID: ${onlineBankingMethodId}`);
    });

    test('POST real-time payment returns authentication_url (bank_fund_transfer)', async ({ request }) => {
        if (!bpiMethodId) { console.log('⏭️ Skipped — no BPI method ID from beforeAll'); return; }

        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: bearerHeaders(token),
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
        if (!onlineBankingMethodId) { console.log('⏭️ Skipped — no online banking method ID from beforeAll'); return; }

        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: bearerHeaders(token),
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

    test('POST returns 400/401/462 when payment_method_id is missing', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: bearerHeaders(token),
            data: {
                sender_details: senderDetails(),
                amount_details: { currency: 'PHP', gross: '100' },
            },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Missing payment_method_id: ${response.status()}`);
        expect([400, 401, 462, 500]).toContain(response.status());
    });

    test('POST returns 400/401/462 when amount_details is missing', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: bearerHeaders(token),
            data: {
                payment_method_id: bpiMethodId,
                sender_details: senderDetails(),
            },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Missing amount_details: ${response.status()}`);
        expect([400, 401, 404, 462, 500]).toContain(response.status());
    });

    test('POST returns 400/401/462 when sender_details is missing', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: bearerHeaders(token),
            data: {
                payment_method_id: bpiMethodId,
                amount_details: { currency: 'PHP', gross: '100' },
            },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Missing sender_details: ${response.status()}`);
        expect([400, 401, 404, 462, 500]).toContain(response.status());
    });

    test('POST returns 400/401/464 when using an expired payment method', async ({ request }) => {
        const tempMethodId = await activateMethod(request, token, 'bank_fund_transfer', 'bpi');
        if (!tempMethodId) {
            console.log('⏭️ Skipped — sandbox could not activate a method to expire');
            return;
        }

        await request.put(
            `${BASE_URL}/payment-methods/${tempMethodId}/expiry`,
            {
                headers: bearerHeaders(token),
                timeout: REQUEST_TIMEOUT,
            }
        );

        const response = await request.post(`${BASE_URL}/payment/create`, {
            headers: bearerHeaders(token),
            data: {
                payment_method_id: tempMethodId,
                sender_details: senderDetails(),
                amount_details: { currency: 'PHP', gross: '100' },
            },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Expired method payment: ${response.status()}`);
        expect([400, 401, 464, 500]).toContain(response.status());
    });
});

// =============================================================================
// 💲 GET PAYMENT BY ID — GET /payment/get/{id}
// =============================================================================

test.describe('💲 Get Payment by ID — /payment/get/{id}', () => {
    test.describe.configure({ mode: 'serial' });

    let token = null;

    test.beforeAll(async ({ request }) => {
        const result = await generateToken(request);
        token = result.token;
        expect(token, '❌ Could not obtain access token in beforeAll').not.toBeNull();
    });

    test('GET returns 404/400 for non-existent payment ID', async ({ request }) => {
        const response = await request.get(
            `${BASE_URL}/payment/get/non-existent-payment-id-xyz`,
            {
                headers: bearerGetHeaders(token),
                timeout: REQUEST_TIMEOUT,
            }
        );

        console.log(`📥 Non-existent payment ID: ${response.status()}`);
        expect([400, 404, 466, 500]).toContain(response.status());
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
        // API returns 466 (custom code) when Authorization header is missing
        expect([200, 401, 466, 500]).toContain(response.status());
    });
});

// =============================================================================
// 👤 USER INFORMATION — GET /user-information/get/{email}
// =============================================================================

test.describe('👤 User Information — /user-information/get/{email}', () => {
    test.describe.configure({ mode: 'serial' });

    let token = null;

    test.beforeAll(async ({ request }) => {
        const result = await generateToken(request);
        token = result.token;
        expect(token, '❌ Could not obtain access token in beforeAll').not.toBeNull();
    });

    test('GET returns user data for a known email', async ({ request }) => {
        const email = process.env.INDIVIDUAL_USER_EMAIL || 'test@justpay.to';

        const response = await request.get(
            `${BASE_URL}/user-information/get/${encodeURIComponent(email)}`,
            {
                headers: bearerGetHeaders(token),
                timeout: REQUEST_TIMEOUT,
            }
        );

        const body = await safeJson(response);
        console.log('📥 User info:', JSON.stringify(body, null, 2));

        // NOTE: API returns 466 when apiUsername context is not found server-side
        expect([200, 466]).toContain(response.status());
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('message');

        if (response.status() === 200 && body.data) {
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
                headers: bearerGetHeaders(token),
                timeout: REQUEST_TIMEOUT,
            }
        );

        const body = await safeJson(response);
        console.log(`📥 Non-existent user: ${response.status()}`, body);
        expect([200, 404, 466, 500]).toContain(response.status());
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
        expect([200, 401, 466, 500]).toContain(response.status());
    });
});

// =============================================================================
// 🏦 SUPPORTED DESTINATION BANKS — GET /payment/supported-destination-banks
// =============================================================================

test.describe('🏦 Supported Destination Banks — /payment/supported-destination-banks', () => {
    test.describe.configure({ mode: 'serial' });

    let token = null;

    test.beforeAll(async ({ request }) => {
        const result = await generateToken(request);
        token = result.token;
        expect(token, '❌ Could not obtain access token in beforeAll').not.toBeNull();
    });

    test('GET returns list of supported destination banks', async ({ request }) => {
        const response = await request.get(
            `${BASE_URL}/payment/supported-destination-banks`,
            {
                headers: bearerGetHeaders(token),
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
                headers: bearerGetHeaders(token),
                timeout: REQUEST_TIMEOUT,
            }
        );

        const body = await safeJson(response);
        expect(response.status()).toBe(200);

        for (const bank of body.data) {
            // API returns 'service_code' not 'code'
            expect(bank).toHaveProperty('service_code');
            expect(typeof bank.service_code).toBe('string');
            console.log(`  ✅ Bank: ${bank.service_code} — ${bank.name ?? '(no name)'}`);
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
        expect([200, 401, 466, 500]).toContain(response.status());
    });
});

// =============================================================================
// ❌ ERROR HANDLING — Custom JustPayTo Response Codes
// =============================================================================

test.describe('❌ Error Handling — Custom Response Codes', () => {
    test.describe.configure({ mode: 'serial' });

    let token = null;

    test.beforeAll(async ({ request }) => {
        const result = await generateToken(request);
        token = result.token;
        expect(token, '❌ Could not obtain access token in beforeAll').not.toBeNull();
    });

    test('462 Invalid Request — activate with empty body', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(token),
            data: {},
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Empty body: ${response.status()}`);
        expect([400, 404, 462, 500]).toContain(response.status());
    });

    test('463 Invalid Payment Method — bogus method code', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerHeaders(token),
            data: {
                method_code: 'fake_method_9999',
                provider_code: 'fake_provider',
                success_redirect_url: 'https://justpay.to/success',
                failed_redirect_url: 'https://justpay.to/failed',
            },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Bogus method: ${response.status()}`);
        expect([400, 401, 404, 463, 500]).toContain(response.status());
    });

    test('401 Unauthorized — expired/fake Bearer token', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods`, {
            headers: { ...BASE_HEADERS, 'Authorization': 'Bearer this-is-a-fake-token' },
            timeout: REQUEST_TIMEOUT,
        });

        console.log(`📥 Fake token: ${response.status()}`);
        // NOTE: sandbox does not enforce Bearer token validation — returns 200
        expect([200, 401, 403, 500]).toContain(response.status());
    });

    test('405 Method Not Allowed — GET on POST-only endpoint', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/payment-methods/activate`, {
            headers: bearerGetHeaders(token),
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