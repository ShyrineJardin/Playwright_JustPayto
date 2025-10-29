import {test, expect} from '@playwright/test';

test('🏦 Bank Transfer payment for individual user', async ({page, context, baseURL, browserName, playwright}) => {

    console.log('💻 Complete Bank Transfer Payment Flow');
    console.log(`🔗 URL: ${process.env.INDIVIDUAL_PAYMENT_URL}`);
    await page.goto(process.env.INDIVIDUAL_PAYMENT_URL);
    await expect(page).toHaveURL(/justpay\.to/);
    console.log('✅ Payment page loaded successfully');

    // Verify message field validation
    console.log('💬 Verifying message field validation');
    console.log('👉 Blank message field should show an error');
    await page.getByRole('button', {name: 'Send Money'}).click();

    const messageError = (await page.locator('body').innerText()).toLowerCase();

    if (!messageError.includes('message is required')) {
        throw new Error('❌ Message field validation failed: No error for blank message field');
    } else {
        console.log('✅ Message field validation works as expected');
    }

    // Fill in message field
    const testMessage = 'BankTransferTest12345';
    console.log(`💬 Filling in message field with: ${testMessage}`)
    await page.locator('#message-order-items-ref').fill(testMessage);
    console.log('✅ Message field filled successfully');

    // Proceed to payment
    console.log('💵 Proceeding to payment');
    await page.getByRole('button', {name: 'Send Money'}).click();
    
    const paymentError = (await page.locator('body').innerText()).toLowerCase();

    if (!paymentError.includes('please select a payment method first')) {
        throw new Error('❌ Payment method selection failed: No payment method selected');
    } else {
        console.log('✅ Payment method selection works as expected');
    }

    // Select credit card payment method
    console.log('💳 Selecting bank transfer payment method');
    await page.locator('#payment-method').click();

    await page.getByAltText('bank_fund_transfer').click();

    console.log('Selecting Philippines as bank transfer country');
    await page.getByAltText('PH').click();
    console.log('✅ Philippines selected as bank transfer country');

    console.log('Selecting BPI for bank transfer')
    await page.getByAltText('bpi').locator('..').first().click();
    console.log('✅ Bank transfer payment method selected');

    await page.getByRole('button', {name: 'Send Money'}).click();

    // Checking for amount error message
    console.log('💬 Checking for amount error message');
    const amountError = (await page.locator('body').innerText()).toLowerCase();

    if (!amountError.includes('please enter an amount first')) {
        throw new Error('❌ Amount error message not displayed for bank transfer');
    } else {
        console.log('✅ Amount error message displayed as expected for bank transfer');
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
    await page.getByRole('button', {name: 'Send Money'}).click();
    const tcError = (await page.locator('body').innerText()).toLowerCase();

    if (!tcError.includes('terms and conditions is required')) {
        throw new Error('❌ T&C error message not displayed when T&C not accepted');
    } else {
        console.log('✅ T&C error message displayed as expected when T&C not accepted');
    }

    //clicking the TC should open new tab
    console.log('💬 Clicking on Terms and Conditions link to open T&C page');
    const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('a').getByText('Terms and Conditions').click()
    ]);
    await newPage.waitForLoadState();
    console.log(`✅ New tab opened with URL: ${newPage.url()}`);
    await expect(newPage).toHaveURL(/terms-conditions/);
    console.log('✅ T&C page loaded successfully');


    // checking the T&C checkbox
    console.log('✅ Accepting Terms and Conditions');
    await page.getByRole('checkbox').check();
    console.log('✅ T&C accepted');
    
    await page.getByRole('button', {name: 'Send Money'}).click();

    //payment page contact information for verification
    console.log('💬 Verifying contact information on payment page');

    await page.getByRole('button', {name: 'OK'}).click();
   
    //checking name message error
    const nameError = (await page.locator('body').innerText()).toLowerCase();
    if (!nameError.includes('payer/sender name is required')) {
        throw new Error('❌ Name error message not displayed');
    } else {
        console.log('✅ Name error message displayed as expected for bank transfer');
    }
    console.log('💵 Filling in sender name');


});