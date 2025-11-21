import {test, expect} from '@playwright/test';
import { checkEmail, extractOTP, checkMerchantEmail } from '../../helpers/gmail-helper.js';


test('🏦 Bank Transfer payment for meralco', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

    console.log('💻 Complete Bank Transfer Payment Flow');
    console.log(`🔗 URL: ${process.env.MERALCO_PAYMENT_URL}`);
    
    try {
        // Increase timeout to 90 seconds for slow network/GUI conditions
        await page.goto(process.env.INDIVIDUAL_PAYMENT_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    } catch (error) {
        console.error('❌ page.goto timeout:', error.message);
        console.log('⏳ Waiting for page content to appear anyway...');
    }
    
    await expect(page).toHaveURL(/justpay\.to/);

    // Check if the page actually loaded with content - use longer timeout for GUI
    console.log('⏳ Waiting for Pay now button to be visible...');
    const isButtonVisible = await page.locator('button:has-text("Pay Now")')
        .waitFor({state: 'visible', timeout: 60000})
        .then(() => true)
        .catch(() => false); 
    
    if (!isButtonVisible) {
        console.error('❌ FAILED: Meralco Payment page did not load properly - may be down or loading slowly');
        console.log('📄 Current page content:');
        console.log((await page.locator('body').innerText()).substring(0, 500));
        throw new Error('Meralco page failed to load - The page may be down or loading slowly');
    } else {
        console.log('✅ Meralco Payment page loaded successfully');
    }

    // Verify biller field validation
    console.log('💬 Verifying biller field validation');
    console.log('👉 Blank message field should show an error');
    await page.getByRole('button', {name: 'Pay Now'}).click();
    await page.waitForTimeout(500); // Allow page to render error message
    const messageError = (await page.locator('body').innerText()).toLowerCase();

    if (!messageError.includes('biller is required')) {
        throw new Error('❌ Message field validation failed: No error for blank message field');
    } else {
        console.log('✅ Message field validation works as expected');
    }
)}