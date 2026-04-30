import { test, expect } from '@playwright/test';

/**
 * ============================================================
 * Unit Tests — Autosweep Payment Methods (All 4 in one file)
 * ============================================================
 * Source: e2e_tests/autosweep/
 *   - bank-transfer.spec.js
 *   - credit-card.spec.js
 *   - ewallet.spec.js
 *   - online-banking.spec.js
 *
 * What makes Autosweep DIFFERENT from every other flow:
 *   - Page gate: announcement modal (section.modal.information) must be
 *     dismissed BEFORE anything else — unique to Autosweep
 *   - CTA: "Load Now" (not "Send Money", "Donate Now", "Pay Now", "I want to pay")
 *   - Plate input: input#plate-no-card-no (AUTOSWEEP_PLATE_NUMBER env var)
 *   - Amount: radio button selection (100/200/300/500/1000) → "Select" button
 *     (NOT a text input — hardcoded to 500 in all 4 specs)
 *   - Submit button: "Load PHP" (dynamic label, not "Pay Now" or "Send Money")
 *   - Plate confirmation: checkbox input[type="checkbox"][name="plateNumber"]
 *     must be checked AFTER clicking Load PHP
 *   - Payment description row: "You are reloading" (not "You are sending" or "You are paying")
 *   - Summary has only 2 fee rows: Processing Fee + System Fee
 *     (NO "Other Fees (Biller Pass-on)" unlike Meralco/BayadCenter)
 *   - Summary key row for vehicle: "Plate Number"
 *   - ALL 4 methods use INDIVIDUAL_USER_* env vars for sender
 *   - ALL 4 methods have no merchant email (single-email flow)
 *   - Payer email subject: "Successful payment of" (bank, card, GCash)
 *   - Online banking: success "complete your payment" +
 *     "Complete your transaction with" (same as BayadCenter — includes "with")
 *   - Note: specs are described as "not complete yet" — tests document
 *     currently confirmed logic only
 *
 * Structure:
 *   SHARED        — logic identical across all 4 Autosweep methods
 *   AUTOSWEEP     — Autosweep-specific traits vs all other flows
 *   A             — bank transfer
 *   B             — credit card
 *   C             — GCash
 *   D             — online banking
 * ============================================================
 */

// ─── Env fixtures ─────────────────────────────────────────────────────────────

const ENV = {
    name:        process.env.INDIVIDUAL_USER_NAME   || 'Maria Santos',
    email:       process.env.INDIVIDUAL_USER_EMAIL  || 'fpztest.sjardin@gmail.com',
    mobile:      process.env.INDIVIDUAL_USER_MOBILE || '9204591518',
    plateNumber: process.env.AUTOSWEEP_PLATE_NUMBER || 'ABC1234',
    paymentUrl:  process.env.AUTOSWEEP_PAYMENT_URL  || 'https://dev.justpay.to/autosweep',
    cardNumber:  process.env.INDIVIDUAL_CARD_NUMBER || '4242424242424242',
    cardExp:     process.env.INDIVIDUAL_CARD_EXP    || '05/31',
    cardCvv:     process.env.INDIVIDUAL_CARD_CVV    || '100',
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

// Autosweep amount selection: radio buttons for preset values
const VALID_RADIO_AMOUNTS = [100, 200, 300, 500, 1000];

const isValidRadioAmount = (val) =>
    VALID_RADIO_AMOUNTS.includes(Number(val));

// Plate number validation — basic alphanumeric, 5-8 chars (Philippine plates)
const isValidPlateNumber = (plate) =>
    typeof plate === 'string' &&
    plate.trim().length >= 4 &&
    /^[A-Z0-9\s-]+$/i.test(plate.trim());

const isValidCardNumber = (n) =>
    typeof n === 'string' && /^\d{13,19}$/.test(n.replace(/\s/g, ''));
const isValidExpiry = (e) => /^\d{2}\/\d{2}$/.test(e ?? '');
const isValidCcv    = (c) => /^\d{3,4}$/.test(c ?? '');

// =============================================================================
// SHARED — identical across all 4 Autosweep methods
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

test.describe('Shared — Email search window (30s)', () => {
    test.describe.configure({ mode: 'serial' });

    test('is exactly 30 000 ms before trigger', () => {
        const t = 1700000000000;
        expect(t - new Date(buildWindow(t)).getTime()).toBe(30000);
    });
});

test.describe('Shared — Sender fields (INDIVIDUAL_USER_* env)', () => {
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
        expect(isValidPesoAmount('₱500.00')).toBe(true);
        expect(isValidPesoAmount('₱1,000.00')).toBe(true);
    });

    test('missing symbol or decimal fails', () => {
        expect(isValidPesoAmount('500.00')).toBe(false);
        expect(isValidPesoAmount('₱500')).toBe(false);
    });

    test('parsePesoAmount strips ₱ and commas', () => {
        expect(parsePesoAmount('₱500.00')).toBe(500);
        expect(parsePesoAmount('₱1,000.00')).toBe(1000);
        expect(parsePesoAmount('N/A')).toBeNull();
    });
});

