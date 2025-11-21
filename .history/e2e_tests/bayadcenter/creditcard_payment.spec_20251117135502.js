import {test, expect} from '@playwright/test';
import path from 'path';
// import { checkEmail, checkMerchantEmail } from '../../../helpers/gmail-helper.js';

test('💳 Creditcard Payment for BayadCenter', async({page, context, baseURL, browserName, playwright})=> {
    test.setTimeout(120000);

    console.log('💻 Complete creditcard payment flow for bayadcenter');
    console.log(`🔗 URL: ${process.env.BAYADCENTER_PAYMENT_URL}`);

    try {
        // Increase timeout to 90 seconds for slow network/GUI conditions
        await page.goto(process.env.BAYADCENTER_PAYMENT_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    } catch (error) {
        console.error('❌ page.goto timeout:', error.message);
        console.log('⏳ Waiting for page content to appear anyway...');
    }

    // Check if the page actually loaded with content - use longer timeout for GUI
    console.log('⏳ Waiting for Pay Now button to be visible...');
    const payNowButton = page.locator('button:has-text("Pay Now")');
    const isButtonVisible = await payNowButton.waitFor({state: 'visible', timeout: 60000}).then(() => true).catch(() => false);
    
    if (!isButtonVisible) {
        console.error('❌ FAILED: BayadCenter Payment page did not load properly - may be down or loading slowly');
        console.log('📄 Current page content:');
        console.log((await page.locator('body').innerText()).substring(0, 500));
        throw new Error('BayadCenter page failed to load - The page may be down or loading slowly');
    } else {
        console.log('✅ BayadCenter Payment page loaded successfully');
    }

    await expect(page).toHaveURL(/justpay\.to/);

    console.log('💸 Click "Pay Now" button')
    await page.locator('button:has-text("Pay Now")').click();
    console.log('✅ "Pay Now" button clicked');

    console.log('💬 Verifying Biller validation');
    console.log('👉 Blank biller field should show an error');
    await page.getByRole('button', {name: 'Pay Now'}).click();

    const billerError = (await page.locator('body').innerText()).toLowerCase();

    if (!billerError.includes('biller is required')) {
        throw new Error('❌ Biller field validation failed: No error for blank message field');
    } else {
        console.log('✅ Biller field validation works as expected');
    }

    //choose biller -
    console.log('🏪 Choosing biller');
    await page.locator('input#choose-a-bill-to-pay').click();
        

})