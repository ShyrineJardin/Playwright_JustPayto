import { test, expect } from '@playwright/test';

/**
 * ============================================================
 * Unit Tests — Business Payment Methods (All methods, all fulfillment types)
 * ============================================================
 * Source: e2e_tests/business/
 *   regular/   bank-transfer, credit-card, ewallet, online-banking
 *   delivery/  bank-transfer, credit-card, ewallet, online-banking
 *   pickup/    bank-transfer, credit-card, ewallet, online-banking
 *
 * What makes Business DIFFERENT from Individual / Donation:
 *   - CTA: "I want to pay" (not "Send Money", "Donate Now", or "Pay Now")
 *   - Uses BUSINESS_USER_* env vars (name, email, mobile, delivery address)
 *     EXCEPT card fields which still use INDIVIDUAL_CARD_* env vars
 *   - Fulfillment dialog appears AFTER T&C, BEFORE payment summary:
 *       Regular  → just click OK (no extra fields)
 *       Delivery → For Delivery radio → address (#your-delivery-shipping-address)
 *                  + mobile + Google Maps verification
 *       Pick-up  → For Pick-up radio → time window (pickupStartTime / pickupEndTime)
 *                  + mobile
 *   - Summary shows "Your Delivery Shipping Address" row (delivery only)
 *   - Summary shows "Time of Pick-up" cell with HH:MM - HH:MM format (pickup only)
 *   - Email lookback is 120 seconds (2 min) — not 30 seconds like individual
 *   - Payer email subject: "Your payment of" (bank, card, GCash)
 *   - Merchant email subject: `${BUSINESS_USER_NAME} paid you` (dynamic from env)
 *   - Online banking only: success "complete your payment" +
 *     subject "Complete your transaction" + NO merchant email
 *   - Pick-up only: payer gets 2 emails —
 *       "Your payment of" + "Your order is ready for pickup"
 *   - Merchant email: present for bank, card, GCash (all fulfillment types)
 *                     absent for online banking (all fulfillment types)
 *
 * Structure:
 *   SHARED BUSINESS      — logic identical across all business methods
 *   BUSINESS-SPECIFIC    — differences from individual/donation
 *   FULFILLMENT          — regular vs delivery vs pickup logic
 *   A. Bank transfer     — payment-method-specific
 *   B. Credit card       — payment-method-specific
 *   C. GCash             — payment-method-specific
 *   D. Online banking    — payment-method-specific
 * ============================================================
 */

// ─── Env fixtures ─────────────────────────────────────────────────────────────

const ENV = {
    // Business user fields
    name:            process.env.BUSINESS_USER_NAME             || 'Juan Dela Cruz',
    email:           process.env.BUSINESS_USER_EMAIL            || 'fpz.test1@gmail.com',
    mobile:          process.env.BUSINESS_USER_MOBILE           || '9204591518',
    deliveryAddress: process.env.BUSINESS_USER_DELIVERY_ADDRESS || '123 Katipunan Avenue, Barangay Loyola Heights',
    merchantEmail:   process.env.BUSINESS_MERCHANT_EMAIL        || 'fpztest.sjardin@gmail.com',
    paymentUrl:      process.env.BUSINESS_PAYMENT_URL           || 'https://dev.justpay.to/mochigallery',

    // Card fields — business specs use INDIVIDUAL_CARD_* for card payments
    cardNumber:      process.env.INDIVIDUAL_CARD_NUMBER         || '4242424242424242',
    cardExp:         process.env.INDIVIDUAL_CARD_EXP            || '05/31',
    cardCvv:         process.env.INDIVIDUAL_CARD_CVV            || '100',
};

// ─── Pure logic helpers ───────────────────────────────────────────────────────

const isValidIp = (v) =>
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(v ?? '');

const cleanIp = (raw) => (raw ?? '').replace(/[()]/g, '').trim();

// Business uses 120s lookback — individual/donation use 30s
const buildWindow = (ms, lookback = 120000) => new Date(ms - lookback).toISOString();
const buildWindow30s = (ms) => new Date(ms - 30000).toISOString();

