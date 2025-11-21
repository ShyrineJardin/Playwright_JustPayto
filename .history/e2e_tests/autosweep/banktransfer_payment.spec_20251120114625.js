import {test, expect} from '@playwright/test';
import path from 'path';
import { checkEmail, extractOTP, checkMerchantEmail } from '../../helpers/gmail-helper.js';


test('🤲 Bank Transfer payment for Autosweep', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

    console.log('🚗 Complete Credit Card Payment Flow for autosweep');
    console.log(`🔗 URL: ${process.env.AUTOSWEEP_PAYMENT_URL}`);

    try {
        // Increase timeout to 90 seconds for slow network/GUI conditions
        await page.goto(process.env.AUTOSWEEP_PAYMENT_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    } catch (error) {
        console.error('❌ page.goto timeout:', error.message);
        console.log('⏳ Waiting for page content to appear anyway...');
    }

    // Check if the page actually loaded with content - use longer timeout for GUI
    console.log('⏳ Waiting for modal to be visible...');
    const payNowButton = page.locator('section.modal.information');
    const isButtonVisible = await payNowButton.waitFor({state: 'visible', timeout: 60000}).then(() => true).catch(() => false);
    
    if (!isButtonVisible) {
        console.error('❌ FAILED: Payment page did not load properly - may be down or loading slowly');
        console.log('📄 Current page content:');
        console.log((await page.locator('body').innerText()).substring(0, 500));
        throw new Error('Page failed to load - The page may be down or loading slowly');
    } else {
        console.log('✅ Payment page loaded successfully');
    }

    await expect(page).toHaveURL(/justpay\.to/);

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
    await page.getByRole('button', {name: 'Load Now'}).click();
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
    await page.locator('input#plate-no-card-no').fill(process.env.AUTOSWEEP_PLATE_NUMBER);
    console.log('✅ Plate Number field filled successfully');

})