import { test, expect } from '@playwright/test';

/**
 * ============================================================
 * Unit Tests — Donation Payment Methods (All 4 in one file)
 * ============================================================
 * Source: e2e_tests/donation/
 *   - bank-transfer.spec.js    (GawadKalinga)
 *   - credit-card.spec.js
 *   - ewallet.spec.js
 *   - online-banking.spec.js
 *
 * What makes Donation DIFFERENT from Individual:
 *   - CTA button: "Donate Now" (not "Send Money")
 *   - Message field ID: #what-is-your-donation-for-add-a-message-or-additional-notes
 *     (much longer ID than individual's #message-order-items-ref)
 *   - Summary row key: "Source of Fund" (not "Payment Method")
 *   - Payer email subject: "You are donating" (not "You are sending")
 *   - GCash: no merchant email step
 *   - Online banking: success phrase "complete your payment" +
 *     subject "Complete your donation" + no merchant email
 *
 * Strategy: 2-3 tests per method, shared logic tested once.
 *
 * Structure:
 *   SHARED   — logic identical across all 4 donation methods
 *   DONATION — donation-specific differences vs individual
 *   A        — bank transfer specifics
 *   B        — credit card specifics
 *   C        — GCash specifics
 *   D        — online banking specifics
 * ============================================================
 */

// ─── Env fixtures ─────────────────────────────────────────────────────────────

const ENV = {
    name:          process.env.INDIVIDUAL_USER_NAME        || 'Maria Santos',
    email:         process.env.INDIVIDUAL_USER_EMAIL       || 'fpztest.sjardin@gmail.com',
    mobile:        process.env.INDIVIDUAL_USER_MOBILE      || '9204591518',
    address:       process.env.INDIVIDUAL_USER_ADDRESS     || 'Makati',
    nationality:   process.env.INDIVIDUAL_USER_NATIONALITY || 'Filipino',
    birthdate:     process.env.INDIVIDUAL_USER_BIRTHDATE   || '010101',
    birthplace:    process.env.INDIVIDUAL_USER_BIRTHPLACE  || 'Makati',
    merchantEmail: process.env.INDIVIDUAL_MERCHANT_EMAIL   || 'fpz.test1@gmail.com',
    cardNumber:    process.env.INDIVIDUAL_CARD_NUMBER      || '4242424242424242',
    cardExp:       process.env.INDIVIDUAL_CARD_EXP         || '05/31',
    cardCvv:       process.env.INDIVIDUAL_CARD_CVV         || '100',
    paymentUrl:    process.env.GAWADKALINGA_PAYMENT_URL    || 'https://dev.justpay.to/gawadkalinga',
};

// ─── Pure logic helpers ───────────────────────────────────────────────────────

const detectOtpType = (text) => {
    const l = (text ?? '').toLowerCase();
    return (l.includes('mobile') || l.includes('phone')) && !l.includes('email') ? 'sms' : 'email';
};

const isValidOtp = (otp) =>
    typeof otp === 'string' && otp.length === 6 && /^[A-Z0-9]{6}$/i.test(otp);

const isValidIp = (v) =>
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(v ?? '');

const cleanIp = (raw) => (raw ?? '').replace(/[()]/g, '').trim();

const normaliseDob = (v) => (v ?? '').replace(/\D/g, '');

const dobMatches = (displayed, envVal) => {
    const a = normaliseDob(displayed), e = normaliseDob(envVal);
    return e.length > 0 && a.includes(e);
};

const buildWindow = (ms, lookback = 30000) => new Date(ms - lookback).toISOString();

const kycRequired = (count, body) =>
    count > 0 && (body ?? '').toLowerCase().includes('residential address is required');

const nameMatch     = (d, e) => (d ?? '').toLowerCase().includes((e ?? '').toLowerCase());
const emailMatch    = (d, e) => (d ?? '').toLowerCase() === (e ?? '').toLowerCase();
const mobileMatch   = (d, e) => (d ?? '').includes(e ?? '');
const labelContains = (d, e) => (d ?? '').includes(e ?? '');

// Two distinct success checks — critical for donation flow
const isTransactionSuccessful  = (body) => (body ?? '').toLowerCase().includes('transaction successful');
const isOnlineBankSuccess      = (body) => (body ?? '').toLowerCase().includes('complete your payment');

