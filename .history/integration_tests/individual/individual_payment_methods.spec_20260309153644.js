import { test, expect } from '@playwright/test';
import path from 'path';
import { checkEmail, extractOTP, checkMerchantEmail } from '../../helpers/gmail-helper.js';

/**
 * Integration Test: Individual Payment Methods (All in One)
 *
 * Covers all 4 individual payment methods in a single file using a
 * data-driven approach. Each method runs the same shared steps
 * (page load, T&C, contact info, KYC, OTP) and then branches into
 * its own payment-specific flow.
 *
 * Payment Methods:
 *   💳 Credit Card     — card form → direct confirm → success
 *   🏦 Bank Transfer   — BPI selection → bank popup (Xendit mock) → credentials + OTP
 *   📱 E-Wallet        — GCash selection → eWallet popup → Proceed button
 *   💻 Online Banking  — BPI desktop selection → redirect → complete your payment
 *
 * Shared assertions across all methods:
 *   - Page loads successfully
 *   - OTP (email) is delivered, valid, and accepted
 *   - Payment summary shows correct persisted values
 *   - Transaction completes with correct success message
 *   - Payer receives confirmation email
 *   - Merchant receives confirmation email (except Online Banking)
 */

// ─── Payment Method Configurations ────────────────────────────────────────────

