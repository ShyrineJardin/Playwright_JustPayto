import {test, expect} from '@playwright/test';

test('💳 Credit card payment for individual user', async ({page, context, baseURL, browserName, playwright}) => {

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

    // Fill in credit card details
    console.log('💳 Filling in credit card details');
    await page.locator('#card-number').fill(process.env.INDIVIDUAL_CARD_NUMBER);
    await page.locator('#card-expiry').fill(process.env.INDIVIDUAL_CARD_EXP);
    await page.locator('#card-cvc').fill(process.env.INDIVIDUAL_CARD_CVV);
    await page.locator('#billing-street-line-1').fill(process.env.INDIVIDUAL_CARD_STREETLINE_1);
    await page.locator('#billing-street-line-2').fill(process.env.INDIVIDUAL_CARD_STREETLINE_2);
    await page.locator('#billing-province').fill(process.env.INDIVIDUAL_CARD_PROVINCE);
    await page.locator('#billing-postal-code').fill(process.env.INDIVIDUAL_CARD_POSTAL);
    console.log('✅ Credit card details filled successfully');




});