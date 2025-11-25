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
    // await page.getByRole('button', {name: 'Load Now'}).click();
    // await page.waitForTimeout(500); // Allow page to render error message
    // const paymentError = (await page.locator('body').innerText()).toLowerCase();

    // if (!paymentError.includes('please select a payment method first')) {
    //     throw new Error('❌ Payment method selection failed: No payment method selected');
    // } else {
    //     console.log('✅ Payment method selection works as expected');
    // }

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

    // // check if the currency dropdown is working
    // console.log('💬 Checking currency dropdown functionality');
    // await page.locator('#php[name="currency"]').click();
    // await expect (page.locator('ul.MuiList-root')).toBeVisible();
    // console.log('✅ Currency dropdown is working as expected');

    // console.log('🔙 Looking for Back button')
    // await page.getByText('Back').click();

    // // Wait for the page to fully load after going back
    // await page.waitForLoadState('networkidle');
    // await page.waitForTimeout(1500);

    // //clicking send money without clicking the T&C
    // console.log('💵 Clicking Send Money without accepting T&C - should error');
    // const submitButton = page.getByRole('button', {name: /Load PHP/});
    // await submitButton.click({force: true});


    // const tcError = (await page.locator('body').innerText()).toLowerCase();

    // if (!tcError.includes('terms and conditions is required')) {
    //     throw new Error('❌ T&C error message not displayed when T&C not accepted');
    // } else {
    //     console.log('✅ T&C error message displayed as expected when T&C not accepted');
    // }

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

    // Wait for any loading state to complete
    console.log('⏳ Waiting for form to finish processing...');
    const loadButton = page.getByRole('button', {name: /Load PHP/});

    // Wait for the loading spinner inside the button to disappear
    await page.locator('button:has-text("Load PHP") span.loading').waitFor({state: 'hidden', timeout: 20000}).catch(() => {
        console.log('⚠️ Loading spinner not found or already hidden');
    });

    // Add a small wait for form validation to complete
    await page.waitForTimeout(2000);

    // Try to click even if disabled (may work if validation completes)
    console.log('💰 Clicking Load button');
    await loadButton.click({force: true});

    // console.log('🔍 Verifying plate number in readonly display field...');
    // const readonlyField = page.locator('input[aria-invalid="false"][readonly][type="text"].MuiInputBase-input.MuiOutlinedInput-input.MuiInputBase-inputAdornedStart.MuiOutlinedInput-inputAdornedStart');

    // // Wait for the field to be visible
    // await readonlyField.waitFor({ state: 'visible', timeout: 10000 });

    // // Get the displayed value
    // const displayedValue = await readonlyField.inputValue();
    // console.log(`📋 Displayed plate number: ${displayedValue}`);
    // console.log(`📋 Input plate number: ${plateNumber}`);

    // // Verify they match
    // if (displayedValue === plateNumber) {
    //     console.log('✅ Plate number verification PASSED: Input and display match');
    // } else {
    //     throw new Error(`❌ Plate number verification FAILED: Expected "${plateNumber}" but got "${displayedValue}"`);
    // }

    // click the checkbox to confirm the plate number
    console.log('🔃 Confirm the plate number by clicking the checkbox');
    await page.getByRole('checkbox').check();
    console.log('✅ Plate number checkbox confirmed');

    console.log('💰 Clicking Ok button');
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
        

})