const PAYMENT_METHODS = [
    {
        id: 'credit_card',
        label: '💳 Credit Card',
        testMessage: 'CreditCardIntegrationTest',
        expectedPaymentMethod: 'Credit Card',
        successText: 'transaction successful',
        payerEmailSubject: 'You are sending',
        hasMerchantEmail: true,
        hasAcknowledge: false,
        hasBankPopup: false,
        hasEwalletPopup: false,

        // How to select this payment method
        async selectMethod(page) {
            await page.locator('#payment-method').click();
            await page.getByAltText('mastercard_visa').click();
            await page.getByAltText('credit_card').click();
            console.log('✅ Credit card payment method selected');

            // Fill card-specific fields
            await page.locator('input#account-holder-s-full-name').fill(process.env.INDIVIDUAL_USER_NAME);
            await page.locator('input#card-number').fill(process.env.INDIVIDUAL_CARD_NUMBER);
            await page.locator('input#expiration-date-mm-yy').fill(process.env.INDIVIDUAL_CARD_EXP);
            await page.locator('input#ccv-or-cvc-back-of-the-card').fill(process.env.INDIVIDUAL_CARD_CVV);
            await page.locator('#your-email').fill(process.env.INDIVIDUAL_USER_EMAIL);
            await page.locator('#your-mobile-number').fill(process.env.INDIVIDUAL_USER_MOBILE);
            await page.getByText('OK').click();

            // Handle optional international card address fields
            const isStreetVisible = await page.locator('input#your-card-street-line-1').isVisible().catch(() => false);
            if (isStreetVisible) {
                console.log('🌎 International card — filling address fields');
                await page.locator('input#your-card-street-line-1').fill(process.env.INDIVIDUAL_CARD_STREETLINE_1);
                await page.locator('input#your-card-street-line-2').fill(process.env.INDIVIDUAL_CARD_STREETLINE_2);
                await page.locator('input#your-card-province-state').fill(process.env.INDIVIDUAL_CARD_PROVINCE);
                await page.locator('input#your-card-postal-code').fill(process.env.INDIVIDUAL_CARD_POSTAL);
                await page.getByText('OK').click();
            }

            await page.getByRole('button', { name: 'Send Money' }).click();
        },

        // Post-confirm flow (no popup, just wait)
        async completePayment(page, context) {
            const confirmButton = page.locator('button', { hasText: 'Confirm' }).first();
            await confirmButton.click();
            console.log('🔃 Processing Credit Card transaction...');
            await page.waitForTimeout(30000);
        },
    },

    {
        id: 'bank_transfer',
        label: '🏦 Bank Transfer',
        testMessage: 'BankTransferIntegrationTest',
        expectedPaymentMethod: 'Bank of the Philippine Islands',
        successText: 'transaction successful',
        payerEmailSubject: 'You are sending',
        hasMerchantEmail: true,
        hasAcknowledge: true,
        hasBankPopup: true,
        hasEwalletPopup: false,
        bankPopupUrl: /bank-web-mock\.xendit\.co/,

        async selectMethod(page) {
            await page.locator('#payment-method').click();
            await page.getByAltText('bank_fund_transfer').click();
            await page.getByAltText('PH').click();
            await page.getByAltText('bpi').locator('..').first().click();
            console.log('✅ Bank Transfer (BPI) selected');

            await page.getByRole('button', { name: 'Send Money' }).click();
        },

        async completePayment(page, context) {
            const confirmButton = page.locator('button', { hasText: 'Confirm' }).first();
            await confirmButton.click();

            await page.locator('input[name="acknowledge"]').check();
            console.log('✅ Acknowledge checkbox checked');

            const continueButton = page.locator('button:has-text("Continue"):not([disabled])').first();
            await continueButton.waitFor({ state: 'visible', timeout: 10000 });

            const [popup] = await Promise.all([
                context.waitForEvent('page'),
                continueButton.click()
            ]);

            await popup.waitForLoadState('domcontentloaded');
            console.log(`🏦 Bank popup URL: ${popup.url()}`);
            await expect(popup).toHaveURL(/bank-web-mock\.xendit\.co/);

            await popup.locator('input[name="username"]').waitFor({ state: 'visible', timeout: 10000 });
            await popup.locator('input[name="username"]').fill('91284');
            await popup.locator('input[name="password"]').fill('strongpassword');
            await popup.locator('button[type="submit"]').click();

            await popup.locator('input[name="otp"]').waitFor({ state: 'visible', timeout: 10000 });
            await popup.locator('input[name="otp"]').fill('222000');
            await popup.locator('button:has-text("Confirm")').click();

            console.log('⏳ Waiting for bank transaction to process...');
            await page.waitForTimeout(20000);
        },
    },

    {
        id: 'ewallet',
        label: '📱 E-Wallet (GCash)',
        testMessage: 'eWalletIntegrationTest',
        expectedPaymentMethod: 'GCash',
        successText: 'transaction successful',
        payerEmailSubject: 'You are sending',
        hasMerchantEmail: true,
        hasAcknowledge: true,
        hasEwalletPopup: true,
        hasBankPopup: false,

        async selectMethod(page) {
            await page.locator('#payment-method').click();
            await page.getByAltText('e_wallet').click();
            await page.getByAltText('PH').click();
            await page.getByAltText('gcash').locator('..').first().click();
            console.log('✅ E-Wallet (GCash) selected');

            // No Send Money click needed here — amount comes next in shared flow
        },

        async completePayment(page, context) {
            const confirmButton = page.locator('button', { hasText: 'Confirm' }).first();
            await confirmButton.click();

            await page.locator('input[name="acknowledge"]').check();
            console.log('✅ Acknowledge checkbox checked');

            const continueButton = page.locator('button:has-text("Continue"):not([disabled])').first();
            await continueButton.waitFor({ state: 'visible', timeout: 10000 });

            const [popup] = await Promise.all([
                context.waitForEvent('page'),
                continueButton.click()
            ]);

            await popup.waitForLoadState('domcontentloaded');
            console.log(`📱 eWallet popup URL: ${popup.url()}`);
            await expect(popup).toHaveURL(/ewallet-mock-connector\.xendit\.co/);

            await popup.locator('button#proceed-button').click();
            console.log('✅ Proceed to Pay clicked on eWallet mock');

            await page.waitForTimeout(15000);
        },
    },

    {
        id: 'online_banking',
        label: '💻 Online Banking (BPI Desktop)',
        testMessage: 'OnlineBankIntegrationTest',
        expectedPaymentMethod: 'Bank of the Philippine Islands',
        successText: 'complete your payment',
        payerEmailSubject: 'Complete your transaction',
        hasMerchantEmail: false, // Online banking does not send merchant email
        hasAcknowledge: false,
        hasBankPopup: false,
        hasEwalletPopup: false,

        async selectMethod(page) {
            await page.locator('#payment-method').click();
            await page.getByAltText('online_banking').click();
            await page.getByAltText('PH').click();
            await page.getByAltText('online_banking_desktop').locator('..').first().click();
            await page.getByAltText('bpi').locator('..').first().click();
            console.log('✅ Online Banking (BPI Desktop) selected');
        },

        async completePayment(page, context) {
            const confirmButton = page.locator('button', { hasText: 'Confirm' }).first();
            await confirmButton.click();
            console.log('🔃 Processing Online Banking transaction...');
            await page.waitForTimeout(5000);
        },
    },
];

// ─── Shared Helpers ────────────────────────────────────────────────────────────

/**
 * Shared: navigate to payment page and verify it loaded
 */
