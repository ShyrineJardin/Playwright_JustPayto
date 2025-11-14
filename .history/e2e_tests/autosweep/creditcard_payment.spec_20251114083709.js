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

   console.log('📢 Close the Autosweep Announcement Modal')
    
    // Wait for the modal to appear
    const modal = page.locator('section.modal.information')
    await expect(modal).toBeVisible({ timeout: 10000 })
    
    // Verify modal content
    await expect(modal.locator('h3')).toHaveText('Announcement')
    await expect(modal.locator('iframe')).toBeVisible()
    
    // Click the close button
    const closeButton = modal.locator('button.close')
    await expect(closeButton).toBeEnabled()
    await closeButton.click()
    
    // Verify modal is closed
    await expect(modal).not.toBeVisible()
    console.log('✅ Announcement modal closed successfully')

    console.log('💸 Click "Load Now" button')
    await page.locator('button:has-text("Load Now")').click();
    console.log('✅ "Load Now" button clicked');

    console.log('💬 Verifying plate no. field validation');
    console.log('👉 Blank plate no. field should show an error');
    await page.getByRole('button', {name: 'Load Now'}).click();

    const platenumError = (await page.locator('body').innerText()).toLowerCase();

    if (!platenumError.includes('plate no. / card no. is required')) {
        throw new Error('❌ Plate no. field validation failed: No error for blank message field');
    } else {
        console.log('✅ Plate no. field validation works as expected');
    }

    // Fill in plate no. field
    console.log('🔢 Entering Plate No.');
    await page.locator('input#ccv-or-cvc-back-of-the-card').fill(process.env.INDIVIDUAL_CARD_CVV);
    console.log('✅ Card ccv field filled successfully');


});