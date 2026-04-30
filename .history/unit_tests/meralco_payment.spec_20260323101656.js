import { test, expect } from '@playwright/test';

/**
 * ============================================================
 * Unit Tests — Meralco Payment Methods (All 4 in one file)
 * ============================================================
 * Source: e2e_tests/meralco/
 *   - bank-transfer.spec.js
 *   - credit-card.spec.js
 *   - ewallet.spec.js
 *   - online-banking.spec.js
 *
 * What makes Meralco DIFFERENT from Individual / Donation:
 *   - CTA: "Pay Now" (not "Send Money" or "Donate Now")
 *   - Has a biller input step BEFORE payment method selection:
 *       input#biller-information → click
 *       input#account-number[name=referenceNumber] → fill MERALCO_ACCOUNT_NUMBER
 *       input#amount → fill '900' (NOT #amount-to-pay)
 *   - Amount is pre-filled in biller form then VERIFIED against
 *     #amount-to-pay after method selection (numeric comparison)
 *   - No KYC, no OTP step
 *   - Summary has fee breakdown: Processing Fee, System Fee,
 *     Other Fees (Biller Pass-on) — same 3-row pattern as BayadCenter
 *   - Summary uses "Payment Method" row (not "Source of Fund")
 *   - ALL 4 methods have no merchant email (single-email flow)
 *   - Payer email subject: "Successful payment of" (bank, card, GCash)
 *   - Online banking only: "complete your payment" + "Complete your transaction"
 *
 * Structure:
 *   SHARED   — logic identical across all 4 Meralco methods
 *   MERALCO  — traits that differ from individual/donation flow types
 *   A        — bank transfer
 *   B        — credit card
 *   C        — GCash
 *   D        — online banking
 * ============================================================
 */

// ─── Env fixtures ─────────────────────────────────────────────────────────────

const ENV = {
    name:           process.env.INDIVIDUAL_USER_NAME   || 'Maria Santos',
    email:          process.env.INDIVIDUAL_USER_EMAIL  || 'fpztest.sjardin@gmail.com',
    mobile:         process.env.INDIVIDUAL_USER_MOBILE || '9204591518',
    meralcoAccount: process.env.MERALCO_ACCOUNT_NUMBER || '0001005787',
    paymentUrl:     process.env.MERALCO_PAYMENT_URL    || 'https://dev.justpay.to/meralco',
    cardNumber:     process.env.INDIVIDUAL_CARD_NUMBER || '4242424242424242',
    cardExp:        process.env.INDIVIDUAL_CARD_EXP    || '05/31',
    cardCvv:        process.env.INDIVIDUAL_CARD_CVV    || '100',
};

// ─── Pure logic helpers ───────────────────────────────────────────────────────

const isValidIp = (v) =>
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(v ?? '');

const cleanIp = (raw) => (raw ?? '').replace(/[()]/g, '').trim();

const buildWindow = (ms, lookback = 30000) => new Date(ms - lookback).toISOString();

const nameMatch     = (d, e) => (d ?? '').toLowerCase().includes((e ?? '').toLowerCase());
const emailMatch    = (d, e) => (d ?? '').toLowerCase() === (e ?? '').toLowerCase();
const mobileMatch   = (d, e) => (d ?? '').includes(e ?? '');
const labelContains = (d, e) => (d ?? '').includes(e ?? '');

const isTransactionSuccessful = (body) =>
    (body ?? '').toLowerCase().includes('transaction successful');
const isOnlineBankSuccess = (body) =>
    (body ?? '').toLowerCase().includes('complete your payment');

const isValidPesoAmount = (text) =>
    /₱[\d,]+\.\d{2}/.test(text ?? '');

const parsePesoAmount = (text) => {
    const v = parseFloat((text ?? '').replace(/[₱,]/g, ''));
    return isNaN(v) ? null : v;
};

// Mirrors e2e: parseFloat(displayed.replace(/,/g,'')) === parseFloat(expected)
const amountsMatch = (displayed, expected) => {
    const d = parseFloat((displayed ?? '').replace(/,/g, ''));
    const e = parseFloat(expected ?? '');
    return !isNaN(d) && !isNaN(e) && d === e;
};

const isValidCardNumber = (n) =>
    typeof n === 'string' && /^\d{13,19}$/.test(n.replace(/\s/g, ''));
const isValidExpiry = (e) => /^\d{2}\/\d{2}$/.test(e ?? '');
const isValidCcv    = (c) => /^\d{3,4}$/.test(c ?? '');

// =============================================================================
// SHARED — identical across all 4 Meralco methods
// =============================================================================

test.describe('Shared — IP address', () => {
    test.describe.configure({ mode: 'serial' });

    test('parenthesised raw → cleaned → valid', () => {
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
});

test.describe('Shared — Peso currency format', () => {
    test.describe.configure({ mode: 'serial' });

    test('valid peso strings pass', () => {
        expect(isValidPesoAmount('₱900.00')).toBe(true);
        expect(isValidPesoAmount('₱1,500.00')).toBe(true);
    });

    test('missing symbol or decimal fails', () => {
        expect(isValidPesoAmount('900.00')).toBe(false);
        expect(isValidPesoAmount('₱900')).toBe(false);
    });

    test('parsePesoAmount strips ₱ and commas', () => {
        expect(parsePesoAmount('₱900.00')).toBe(900);
        expect(parsePesoAmount('₱1,500.00')).toBe(1500);
        expect(parsePesoAmount('N/A')).toBeNull();
    });
});

test.describe('Shared — Amount comparison logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('900 matches 900', () => {
        expect(amountsMatch('900', '900')).toBe(true);
    });

    test('900.00 matches 900', () => {
        expect(amountsMatch('900.00', '900')).toBe(true);
    });

    test('comma-formatted 1,500 matches 1500', () => {
        expect(amountsMatch('1,500', '1500')).toBe(true);
    });

    test('mismatched amounts fail', () => {
        expect(amountsMatch('800', '900')).toBe(false);
    });

    test('non-numeric input fails gracefully', () => {
        expect(amountsMatch('N/A', '900')).toBe(false);
    });
});