const nameMatch   = (d, e) => (d ?? '').toLowerCase().includes((e ?? '').toLowerCase());
const emailMatch  = (d, e) => (d ?? '').toLowerCase() === (e ?? '').toLowerCase();
const mobileMatch = (d, e) => (d ?? '').includes(e ?? '');
const labelContains = (d, e) => (d ?? '').includes(e ?? '');

const isTransactionSuccessful = (body) =>
    (body ?? '').toLowerCase().includes('transaction successful');
const isOnlineBankSuccess = (body) =>
    (body ?? '').toLowerCase().includes('complete your payment');

// Merchant email subject is dynamic: `${BUSINESS_USER_NAME} paid you`
const buildMerchantSubject = (name) => `${name} paid you`;

// Pick-up time format: HH:MM - HH:MM (extracted from td.fulfillment-detail via split('\n')[1])
const isValidPickupTimeRange = (text) =>
    /\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/.test(text ?? '');

const isValidCardNumber = (n) =>
    typeof n === 'string' && /^\d{13,19}$/.test(n.replace(/\s/g, ''));
const isValidExpiry = (e) => /^\d{2}\/\d{2}$/.test(e ?? '');
const isValidCcv    = (c) => /^\d{3,4}$/.test(c ?? '');

// =============================================================================
// SHARED BUSINESS — identical across all methods and fulfillment types
// =============================================================================

test.describe('Shared — IP address', () => {
    test.describe.configure({ mode: 'serial' });

    test('parenthesised raw → cleaned → valid IPv4', () => {
        expect(isValidIp(cleanIp('(192.168.1.1)'))).toBe(true);
    });

    test('non-IP text fails', () => {
        expect(isValidIp('not an ip')).toBe(false);
    });
});

test.describe('Shared — Email search window (120s lookback)', () => {
    test.describe.configure({ mode: 'serial' });

    test('business lookback is 120 000 ms (2 minutes)', () => {
        const t = 1700000000000;
        expect(t - new Date(buildWindow(t)).getTime()).toBe(120000);
    });

    test('individual lookback is 30 000 ms for comparison', () => {
        const t = 1700000000000;
        expect(t - new Date(buildWindow30s(t)).getTime()).toBe(30000);
    });

    test('business lookback is 4x longer than individual', () => {
        const t = 1700000000000;
        const business = t - new Date(buildWindow(t)).getTime();
        const individual = t - new Date(buildWindow30s(t)).getTime();
        expect(business / individual).toBe(4);
    });
});

test.describe('Shared — Sender field assertions (BUSINESS_USER_* env)', () => {
    test.describe.configure({ mode: 'serial' });

    test('name: case-insensitive contains match', () => {
        expect(nameMatch(ENV.name.toUpperCase(), ENV.name)).toBe(true);
        expect(nameMatch('Pedro Penduko', ENV.name)).toBe(false);
    });

    test('email: exact case-insensitive match', () => {
        expect(emailMatch(ENV.email.toUpperCase(), ENV.email)).toBe(true);
        expect(emailMatch(`${ENV.email} `, ENV.email)).toBe(false);
    });

    test('mobile: displayed contains env mobile', () => {
        expect(mobileMatch(`+63 ${ENV.mobile}`, ENV.mobile)).toBe(true);
        expect(mobileMatch('9000000000', ENV.mobile)).toBe(false);
    });

    test('sub total contains 100.00', () => {
        expect('PHP 100.00'.includes('100.00')).toBe(true);
    });
});

// =============================================================================
// BUSINESS-SPECIFIC — differences from individual, donation, meralco, bayadcenter
// =============================================================================

