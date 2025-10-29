import {test, expect} from '@playwright/test';

test('💳 Credit card payment for individual user', async ({page, context, baseURL, browserName, playwright}) => {

    console.log('💻 Complete Credit Card Payment Flow')
    await page.goto(process.env.INDIVIDUAL_PAYMENT_URL);


});