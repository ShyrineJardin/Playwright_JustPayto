import {test, expect} from '@playwright/test';
import path from 'path';
import { checkEmail, checkMerchantEmail } from '../../../helpers/gmail-helper.js';

test('🏦 Credit card payment for business user - delivery', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);
    
    console.log('💻 Complete Credit Card Payment Flow for business - pickup');
    console.log(`🔗 URL: ${process.env.BUSINESS_PAYMENT_URL}`);

    await page.goto(process.env.BUSINESS_PAYMENT_URL);
    await expect(page).toHaveURL(/justpay\.to/);
       

})