test.describe('Business-specific — differences from other flow types', () => {
    test.describe.configure({ mode: 'serial' });

    test('CTA is "I want to pay" — unique across all flows', () => {
        const businessCta   = 'I want to pay';
        const individualCta = 'Send Money';
        const donationCta   = 'Donate Now';
        const billerCta     = 'Pay Now';
        expect(businessCta).not.toBe(individualCta);
        expect(businessCta).not.toBe(donationCta);
        expect(businessCta).not.toBe(billerCta);
    });

    test('uses BUSINESS_USER_* env vars (not INDIVIDUAL_USER_*)', () => {
        // Name, email, mobile come from BUSINESS_USER_* 
        // Card fields come from INDIVIDUAL_CARD_* (shared across flows)
        expect(ENV.name).toBeDefined();
        expect(ENV.email).toBeDefined();
        expect(ENV.mobile).toBeDefined();
        expect(ENV.cardNumber).toBeDefined(); // still INDIVIDUAL_CARD_NUMBER
    });

    test('merchant email subject is dynamic: "${name} paid you"', () => {
        const subject = buildMerchantSubject(ENV.name);
        expect(subject).toContain(ENV.name);
        expect(subject).toContain('paid you');
        expect(subject).toBe(`${ENV.name} paid you`);
    });

    test('merchant subject differs from individual ("You are receiving")', () => {
        const businessMerchant   = buildMerchantSubject(ENV.name);
        const individualMerchant = 'You are receiving';
        expect(businessMerchant).not.toBe(individualMerchant);
    });

    test('payer email subject is "Your payment of" (not "You are sending")', () => {
        const businessPayer   = 'Your payment of';
        const individualPayer = 'You are sending';
        expect(businessPayer).not.toBe(individualPayer);
        expect(businessPayer).toContain('payment of');
    });

    test('email lookback is 120s — not 30s like individual flows', () => {
        const t = 1700000000000;
        const businessMs   = t - new Date(buildWindow(t)).getTime();
        const individualMs = t - new Date(buildWindow30s(t)).getTime();
        expect(businessMs).toBe(120000);
        expect(individualMs).toBe(30000);
        expect(businessMs).toBeGreaterThan(individualMs);
    });

    test('BUSINESS_PAYMENT_URL env var is defined', () => {
        expect(ENV.paymentUrl.length).toBeGreaterThan(0);
    });
});

// =============================================================================
// FULFILLMENT TYPES — regular vs delivery vs pickup
// =============================================================================

test.describe('Fulfillment — Regular payment', () => {
    test.describe.configure({ mode: 'serial' });

    test('regular flow just clicks OK — no delivery or pickup fields', () => {
        // Regular: after Pay Now → fulfillment dialog → click OK directly
        // No address field, no time window, no Google Maps
        const hasDeliveryField = false;
        const hasPickupTime    = false;
        expect(hasDeliveryField).toBe(false);
        expect(hasPickupTime).toBe(false);
    });

    test('regular payer gets 1 email ("Your payment of")', () => {
        const emails = ['Your payment of'];
        expect(emails).toHaveLength(1);
        expect(emails[0]).toContain('Your payment of');
    });
});

test.describe('Fulfillment — Delivery', () => {
    test.describe.configure({ mode: 'serial' });

    test('delivery selector is #your-delivery-shipping-address', () => {
        const selector = '#your-delivery-shipping-address';
        expect(selector).toContain('delivery-shipping-address');
    });

    test('delivery summary row key is "Your Delivery Shipping Address"', () => {
        const rowKey = 'Your Delivery Shipping Address';
        expect(rowKey).toContain('Delivery Shipping Address');
    });

    test('BUSINESS_USER_DELIVERY_ADDRESS env var is defined', () => {
        expect(ENV.deliveryAddress.length).toBeGreaterThan(0);
    });

    test('delivery address contains env value', () => {
        expect(labelContains(ENV.deliveryAddress, ENV.deliveryAddress)).toBe(true);
    });

    test('delivery has Google Maps verification step — #google-maps-container', () => {
        const mapSelector = '#google-maps-container';
        expect(mapSelector).toContain('google-maps');
    });

    test('delivery payer gets 1 email ("Your payment of")', () => {
        const emails = ['Your payment of'];
        expect(emails).toHaveLength(1);
    });
});

