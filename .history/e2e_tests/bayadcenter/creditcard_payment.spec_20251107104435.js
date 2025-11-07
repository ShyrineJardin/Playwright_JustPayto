import {test, expect} from '@playwright/test';
import path from 'path';
// import { checkEmail, checkMerchantEmail } from '../../../helpers/gmail-helper.js';

test('💳 Creditcard Payment for BayadCenter', async({page, context, baseURL, browserName, playwright})=> {
    test.setTimeout(120000);

    console.log('💻 Complete creditcard payment flow for bayadcenter');
    console.log(`🔗 URL: ${process.env.BAYADCENTER_PAYMENT_URL}`);

    await page.goto(process.env.BAYADCENTER_PAYMENT_URL);
    await expect(page).toHaveURL(/justpay\.to/);
    console.log('✅ BayadCenter Payment page loaded successfully');

    
})