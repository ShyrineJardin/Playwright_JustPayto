import {test, expect} from '@playwright/test';
import path from 'path';
import { checkEmail, checkMerchantEmail } from '../../../helpers/gmail-helper.js';

test('🏦 Credit card payment for business user', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

    console.log('💻 Complete Credit  Payment Flow for business');
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

});