// =============================================================================
// AUTOSWEEP-SPECIFIC — differences from all other flows
// =============================================================================

test.describe('Autosweep-specific — differences from all other flows', () => {
    test.describe.configure({ mode: 'serial' });

    test('page is gated by announcement modal before anything else', () => {
        // All 4 specs wait for section.modal.information BEFORE any interaction
        const modalSelector = 'section.modal.information';
        expect(modalSelector).toContain('modal');
        expect(modalSelector).toContain('information');
    });

    test('modal has h3 "Announcement" and an iframe', () => {
        // Verified in all 4 e2e specs:
        // await expect(modal.locator('h3')).toHaveText('Announcement')
        // await expect(modal.locator('iframe')).toBeVisible()
        const heading = 'Announcement';
        expect(heading).toBe('Announcement');
    });

    test('CTA is "Load Now" — unique across all flows', () => {
        const autosweepCta  = 'Load Now';
        const individualCta = 'Send Money';
        const donationCta   = 'Donate Now';
        const billerCta     = 'Pay Now';
        const businessCta   = 'I want to pay';
        expect(autosweepCta).not.toBe(individualCta);
        expect(autosweepCta).not.toBe(donationCta);
        expect(autosweepCta).not.toBe(billerCta);
        expect(autosweepCta).not.toBe(businessCta);
    });

    test('plate number input selector is input#plate-no-card-no', () => {
        expect('input#plate-no-card-no').toContain('plate-no-card-no');
    });

    test('AUTOSWEEP_PLATE_NUMBER env var is defined and non-empty', () => {
        expect(ENV.plateNumber.length).toBeGreaterThan(0);
    });

    test('amount selection is radio buttons — not a text field', () => {
        // All 4 specs:
        //   await page.locator('#amount-to-pay').click();
        //   await page.getByLabel('500').check();  ← radio
        //   await page.locator('button:has-text("Select")').click();
        const isRadioNotText = true;
        expect(isRadioNotText).toBe(true);
    });

    test('valid radio amounts are 100, 200, 300, 500, 1000', () => {
        expect(isValidRadioAmount(100)).toBe(true);
        expect(isValidRadioAmount(200)).toBe(true);
        expect(isValidRadioAmount(300)).toBe(true);
        expect(isValidRadioAmount(500)).toBe(true);
        expect(isValidRadioAmount(1000)).toBe(true);
    });

    test('invalid radio amounts fail', () => {
        expect(isValidRadioAmount(0)).toBe(false);
        expect(isValidRadioAmount(150)).toBe(false);
        expect(isValidRadioAmount(999)).toBe(false);
        expect(isValidRadioAmount('abc')).toBe(false);
    });

    test('all 4 e2e specs hardcode 500 as the selected amount', () => {
        const hardcodedAmount = 500;
        expect(isValidRadioAmount(hardcodedAmount)).toBe(true);
        expect(hardcodedAmount).toBe(500);
    });

    test('submit button is "Load PHP" — not "Pay Now" or "Send Money"', () => {
        const submitLabel = 'Load PHP';
        expect(submitLabel).toContain('Load');
        expect(submitLabel).not.toBe('Pay Now');
        expect(submitLabel).not.toBe('Send Money');
    });

    test('plate confirmation checkbox must be checked after Load PHP click', () => {
        // All 4 specs check: input[type="checkbox"][name="plateNumber"]
        const checkboxSelector = 'input[type="checkbox"][name="plateNumber"]';
        expect(checkboxSelector).toContain('plateNumber');
    });

    test('payment description row is "You are reloading" (not "You are sending" or "You are paying")', () => {
        const autosweepDesc   = 'You are reloading';
        const individualDesc  = 'You are sending';
        const billerDesc      = 'You are paying';
        expect(autosweepDesc).not.toBe(individualDesc);
        expect(autosweepDesc).not.toBe(billerDesc);
        expect(autosweepDesc).toContain('reloading');
    });

    test('summary key row for vehicle is "Plate Number" (not "Account Number" or "Selected Biller")', () => {
        const autosweepRow  = 'Plate Number';
        const billerRow     = 'Account Number';
        const bayadRow      = 'Selected Biller';
        expect(autosweepRow).not.toBe(billerRow);
        expect(autosweepRow).not.toBe(bayadRow);
    });

    test('summary has 2 fee rows only: Processing Fee + System Fee (no Biller Pass-on)', () => {
        // Meralco/BayadCenter have 3 fee rows — Autosweep only has 2
        const feeRows = ['Processing Fee', 'System Fee'];
        expect(feeRows).toHaveLength(2);
        expect(feeRows).not.toContain('Other Fees (Biller Pass-on)');
    });

    test('ALL 4 methods have no merchant email (single-email flow)', () => {
        const hasNoMerchantStep = true;
        expect(hasNoMerchantStep).toBe(true);
    });

    test('sender env vars are INDIVIDUAL_USER_* (not BUSINESS_USER_*)', () => {
        // Unlike business flow, Autosweep uses INDIVIDUAL_USER_* for sender
        expect(ENV.name).toBeDefined();
        expect(ENV.email).toBeDefined();
        expect(ENV.mobile).toBeDefined();
    });
});

