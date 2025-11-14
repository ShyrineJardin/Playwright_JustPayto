import {test, expect} from '@playwright/test';
import path from 'path';
// import { checkEmail, checkMerchantEmail } from '../../../helpers/gmail-helper.js';

test('💳 Creditcard Payment for BayadCenter', async({page, context, baseURL, browserName, playwright})=> {
    test.setTimeout(120000);

    console.log('💻 Complete creditcard payment flow for bayadcenter');
    console.log(`🔗 URL: ${process.env.BAYADCENTER_PAYMENT_URL}`);

    // Navigate to the page
    await page.goto(process.env.BAYADCENTER_PAYMENT_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });

    // Verify URL
    await expect(page).toHaveURL(/justpay\.to/, {timeout: 10000});

    // Wait for the actual page content to load - verify "Pay Now" button exists
    await expect(page.locator('button:has-text("Pay Now")')).toBeVisible({timeout: 30000});
    
    console.log('✅ BayadCenter Payment page loaded successfully');

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