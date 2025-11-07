import {test, expect} from '@playwright/test';
import path from 'path';

test('🏦 Bank transfer payment for business user', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

    console.log('💻 Complete Bank Transfer Payment Flow for business');
    console.log(`🔗 URL: ${process.env.BUSINESS_PAYMENT_URL}`);

    await page.goto(process.env.BUSINESS_PAYMENT_URL);
    await expect(page).toHaveURL(/justpay\.to/);
    console.log('✅ Payment page loaded successfully');

    console.log('💸 Choose "I want to pay" button')
    await page.locator('button:has-text("I want to pay")').click();
    console.log('✅ "I want to pay" button clicked');

    console.log('💬 Verifying message field validation');
    console.log('👉 Blank message field should show an error');
    await page.getByRole('button', {name: 'Pay Now'}).click();

    const messageError = (await page.locator('body').innerText()).toLowerCase();

    if (!messageError.includes('message is required')) {
        throw new Error('❌ Message field validation failed: No error for blank message field');
    } else {
        console.log('✅ Message field validation works as expected');
    }
    
    // Fill in message field
    const testMessage = 'BankTransferBusinessTest12345';
    console.log(`💬 Filling in message field with: ${testMessage}`)
    await page.locator('#message-order-items-ref').fill(testMessage);
    console.log('✅ Message field filled successfully');

    await page.getByRole('button', {name: 'Pay Now'}).click();

    // name error validation
    console.log('💬 Verifying name field validation');
    console.log('👉 Blank name field should show an error');
    const nameError = (await page.locator('body').innerText()).toLowerCase();

    if (!nameError.includes('payer/sender name is required')) {
        throw new Error('❌ Name field validation failed: No error for blank name field');
    } else {
        console.log('✅ Name field validation works as expected');
    }

    // Fill in name field
    console.log(`💬 Filling in name field`)
    await page.locator('#your-name').fill(process.env.BUSINESS_USER_NAME);
    console.log('✅ Name field filled successfully');

    // email error validation
    console.log('💬 Verifying email field validation');
    console.log('👉 Blank email field should show an error');
    await page.getByRole('button', {name: 'Pay Now'}).click();

    const emailError = (await page.locator('body').innerText()).toLowerCase();
    if (!emailError.includes('payer/sender email is required')) {
        throw new Error('❌ Email field validation failed: No error for blank email field');
    } else {
        console.log('✅ Email field validation works as expected');
    }

    // Fill in email field
    console.log(`💬 Filling in email field`)
    await page.locator('#your-email').fill(process.env.BUSINESS_USER_EMAIL);
    console.log('✅ Email field filled successfully');

    // payment error validation
    console.log('💬 Verifying payment method selection validation');
    console.log('👉 No payment method selected should show an error');
    await page.getByRole('button', {name: 'Pay Now'}).click();

    const paymentError = (await page.locator('body').innerText()).toLowerCase();

    if (!paymentError.includes('please select a payment method first')) {
        throw new Error('❌ Payment method selection failed: No payment method selected');
    } else {
        console.log('✅ Payment method selection works as expected');
    }

    // Select bank transfer payment method
    console.log('🏦 Selecting bank transfer payment method');
    await page.locator('#payment-method').click();
    await page.getByAltText('bank_fund_transfer').click();
    console.log('✅ Bank transfer payment method selected');

    console.log('Selecting Philippines as bank transfer country');
    await page.getByAltText('PH').click();
    console.log('✅ Philippines selected as bank transfer country');

    console.log('Selecting BPI for bank transfer')
    await page.getByAltText('bpi').locator('..').first().click();
    console.log('✅ Bank transfer payment method selected');

    await page.getByRole('button', {name: 'Pay Now'}).click();

      // Checking for amount error message
    console.log('💬 Checking for amount error message');
    const amountError = (await page.locator('body').innerText()).toLowerCase();

    if (!amountError.includes('please enter an amount first')) {
        throw new Error('❌ Amount error message not displayed');
    } else {
        console.log('✅ Amount error message displayed as expected');
    }

    console.log('💵 Filling in amount');
    await page.locator('#amount-to-pay').fill('100');
    console.log('✅ Amount filled successfully');

    // check if the currency dropdown is working
    console.log('💬 Checking currency dropdown functionality');
    await page.locator('#php[name="currency"]').click();
    await expect (page.locator('ul.MuiList-root')).toBeVisible();
    console.log('✅ Currency dropdown is working as expected');

    console.log('🔙 Looking for Back button')
    await page.getByText('Back').click();

    //clicking send money without clicking the T&C
    console.log('💵 Clicking Send Money without accepting T&C - should error');
    await page.getByRole('button', {name: 'Pay Now'}).click();
    const tcError = (await page.locator('body').innerText()).toLowerCase();

    if (!tcError.includes('terms and conditions is required')) {
        throw new Error('❌ T&C error message not displayed when T&C not accepted');
    } else {
        console.log('✅ T&C error message displayed as expected when T&C not accepted');
    }

    //clicking the TC should open new tab
    console.log('💬 Clicking on Terms and Conditions link to open T&C page');
    const [termsPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('a').getByText('Terms and Conditions').click()
    ]);
    await termsPage.waitForLoadState();
    console.log(`✅ New tab opened with URL: ${termsPage.url()}`);
    await expect(termsPage).toHaveURL(/terms-conditions/);
    console.log('✅ T&C page loaded successfully');

    // Close the T&C tab
    await termsPage.close();
    console.log('🔒 T&C page closed');

    // Continue on the main/original tab
    await page.bringToFront();
    console.log('↩️ Back to main payment page');


    // checking the T&C checkbox
    console.log('✅ Accepting Terms and Conditions');
    await page.getByRole('checkbox').check();
    console.log('✅ T&C accepted');
    
    await page.getByRole('button', {name: 'Pay Now'}).click();

    // choosing regular payment
    console.log('⏳ Choosing regular payment option');
    await page.locator('button:has-text("OK")').click();
    console.log('✅ Regular payment option selected');
    
    // mobile number error validation
    console.log('💬 Verifying mobile number field validation');
    console.log('👉 Blank mobile number field should show an error');
    await page.locator('button:has-text("OK")').click();
    const mobileError = (await page.locator('body').innerText()).toLowerCase();

    if (!mobileError.includes('mobile number is required')) {
        throw new Error('❌ Mobile number field validation failed: No error for blank mobile number field');
    } else {
        console.log('✅ Mobile number field validation works as expected');
    }

    //FILL in mobile number field
    console.log(`💬 Filling in mobile number field`)
    await page.locator('#your-mobile-number').fill(process.env.BUSINESS_USER_MOBILE);
    console.log('✅ Mobile number field filled successfully');
    await page.locator('button:has-text("OK")').click();

     // Payment summary verification
    console.log('💬 Verifying payment summary page');

    await page.getByText('Payment Summary').waitFor({ state: 'visible', timeout: 60000 });

    console.log('✅ Payment summary page loaded successfully');

    //verify payment details
    await expect(page.getByText('BankTransferBusinessTest12345')).toBeVisible();
    console.log('✅ Message Verified');

    console.log('💸 Verifying Payment Amount from the Summary Table');
    const subTotalRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Sub Total' });
    const subTotal = await subTotalRow.locator('td').nth(1).innerText();
    console.log(`✅ Sub Total: ${subTotal}`);
    expect(subTotal).toContain('100.00');

    console.log("🔍 Verifying Payer's Information from Summary Table");

    // Name
    console.log('📛 Checking Name...');
    const nameRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Name' });
    const name = await nameRow.locator('td').nth(1).innerText();
    console.log(`✅ Name verified: ${name}`);
    expect(name.toLowerCase()).toContain(process.env.BUSINESS_USER_NAME.toLowerCase());

    // Email
    console.log('📧 Checking Email...');
    const emailRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Email' });
    const email = await emailRow.locator('td').nth(1).innerText();
    console.log(`✅ Email verified: ${email}`);
    expect(email.toLowerCase()).toBe(process.env.BUSINESS_USER_EMAIL.toLowerCase());

    // Mobile
    console.log('📱 Checking Mobile Number...');
    const mobileRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Mobile Number' });
    const mobile = await mobileRow.locator('td').nth(1).innerText();
    console.log(`✅ Mobile verified: ${mobile}`);
    expect(mobile).toContain(process.env.BUSINESS_USER_MOBILE);

    // Payment Method
    console.log('💳 Checking Payment Method...');
    const paymentRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Payment Method' });
    const paymentMethod = await paymentRow.locator('td').nth(1).innerText();
    console.log(`✅ Payment Method verified: ${paymentMethod}`);
    expect(paymentMethod).toContain('Bank of the Philippine Islands');

    // IP Address
    console.log('🌐 Verifying IP Address Information');
    const ipText = await page.locator('.MuiTypography-h6', { hasText: 'your current IP address' }).locator('span').innerText();
    const cleanedIP = ipText.replace(/[()]/g, '').trim();
    console.log(`✅ IP Address logged: ${cleanedIP}`);
    expect(cleanedIP).toMatch(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);

    console.log('🎉 All Payment Summary validations passed successfully');
    console.log('✅ Payment Summary Validation Complete');

    // scroll to button
    const confirmButton = page.locator('button', { hasText: 'Confirm' }).first();
    await confirmButton.click();

    console.log('🔃 Processing Transaction')

    console.log('Checkin/Agreeing Authentication Checkbox');
    await page.locator('input[name="acknowledge"]').check();


    console.log('👆 Clicking Continue button')

    await page.waitForTimeout(1000);

    const continueButton = page.locator('button:has-text("Continue"):not([disabled])').first();
    await continueButton.waitFor({ state: 'visible', timeout: 10000 });

    console.log('✅ Continue button is enabled, clicking to open bank popup');

    const [popup] = await Promise.all([
        context.waitForEvent('page'), // Wait for popup to open
        continueButton.click() // Click Continue
    ]);

    console.log('✅ Bank authentication popup opened');
    await popup.waitForLoadState('domcontentloaded');
    console.log(`🏦 Bank mock page URL: ${popup.url()}`);

    // Verify we're on the bank mock page
    await expect(popup).toHaveURL(/bank-web-mock\.xendit\.co/);

    // Wait for the form to be fully loaded
    console.log('⏳ Waiting for login form to load...');
    await popup.locator('input[name="username"]').waitFor({ state: 'visible', timeout: 10000 });


    console.log('💬 Filling in MoneyBank mock login credentials');
    await popup.locator('input[name="username"]').fill('91284');
    await popup.locator('input[name="password"]').fill('strongpassword');

    await popup.locator('button[type="submit"]').click();

    console.log('🔐 Filling in OTP on bank popup');
    await popup.locator('input[name="otp"]').fill('222000');
    await popup.locator('button:has-text("Confirm")').click();

    test.setTimeout(180000); // 3 minutes to accommodate processing time

    console.log('⏳ Waiting for transaction to process (20 seconds)...');
    await page.waitForTimeout(20000); // wait for 20 seconds for processing

    console.log('🔎 Checking Transaction Status')
    await page.waitForTimeout(2000);
    const successMessage = await page.locator('body').innerText();

    if (!successMessage.toLowerCase().includes('transaction successful')) {
        throw new Error('❌ Payment not successful - Success message not found');
    } else {
        console.log('✅ Payment completed successfully - Success message verified');
    }

    await page.screenshot({ path: `banktransfer_individual_${browserName}.png`, fullPage: true });

    await page.locator('button', { hasText: 'Ok' }).click();
    console.log('🎉 Individual Bank Transfer Payment Flow Test Completed Successfully');

    const testTriggerTime1 = Date.now();
        const searchTime1 = new Date(testTriggerTime1 - 30 * 1000);
    
        const testTriggerTime2 = Date.now();
        const searchTime2 = new Date(testTriggerTime2 - 30 * 1000);
    
        //email verification for user
        console.log('📧 Verifying payment confirmation email for individual user');
    
        console.log('📬 Waiting for confirmation email for payer...');
    
        await page.waitForTimeout(2000); // short delay before checking
    
        const payerEmail = await checkEmail({
        from: 'hello@justpay.to',
        to: process.env.BUSINESS_USER_EMAIL,
        subject: 'was successfully processed',
        subject_includes: 'was successfully processed',
        wait_time_sec: 20,
        max_wait_time_sec: 180,
        after: searchTime1.toISOString(),
        });
    
        if (!payerEmail) {
        throw new Error(`❌ No confirmation email received for payer: ${process.env.BUSINESS_USER_EMAIL}`);
        }
    
        console.log('✅ Payer confirmation email received.');
        console.log(`📧 To: ${process.env.BUSINESS_USER_EMAIL}`);
        console.log(`🕒 Received at: ${payerEmail.date || 'unknown'}`);
    
        // --- EMAIL VERIFICATION FOR MERCHANT (You are receiving) ---
        console.log('📬 Waiting for confirmation email for merchant...');
    
        await page.waitForTimeout(2000); // slight pause before checking merchant inbox
    
        const merchantEmail = await checkMerchantEmail({
        from: 'hello@justpay.to',
        to: process.env.BUSINESS_MERCHANT_EMAIL,
        subject: process.env.BUSINESS_USER_NAME + ' paid you',
        wait_time_sec: 20,
        max_wait_time_sec: 180,
        after: searchTime2.toISOString(),
        });
    
        if (!merchantEmail) {
        throw new Error(`❌ No confirmation email received for merchant: ${process.env.INDIVIDUAL_MERCHANT_EMAIL}`);
        }
    
        console.log('✅ Merchant confirmation email received.');
        console.log(`📧 To: ${process.env.INDIVIDUAL_MERCHANT_EMAIL}`);
        console.log(`🕒 Received at: ${merchantEmail.date || 'unknown'}`);
    
        // --- FINAL VALIDATION ---
        console.log('🎉 Email verification for both payer and merchant completed successfully!');

});