async function navigateToPaymentPage(page) {
    try {
        await page.goto(process.env.INDIVIDUAL_PAYMENT_URL, {
            waitUntil: 'domcontentloaded',
            timeout: 90000
        });
    } catch (error) {
        console.error('❌ page.goto timeout:', error.message);
    }

    await expect(page).toHaveURL(/justpay\.to/);

    const isVisible = await page.locator('button:has-text("Send Money")')
        .waitFor({ state: 'visible', timeout: 60000 })
        .then(() => true)
        .catch(() => false);

    if (!isVisible) {
        throw new Error('❌ Individual Payment page failed to load');
    }

    console.log('✅ Payment page loaded');
}

/**
 * Shared: fill amount, back, T&C, Send Money
 */
async function fillAmountAndAcceptTnC(page, context) {
    await page.locator('#amount-to-pay').fill('100');

    // Verify currency dropdown works
    await page.locator('#php[name="currency"]').click();
    await expect(page.locator('ul.MuiList-root')).toBeVisible();
    await page.getByText('Back').click();

    // T&C opens in new tab
    const [termsPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('a').getByText('Terms and Conditions').click()
    ]);
    await termsPage.waitForLoadState();
    await expect(termsPage).toHaveURL(/terms-conditions/);
    await termsPage.close();
    await page.bringToFront();
    console.log('✅ T&C verified and closed');

    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Send Money' }).click();
    console.log('✅ T&C accepted, Send Money clicked');
}

/**
 * Shared: fill contact info (name/email/mobile) — handles credit card
 * which pre-fills email/mobile earlier in the flow
 */
async function fillContactInfo(page, methodId) {
    // Credit card pre-fills email/mobile in selectMethod, so only name needed here
    if (methodId === 'credit_card') {
        await page.getByText('OK').click();
        await page.getByText('OK').click();
        await page.locator('#your-name').fill(process.env.INDIVIDUAL_USER_NAME);
        await page.getByText('OK').click();

        // Re-fill email/mobile only if empty (credit card may have pre-filled)
        const emailValue = await page.locator('#your-email').inputValue();
        if (!emailValue || emailValue.trim() === '') {
            await page.locator('#your-email').fill(process.env.INDIVIDUAL_USER_EMAIL);
        }

        const mobileValue = await page.locator('#your-mobile-number').inputValue();
        if (!mobileValue || mobileValue.trim() === '') {
            await page.locator('#your-mobile-number').fill(process.env.INDIVIDUAL_USER_MOBILE);
            await page.getByText('OK').click();
        }
    } else {
        await page.locator('#your-name').fill(process.env.INDIVIDUAL_USER_NAME);
        await page.locator('#your-email').fill(process.env.INDIVIDUAL_USER_EMAIL);
        await page.locator('#your-mobile-number').fill(process.env.INDIVIDUAL_USER_MOBILE);
        await page.getByText('OK').click();
    }

    console.log('✅ Contact info filled');
}

/**
 * Shared: handle KYC section if present
 */
async function handleKycIfPresent(page) {
    const addressFieldExists = await page.locator('#your-residential-address').count() > 0;
    const bodyText = await page.locator('body').innerText();

    if (!addressFieldExists || !bodyText.toLowerCase().includes('residential address is required')) {
        console.log('🔓 No KYC section — skipping');
        return;
    }

    console.log('🔐 KYC detected — filling fields');
    const filePath = path.resolve('tests/fixtures/test-image.jpg');

    await page.locator('#your-residential-address').fill(process.env.INDIVIDUAL_USER_ADDRESS);
    await page.getByText('OK').click();
    await page.locator('#nationality').fill(process.env.INDIVIDUAL_USER_NATIONALITY);
    await page.getByText('OK').click();
    await page.locator('#birth-date').fill(process.env.INDIVIDUAL_USER_BIRTHDATE);
    await page.getByText('OK').click();
    await page.locator('#your-place-of-birth').fill(process.env.INDIVIDUAL_USER_BIRTHPLACE);
    await page.getByText('OK').click();

    // Gov ID upload
    const govIdInput = page.locator('input[type="file"].FileUpload').first();
    await expect(govIdInput).toBeVisible({ timeout: 10000 });
    await govIdInput.setInputFiles(filePath);
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'OK' }).click();
    await page.waitForTimeout(2000);

    // E-signature upload
    const eSignInput = page.locator('input[type="file"].FileUpload').nth(1);
    await expect(eSignInput).toBeVisible({ timeout: 10000 });
    await eSignInput.setInputFiles(filePath);
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'OK' }).click();

    console.log('✅ KYC fields completed');
}

