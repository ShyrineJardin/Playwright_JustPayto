import {test, expect} from '@playwright/test'
import path from 'path';

test('🤲 Bank Transfer payment for gawadkalinga', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

    console.log('💻 Complete Bank Transfer Payment Flow for business');
    console.log(`🔗 URL: ${process.env.BUSINESS_PAYMENT_URL}`);
})