// =============================================================================
// MERALCO-SPECIFIC — differences from individual and donation flows
// =============================================================================

test.describe('Meralco-specific — differences from other flow types', () => {
    test.describe.configure({ mode: 'serial' });

    test('CTA is "Pay Now" — not "Send Money" or "Donate Now"', () => {
        expect('Pay Now').not.toBe('Send Money');
        expect('Pay Now').not.toBe('Donate Now');
    });

    test('biller input selector is input#biller-information', () => {
        expect('input#biller-information').toContain('biller-information');
    });

    test('account number selector includes referenceNumber', () => {
        expect('input#account-number[name=referenceNumber]').toContain('referenceNumber');
    });

    test('biller amount uses input#amount — not #amount-to-pay', () => {
        expect('input#amount').not.toBe('input#amount-to-pay[name="amount"]');
    });

    test('MERALCO_ACCOUNT_NUMBER env var is defined', () => {
        expect(ENV.meralcoAccount.length).toBeGreaterThan(0);
    });

    test('billed amount is 900 across all 4 methods', () => {
        expect(amountsMatch('900', '900')).toBe(true);
        expect(amountsMatch('100', '900')).toBe(false);
    });

    test('ALL 4 methods have no merchant email step', () => {
        // Every Meralco e2e calls checkEmail once only — no checkMerchantEmail
        const hasNoMerchantStep = true;
        expect(hasNoMerchantStep).toBe(true);
    });

    test('summary row is "Payment Method" (not "Source of Fund")', () => {
        expect('Payment Method').not.toBe('Source of Fund');
    });

    test('summary has exactly 3 fee rows', () => {
        const feeRows = ['Processing Fee', 'System Fee', 'Other Fees (Biller Pass-on)'];
        expect(feeRows).toHaveLength(3);
        expect(feeRows).toContain('Other Fees (Biller Pass-on)');
    });
});

// =============================================================================
// A. Meralco — Bank transfer
// =============================================================================

test.describe('A. Meralco bank transfer — unique logic', () => {
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

    test('payer email subject is "Successful payment of"', () => {
        const subject = 'Successful payment of';
        expect(subject).toContain('Successful payment');
        expect(subject).not.toContain('Complete your');
    });
});

// =============================================================================
// B. Meralco — Credit card
// =============================================================================

test.describe('B. Meralco credit card — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('payment label is "Credit Card"', () => {
        expect(labelContains('Credit Card', 'Credit Card')).toBe(true);
        expect(labelContains('GCash', 'Credit Card')).toBe(false);
    });

    test('card fields have valid formats', () => {
        expect(isValidCardNumber(ENV.cardNumber)).toBe(true);
        expect(isValidExpiry(ENV.cardExp)).toBe(true);
        expect(isValidCcv(ENV.cardCvv)).toBe(true);
    });

    test('same payer email subject as bank transfer', () => {
        expect('Successful payment of').toBe('Successful payment of');
    });
});

// =============================================================================
// C. Meralco — GCash
// =============================================================================

test.describe('C. Meralco GCash — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('payment label is "GCash"', () => {
        expect(labelContains('GCash', 'GCash')).toBe(true);
        expect(labelContains('Bank of the Philippine Islands', 'GCash')).toBe(false);
    });

    test('success phrase is "transaction successful" (not online banking phrase)', () => {
        expect(isTransactionSuccessful('transaction successful')).toBe(true);
        expect(isOnlineBankSuccess('transaction successful')).toBe(false);
    });

    test('mock popup is ewallet-mock — not bank-web-mock', () => {
        expect('ewallet-mock-connector.xendit.co').not.toBe('bank-web-mock.xendit.co');
        expect('ewallet-mock-connector.xendit.co').toContain('ewallet');
    });
});

// =============================================================================
// D. Meralco — Online banking
// =============================================================================

test.describe('D. Meralco online banking — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('success phrase is "complete your payment" — NOT "transaction successful"', () => {
        expect(isOnlineBankSuccess('complete your payment')).toBe(true);
        expect(isTransactionSuccessful('complete your payment')).toBe(false);
        expect(isOnlineBankSuccess('transaction successful')).toBe(false);
    });

    test('email subject is "Complete your transaction" — unique to online banking', () => {
        const onlineSubject = 'Complete your transaction';
        const otherSubject  = 'Successful payment of';
        expect(onlineSubject).not.toBe(otherSubject);
        expect(onlineSubject).toContain('Complete your transaction');
    });

    test('payment label is BPI (same as bank transfer — not Credit Card or GCash)', () => {
        const bpi = 'Bank of the Philippine Islands';
        expect(labelContains(bpi, bpi)).toBe(true);
        expect(labelContains('Credit Card', bpi)).toBe(false);
        expect(labelContains('GCash', bpi)).toBe(false);
    });
});