/**
 * Shared: handle OTP step (email auto, SMS manual skip)
 * Returns false if SMS OTP detected (test should skip)
 */
async function handleOtp(page) {
    await page.locator('input#enter-the-code').waitFor({ state: 'visible', timeout: 30000 });

    const otpInstruction = await page.locator('p:has-text("Enter the code")').innerText();
    const isSmsOtp = (
        otpInstruction.toLowerCase().includes('mobile') ||
        otpInstruction.toLowerCase().includes('phone')
    ) && !otpInstruction.toLowerCase().includes('email');

    if (isSmsOtp) {
        console.log('⚠️ SMS OTP detected — cannot automate, skipping test');
        return false;
    }

    console.log('📧 Email OTP detected');
    const triggerTime = Date.now();
    const searchAfter = new Date(triggerTime - 30000).toISOString();

    const otpEmail = await checkEmail({
        from: 'hello@justpay.to',
        to: process.env.INDIVIDUAL_USER_EMAIL,
        subject: 'Verify your Email Address',
        wait_time_sec: 20,
        max_wait_time_sec: 120,
        after: searchAfter
    });

    if (!otpEmail) throw new Error('❌ OTP email not received');

    const otpCode = extractOTP(otpEmail);
    if (!otpCode) throw new Error('❌ Could not extract OTP from email');

    expect(otpCode).toHaveLength(6);
    expect(otpCode).toMatch(/^[A-Z0-9]{6}$/i);

    await page.locator('input#enter-the-code').fill(otpCode);
    await page.locator('button[type="submit"]').first().click();

    const bodyText = await page.locator('body').innerText();
    if (bodyText.toLowerCase().includes('invalid code')) {
        throw new Error('❌ OTP rejected — invalid code');
    }

    console.log('✅ OTP submitted and accepted');
    return true;
}

/**
 * Shared: verify payment summary table values
 */
