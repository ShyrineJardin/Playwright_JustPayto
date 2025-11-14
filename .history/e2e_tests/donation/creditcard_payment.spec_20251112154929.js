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

    // payment error validation
    console.log('💬 Verifying payment method selection validation');
    console.log('👉 No payment method selected should show an error');
    await page.getByRole('button', {name: 'Donate Now'}).click();

    const paymentError = (await page.locator('body').innerText()).toLowerCase();

    if (!paymentError.includes('please select a payment method first')) {
        throw new Error('❌ Payment method selection failed: No payment method selected');
    } else {
        console.log('✅ Payment method selection works as expected');
    }

    // Select credit card payment method
    console.log('💳 Selecting credit card payment method');
    await page.locator('#payment-method').click();

    await page.getByAltText('mastercard_visa').click();
    await page.getByAltText('credit_card').click();
    console.log('✅ Credit card payment method selected');

    // Test Credit Card Form Validation
    console.log('💳 Testing Credit Card Form Validation');
    console.log('⚠️ Clicking OK with empty Account holder name should show error');

    
    // Click OK button 
    await page.getByText('OK').click();

    // Check for the account holder name error
    const accountnameError = (await page.locator('body').innerText()).toLowerCase(); 
    if (!accountnameError.includes('card number is required')) {
        throw new Error('❌ Expected error message "Card Number is required" not found');
    } else {
        console.log('✅ Error message for card number appeared');
    }
    const accountnameError = await page.locator('body').textContent();

    if (accountnameError.includes('Account Holder Name is required')) {
    console.log('✅ Error message for account holder name appeared as expected');
    } else {
    const bodyTextLower = accountnameError.toLowerCase();
    if (bodyTextLower.includes('account holder name is required')) {
        console.log('✅ Error message for account holder name appeared (lowercase match)');
    } else {
        console.log(`Current page text: ${accountnameError}`);
        throw new Error('❌ Expected error message "Account Holder Name is required" not found.');
    }
    }

    

    // Fill Account Name Holder
    console.log('🪪 Entering Account Name Holder');
    await page.locator('input#account-holder-s-full-name').fill(process.env.INDIVIDUAL_USER_NAME);
    console.log('✅ Account name field filled successfully');

    await page.getByText('OK').click();

    // Check for the card number error
    const cardnumError = (await page.locator('body').innerText()).toLowerCase(); 
    if (!cardnumError.includes('card number is required')) {
        throw new Error('❌ Expected error message "Card Number is required" not found');
    } else {
        console.log('✅ Error message for card number appeared');
    }

    // Fill Card number
    console.log('🔢 Entering Card Number');
    await page.locator('input#card-number').fill(process.env.INDIVIDUAL_CARD_NUMBER);
    console.log('✅ Card Number field filled successfully');

    await page.getByText('OK').click();

    // Check for the card expiration date error
    const cardexpError = await page.locator('body').textContent();

    if (cardexpError.includes('Expiration Date (MM/YY) is required')) {
    console.log('✅ Error message for expiration date appeared as expected');
    } else {
    const bodyTextLower = cardexpError.toLowerCase();
    if (bodyTextLower.includes('expiration date (mm/yy) is required')) {
        console.log('✅ Error message for expiration date appeared (lowercase match)');
    } else {
        console.log(`Current page text: ${cardexpError}`);
        throw new Error('❌ Expected error message "Expiration Date (MM/YY) is required" not found.');
    }
    }

    // Fill Expiration Date
    console.log('🔢 Entering Card Expiration Date');
    await page.locator('input#expiration-date-mm-yy').fill(process.env.INDIVIDUAL_CARD_EXP);
    console.log('✅ Card expiration field filled successfully');

    await page.getByText('OK').click();

    // Check for the card ccv error
    const ccvError = await page.locator('body').textContent();

    if (ccvError.includes('CCV or CVC (back of the card) is required')) {
    console.log('✅ Error message for ccv appeared as expected');
    } else {
    const bodyTextLower =  ccvError.toLowerCase();
    if (bodyTextLower.includes('ccv or cvc (back of the card) is required')) {
        console.log('✅ Error message for ccv appeared (lowercase match)');
    } else {
        console.log(`Current page text: ${ccvError}`);
        throw new Error('❌ Expected error message "CCV or CVC (back of the card) is required" not found.');
    }
    }

    // Fill CCV
    console.log('🔢 Entering Card CCV');
    await page.locator('input#ccv-or-cvc-back-of-the-card').fill(process.env.INDIVIDUAL_CARD_CVV);
    console.log('✅ Card ccv field filled successfully');

    await page.getByText('OK').click();

    //checking email message error
    const emailError = (await page.locator('body').innerText()).toLowerCase();
    if (!emailError.includes('payer/sender email is required')) {
        throw new Error('❌ Email error message not displayed');
    } else {
        console.log('✅ Email error message displayed as expected');
    }
    
    //filling in email
    console.log('📧 Filling in sender email');
    await page.locator('#your-email').fill(process.env.INDIVIDUAL_USER_EMAIL);
    console.log('✅ Sender email filled successfully');

    await page.getByText('OK').click();

    //checking mobile message error
    const mobileError = (await page.locator('body').innerText()).toLowerCase(); 
    if (!mobileError.includes('payer/sender mobile number is required')) {
        throw new Error('❌ Mobile number error message not displayed');
    } else {
        console.log('✅ Mobile number error message displayed as expected');
    }
    
    //filling in mobile number
    console.log('📱 Filling in sender mobile number');
    await page.locator('#your-mobile-number').fill(process.env.INDIVIDUAL_USER_MOBILE);
    console.log('✅ Sender mobile number filled successfully');

    await page.getByText('OK').click();


});