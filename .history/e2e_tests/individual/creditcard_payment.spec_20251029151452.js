import {test, expect} from '@playwright/test';

test('💳 Credit card payment for individual user', async ({page, context, baseURL, browserName, playwright}) => {

    console.log('💻 Complete Credit Card Payment Flow');
    console.log(`🔗 URL: ${process.env.INDIVIDUAL_PAYMENT_URL}`);
    await page.goto(process.env.INDIVIDUAL_PAYMENT_URL);
    await expect(page).toHaveURL('justpay.to');
    console.log('✅ Payment page loaded successfully');

    // Verify message field validation
    console.log('💬 Verifying message field validation');
    console.log('👉 Blank message field should show an error');
    await page.getByRole('button', {name: 'Send Money'}).click();
    await expect(page.getByText('message is required')).toBeVisible();

    


});