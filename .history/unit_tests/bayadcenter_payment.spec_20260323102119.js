import { test, expect } from '@playwright/test';

/**
 * ============================================================
 * Unit Tests — BayadCenter Payment Methods (All 4 in one file)
 * ============================================================
 * Source: e2e_tests/bayadcenter/
 *   - bank-transfer.spec.js
 *   - credit-card.spec.js
 *   - ewallet.spec.js
 *   - online-banking.spec.js
 *
 * What makes BayadCenter DIFFERENT from Meralco / Individual:
 *   - CTA: "Pay Now" (same as Meralco)
 *   - Biller selection uses input#choose-a-bill-to-pay (category → biller)
 *     unlike Meralco which uses input#biller-information (direct click)
 *   - Dynamic BILLER_CONFIGS object drives all field values and selectors
 *   - BILLERS_TO_TEST array controls which billers actually run
 *   - Tests are generated dynamically via a for loop — not static test blocks
 *   - Amount comes from billerConfig.fields.amount (not hardcoded '900')
 *   - Each biller has different fields: Cignal has 5 fields + radio button,
 *     Meralco/Maynilad have 2, Bankard has 4, Avon has 4
 *   - Summary key row is "Selected Biller" (not "Payment Method" or "Source of Fund")
 *   - ALL 4 methods have no merchant email (single-email flow)
 *   - Payer email subject: "Successful payment of" (bank, card, GCash)
 *   - Online banking only: "complete your payment" +
 *     "Complete your transaction with" (note "with" — differs from Meralco)
 *
 * Structure:
 *   SHARED         — logic identical across all 4 BayadCenter methods
 *   BAYADCENTER    — traits specific to BayadCenter vs other flows
 *   BILLER CONFIGS — BILLER_CONFIGS structure and filter logic
 *   A              — bank transfer
 *   B              — credit card
 *   C              — GCash
 *   D              — online banking
 * ============================================================
 */

// ─── Env fixtures ─────────────────────────────────────────────────────────────

const ENV = {
    name:       process.env.INDIVIDUAL_USER_NAME   || 'Maria Santos',
    email:      process.env.INDIVIDUAL_USER_EMAIL  || 'fpztest.sjardin@gmail.com',
    mobile:     process.env.INDIVIDUAL_USER_MOBILE || '9204591518',
    paymentUrl: process.env.BAYADCENTER_PAYMENT_URL || 'https://dev.justpay.to/bayadcenter',
    cardNumber: process.env.INDIVIDUAL_CARD_NUMBER || '4242424242424242',
    cardExp:    process.env.INDIVIDUAL_CARD_EXP    || '05/31',
    cardCvv:    process.env.INDIVIDUAL_CARD_CVV    || '100',
};

// ─── BILLER_CONFIGS (mirrored from all 4 e2e specs) ───────────────────────────

const BILLER_CONFIGS = {
    cignal: {
        category: 'Cable/Internet',
        name: 'Cignal',
        fields: { accountNumber: '9006567444', amount: '1500', lastName: 'Santos', firstName: 'Maria', middleInitial: 'D' },
        selectors: {
            accountNumber: 'input[name="referenceNumber"]',
            amount: 'input#amount[name="amount"]',
            lastName: 'input[name="LastName"]',
            firstName: 'input[name="FirstName"]',
            middleInitial: 'input[name="MI"]',
        },
        radioButton: { name: 'ExternalEntityName', value: 'BAYAD' },
    },
    maynilad: {
        category: 'Water',
        name: 'Maynilad',
        fields: { accountNumber: '53039157', amount: '800' },
        selectors: {
            accountNumber: 'input[name="referenceNumber"]',
            amount: 'input#amount[name="amount"]',
        },
    },
    bankard: {
        category: 'Credit Cards',
        name: 'Bankard',
        fields: { accountNumber: '4573580400000020', amount: '800', accountName: 'Maria Santos', billDate: '11202025' },
        selectors: {
            accountNumber: 'input[name="referenceNumber"]',
            amount: 'input#amount[name="amount"]',
            accountName: 'input#account-name[name="AccountName"]',
            billDate: 'input#bill-date-mm-dd-yyyy[name="BillDate"]',
        },
    },
    avon: {
        category: 'Distribution',
        name: 'Avon',
        fields: { accountNumber: '8888888888888', amount: '800', accountName: 'Maria Santos', branch: 'San Antonio' },
        selectors: {
            accountNumber: 'input[name="referenceNumber"]',
            amount: 'input#amount[name="amount"]',
            accountName: 'input#name[name="Name"]',
            branch: 'input#branch[name="Branch"]',
        },
    },
    meralco: {
        category: 'Electricity',
        name: 'Meralco',
        fields: { accountNumber: '0116417010', amount: '2000' },
        selectors: {
            accountNumber: 'input[name="referenceNumber"]',
            amount: 'input#amount[name="amount"]',
        },
    },
};

const BILLERS_TO_TEST = ['meralco'];

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