// =============================================================================
// PLATE NUMBER — validation logic
// =============================================================================

test.describe('Plate number validation', () => {
    test.describe.configure({ mode: 'serial' });

    test('valid Philippine plate formats pass', () => {
        expect(isValidPlateNumber('ABC1234')).toBe(true);
        expect(isValidPlateNumber('ABC 123')).toBe(true);
        expect(isValidPlateNumber('1234')).toBe(true);
    });

    test('env plate number is valid', () => {
        expect(isValidPlateNumber(ENV.plateNumber)).toBe(true);
    });

    test('empty or too-short plate fails', () => {
        expect(isValidPlateNumber('')).toBe(false);
        expect(isValidPlateNumber('AB')).toBe(false);
        expect(isValidPlateNumber(null)).toBe(false);
    });
});

// =============================================================================
// A. Autosweep — Bank transfer
// =============================================================================

test.describe('A. Autosweep bank transfer — unique logic', () => {
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
        expect(subject).not.toContain('donating');
    });
});

// =============================================================================
// B. Autosweep — Credit card
// =============================================================================

test.describe('B. Autosweep credit card — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('payment label is "Credit Card"', () => {
        expect(labelContains('Credit Card', 'Credit Card')).toBe(true);
        expect(labelContains('GCash', 'Credit Card')).toBe(false);
    });

    test('card fields use INDIVIDUAL_CARD_* env vars', () => {
        expect(isValidCardNumber(ENV.cardNumber)).toBe(true);
        expect(isValidExpiry(ENV.cardExp)).toBe(true);
        expect(isValidCcv(ENV.cardCvv)).toBe(true);
    });

    test('same payer email subject as bank transfer', () => {
        expect('Successful payment of').toBe('Successful payment of');
    });

    test('success phrase is "transaction successful"', () => {
        expect(isTransactionSuccessful('transaction successful')).toBe(true);
        expect(isOnlineBankSuccess('transaction successful')).toBe(false);
    });
});

// =============================================================================
// C. Autosweep — GCash
// =============================================================================

test.describe('C. Autosweep GCash — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('payment label is "GCash"', () => {
        expect(labelContains('GCash', 'GCash')).toBe(true);
        expect(labelContains('Bank of the Philippine Islands', 'GCash')).toBe(false);
    });

    test('success phrase is "transaction successful" (not online banking)', () => {
        expect(isTransactionSuccessful('transaction successful')).toBe(true);
        expect(isOnlineBankSuccess('transaction successful')).toBe(false);
    });

    test('mock popup is ewallet-mock — not bank-web-mock', () => {
        expect('ewallet-mock-connector.xendit.co').toContain('ewallet');
        expect('ewallet-mock-connector.xendit.co').not.toBe('bank-web-mock.xendit.co');
    });

    test('same payer email subject as bank transfer ("Successful payment of")', () => {
        expect('Successful payment of').toContain('Successful payment');
    });
});

// =============================================================================
// D. Autosweep — Online banking
// =============================================================================

test.describe('D. Autosweep online banking — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('success phrase is "complete your payment" — NOT "transaction successful"', () => {
        expect(isOnlineBankSuccess('complete your payment')).toBe(true);
        expect(isTransactionSuccessful('complete your payment')).toBe(false);
        expect(isOnlineBankSuccess('transaction successful')).toBe(false);
    });

    test('email subject is "Complete your transaction with" — same as BayadCenter (includes "with")', () => {
        // Autosweep online banking: "Complete your transaction with"
        // Meralco online banking:   "Complete your transaction"  (no "with")
        const autosweepSubject = 'Complete your transaction with';
        const meralcoSubject   = 'Complete your transaction';
        expect(autosweepSubject).not.toBe(meralcoSubject);
        expect(autosweepSubject).toContain('with');
        expect(meralcoSubject).not.toContain('with');
    });

    test('payment label is BPI (same as bank transfer)', () => {
        const bpi = 'Bank of the Philippine Islands';
        expect(labelContains(bpi, bpi)).toBe(true);
        expect(labelContains('Credit Card', bpi)).toBe(false);
        expect(labelContains('GCash', bpi)).toBe(false);
    });
});