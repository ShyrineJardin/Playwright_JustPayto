import {test, expect} from '@playwright/test';
import path from 'path';
import { checkEmail, extractOTP, checkMerchantEmail } from '../../helpers/gmail-helper.js';


test('🤲 Credit Card payment for Donation', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

    console.log('💻 Complete Credit Card Payment Flow for donation');
    console.log(`🔗 URL: ${process.env.GAWADKALINGA_PAYMENT_URL}`);

    await page.goto(process.env.GAWADKALINGA_PAYMENT_URL);
    await expect(page).toHaveURL(/justpay\.to/);
    console.log('✅ GawadKalinga Payment page loaded successfully');

    console.log('💸 Click "Donate Now" button')
    await page.locator('button:has-text("Donate Now")').click();
    console.log('✅ "Donate Now" button clicked');

    console.log('💬 Verifying message field validation');
    console.log('👉 Blank message field should show an error');
    await page.getByRole('button', {name: 'Donate Now'}).click();

    const messageError = (await page.locator('body').innerText()).toLowerCase();

    if (!messageError.includes('message is required')) {
        throw new Error('❌ Message field validation failed: No error for blank message field');
    } else {
        console.log('✅ Message field validation works as expected');
    }

    // Fill in message field
    const testMessage = 'CreditCardDonationTest12345';
    console.log(`💬 Filling in message field with: ${testMessage}`)
    await page.locator('#what-is-your-donation-for-add-a-message-or-additional-notes').fill(testMessage);
    console.log('✅ Message field filled successfully');

    await page.getByRole('button', {name: 'Donate Now'}).click();

});