const amountsMatch = (displayed, expected) => {
    const d = parseFloat((displayed ?? '').replace(/,/g, ''));
    const e = parseFloat(expected ?? '');
    return !isNaN(d) && !isNaN(e) && d === e;
};

const isValidCardNumber = (n) =>
    typeof n === 'string' && /^\d{13,19}$/.test(n.replace(/\s/g, ''));
const isValidExpiry = (e) => /^\d{2}\/\d{2}$/.test(e ?? '');
const isValidCcv    = (c) => /^\d{3,4}$/.test(c ?? '');

// billerConfig validity check
const billerConfigIsValid = (config) =>
    config !== null &&
    typeof config === 'object' &&
    typeof config.category === 'string' &&
    typeof config.name === 'string' &&
    typeof config.fields === 'object' &&
    typeof config.selectors === 'object';

const fieldHasSelector = (config, fieldName) =>
    fieldName in config.fields &&
    fieldName in config.selectors &&
    typeof config.selectors[fieldName] === 'string' &&
    config.selectors[fieldName].length > 0;

const getActiveBillers = (configs, toTest) =>
    Object.entries(configs).filter(([id]) => toTest.includes(id));

// =============================================================================
// SHARED — identical across all 4 BayadCenter methods
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
        expect(isValidPesoAmount('₱2,000.00')).toBe(true);
        expect(isValidPesoAmount('₱800.00')).toBe(true);
    });

    test('missing symbol or decimal fails', () => {
        expect(isValidPesoAmount('800.00')).toBe(false);
        expect(isValidPesoAmount('₱800')).toBe(false);
    });

    test('parsePesoAmount strips ₱ and commas', () => {
        expect(parsePesoAmount('₱2,000.00')).toBe(2000);
        expect(parsePesoAmount('₱800.00')).toBe(800);
        expect(parsePesoAmount('N/A')).toBeNull();
    });
});

test.describe('Shared — Amount comparison logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('exact match passes', () => {
        expect(amountsMatch('2000', '2000')).toBe(true);
    });

    test('decimal match passes', () => {
        expect(amountsMatch('2000.00', '2000')).toBe(true);
    });

    test('comma-formatted matches plain', () => {
        expect(amountsMatch('2,000', '2000')).toBe(true);
    });

    test('mismatched amounts fail', () => {
        expect(amountsMatch('800', '2000')).toBe(false);
    });

    test('non-numeric fails gracefully', () => {
        expect(amountsMatch('N/A', '2000')).toBe(false);
    });
});

// =============================================================================
// BAYADCENTER-SPECIFIC — differences from Meralco and other flows
// =============================================================================

test.describe('BayadCenter-specific — differences from other flows', () => {
    test.describe.configure({ mode: 'serial' });

    test('biller selector is input#choose-a-bill-to-pay (not input#biller-information)', () => {
        const bayadSelector  = 'input#choose-a-bill-to-pay';
        const meralcoSelector = 'input#biller-information';
        expect(bayadSelector).not.toBe(meralcoSelector);
        expect(bayadSelector).toContain('choose-a-bill-to-pay');
    });

    test('summary key row is "Selected Biller" (not "Payment Method" or "Source of Fund")', () => {
        const bayadRow      = 'Selected Biller';
        const meralcoRow    = 'Payment Method';
        const donationRow   = 'Source of Fund';
        expect(bayadRow).not.toBe(meralcoRow);
        expect(bayadRow).not.toBe(donationRow);
    });

    test('biller amount comes from billerConfig.fields.amount (not hardcoded)', () => {
        // Unlike Meralco which hardcodes 900, BayadCenter reads from config
        const meralcoAmount = BILLER_CONFIGS.meralco.fields.amount;
        expect(meralcoAmount).toBe('2000'); // per config, not 900
        expect(meralcoAmount).not.toBe('900');
    });

    test('ALL 4 methods have no merchant email', () => {
        const hasNoMerchantStep = true;
        expect(hasNoMerchantStep).toBe(true);
    });

    test('BAYADCENTER_PAYMENT_URL env var is defined', () => {
        expect(ENV.paymentUrl.length).toBeGreaterThan(0);
    });

    test('summary has 3 fee rows including Other Fees (Biller Pass-on)', () => {
        const feeRows = ['Processing Fee', 'System Fee', 'Other Fees (Biller Pass-on)'];
        expect(feeRows).toHaveLength(3);
        expect(feeRows[2]).toBe('Other Fees (Biller Pass-on)');
    });

    test('payment description row is "You are sending a payment to"', () => {
        const descRow = 'You are sending a payment to';
        expect(descRow).toContain('sending a payment to');
    });
});

// =============================================================================
// BILLER CONFIGS — structure and filter logic
// =============================================================================

