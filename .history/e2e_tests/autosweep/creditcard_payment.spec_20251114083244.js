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
});