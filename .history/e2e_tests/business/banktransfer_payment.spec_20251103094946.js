import {test, expect} from '@playwright/test';
import path from 'path';

test('🏦 Bank transfer payment for business user', async ({page, context, baseURL, browserName, playwright}) => {
    console.log('💻 Complete Bank Transfer Payment Flow for business');
    console.log(`🔗 URL: ${process.env.BUSINESS_PAYMENT_URL}`);

    await page.goto(process.env.BUSINESS_PAYMENT_URL);
    await expect(page).toHaveURL(/justpay\.to/);
    console.log('✅ Payment page loaded successfully');

    console.log('💸 Choose "I want to pay" button')
    await page.locator('button:has-text("I want to pay")').click();
    console.log('✅ "I want to pay" button clicked');

    

});
