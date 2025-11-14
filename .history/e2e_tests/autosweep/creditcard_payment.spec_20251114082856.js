import {test, expect} from '@playwright/test';
import path from 'path';
import { checkEmail, extractOTP, checkMerchantEmail } from '../../helpers/gmail-helper.js';


test('🤲 Credit Card payment for Autosweep', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

    console.log('🚗 Complete Credit Card Payment Flow for autosweep');
    console.log(`🔗 URL: ${process.env.AUTOSWEEP_PAYMENT_URL}`);

    await page.goto(process.env.AUTOSWEEP_PAYMENT_URL);
    await expect(page).toHaveURL(/justpay\.to/);
    console.log('✅ Autosweep Payment page loaded successfully');

    console.log('Close the Autosweep Announcement Modal')
});