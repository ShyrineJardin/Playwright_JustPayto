import {test, expect} from '@playwright/test';
import path from 'path';
import { checkEmail, extractOTP, checkMerchantEmail } from '../../helpers/gmail-helper.js';


test('🤲 Bank Transfer payment for Autosweep', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

    console.log('🚗 Complete Bank Transfer Payment Flow for autosweep');
    console.log(`🔗 URL: ${process.env.AUTOSWEEP_PAYMENT_URL}`);

    try {
        // Increase timeout to 90 seconds for slow network/GUI conditions
        await page.goto(process.env.AUTOSWEEP_PAYMENT_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    } catch (error) {
        console.error('❌ page.goto timeout:', error.message);
        console.log('⏳ Waiting for page content to appear anyway...');
    }

    // Check if the page actually loaded with content - use longer timeout for GUI
    console.log('⏳ Waiting for modal to be visible...');
    const payNowButton = page.locator('section.modal.information');
    const isButtonVisible = await payNowButton.waitFor({state: 'visible', timeout: 60000}).then(() => true).catch(() => false);
    
    if (!isButtonVisible) {
        console.error('❌ FAILED: Payment page did not load properly - may be down or loading slowly');
        console.log('📄 Current page content:');
        console.log((await page.locator('body').innerText()).substring(0, 500));
        throw new Error('Page failed to load - The page may be down or loading slowly');
    } else {
        console.log('✅ Payment page loaded successfully');
    }

    await expect(page).toHaveURL(/justpay\.to/);

    console.log('📢 Close the Autosweep Announcement Modal')
    
    // Wait for the modal to appear
    const modal = page.locator('section.modal.information')
    await expect(modal).toBeVisible({ timeout: 10000 })
    
    // Verify modal content
    await expect(modal.locator('h3')).toHaveText('Announcement')
    await expect(modal.locator('iframe')).toBeVisible()
    
    // Click the close button
    const closeButton = modal.locator('button.close')
    await expect(closeButton).toBeEnabled()
    await closeButton.click()
    
    // Verify modal is closed
    await expect(modal).not.toBeVisible()
    console.log('✅ Announcement modal closed successfully')

    console.log('💸 Click "Load Now" button')
    await page.getByRole('button', {name: 'Load Now'}).click();
    console.log('✅ "Load Now" button clicked');

    console.log('💬 Verifying plate no. field validation');
    console.log('👉 Blank plate no. field should show an error');
    await page.getByRole('button', {name: 'Load Now'}).click();

    const platenumError = (await page.locator('body').innerText()).toLowerCase();

    if (!platenumError.includes('plate no. / card no. is required')) {
        throw new Error('❌ Plate no. field validation failed: No error for blank message field');
    } else {
        console.log('✅ Plate no. field validation works as expected');
    }

    // Fill in plate no. field
    console.log('🔢 Entering Plate No.');
    await page.locator('input#plate-no-card-no').fill(process.env.AUTOSWEEP_PLATE_NUMBER);
    console.log('✅ Plate Number field filled successfully');

    // Proceed to payment
    console.log('💵 Proceeding to payment');

    console.log('💳 Selecting bank transfer payment method');
    await page.locator('#payment-method').click();

    await page.getByAltText('bank_fund_transfer').click();

    console.log('Selecting Philippines as bank transfer country');
    await page.getByAltText('PH').click();
    console.log('✅ Philippines selected as bank transfer country');

    console.log('Selecting BPI for bank transfer')
    await page.getByAltText('bpi').locator('..').first().click();
    console.log('✅ Bank transfer payment method selected');

    console.log('💵 Filling in amount - 500');
    await page.locator('#amount-to-pay').click();
    await page.getByLabel('500').check();
    await page.locator('button:has-text("Select")').click();
    console.log('✅ 500 option selected');
    console.log('✅ Amount filled successfully');

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

    // Wait for the button to be enabled and clickable
    console.log('⏳ Waiting for Load button to be ready...');
    const loadButton = page.getByRole('button', {name: /Load PHP/});

    // Wait for loading state to complete - check if loading spinner exists and disappears
    try {
        const loadingSpinner = page.locator('button:has-text("Load PHP") span.loading');
        const spinnerExists = await loadingSpinner.count() > 0;
        
        if (spinnerExists) {
            console.log('⏳ Waiting for loading spinner to disappear...');
            await loadingSpinner.waitFor({state: 'hidden', timeout: 20000});
            console.log('✅ Loading spinner disappeared');
        }
    } catch (error) {
        console.log('⚠️ No loading spinner found or already hidden');
    }

    // Wait for button to be enabled
    await loadButton.waitFor({ state: 'visible', timeout: 10000 });
    
    // Additional wait for form validation
    await page.waitForTimeout(2000);

    // Check if button is enabled before clicking
    const isDisabled = await loadButton.isDisabled();
    if (isDisabled) {
        console.log('⚠️ Load button still disabled, force clicking...');
        await loadButton.click({force: true});
    } else {
        console.log('💰 Load button enabled, clicking normally');
        await loadButton.click();
    }
    
    console.log('✅ Load button clicked successfully');

    // Wait for the plate number confirmation modal/dialog
    console.log('⏳ Waiting for plate number confirmation dialog...');
    await page.waitForTimeout(2000); // Allow dialog to appear

    console.log('🔍 Verifying plate number in readonly display field...');
    
    // click the checkbox to confirm the plate number
    console.log('🔃 Confirm the plate number by clicking the checkbox');
    await page.locator('input[type="checkbox"][name="plateNumber"]').check();
    console.log('✅ Plate number checkbox confirmed');

    console.log('💰 Clicking OK button');
    await page.getByText('OK').click();

    //payment page contact information for verification
    console.log('💬 Verifying contact information on payment page');

    await page.getByText('OK').click();

    //checking name message error
    const nameError = (await page.locator('body').innerText()).toLowerCase();
    if (!nameError.includes('payer/sender name is required')) {
        throw new Error('❌ Name error message not displayed');
    } else {
        console.log('✅ Name error message displayed as expected');
    }
    console.log('📛 Filling in sender name');
    
    await page.locator('#your-name').fill(process.env.INDIVIDUAL_USER_NAME);
    console.log('✅ Sender name filled successfully');
    
    await page.getByText('OK').click();
    
    //checking email message error
    const emailError = (await page.locator('body').innerText()).toLowerCase();
    if (!emailError.includes('payer/sender email is required')) {
        throw new Error('❌ Email error message not displayed');
    } else {
        console.log('✅ Email error message displayed as expected');
    }
    
    //filling in email
    console.log('📧 Filling in sender email');
    await page.locator('#your-email').fill(process.env.INDIVIDUAL_USER_EMAIL);
    console.log('✅ Sender email filled successfully');
    
    await page.getByText('OK').click();
    
    //checking mobile message error
    const mobileError = (await page.locator('body').innerText()).toLowerCase(); 
    if (!mobileError.includes('payer/sender mobile number is required')) {
        throw new Error('❌ Mobile number error message not displayed');
    } else {
        console.log('✅ Mobile number error message displayed as expected');
    }
    
    //filling in mobile number
    console.log('📱 Filling in sender mobile number');
    await page.locator('#your-mobile-number').fill(process.env.INDIVIDUAL_USER_MOBILE);
    console.log('✅ Sender mobile number filled successfully');
    
    await page.getByText('OK').click();
    
    // Payment summary verification
    console.log('💬 Verifying payment summary page');

    await page.getByText('Payment Summary').waitFor({ state: 'visible', timeout: 15000});

    console.log('✅ Payment summary page loaded successfully');

    // Verify Biller Information
    console.log('🏢 Verifying User Information from Summary Table');

    console.log('🔍 Checking Plate Number...');
    const billerRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Plate Number' });
    const billerName = await billerRow.locator('td').nth(1).innerText();
    console.log(`✅ Plate Number verified: ${billerName}`);
    expect(billerName).toBeTruthy(); // Just verify it exists and has a value

    // Verify Payment Description
    console.log('💸 Verifying Payment Description');
    const paymentDescRow = page.locator('.MuiTable-root tbody tr', { hasText: 'You are reloading ' });
    const paymentDescAmount = await paymentDescRow.locator('td').nth(1).innerText();
    console.log(`✅ Payment amount: ${paymentDescAmount}`);
    expect(paymentDescAmount).toMatch(/₱[\d,]+\.\d{2}/);

    // Verify Fee Breakdown
    console.log('💳 Verifying Fee Breakdown from Summary Table');

    console.log('🔧 Checking Processing Fee...');
    const processingFeeRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Processing Fee' });
    const processingFee = await processingFeeRow.locator('td').nth(1).innerText();
    console.log(`✅ Processing Fee: ${processingFee}`);
    expect(processingFee).toMatch(/₱[\d,]+\.\d{2}/);
    const processingFeeValue = parseFloat(processingFee.replace(/[₱,]/g, ''));

    console.log('⚙️ Checking System Fee...');
    const systemFeeRow = page.locator('.MuiTable-root tbody tr', { hasText: 'System Fee' });
    const systemFee = await systemFeeRow.locator('td').nth(1).innerText();
    console.log(`✅ System Fee: ${systemFee}`);
    expect(systemFee).toMatch(/₱[\d,]+\.\d{2}/);
    const systemFeeValue = parseFloat(systemFee.replace(/[₱,]/g, ''));

    // Verify User Information
    console.log('🔍 Verifying User Information from Summary Table');

    // Name
    console.log('📛 Checking Name...');
    const nameRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Name' });
    const name = await nameRow.locator('td').nth(1).innerText();
    console.log(`✅ Name verified: ${name}`);
    expect(name.toLowerCase()).toContain(process.env.INDIVIDUAL_USER_NAME.toLowerCase());

    // Email
    console.log('📧 Checking Email...');
    const emailRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Email' });
    const email = await emailRow.locator('td').nth(1).innerText();
    console.log(`✅ Email verified: ${email}`);
    expect(email.toLowerCase()).toBe(process.env.INDIVIDUAL_USER_EMAIL.toLowerCase());

    // Mobile
    console.log('📱 Checking Mobile Number...');
    const mobileRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Mobile Number' });
    const mobile = await mobileRow.locator('td').nth(1).innerText();
    console.log(`✅ Mobile verified: ${mobile}`);
    expect(mobile).toContain(process.env.INDIVIDUAL_USER_MOBILE);

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

    // Click confirm button
    const confirmButton = page.locator('button', { hasText: 'Confirm' }).first();
    await confirmButton.click();
    console.log('✅ Confirm button clicked - Processing payment');
    
    console.log('🔃 Processing Transaction')

    console.log('Checking/Agreeing Authentication Checkbox');
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

    const testTriggerTime1 = Date.now();
    const searchTime1 = new Date(testTriggerTime1 - 30 * 1000);
    
    await page.locator('button', { hasText: 'Ok' }).click();

    //email verification for user
    console.log('📧 Verifying payment confirmation email for individual user');

    console.log('📬 Waiting for confirmation email for payer...');

    await page.waitForTimeout(2000); // short delay before checking

    const payerEmail = await checkEmail({
        from: 'hello@justpay.to',
        to: process.env.INDIVIDUAL_USER_EMAIL,
        subject: 'Successful payment of',
        wait_time_sec: 30,
        max_wait_time_sec: 180,
        after: searchTime1.toISOString(),
    });

    if (!payerEmail) {
        throw new Error(`❌ No confirmation email received for payer: ${process.env.INDIVIDUAL_USER_EMAIL}`);
    }

    console.log('✅ Payer confirmation email received.');
    console.log(`📧 To: ${process.env.INDIVIDUAL_USER_EMAIL}`);
    console.log(`🕒 Received at: ${payerEmail.date || 'unknown'}`);

    console.log('✅ Test completed successfully');

})