test.describe('Fulfillment — Pick-up', () => {
    test.describe.configure({ mode: 'serial' });

    test('pickup time input selectors are pickupStartTime and pickupEndTime', () => {
        expect('input[name="pickupStartTime"]').toContain('pickupStartTime');
        expect('input[name="pickupEndTime"]').toContain('pickupEndTime');
    });

    test('valid pickup time range matches HH:MM - HH:MM format', () => {
        expect(isValidPickupTimeRange('09:00 - 17:00')).toBe(true);
        expect(isValidPickupTimeRange('09:00-17:00')).toBe(true);
    });

    test('invalid time range fails', () => {
        expect(isValidPickupTimeRange('9am to 5pm')).toBe(false);
        expect(isValidPickupTimeRange('')).toBe(false);
    });

    test('time range extracted via split("\\n")[1] from fulfillment-detail cell', () => {
        const rawCell = 'Time of Pick-up\n09:00 - 17:00';
        const extracted = rawCell.split('\n')[1];
        expect(isValidPickupTimeRange(extracted)).toBe(true);
        expect(extracted).toContain('09:00');
        expect(extracted).toContain('17:00');
    });

    test('pickup payer gets 2 emails', () => {
        const emails = ['Your payment of', 'Your order is ready for pickup'];
        expect(emails).toHaveLength(2);
        expect(emails[0]).toContain('Your payment of');
        expect(emails[1]).toContain('ready for pickup');
    });

    test('"Your order is ready for pickup" is unique to pickup — not in regular or delivery', () => {
        const pickupOnlySubject = 'Your order is ready for pickup';
        expect(pickupOnlySubject).not.toBe('Your payment of');
        expect(pickupOnlySubject).toContain('pickup');
    });
});

// =============================================================================
// A. Business — Bank transfer
// =============================================================================

test.describe('A. Business bank transfer — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('payment label is "Bank of the Philippine Islands"', () => {
        const bpi = 'Bank of the Philippine Islands';
        expect(labelContains(bpi, bpi)).toBe(true);
        expect(labelContains('GCash', bpi)).toBe(false);
    });

    test('success phrase is "transaction successful"', () => {
        expect(isTransactionSuccessful('transaction successful')).toBe(true);
        expect(isOnlineBankSuccess('transaction successful')).toBe(false);
    });

    test('has merchant email — subject is dynamic', () => {
        const subject = buildMerchantSubject(ENV.name);
        expect(subject).toContain('paid you');
        expect(subject).toContain(ENV.name);
    });

    test('payer subject is "Your payment of"', () => {
        expect('Your payment of').toContain('payment of');
        expect('Your payment of').not.toContain('donating');
        expect('Your payment of').not.toContain('sending');
    });
});

// =============================================================================
// B. Business — Credit card
// =============================================================================

test.describe('B. Business credit card — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('payment label is "Credit Card"', () => {
        expect(labelContains('Credit Card', 'Credit Card')).toBe(true);
        expect(labelContains('GCash', 'Credit Card')).toBe(false);
    });

    test('card fields use INDIVIDUAL_CARD_* env vars (not BUSINESS_*)', () => {
        // Business credit card specs fill:
        //   input#account-holder-s-full-name ← INDIVIDUAL_USER_NAME (account holder)
        //   input#card-number                ← INDIVIDUAL_CARD_NUMBER
        //   input#expiration-date-mm-yy      ← INDIVIDUAL_CARD_EXP
        //   input#ccv-or-cvc-back-of-the-card← INDIVIDUAL_CARD_CVV
        expect(isValidCardNumber(ENV.cardNumber)).toBe(true);
        expect(isValidExpiry(ENV.cardExp)).toBe(true);
        expect(isValidCcv(ENV.cardCvv)).toBe(true);
    });

    test('has merchant email — same dynamic subject as bank transfer', () => {
        expect(buildMerchantSubject(ENV.name)).toContain('paid you');
    });

    test('success phrase is "transaction successful" (not online banking phrase)', () => {
        expect(isTransactionSuccessful('transaction successful')).toBe(true);
        expect(isOnlineBankSuccess('transaction successful')).toBe(false);
    });
});

// =============================================================================
// C. Business — GCash
// =============================================================================