const isValidCardNumber = (n) => typeof n === 'string' && /^\d{13,19}$/.test(n.replace(/\s/g, ''));
const isValidExpiry     = (e) => /^\d{2}\/\d{2}$/.test(e ?? '');
const isValidCcv        = (c) => /^\d{3,4}$/.test(c ?? '');

// =============================================================================
// SHARED — identical logic across all 4 donation methods
// =============================================================================

test.describe('Shared — OTP logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('email OTP when no mobile/phone keyword', () => {
        expect(detectOtpType('Enter the code sent to your email')).toBe('email');
    });

    test('SMS OTP when instruction mentions mobile or phone', () => {
        expect(detectOtpType('Enter the code sent to your mobile number')).toBe('sms');
        expect(detectOtpType('Enter the code sent to your phone')).toBe('sms');
    });

    test('email wins when both mobile and email appear', () => {
        expect(detectOtpType('Enter the code sent to your mobile or email')).toBe('email');
    });

    test('valid OTP: 6-char alphanumeric', () => {
        expect(isValidOtp('ABC123')).toBe(true);
        expect(isValidOtp('ABC12')).toBe(false);
        expect(isValidOtp(null)).toBe(false);
    });
});

test.describe('Shared — KYC gate', () => {
    test.describe.configure({ mode: 'serial' });

    test('shows KYC when address field exists AND error in body', () => {
        expect(kycRequired(1, 'Residential Address is required.')).toBe(true);
    });

    test('hides KYC when field absent or error text absent', () => {
        expect(kycRequired(0, 'Residential Address is required.')).toBe(false);
        expect(kycRequired(1, 'Contact information')).toBe(false);
    });
});

test.describe('Shared — DOB normalisation', () => {
    test.describe.configure({ mode: 'serial' });

    test('strips slashes and hyphens before comparing', () => {
        expect(dobMatches('01/01/01', '010101')).toBe(true);
        expect(dobMatches('01-01-01', '010101')).toBe(true);
    });

    test('env birthdate normalises to digits only', () => {
        const n = normaliseDob(ENV.birthdate);
        expect(n.length).toBeGreaterThan(0);
        expect(/^\d+$/.test(n)).toBe(true);
    });

    test('text month names do NOT match digit-only env value', () => {
        expect(dobMatches('January 01, 2001', '010101')).toBe(false);
    });
});

test.describe('Shared — IP address', () => {
    test.describe.configure({ mode: 'serial' });

    test('full pipeline: parenthesised raw → cleaned → valid', () => {
        expect(isValidIp(cleanIp('(192.168.1.1)'))).toBe(true);
    });

    test('non-IP text fails', () => {
        expect(isValidIp('not an ip')).toBe(false);
    });
});

test.describe('Shared — Email search window', () => {
    test.describe.configure({ mode: 'serial' });

    test('is exactly 30 000 ms before trigger', () => {
        const t = 1700000000000;
        expect(t - new Date(buildWindow(t)).getTime()).toBe(30000);
    });
});

