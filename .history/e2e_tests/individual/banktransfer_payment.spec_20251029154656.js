import {test, expect} from '@playwright/test';

test(' Bank Transfer payment for individual user', async ({page, context, baseURL, browserName, playwright}) => {

    console.log('💻 Complete Credit Card Payment Flow');
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
    const testMessage = 'CreditCardTest12345';
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
    console.log('💳 Selecting credit card payment method');
    await page.locator('#payment-method').click();

    await page.getByAltText('mastercard_visa').click();
    await page.getByAltText('credit_card').click();
    console.log('✅ Credit card payment method selected');

    



});