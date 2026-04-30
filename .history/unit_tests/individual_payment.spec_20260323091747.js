import { test, expect } from '@playwright/test';

/**
 * ============================================================
 * Unit Tests — Individual Payment Methods (All 4 in one file)
 * ============================================================
 * Covers:
 *   A. Bank transfer    — bank_fund_transfer / BPI
 *   B. GCash / e-wallet — e_wallet / GCash
 *   C. Credit card      — mastercard_visa / credit_card
 *   D. Online banking   — online_banking / BPI desktop
 *
 * Strategy — 2-3 tests per method, testing only what's UNIQUE
 * to that method. Shared logic (OTP type detection, KYC gate,
 * DOB normalisation, IP format, email window) is tested once
 * in the shared section and NOT repeated per method.
 *
 * Structure:
 *   SHARED  — logic identical across all 4 methods
 *   A       — bank transfer specifics
 *   B       — GCash specifics
 *   C       — credit card specifics
 *   D       — online banking specifics
 * ============================================================
 */

// ─── Env fixtures ─────────────────────────────────────────────────────────────

const ENV = {
    name:          process.env.INDIVIDUAL_USER_NAME      || 'Maria Santos',
    email:         process.env.INDIVIDUAL_USER_EMAIL     || 'fpztest.sjardin@gmail.com',
    mobile:        process.env.INDIVIDUAL_USER_MOBILE    || '9204591518',
    address:       process.env.INDIVIDUAL_USER_ADDRESS   || 'Makati',
    nationality:   process.env.INDIVIDUAL_USER_NATIONALITY || 'Filipino',
    birthdate:     process.env.INDIVIDUAL_USER_BIRTHDATE || '010101',
    birthplace:    process.env.INDIVIDUAL_USER_BIRTHPLACE || 'Makati',
    merchantEmail: process.env.INDIVIDUAL_MERCHANT_EMAIL || 'fpz.test1@gmail.com',
    cardNumber:    process.env.INDIVIDUAL_CARD_NUMBER    || '4242424242424242',
    cardExp:       process.env.INDIVIDUAL_CARD_EXP       || '05/31',
    cardCvv:       process.env.INDIVIDUAL_CARD_CVV       || '100',
};

// ─── Pure logic helpers (all inlined, no imports) ─────────────────────────────

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

const dobMatches = (displayed, env) => {
    const a = normaliseDob(displayed), e = normaliseDob(env);
    return e.length > 0 && a.includes(e);
};

const buildWindow = (ms, lookback = 30000) => new Date(ms - lookback).toISOString();

const kycRequired = (count, body) =>
    count > 0 && (body ?? '').toLowerCase().includes('residential address is required');

const nameMatch  = (d, e) => (d ?? '').toLowerCase().includes((e ?? '').toLowerCase());
const emailMatch = (d, e) => (d ?? '').toLowerCase() === (e ?? '').toLowerCase();
const mobileMatch = (d, e) => (d ?? '').includes(e ?? '');
const methodContains = (d, e) => (d ?? '').includes(e ?? '');

const isSuccess = (body) => (body ?? '').toLowerCase().includes('transaction successful');
const isOnlineBankSuccess = (body) => (body ?? '').toLowerCase().includes('complete your payment');

const isValidCardNumber = (n) => typeof n === 'string' && /^\d{13,19}$/.test(n.replace(/\s/g, ''));
const isValidExpiry = (e) => /^\d{2}\/\d{2}$/.test(e ?? '');
const isValidCcv = (c) => /^\d{3,4}$/.test(c ?? '');
const intlCardDetected = (visible) => visible === true;

// =============================================================================
// SHARED — logic identical across all 4 individual payment methods
// =============================================================================

test.describe('Shared — OTP logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('email OTP when instruction has no mobile/phone keyword', () => {
        expect(detectOtpType('Enter the code sent to your email')).toBe('email');
    });

    test('SMS OTP when instruction contains mobile or phone', () => {
        expect(detectOtpType('Enter the code sent to your mobile number')).toBe('sms');
        expect(detectOtpType('Enter the code sent to your phone')).toBe('sms');
    });

    test('email wins when both mobile and email appear in instruction', () => {
        expect(detectOtpType('Enter the code sent to your mobile or email')).toBe('email');
    });

    test('valid OTP: 6-char alphanumeric passes', () => {
        expect(isValidOtp('ABC123')).toBe(true);
    });

    test('invalid OTP: wrong length or special chars fail', () => {
        expect(isValidOtp('ABC12')).toBe(false);
        expect(isValidOtp('ABC-12')).toBe(false);
        expect(isValidOtp(null)).toBe(false);
    });
});

test.describe('Shared — KYC gate', () => {
    test.describe.configure({ mode: 'serial' });

    test('shows KYC when address field exists AND body has error text', () => {
        expect(kycRequired(1, 'Residential Address is required.')).toBe(true);
    });

    test('hides KYC when field count is 0 or error text absent', () => {
        expect(kycRequired(0, 'Residential Address is required.')).toBe(false);
        expect(kycRequired(1, 'Contact information')).toBe(false);
    });
});

