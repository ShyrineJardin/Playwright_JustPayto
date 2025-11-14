import {test, expect} from '@playwright/test';
import path from 'path';
import { checkEmail, checkMerchantEmail } from '../../../helpers/gmail-helper.js';

test('🏦 Credit card payment for business user', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

    console.log('💻 Complete Credit Card Payment Flow for business');
    console.log(`🔗 URL: ${process.env.BUSINESS_PAYMENT_URL}`);

    await page.goto(process.env.BUSINESS_PAYMENT_URL);
    await expect(page).toHaveURL(/justpay\.to/);
       
    // Check if the page actually loaded with content
    const payNowButton = page.locator('button:has-text("I want to pay")');
    const isButtonVisible = await payNowButton.isVisible({timeout: 30000}).catch(() => false);
    
    if (!isButtonVisible) {
        console.error('❌ FAILED: Payment page did not load properly - may be down or loading slowly');
        throw new Error('Page failed to load - The page may be down or loading slowly');
    } else {
        console.log('✅ Payment page loaded successfully');
    }

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
    const testMessage = 'CreditCardBusinessTest12345';

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
    if (!accountnameError.includes('account holder name is required')) {
        throw new Error('❌ Expected error message "Account Holder Name is required" not found.');
    } else {
        console.log('✅ Error message for account holder name appeared');
    }

    
    // Fill Account Name Holder
    console.log('🪪 Entering Account Name Holder');
    await page.locator('input#account-holder-s-full-name').fill(process.env.INDIVIDUAL_USER_NAME);
    console.log('✅ Account name field filled successfully');

    // await page.getByText('OK').click();

    // // Check for the card number error
    // const cardnumError = (await page.locator('body').innerText()).toLowerCase(); 
    // if (!cardnumError.includes('card number is required')) {
    //     throw new Error('❌ Expected error message "Card Number is required" not found');
    // } else {
    //     console.log('✅ Error message for card number appeared');
    // }

    // Fill Card number
    console.log('🔢 Entering Card Number');
    await page.locator('input#card-number').fill(process.env.INDIVIDUAL_CARD_NUMBER);
    console.log('✅ Card Number field filled successfully');

    // await page.getByText('OK').click();

    // // Check for the card expiration date error
    // const cardexpError = (await page.locator('body').innerText()).toLowerCase();
    // if (!cardexpError.includes('expiration date (mm/yy) is required')) {
    //     throw new Error('❌ Expected error message "Expiration Date (MM/YY) is required" not found.');
    // } else {
    //     console.log('✅ Error message for expiration date appeared');
    // }

    // Fill Expiration Date
    console.log('🔢 Entering Card Expiration Date');
    await page.locator('input#expiration-date-mm-yy').fill(process.env.INDIVIDUAL_CARD_EXP);
    console.log('✅ Card expiration field filled successfully');

    // await page.getByText('OK').click();

    // // Check for the card ccv error
    // const ccvErrorr = (await page.locator('body').innerText()).toLowerCase();
    // if (!ccvError.includes('ccv or cvc (back of the card) is required')) {
    //     throw new Error('❌ Expected error message "CCV or CVC (back of the card) is required" not found.');
    // } else {
    //     console.log('✅ Error message for ccv appeared');
    // }

    // Fill CCV
    console.log('🔢 Entering Card CCV');
    await page.locator('input#ccv-or-cvc-back-of-the-card').fill(process.env.INDIVIDUAL_CARD_CVV);
    console.log('✅ Card ccv field filled successfully');

    // await page.getByText('OK').click();

    // //checking email message error
    // const emailError = (await page.locator('body').innerText()).toLowerCase();
    // if (!emailError.includes('payer/sender email is required')) {
    //     throw new Error('❌ Email error message not displayed');
    // } else {
    //     console.log('✅ Email error message displayed as expected');
    // }
    
    //filling in email
    console.log('📧 Filling in sender email');
    await page.locator('#your-email').fill(process.env.INDIVIDUAL_USER_EMAIL);
    console.log('✅ Sender email filled successfully');

    // await page.getByText('OK').click();

    // //checking mobile message error
    // const mobileError = (await page.locator('body').innerText()).toLowerCase(); 
    // if (!mobileError.includes('payer/sender mobile number is required')) {
    //     throw new Error('❌ Mobile number error message not displayed');
    // } else {
    //     console.log('✅ Mobile number error message displayed as expected');
    // }
    
    //filling in mobile number
    console.log('📱 Filling in sender mobile number');
    await page.locator('#your-mobile-number').fill(process.env.INDIVIDUAL_USER_MOBILE);
    console.log('✅ Sender mobile number filled successfully');

    await page.getByText('OK').click();

    // Check if address fields are required (for non-Philippine cards)
    console.log('🌍 Checking if international card address fields are required');

    const streetLine1Input = page.locator('input#your-card-street-line-1');
    const isStreetLine1Visible = await streetLine1Input.isVisible().catch(() => false);
    if (isStreetLine1Visible) {
        console.log('🌎 International card detected - Address fields are required');
        
        //checking mobile message error
        const streetline1Error = (await page.locator('body').innerText()).toLowerCase(); 
        if (!streetline1Error.includes('card street line 1 is required')) {
            throw new Error('❌  Expected error message "Card Street Line 1 is required" not found.');
        } else {
            console.log('✅ Error message for street line 1 appeared');
        }

        // Fill street line 1
        console.log('📧 Entering Card Street Line 1');
        await page.locator('input#your-card-street-line-1').fill(process.env.INDIVIDUAL_CARD_STREETLINE_1);
        console.log('✅  Card Street Line 1 filled successfully');

        await page.getByText('OK').click();

        // Check for street line 2 error
        const streetline2Error = (await page.locator('body').innerText()).toLowerCase(); 
        if (!streetline2Error.includes('card street line 2 is required')) {
            throw new Error('❌ Expected error message "Card Street Line 2 is required" not found.');
        } else {
            console.log('✅ Error message for street line 2 appeared');
        }

        // Fill street line 2
        console.log('📧 Entering Card Street Line 2');
        await page.locator('input#your-card-street-line-2').fill(process.env.INDIVIDUAL_CARD_STREETLINE_2);
        console.log('✅ Card Street Line 2 filled successfully');

        await page.getByText('OK').click();

        // Check for province state error
        const provinceError = (await page.locator('body').innerText()).toLowerCase(); 
        if (!provinceError.includes('card province state is required')) {
            throw new Error('❌ Expected error message "Card Province State is required" not found.');
        } else {
            console.log('✅ Error message for province state appeared');
        }

        // Fill province state
        console.log('📧 Entering Card Province State');
        await page.locator('input#your-card-province-state').fill(process.env.INDIVIDUAL_CARD_PROVINCE);
        console.log('✅ Card Province State filled successfully');

        await page.getByText('OK').click();

        // Check for postal code error
        const postalError = (await page.locator('body').innerText()).toLowerCase(); 
        if (!postalError.includes('card postal code is required')) {
            throw new Error('❌ Expected error message "Card Postal Code is required" not found.');
        } else {
            console.log('✅ Error message for postal code appeared');
        }

        // Fill postal code
        console.log('📧 Entering Card Postal Code');
        await page.locator('input#your-card-postal-code').fill(process.env.INDIVIDUAL_CARD_POSTAL);
        console.log('✅ Card Postal Code filled successfully');

        await page.getByText('OK').click();

    } else {
        console.log('🇵🇭 Philippine card detected - Address fields not required, skipping');
    }

    console.log('✅ Credit card form submitted successfully');

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

    // choosing regular payment
    console.log('⏳ Choosing regular payment option');
    await page.locator('button:has-text("OK")').click();
    console.log('✅ Regular payment option selected');


});