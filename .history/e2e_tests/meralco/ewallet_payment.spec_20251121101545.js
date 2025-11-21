import {test, expect} from '@playwright/test';
import path from 'path';
import { checkEmail, extractOTP } from '../../helpers/gmail-helper.js';


test('💻 Online Bank payment for individual user', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

    console.log('💻 Complete Online Bank Payment Flow');
    console.log(`🔗 URL: ${process.env.INDIVIDUAL_PAYMENT_URL}`);
    
    try {
        // Increase timeout to 90 seconds for slow network/GUI conditions
        await page.goto(process.env.INDIVIDUAL_PAYMENT_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    } catch (error) {
        console.error('❌ page.goto timeout:', error.message);
        console.log('⏳ Waiting for page content to appear anyway...');
    }
    
    await expect(page).toHaveURL(/justpay\.to/);
    
    // Check if the page actually loaded with content - use longer timeout for GUI
    console.log('⏳ Waiting for Send Money button to be visible...');
    const isButtonVisible = await page.locator('button:has-text("Send Money")')
        .waitFor({state: 'visible', timeout: 60000})
        .then(() => true)
        .catch(() => false); 
    
    if (!isButtonVisible) {
        console.error('❌ FAILED: Individual Payment page did not load properly - may be down or loading slowly');
        console.log('📄 Current page content:');
        console.log((await page.locator('body').innerText()).substring(0, 500));
        throw new Error('Individual page failed to load - The page may be down or loading slowly');
    } else {
        console.log('✅ Individual Payment page loaded successfully');
    }

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
    const testMessage = 'OnlineBankTest12345';
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