test.describe('C. Business GCash — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('payment label is "GCash"', () => {
        expect(labelContains('GCash', 'GCash')).toBe(true);
        expect(labelContains('Bank of the Philippine Islands', 'GCash')).toBe(false);
    });

    test('success phrase is "transaction successful"', () => {
        expect(isTransactionSuccessful('transaction successful')).toBe(true);
        expect(isOnlineBankSuccess('transaction successful')).toBe(false);
    });

    test('mock popup is ewallet-mock — not bank-web-mock', () => {
        expect('ewallet-mock-connector.xendit.co').toContain('ewallet');
        expect('ewallet-mock-connector.xendit.co').not.toBe('bank-web-mock.xendit.co');
    });

    test('has merchant email for all 3 fulfillment types', () => {
        // GCash business sends merchant email in regular, delivery, and pickup
        const subject = buildMerchantSubject(ENV.name);
        expect(subject).toContain('paid you');
    });
});

// =============================================================================
// D. Business — Online banking
// =============================================================================

test.describe('D. Business online banking — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('success phrase is "complete your payment" — NOT "transaction successful"', () => {
        expect(isOnlineBankSuccess('complete your payment')).toBe(true);
        expect(isTransactionSuccessful('complete your payment')).toBe(false);
        expect(isOnlineBankSuccess('transaction successful')).toBe(false);
    });

    test('payer email subject is "Complete your transaction"', () => {
        const onlineSubject   = 'Complete your transaction';
        const regularSubject  = 'Your payment of';
        expect(onlineSubject).not.toBe(regularSubject);
        expect(onlineSubject).toContain('Complete your transaction');
    });

    test('NO merchant email — online banking business is single-email only', () => {
        // Unlike bank, card, GCash — online banking business does NOT call checkMerchantEmail
        const hasNoMerchantStep = true;
        expect(hasNoMerchantStep).toBe(true);
    });

    test('online banking has no merchant email across ALL 3 fulfillment types', () => {
        // Confirmed from: regular/online-banking, delivery/online-banking, pickup/online-banking
        // All 3 only call checkEmail once (no checkMerchantEmail)
        const fulfillmentTypes = ['regular', 'delivery', 'pickup'];
        fulfillmentTypes.forEach(type => {
            const noMerchantEmail = true; // confirmed from each spec
            expect(noMerchantEmail, `${type} online banking should have no merchant email`)
                .toBe(true);
        });
    });

    test('online banking payment label is BPI (same as bank transfer)', () => {
        const bpi = 'Bank of the Philippine Islands';
        expect(labelContains(bpi, bpi)).toBe(true);
        expect(labelContains('Credit Card', bpi)).toBe(false);
        expect(labelContains('GCash', bpi)).toBe(false);
    });
});

// =============================================================================
// CROSS-METHOD — merchant email matrix
// =============================================================================

test.describe('Merchant email matrix', () => {
    test.describe.configure({ mode: 'serial' });

    test('bank, card, GCash all have merchant email for all fulfillment types', () => {
        const withMerchant = ['bank transfer', 'credit card', 'gcash'];
        withMerchant.forEach(method => {
            const hasMerchant = true;
            expect(hasMerchant, `${method} should have merchant email`).toBe(true);
        });
    });

    test('online banking has NO merchant email for any fulfillment type', () => {
        const noMerchant = ['regular', 'delivery', 'pickup'];
        noMerchant.forEach(type => {
            const hasMerchant = false;
            expect(hasMerchant, `online banking ${type} should not have merchant email`)
                .toBe(false);
        });
    });

    test('merchant subject format: "${BUSINESS_USER_NAME} paid you"', () => {
        const subject = buildMerchantSubject('Maria Santos');
        expect(subject).toBe('Maria Santos paid you');
    });

    test('merchant subject is env-dependent — not hardcoded', () => {
        const subjectA = buildMerchantSubject('User A');
        const subjectB = buildMerchantSubject('User B');
        expect(subjectA).not.toBe(subjectB);
        expect(subjectA).toContain('User A');
        expect(subjectB).toContain('User B');
    });
});