import {test, expect} from '@playwright/test';
import path from 'path';
import { checkEmail, checkMerchantEmail } from '../../../helpers/gmail-helper.js';

test('🏦 Bank transfer payment for business user - delivery', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

    console.log('💻 Complete Bank Transfer Payment Flow for business - delivery');
    console.log(`🔗 URL: ${process.env.BUSINESS_PAYMENT_URL}`);

    await page.goto(process.env.BUSINESS_PAYMENT_URL);
    await expect(page).toHaveURL(/justpay\.to/);
    console.log('✅ Payment page loaded successfully');

    console.log('💸 Choose "I want to pay" button')
    await page.locator('button:has-text("I want to pay")').click();
    console.log('✅ "I want to pay" button clicked');

    console.log('💬 Verifying message field validation');
    console.log('👉 Blank message field should show an error');
    await page.getByRole('button', {name: 'Pay Now'}).click();

    const messageError = (await page.locator('body').innerText()).toLowerCase();

    if (!messageError.includes('message is required')) {
        throw new Error('❌ Message field validation failed: No error for blank message field');
    } else {
        console.log('✅ Message field validation works as expected');
    }
    
    // Fill in message field
    const testMessage = 'BankTransferBusinessDeliveryTest12345';

    console.log(`💬 Filling in message field with: ${testMessage}`)
    await page.locator('#message-order-items-ref').fill(testMessage);
    console.log('✅ Message field filled successfully');

    await page.getByRole('button', {name: 'Pay Now'}).click();

    // name error validation
    console.log('💬 Verifying name field validation');
    console.log('👉 Blank name field should show an error');
    const nameError = (await page.locator('body').innerText()).toLowerCase();

    if (!nameError.includes('payer/sender name is required')) {
        throw new Error('❌ Name field validation failed: No error for blank name field');
    } else {
        console.log('✅ Name field validation works as expected');
    }

    // Fill in name field
    console.log(`💬 Filling in name field`)
    await page.locator('#your-name').fill(process.env.BUSINESS_USER_NAME);
    console.log('✅ Name field filled successfully');

    // email error validation
    console.log('💬 Verifying email field validation');
    console.log('👉 Blank email field should show an error');
    await page.getByRole('button', {name: 'Pay Now'}).click();

    const emailError = (await page.locator('body').innerText()).toLowerCase();
    if (!emailError.includes('payer/sender email is required')) {
        throw new Error('❌ Email field validation failed: No error for blank email field');
    } else {
        console.log('✅ Email field validation works as expected');
    }

    // Fill in email field
    console.log(`💬 Filling in email field`)
    await page.locator('#your-email').fill(process.env.BUSINESS_USER_EMAIL);
    console.log('✅ Email field filled successfully');

    // payment error validation
    console.log('💬 Verifying payment method selection validation');
    console.log('👉 No payment method selected should show an error');
    await page.getByRole('button', {name: 'Pay Now'}).click();

    const paymentError = (await page.locator('body').innerText()).toLowerCase();

    if (!paymentError.includes('please select a payment method first')) {
        throw new Error('❌ Payment method selection failed: No payment method selected');
    } else {
        console.log('✅ Payment method selection works as expected');
    }

    // Select bank transfer payment method
    console.log('🏦 Selecting bank transfer payment method');
    await page.locator('#payment-method').click();
    await page.getByAltText('bank_fund_transfer').click();
    console.log('✅ Bank transfer payment method selected');

    console.log('Selecting Philippines as bank transfer country');
    await page.getByAltText('PH').click();
    console.log('✅ Philippines selected as bank transfer country');

    console.log('Selecting BPI for bank transfer')
    await page.getByAltText('bpi').locator('..').first().click();
    console.log('✅ Bank transfer payment method selected');

    await page.getByRole('button', {name: 'Pay Now'}).click();

      // Checking for amount error message
    console.log('💬 Checking for amount error message');
    const amountError = (await page.locator('body').innerText()).toLowerCase();

    if (!amountError.includes('please enter an amount first')) {
        throw new Error('❌ Amount error message not displayed');
    } else {
        console.log('✅ Amount error message displayed as expected');
    }

    console.log('💵 Filling in amount');
    await page.locator('#amount-to-pay').fill('100');
    console.log('✅ Amount filled successfully');

    // check if the currency dropdown is working
    console.log('💬 Checking currency dropdown functionality');
    await page.locator('#php[name="currency"]').click();
    await expect (page.locator('ul.MuiList-root')).toBeVisible();
    console.log('✅ Currency dropdown is working as expected');

    console.log('🔙 Looking for Back button')
    await page.getByText('Back').click();

    //clicking send money without clicking the T&C
    console.log('💵 Clicking Send Money without accepting T&C - should error');
    await page.getByRole('button', {name: 'Pay Now'}).click();
    const tcError = (await page.locator('body').innerText()).toLowerCase();

    if (!tcError.includes('terms and conditions is required')) {
        throw new Error('❌ T&C error message not displayed when T&C not accepted');
    } else {
        console.log('✅ T&C error message displayed as expected when T&C not accepted');
    }

    //clicking the TC should open new tab
    console.log('💬 Clicking on Terms and Conditions link to open T&C page');
    const [termsPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('a').getByText('Terms and Conditions').click()
    ]);
    await termsPage.waitForLoadState();
    console.log(`✅ New tab opened with URL: ${termsPage.url()}`);
    await expect(termsPage).toHaveURL(/terms-conditions/);
    console.log('✅ T&C page loaded successfully');

    // Close the T&C tab
    await termsPage.close();
    console.log('🔒 T&C page closed');

    // Continue on the main/original tab
    await page.bringToFront();
    console.log('↩️ Back to main payment page');


    // checking the T&C checkbox
    console.log('✅ Accepting Terms and Conditions');
    await page.getByRole('checkbox').check();
    console.log('✅ T&C accepted');
    
    await page.getByRole('button', {name: 'Pay Now'}).click();
    
    // choosing delivery
    console.log('⏳ Choosing delivery option');
    await page.getByLabel('For Delivery').check();
    await page.locator('button:has-text("OK")').click();
    console.log('✅ Delivery option selected');

    //for delivery additional info
    //address error validation
    await page.locator('button:has-text("OK")').click();
    console.log('💬 Checking for address error message');
    const addressError = (await page.locator('body').innerText()).toLowerCase();

    if (!addressError.includes('delivery shipping address is required')) {
        throw new Error('❌ Delivery shipping address error message not displayed');
    } else {
        console.log('✅ Delivery shipping address message displayed as expected');
    }

    console.log('🏘️ Filling in delivery address');
     await page.locator('#your-delivery-shipping-address').fill(process.env.BUSINESS_USER_DELIVERY_ADDRESS);
    console.log('✅ Delivery Address field filled successfully');
    await page.locator('button:has-text("OK")').click();

    // mobile number error validation
    console.log('💬 Verifying mobile number field validation');
    console.log('👉 Blank mobile number field should show an error');
    await page.locator('button:has-text("OK")').click();
    const mobileError = (await page.locator('body').innerText()).toLowerCase();

    if (!mobileError.includes('mobile number is required')) {
        throw new Error('❌ Mobile number field validation failed: No error for blank mobile number field');
    } else {
        console.log('✅ Mobile number field validation works as expected');
    }

    // Fill in mobile number field
    console.log(`💬 Filling in mobile number field`)
    await page.locator('#your-mobile-number').fill(process.env.BUSINESS_USER_MOBILE);
    console.log('✅ Mobile number field filled successfully');
    await page.locator('button:has-text("OK")').click();

    // Verifying delivery address
    console.log('📍 Checking delivery address in map');
    
    // Wait for the "For Delivery" section to be visible
    await page.locator('h5:has-text("For Delivery")').waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ "For Delivery" section loaded');
    
    // Verify Google Maps is loaded
    const googleMapContainer = page.locator('#google-maps-container');
    await expect(googleMapContainer).toBeVisible();
    console.log('✅ Google Maps container is visible');
    
    // Verify the map has loaded (check for Google Maps elements)
    const mapElement = page.locator('[aria-label="Map"]');
    await expect(mapElement).toBeVisible();
    console.log('✅ Google Maps loaded successfully');
    
    // Verify the marker/pin is present on the map
    const mapPin = page.locator('img[src*="spotlight-poi"]').or(page.locator('[title*="map pin"]'));
    await expect(mapPin).toBeVisible({ timeout: 5000 });
    console.log('✅ Location marker is visible on the map');
    
    // Click OK button to proceed
    console.log('👆 Clicking OK button to confirm delivery location');
    await page.locator('button:has-text("OK")').click();
    console.log('✅ Delivery location confirmed');

     // Payment summary verification
    console.log('💬 Verifying payment summary page');

    await page.getByText('Payment Summary').waitFor({ state: 'visible', timeout: 60000 });

    console.log('✅ Payment summary page loaded successfully');

    //verify payment details
    await expect(page.getByText('BankTransferBusinessDeliveryTest12345')).toBeVisible();
    console.log('✅ Message Verified');

    console.log('💸 Verifying Payment Amount from the Summary Table');
    const subTotalRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Sub Total' });
    const subTotal = await subTotalRow.locator('td').nth(1).innerText();
    console.log(`✅ Sub Total: ${subTotal}`);
    expect(subTotal).toContain('100.00');

    console.log("🔍 Verifying Payer's Information from Summary Table");

    // Name
    console.log('📛 Checking Name...');
    const nameRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Name' });
    const name = await nameRow.locator('td').nth(1).innerText();
    console.log(`✅ Name verified: ${name}`);
    expect(name.toLowerCase()).toContain(process.env.BUSINESS_USER_NAME.toLowerCase());

    // Email
    console.log('📧 Checking Email...');
    const emailRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Email' });
    const email = await emailRow.locator('td').nth(1).innerText();
    console.log(`✅ Email verified: ${email}`);
    expect(email.toLowerCase()).toBe(process.env.BUSINESS_USER_EMAIL.toLowerCase());

    // Mobile
    console.log('📱 Checking Mobile Number...');
    const mobileRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Mobile Number' });
    const mobile = await mobileRow.locator('td').nth(1).innerText();
    console.log(`✅ Mobile verified: ${mobile}`);
    expect(mobile).toContain(process.env.BUSINESS_USER_MOBILE);

    // Payment Method
    console.log('💳 Checking Payment Method...');
    const paymentRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Payment Method' });
    const paymentMethod = await paymentRow.locator('td').nth(1).innerText();
    console.log(`✅ Payment Method verified: ${paymentMethod}`);
    expect(paymentMethod).toContain('Bank of the Philippine Islands');

    // delivery address
    console.log('🏘️ Checking Delivery Address...');
    const addressRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Delivery Address' });
    const address = await mobileRow.locator('td').nth(1).innerText();
    console.log(`✅ Delivery Address verified: ${mobile}`);
    expect(mobile).toContain(process.env.BUSINESS_USER_DELIVERY_ADDRESS);

});