async function verifyPaymentSummary(page, method) {
    await page.getByText('Payment Summary').waitFor({ state: 'visible', timeout: 15000 });
    console.log('✅ Payment Summary loaded');

    // Message
    await expect(page.getByText(method.testMessage)).toBeVisible();
    console.log(`✅ Message verified: ${method.testMessage}`);

    // Amount
    const subTotal = await page.locator('.MuiTable-root tbody tr', { hasText: 'Sub Total' })
        .locator('td').nth(1).innerText();
    expect(subTotal).toContain('100.00');
    console.log(`✅ Amount verified: ${subTotal}`);

    // Name
    const name = await page.locator('.MuiTable-root tbody tr', { hasText: 'Your Name' })
        .locator('td').nth(1).innerText();
    expect(name.toLowerCase()).toContain(process.env.INDIVIDUAL_USER_NAME.toLowerCase());
    console.log(`✅ Name verified: ${name}`);

    // Email
    const emailVal = await page.locator('.MuiTable-root tbody tr', { hasText: 'Your Email' })
        .locator('td').nth(1).innerText();
    expect(emailVal.toLowerCase()).toBe(process.env.INDIVIDUAL_USER_EMAIL.toLowerCase());
    console.log(`✅ Email verified: ${emailVal}`);

    // Mobile
    const mobile = await page.locator('.MuiTable-root tbody tr', { hasText: 'Your Mobile Number' })
        .locator('td').nth(1).innerText();
    expect(mobile).toContain(process.env.INDIVIDUAL_USER_MOBILE);
    console.log(`✅ Mobile verified: ${mobile}`);

    // Optional KYC fields
    for (const [label, envKey, transform] of [
        ['Your Address',        'INDIVIDUAL_USER_ADDRESS',    (v) => v.toLowerCase()],
        ['Your Nationality',    'INDIVIDUAL_USER_NATIONALITY', (v) => v.toLowerCase()],
        ['Your Place of Birth', 'INDIVIDUAL_USER_BIRTHPLACE',  (v) => v.toLowerCase()],
    ]) {
        const count = await page.locator('.MuiTable-root tbody tr', { hasText: label }).count();
        if (count > 0) {
            const val = await page.locator('.MuiTable-root tbody tr', { hasText: label })
                .locator('td').nth(1).innerText();
            expect(transform(val)).toContain(transform(process.env[envKey] ?? ''));
            console.log(`✅ ${label} verified: ${val}`);
        }
    }

    // Date of Birth (digits only comparison)
    const dobCount = await page.locator('.MuiTable-root tbody tr', { hasText: 'Your Date of Birth' }).count();
    if (dobCount > 0) {
        const dob = await page.locator('.MuiTable-root tbody tr', { hasText: 'Your Date of Birth' })
            .locator('td').nth(1).innerText();
        const actualDob = dob.replace(/\D/g, '');
        const expectedDob = (process.env.INDIVIDUAL_USER_BIRTHDATE ?? '').replace(/\D/g, '');
        expect(actualDob).toContain(expectedDob);
        console.log(`✅ Date of Birth verified: ${dob}`);
    }

    // Payment method
    const paymentMethod = await page.locator('.MuiTable-root tbody tr', { hasText: 'Payment Method' })
        .locator('td').nth(1).innerText();
    expect(paymentMethod).toContain(method.expectedPaymentMethod);
    console.log(`✅ Payment method verified: ${paymentMethod}`);

    // IP address
    const ipText = await page.locator('.MuiTypography-h6', { hasText: 'your current IP address' })
        .locator('span').innerText();
    const cleanedIP = ipText.replace(/[()]/g, '').trim();
    expect(cleanedIP).toMatch(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
    console.log(`✅ IP address verified: ${cleanedIP}`);
}

/**
 * Shared: verify confirmation emails (payer + optional merchant)
 */
async function verifyConfirmationEmails(page, method) {
    const triggerTime = Date.now();
    const searchAfter = new Date(triggerTime - 30000).toISOString();

    await page.waitForTimeout(2000);

    // Payer email
    console.log(`📬 Checking payer email (subject: "${method.payerEmailSubject}")...`);
    const payerEmail = await checkEmail({
        from: 'hello@justpay.to',
        to: process.env.INDIVIDUAL_USER_EMAIL,
        subject: method.payerEmailSubject,
        wait_time_sec: 20,
        max_wait_time_sec: 180,
        after: searchAfter
    });

    expect(
        payerEmail,
        `❌ Payer email not received at ${process.env.INDIVIDUAL_USER_EMAIL}`
    ).toBeTruthy();
    console.log(`✅ Payer email received — ${payerEmail.date || 'unknown'}`);

    // Merchant email (not all methods send this)
    if (method.hasMerchantEmail) {
        await page.waitForTimeout(2000);
        const merchantTrigger = Date.now();
        const merchantSearchAfter = new Date(merchantTrigger - 30000).toISOString();

        console.log('📬 Checking merchant email...');
        const merchantEmail = await checkMerchantEmail({
            from: 'hello@justpay.to',
            to: process.env.INDIVIDUAL_MERCHANT_EMAIL,
            subject: 'You are receiving',
            wait_time_sec: 20,
            max_wait_time_sec: 180,
            after: merchantSearchAfter
        });

        expect(
            merchantEmail,
            `❌ Merchant email not received at ${process.env.INDIVIDUAL_MERCHANT_EMAIL}`
        ).toBeTruthy();
        console.log(`✅ Merchant email received — ${merchantEmail.date || 'unknown'}`);
    } else {
        console.log(`ℹ️ ${method.label} does not send merchant email — skipping merchant check`);
    }
}

// ─── Test Suite ────────────────────────────────────────────────────────────────

for (const method of PAYMENT_METHODS) {

    test.describe(`${method.label}`, () => {

        test('📋 Payment summary shows correct values from submitted data', async ({ page, context }) => {
            test.setTimeout(360000);
            console.log(`\n🔗 [Summary] ${method.label}`);

            await navigateToPaymentPage(page);

            // Fill message
            await page.locator('#message-order-items-ref').fill(method.testMessage);

            // Select payment method (method-specific)
            await method.selectMethod(page);

            // Fill amount + T&C (shared) — eWallet/online banking need amount before selectMethod returns
            const needsAmountBeforeTnC = ['ewallet', 'online_banking'].includes(method.id);
            if (needsAmountBeforeTnC) {
                await fillAmountAndAcceptTnC(page, context);
            } else if (method.id === 'bank_transfer') {
                await page.locator('#amount-to-pay').fill('100');
                await page.locator('#php[name="currency"]').click();
                await expect(page.locator('ul.MuiList-root')).toBeVisible();
                await page.getByText('Back').click();
                const [termsPage] = await Promise.all([
                    context.waitForEvent('page'),
                    page.locator('a').getByText('Terms and Conditions').click()
                ]);
                await termsPage.waitForLoadState();
                await expect(termsPage).toHaveURL(/terms-conditions/);
                await termsPage.close();
                await page.bringToFront();
                await page.getByRole('checkbox').check();
                await page.getByRole('button', { name: 'Send Money' }).click();
            }
            // Credit card: amount filled in selectMethod already

            // Contact info (shared)
            await fillContactInfo(page, method.id);

            // KYC (shared)
            await handleKycIfPresent(page);

            // OTP (shared)
            const otpPassed = await handleOtp(page);
            if (!otpPassed) { test.skip(); return; }

            // Verify summary
            await verifyPaymentSummary(page, method);

            console.log(`🎉 [${method.label}] Payment summary assertions passed`);
        });

        test('✅ Transaction completes with correct success status', async ({ page, context }) => {
            test.setTimeout(420000);
            console.log(`\n🔗 [Status] ${method.label}`);

            await navigateToPaymentPage(page);
            await page.locator('#message-order-items-ref').fill(method.testMessage);
            await method.selectMethod(page);

            const needsAmountBeforeTnC = ['ewallet', 'online_banking'].includes(method.id);
            if (needsAmountBeforeTnC) {
                await fillAmountAndAcceptTnC(page, context);
            } else if (method.id === 'bank_transfer') {
                await page.locator('#amount-to-pay').fill('100');
                await page.locator('#php[name="currency"]').click();
                await expect(page.locator('ul.MuiList-root')).toBeVisible();
                await page.getByText('Back').click();
                const [termsPage] = await Promise.all([
                    context.waitForEvent('page'),
                    page.locator('a').getByText('Terms and Conditions').click()
                ]);
                await termsPage.waitForLoadState();
                await expect(termsPage).toHaveURL(/terms-conditions/);
                await termsPage.close();
                await page.bringToFront();
                await page.getByRole('checkbox').check();
                await page.getByRole('button', { name: 'Send Money' }).click();
            }

            await fillContactInfo(page, method.id);
            await handleKycIfPresent(page);

            const otpPassed = await handleOtp(page);
            if (!otpPassed) { test.skip(); return; }

            await verifyPaymentSummary(page, method);

            // Run payment-specific completion
            await method.completePayment(page, context);

            // Assert correct success text per method
            await page.waitForTimeout(2000);
            const statusText = await page.locator('body').innerText();
            expect(
                statusText.toLowerCase(),
                `❌ Expected "${method.successText}" not found in page`
            ).toContain(method.successText);

            console.log(`✅ [${method.label}] Transaction success status confirmed`);
            await page.locator('button', { hasText: 'Ok' }).click();
        });

        test('📬 Payer and merchant receive correct confirmation emails', async ({ page, context }) => {
            test.setTimeout(480000);
            console.log(`\n🔗 [Emails] ${method.label}`);

            await navigateToPaymentPage(page);
            await page.locator('#message-order-items-ref').fill(method.testMessage);
            await method.selectMethod(page);

            const needsAmountBeforeTnC = ['ewallet', 'online_banking'].includes(method.id);
            if (needsAmountBeforeTnC) {
                await fillAmountAndAcceptTnC(page, context);
            } else if (method.id === 'bank_transfer') {
                await page.locator('#amount-to-pay').fill('100');
                await page.locator('#php[name="currency"]').click();
                await expect(page.locator('ul.MuiList-root')).toBeVisible();
                await page.getByText('Back').click();
                const [termsPage] = await Promise.all([
                    context.waitForEvent('page'),
                    page.locator('a').getByText('Terms and Conditions').click()
                ]);
                await termsPage.waitForLoadState();
                await expect(termsPage).toHaveURL(/terms-conditions/);
                await termsPage.close();
                await page.bringToFront();
                await page.getByRole('checkbox').check();
                await page.getByRole('button', { name: 'Send Money' }).click();
            }

            await fillContactInfo(page, method.id);
            await handleKycIfPresent(page);

            const otpPassed = await handleOtp(page);
            if (!otpPassed) { test.skip(); return; }

            await verifyPaymentSummary(page, method);
            await method.completePayment(page, context);

            await page.waitForTimeout(2000);
            const statusText = await page.locator('body').innerText();
            expect(statusText.toLowerCase()).toContain(method.successText);
            await page.locator('button', { hasText: 'Ok' }).click();

            // Verify emails
            await verifyConfirmationEmails(page, method);

            console.log(`🎉 [${method.label}] Email confirmation assertions passed`);
        });

    });
}