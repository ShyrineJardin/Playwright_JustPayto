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

    

});