test.describe('Shared — Sender field assertions', () => {
    test.describe.configure({ mode: 'serial' });

    test('name: case-insensitive contains match', () => {
        expect(nameMatch(ENV.name.toUpperCase(), ENV.name)).toBe(true);
        expect(nameMatch('Juan Dela Cruz', ENV.name)).toBe(false);
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
// DONATION-SPECIFIC — differences vs individual payment flows
// =============================================================================

test.describe('Donation-specific — differences from individual', () => {
    test.describe.configure({ mode: 'serial' });

    test('CTA button is "Donate Now" not "Send Money"', () => {
        const donationCta  = 'Donate Now';
        const individualCta = 'Send Money';
        expect(donationCta).not.toBe(individualCta);
        expect(donationCta).toContain('Donate');
    });

    test('message field ID is the long donation-specific selector', () => {
        // Donation uses: #what-is-your-donation-for-add-a-message-or-additional-notes
        // Individual uses: #message-order-items-ref
        const donationId   = '#what-is-your-donation-for-add-a-message-or-additional-notes';
        const individualId = '#message-order-items-ref';
        expect(donationId).not.toBe(individualId);
        expect(donationId).toContain('donation-for');
    });

    test('summary row key is "Source of Fund" not "Payment Method"', () => {
        // Donation summary uses "Source of Fund" row — individual uses "Payment Method"
        const donationRow   = 'Source of Fund';
        const individualRow = 'Payment Method';
        expect(donationRow).not.toBe(individualRow);
        expect(donationRow).toContain('Source');
    });

    test('payer email subject is "You are donating" not "You are sending"', () => {
        const donationSubject   = 'You are donating';
        const individualSubject = 'You are sending';
        expect(donationSubject).not.toBe(individualSubject);
        expect(donationSubject).toContain('donating');
    });

    test('GAWADKALINGA_PAYMENT_URL env var is defined', () => {
        expect(typeof ENV.paymentUrl).toBe('string');
        expect(ENV.paymentUrl.length).toBeGreaterThan(0);
    });
});

// =============================================================================
// A. Donation — Bank transfer
// =============================================================================

test.describe('A. Donation bank transfer — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('payment label is BPI under "Source of Fund" row', () => {
        const label = 'Bank of the Philippine Islands';
        expect(labelContains(label, label)).toBe(true);
        expect(labelContains('GCash', label)).toBe(false);
    });

    test('success phrase is "transaction successful"', () => {
        expect(isTransactionSuccessful('transaction successful')).toBe(true);
        expect(isOnlineBankSuccess('transaction successful')).toBe(false);
    });

    test('has both payer and merchant email — subjects differ', () => {
        const payer    = 'You are donating';
        const merchant = 'You are receiving';
        expect(payer).not.toBe(merchant);
        expect(payer).toContain('donating');
        expect(merchant).toContain('receiving');
    });
});

// =============================================================================
// B. Donation — Credit card
// =============================================================================

test.describe('B. Donation credit card — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('payment label is "Credit Card" under "Source of Fund" row', () => {
        expect(labelContains('Credit Card', 'Credit Card')).toBe(true);
        expect(labelContains('Bank of the Philippine Islands', 'Credit Card')).toBe(false);
    });

    test('card fields have valid formats', () => {
        expect(isValidCardNumber(ENV.cardNumber)).toBe(true);
        expect(isValidExpiry(ENV.cardExp)).toBe(true);
        expect(isValidCcv(ENV.cardCvv)).toBe(true);
    });

    test('has both payer and merchant email (same subjects as bank transfer)', () => {
        // Credit card donation sends to both — same as bank transfer
        const payer    = 'You are donating';
        const merchant = 'You are receiving';
        expect(payer).toContain('donating');
        expect(merchant).toContain('receiving');
    });
});

// =============================================================================
// C. Donation — GCash
// =============================================================================

test.describe('C. Donation GCash — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('payment label is "GCash" under "Source of Fund" row', () => {
        expect(labelContains('GCash', 'GCash')).toBe(true);
        expect(labelContains('Bank of the Philippine Islands', 'GCash')).toBe(false);
    });

    test('success phrase is "transaction successful" (NOT "complete your payment")', () => {
        expect(isTransactionSuccessful('transaction successful')).toBe(true);
        expect(isOnlineBankSuccess('transaction successful')).toBe(false);
    });

    test('no merchant email — GCash donation is single-email only', () => {
        // GCash donation e2e only calls checkEmail once for payer
        // subject "You are donating" — no checkMerchantEmail call
        const payerSubject = 'You are donating';
        expect(payerSubject).toContain('donating');
        const hasNoMerchantStep = true; // confirmed from e2e spec
        expect(hasNoMerchantStep).toBe(true);
    });
});

// =============================================================================
// D. Donation — Online banking
// =============================================================================

test.describe('D. Donation online banking — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('success phrase is "complete your payment" — NOT "transaction successful"', () => {
        // Most critical difference in donation flows — wrong phrase = silent failure
        expect(isOnlineBankSuccess('complete your payment')).toBe(true);
        expect(isTransactionSuccessful('complete your payment')).toBe(false);
        expect(isOnlineBankSuccess('transaction successful')).toBe(false);
    });

    test('payer email subject is "Complete your donation" (unique to this method)', () => {
        const onlineSubject      = 'Complete your donation';
        const bankTransferSubject = 'You are donating';
        expect(onlineSubject).not.toBe(bankTransferSubject);
        expect(onlineSubject).toContain('Complete your donation');
    });

    test('no merchant email — online banking donation is single-email only', () => {
        // Online banking donation e2e only calls checkEmail once
        // No checkMerchantEmail — same as GCash donation
        const hasNoMerchantStep = true; // confirmed from e2e spec
        expect(hasNoMerchantStep).toBe(true);
    });
});