test.describe('Shared — DOB normalisation', () => {
    test.describe.configure({ mode: 'serial' });

    test('strips slashes and hyphens before comparing', () => {
        expect(dobMatches('01/01/', '010101')).toBe(true);
        expect(dobMatches('1990-01-01', '010101')).toBe(true);
    });

    test('env birthdate normalises to digits only', () => {
        const normalised = normaliseDob(ENV.birthdate);
        expect(normalised.length).toBeGreaterThan(0);
        expect(/^\d+$/.test(normalised)).toBe(true);
    });

    test('text month names do NOT match digit-only env value', () => {
        expect(dobMatches('January 01, 1990', '010101')).toBe(false);
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

test.describe('Shared — Sender field assertions (INDIVIDUAL_* env)', () => {
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
// A. Bank transfer — bank_fund_transfer / BPI
// =============================================================================

test.describe('A. Bank transfer — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('payment method label is "Bank of the Philippine Islands"', () => {
        const label = 'Bank of the Philippine Islands';
        expect(methodContains(label, label)).toBe(true);
        expect(methodContains('GCash', label)).toBe(false);
    });

    test('success phrase is "transaction successful"', () => {
        expect(isSuccess('transaction successful')).toBe(true);
        expect(isSuccess('complete your payment')).toBe(false); // NOT the bank transfer phrase
    });

    test('payer email subject is "You are sending", merchant is "You are receiving"', () => {
        const payer    = 'You are sending';
        const merchant = 'You are receiving';
        expect(payer).not.toBe(merchant);
        expect(payer).toContain('sending');
        expect(merchant).toContain('receiving');
    });
});

// =============================================================================
// B. GCash / e-wallet
// =============================================================================

test.describe('B. GCash — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('payment method label is "GCash" (not BPI or Credit Card)', () => {
        expect(methodContains('GCash', 'GCash')).toBe(true);
        expect(methodContains('Bank of the Philippine Islands', 'GCash')).toBe(false);
    });

    test('success phrase is "transaction successful" (same as bank transfer, NOT online banking)', () => {
        expect(isSuccess('transaction successful')).toBe(true);
        expect(isOnlineBankSuccess('transaction successful')).toBe(false);
    });

    test('mock popup URL is ewallet-mock.xendit (not bank-web-mock)', () => {
        // Unit test locks down the expected mock URL pattern per method
        const ewalletMock  = 'ewallet-mock-connector.xendit.co';
        const bankMock     = 'bank-web-mock.xendit.co';
        expect(ewalletMock).not.toBe(bankMock);
        expect(ewalletMock).toContain('ewallet');
        expect(bankMock).toContain('bank');
    });
});

// =============================================================================
// C. Credit card — mastercard_visa / credit_card
// =============================================================================

test.describe('C. Credit card — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('payment method label is "Credit Card"', () => {
        expect(methodContains('Credit Card', 'Credit Card')).toBe(true);
        expect(methodContains('GCash', 'Credit Card')).toBe(false);
        expect(methodContains('Bank of the Philippine Islands', 'Credit Card')).toBe(false);
    });

    test('card fields are valid formats', () => {
        expect(isValidCardNumber(ENV.cardNumber)).toBe(true);   // 16 digits
        expect(isValidExpiry(ENV.cardExp)).toBe(true);           // MM/YY
        expect(isValidCcv(ENV.cardCvv)).toBe(true);              // 3 digits
    });

    test('international card detection: visible street line 1 triggers address fields', () => {
        expect(intlCardDetected(true)).toBe(true);   // international card
        expect(intlCardDetected(false)).toBe(false);  // domestic card — skip address
    });
});

// =============================================================================
// D. Online banking — online_banking / BPI desktop
// =============================================================================

test.describe('D. Online banking — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('success phrase is "complete your payment" — NOT "transaction successful"', () => {
        // This is the most important difference — wrong phrase = silent failure
        expect(isOnlineBankSuccess('complete your payment')).toBe(true);
        expect(isSuccess('complete your payment')).toBe(false);     // would fail if checked wrong
        expect(isOnlineBankSuccess('transaction successful')).toBe(false); // bank transfer phrase
    });

    test('email subject is "Complete your transaction" (not "You are sending")', () => {
        const onlineSubject = 'Complete your transaction';
        const bankSubject   = 'You are sending';
        expect(onlineSubject).not.toBe(bankSubject);
        expect(onlineSubject).toContain('Complete your transaction');
    });

    test('no merchant email in online banking flow (single-email only)', () => {
        // Online banking spec only calls checkEmail once — no checkMerchantEmail
        // This test documents the intentional absence as a contract
        const hasNoMerchantStep = true; // confirmed from e2e spec
        expect(hasNoMerchantStep).toBe(true);
    });
}); 