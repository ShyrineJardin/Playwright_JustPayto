import {test, expect} from '@playwright/test';
import path from 'path';
import { checkEmail, checkMerchantEmail } from '../../../helpers/gmail-helper.js';

test('🏦 Credit card payment for business user - pickup', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

    console.log('💻 Complete Credit Card Payment Flow for business - pickup');
    console.log(`🔗 URL: ${process.env.BUSINESS_PAYMENT_URL}`);

    await page.goto(process.env.BUSINESS_PAYMENT_URL);
    await expect(page).toHaveURL(/justpay\.to/);
       
    // Check if the page actually loaded with content
    const payNowButton = page.locator('button:has-text("I want to pay")');
    const isButtonVisible = await payNowButton.isVisible({timeout: 30000}).catch(() => false);
    
    if (!isButtonVisible) {
        console.error('❌ FAILED: Payment page did not load properly - may be down or loading slowly');
        throw new Error('Page failed to load - The page may be down or loading slowly');
    } else {
        console.log('✅ Payment page loaded successfully');
    }

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
    const testMessage = 'CreditCardBusinessTestPickUp12345';

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



});