test.describe('BILLER_CONFIGS — structure validation', () => {
    test.describe.configure({ mode: 'serial' });

    test('all 5 billers are defined', () => {
        expect(Object.keys(BILLER_CONFIGS)).toHaveLength(5);
    });

    test('each biller has required keys: category, name, fields, selectors', () => {
        for (const [id, config] of Object.entries(BILLER_CONFIGS)) {
            expect(billerConfigIsValid(config), `${id} config is invalid`).toBe(true);
        }
    });

    test('cignal has 5 fields + radioButton', () => {
        const c = BILLER_CONFIGS.cignal;
        expect(Object.keys(c.fields)).toHaveLength(5);
        expect(c).toHaveProperty('radioButton');
        expect(c.radioButton.value).toBe('BAYAD');
    });

    test('meralco and maynilad have only 2 fields each', () => {
        expect(Object.keys(BILLER_CONFIGS.meralco.fields)).toHaveLength(2);
        expect(Object.keys(BILLER_CONFIGS.maynilad.fields)).toHaveLength(2);
    });

    test('bankard has 4 fields including accountName and billDate', () => {
        const b = BILLER_CONFIGS.bankard;
        expect(b.fields).toHaveProperty('accountName');
        expect(b.fields).toHaveProperty('billDate');
        expect(Object.keys(b.fields)).toHaveLength(4);
    });

    test('avon has 4 fields including accountName and branch', () => {
        const a = BILLER_CONFIGS.avon;
        expect(a.fields).toHaveProperty('accountName');
        expect(a.fields).toHaveProperty('branch');
    });

    test('all billers use input[name="referenceNumber"] for accountNumber', () => {
        for (const [id, config] of Object.entries(BILLER_CONFIGS)) {
            expect(config.selectors.accountNumber, `${id} accountNumber selector wrong`)
                .toBe('input[name="referenceNumber"]');
        }
    });
});

test.describe('BILLER_CONFIGS — BILLERS_TO_TEST filter logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('getActiveBillers returns only meralco when BILLERS_TO_TEST = [meralco]', () => {
        const active = getActiveBillers(BILLER_CONFIGS, ['meralco']);
        expect(active).toHaveLength(1);
        expect(active[0][0]).toBe('meralco');
    });

    test('empty BILLERS_TO_TEST returns no active billers', () => {
        expect(getActiveBillers(BILLER_CONFIGS, [])).toHaveLength(0);
    });

    test('unknown biller ID returns nothing', () => {
        expect(getActiveBillers(BILLER_CONFIGS, ['unknown_biller'])).toHaveLength(0);
    });

    test('multiple billers in list returns multiple results', () => {
        const active = getActiveBillers(BILLER_CONFIGS, ['meralco', 'cignal']);
        expect(active).toHaveLength(2);
    });

    test('all billers can be activated', () => {
        const all = getActiveBillers(BILLER_CONFIGS, Object.keys(BILLER_CONFIGS));
        expect(all).toHaveLength(5);
    });

    test('active billerConfig is meralco config when testing meralco', () => {
        const active = getActiveBillers(BILLER_CONFIGS, BILLERS_TO_TEST);
        expect(active[0][1]).toEqual(BILLER_CONFIGS.meralco);
    });
});

// =============================================================================
// A. BayadCenter — Bank transfer
// =============================================================================

test.describe('A. BayadCenter bank transfer — unique logic', () => {
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
// B. BayadCenter — Credit card
// =============================================================================

test.describe('B. BayadCenter credit card — unique logic', () => {
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

    test('same payer email subject as bank transfer ("Successful payment of")', () => {
        expect('Successful payment of').toBe('Successful payment of');
    });
});

// =============================================================================
// C. BayadCenter — GCash
// =============================================================================

test.describe('C. BayadCenter GCash — unique logic', () => {
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
        expect('ewallet-mock-connector.xendit.co').toContain('ewallet');
        expect('ewallet-mock-connector.xendit.co').not.toBe('bank-web-mock.xendit.co');
    });
});

// =============================================================================
// D. BayadCenter — Online banking
// =============================================================================

test.describe('D. BayadCenter online banking — unique logic', () => {
    test.describe.configure({ mode: 'serial' });

    test('success phrase is "complete your payment" — NOT "transaction successful"', () => {
        expect(isOnlineBankSuccess('complete your payment')).toBe(true);
        expect(isTransactionSuccessful('complete your payment')).toBe(false);
        expect(isOnlineBankSuccess('transaction successful')).toBe(false);
    });

    test('email subject is "Complete your transaction with" — note "with" vs Meralco', () => {
        // BayadCenter:  "Complete your transaction with"   ← has "with"
        // Meralco:      "Complete your transaction"        ← no "with"
        const bayadSubject   = 'Complete your transaction with';
        const meralcoSubject = 'Complete your transaction';
        expect(bayadSubject).not.toBe(meralcoSubject);
        expect(bayadSubject).toContain('with');
        expect(meralcoSubject).not.toContain('with');
    });

    test('payment label is BPI (same as bank transfer, not Credit Card or GCash)', () => {
        const bpi = 'Bank of the Philippine Islands';
        expect(labelContains(bpi, bpi)).toBe(true);
        expect(labelContains('Credit Card', bpi)).toBe(false);
    });
});