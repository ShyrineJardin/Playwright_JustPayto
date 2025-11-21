import {test, expect} from '@playwright/test';
import { checkEmail, extractOTP, checkMerchantEmail } from '../../helpers/gmail-helper.js';


test('🏦 Bank Transfer payment for meralco', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

    console.log('💻 Complete Bank Transfer Payment Flow');
    console.log(`🔗 URL: ${process.env.MERALCO_PAYMENT_URL}`);
    
    try {
        // Increase timeout to 90 seconds for slow network/GUI conditions
        await page.goto(process.env.MERALCO_PAYMENT_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    } catch (error) {
        console.error('❌ page.goto timeout:', error.message);
        console.log('⏳ Waiting for page content to appear anyway...');
    }
    
    await expect(page).toHaveURL(/justpay\.to/);

    // Check if the page actually loaded with content - use longer timeout for GUI
    console.log('⏳ Waiting for Pay now button to be visible...');
    const isButtonVisible = await page.locator('button:has-text("Pay Now")')
        .waitFor({state: 'visible', timeout: 60000})
        .then(() => true)
        .catch(() => false); 
    
    if (!isButtonVisible) {
        console.error('❌ FAILED: Meralco Payment page did not load properly - may be down or loading slowly');
        console.log('📄 Current page content:');
        console.log((await page.locator('body').innerText()).substring(0, 500));
        throw new Error('Meralco page failed to load - The page may be down or loading slowly');
    } else {
        console.log('✅ Meralco Payment page loaded successfully');
    }

    // Verify biller field validation
    console.log('💬 Verifying biller field validation');
    console.log('👉 Blank message field should show an error');
    await page.getByRole('button', {name: 'Pay Now'}).click();
    await page.waitForTimeout(500); // Allow page to render error message
    const messageError = (await page.locator('body').innerText()).toLowerCase();

    if (!messageError.includes('biller is required')) {
        throw new Error('❌ Biller field validation failed: No error for blank message field');
    } else {
        console.log('✅ Biller field validation works as expected');
    }

    //click biller
    console.log('👆 Clicking biller information');
    await page.locator('input#biller-information').click();

    // Verify account number field validation
    console.log('💬 Verifying account number field validation');
    console.log('👉 Blank message field should show an error');
    await page.getByText('OK').click();
    await page.waitForTimeout(500); // Allow page to render error message
    const accountnumError = (await page.locator('body').innerText()).toLowerCase();

    if (!accountnumError.includes('account number is required')) {
        throw new Error('❌ Account number field validation failed: No error for blank message field');
    } else {
        console.log('✅ Account number field validation works as expected');
    }

    // fill account number field
    console.log('💵 Filling in account number');
    await page.locator('input#account-number[name=referenceNumber]').fill(process.env.MERALCO_ACCOUNT_NUMBER);
    console.log('✅ Account number filled successfully');

    // Verify amount field validation
    console.log('💬 Verifying amount field validation');
    console.log('👉 Blank message field should show an error');
    await page.getByText('OK').click();
    await page.waitForTimeout(500); // Allow page to render error message
    const amountError = (await page.locator('body').innerText()).toLowerCase();

    if (!amountError.includes('amount is required')) {
        throw new Error('❌ Amount field validation failed: No error for blank message field');
    } else {
        console.log('✅ Amount field validation works as expected');
    }

    // fill amount field
    console.log('💵 Filling in amount');
    await page.locator('input#amount').fill('900');
    console.log('✅ Account number filled successfully');

    await page.getByText('OK').click();

    await page.getByRole('button', {name: 'Pay Now'}).click();

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
    await page.getByText('Philippines', { exact: true }).click();
    console.log('✅ Philippines selected as bank transfer country');

    console.log('Selecting BPI for bank transfer')
    await page.getByAltText('bpi').locator('..').first().click();
    console.log('✅ Bank transfer payment method selected');

     // Verify the amount matches
    console.log('💰 Verifying amount to pay matches the declared amount');
    await page.waitForTimeout(1000); // Wait for payment confirmation page to load

    const amountInput = page.locator('input#amount-to-pay[name="amount"]');
    await amountInput.waitFor({ state: 'visible', timeout: 10000 });

    const displayedAmount = await amountInput.inputValue();
    const expectedAmount = '900'; 

    // Remove commas and parse to float for comparison
    const displayedNum = parseFloat(displayedAmount.replace(/,/g, ''));
    const expectedNum = parseFloat(expectedAmount);

    console.log(`  Expected amount: ${expectedAmount}`);
    console.log(`  Displayed amount: ${displayedAmount}`);

    if (displayedNum === expectedNum) {
        console.log('✅ Amount matches successfully');
    } else {
        throw new Error(`❌ Amount mismatch: Expected ${expectedNum} but got ${displayedNum} (displayed as "${displayedAmount}")`);
    }

    await page.getByRole('button', {name: 'Pay Now'}).click();

    console.log('💵 Clicking Pay Now without accepting T&C - should error');

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

});