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
    if (!accountnameError.includes('account holder name is required')) {
        throw new Error('❌ Expected error message "Account Holder Name is required" not found.');
    } else {
        console.log('✅ Error message for account holder name appeared');
    }

    
    // Fill Account Name Holder
    console.log('🪪 Entering Account Name Holder');
    await page.locator('input#account-holder-s-full-name').fill(process.env.INDIVIDUAL_USER_NAME);
    console.log('✅ Account name field filled successfully');

<form class="jss82"><h5 class="MuiTypography-root MuiTypography-h5">Credit Card Information</h5><p class="MuiTypography-root MuiTypography-body1">Make sure your browser displays <span>JustPayto, Inc.</span> Be careful with your card details when using a publicly available computer, or using public WIFI.</p><div class="MuiGrid-root jss86 MuiGrid-container MuiGrid-spacing-xs-2"><div class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12"><div class="MuiFormControl-root MuiTextField-root jss38"><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-formControl MuiInputBase-adornedStart MuiOutlinedInput-adornedStart" data-icon-width="25" style="--data-icon-width: 25px;"><div class="MuiInputAdornment-root MuiInputAdornment-positionStart"><div class="MuiAvatar-root MuiAvatar-square"><img src="https://dmi8a13jca4n8.cloudfront.net/p2p-assets/img/payment/name.svg" class="MuiAvatar-img"></div></div><input aria-invalid="false" autocomplete="new-password" id="account-holder-s-full-name" name="accountHolderName" placeholder="Account Holder's Full Name" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedStart MuiOutlinedInput-inputAdornedStart" value="" fdprocessedid="w77nce"><fieldset aria-hidden="true" class="jss54 MuiOutlinedInput-notchedOutline" style="padding-left: 8px;"><legend class="jss55" style="width: 0.01px;"><span>​</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12"><h6 class="MuiTypography-root jss83 MuiTypography-subtitle2" id="cardNumber--mask"></h6><div class="MuiFormControl-root MuiTextField-root jss38" inputmode="decimal"><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-formControl MuiInputBase-adornedStart MuiOutlinedInput-adornedStart" data-icon-width="25" style="--data-icon-width: 25px;"><div class="MuiInputAdornment-root MuiInputAdornment-positionStart"><div class="MuiAvatar-root MuiAvatar-square"><img src="https://dmi8a13jca4n8.cloudfront.net/p2p-assets/img/payment/card-number.svg" class="MuiAvatar-img"></div></div><input aria-invalid="false" autocomplete="new-password" id="card-number" name="cardNumber" placeholder="Card Number" type="text" inputmode="numeric" maxlength="19" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedStart MuiOutlinedInput-inputAdornedStart" value="" fdprocessedid="pjy78u"><fieldset aria-hidden="true" class="jss54 MuiOutlinedInput-notchedOutline" style="padding-left: 8px;"><legend class="jss55" style="width: 0.01px;"><span>​</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12"><div class="MuiFormControl-root MuiTextField-root jss38" inputmode="decimal"><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-formControl MuiInputBase-adornedStart MuiOutlinedInput-adornedStart" data-icon-width="25" style="--data-icon-width: 25px;"><div class="MuiInputAdornment-root MuiInputAdornment-positionStart"><div class="MuiAvatar-root MuiAvatar-square"><img src="https://dmi8a13jca4n8.cloudfront.net/p2p-assets/img/payment/expiry.svg" class="MuiAvatar-img"></div></div><input aria-invalid="false" autocomplete="new-password" id="expiration-date-mm-yy" name="expDate" placeholder="Expiration Date (MM/YY)" type="text" inputmode="numeric" maxlength="5" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedStart MuiOutlinedInput-inputAdornedStart" value="" fdprocessedid="zev38"><fieldset aria-hidden="true" class="jss54 MuiOutlinedInput-notchedOutline" style="padding-left: 8px;"><legend class="jss55" style="width: 0.01px;"><span>​</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12"><h6 class="MuiTypography-root jss83 MuiTypography-subtitle2" id="ccv2--mask"></h6><div class="MuiFormControl-root MuiTextField-root jss38" inputmode="decimal"><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-formControl MuiInputBase-adornedStart MuiOutlinedInput-adornedStart" data-icon-width="25" style="--data-icon-width: 25px;"><div class="MuiInputAdornment-root MuiInputAdornment-positionStart"><div class="MuiAvatar-root MuiAvatar-square"><img src="https://dmi8a13jca4n8.cloudfront.net/p2p-assets/img/payment/cvc.svg" class="MuiAvatar-img"></div></div><input aria-invalid="false" autocomplete="new-password" id="ccv-or-cvc-back-of-the-card" name="ccv2" placeholder="CCV or CVC (back of the card)" type="text" inputmode="numeric" maxlength="3" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedStart MuiOutlinedInput-inputAdornedStart" value="" fdprocessedid="64up7q"><fieldset aria-hidden="true" class="jss54 MuiOutlinedInput-notchedOutline" style="padding-left: 8px;"><legend class="jss55" style="width: 0.01px;"><span>​</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12"><div class="MuiFormControl-root MuiTextField-root jss38"><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-formControl MuiInputBase-adornedStart MuiOutlinedInput-adornedStart" data-icon-width="25" style="--data-icon-width: 25px;"><div class="MuiInputAdornment-root MuiInputAdornment-positionStart"><svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="envelope" class="svg-inline--fa fa-envelope " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" color="#ccc"><path fill="currentColor" d="M64 112c-8.8 0-16 7.2-16 16v22.1L220.5 291.7c20.7 17 50.4 17 71.1 0L464 150.1V128c0-8.8-7.2-16-16-16H64zM48 212.2V384c0 8.8 7.2 16 16 16H448c8.8 0 16-7.2 16-16V212.2L322 328.8c-38.4 31.5-93.7 31.5-132 0L48 212.2zM0 128C0 92.7 28.7 64 64 64H448c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128z"></path></svg></div><input aria-invalid="false" autocomplete="new-password" id="your-email" name="email" placeholder="Your Email" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedStart MuiOutlinedInput-inputAdornedStart" value="" fdprocessedid="ju5v2"><fieldset aria-hidden="true" class="jss54 MuiOutlinedInput-notchedOutline" style="padding-left: 8px;"><legend class="jss55" style="width: 0.01px;"><span>​</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-4"><div class="MuiFormControl-root MuiTextField-root jss38"><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-formControl MuiInputBase-adornedStart MuiOutlinedInput-adornedStart" data-icon-width="25" data-api-path="https://api-dev.justpayto.ph/frontend/api/v3/enduser/get/country" style="--data-icon-width: 25px;"><div class="MuiInputAdornment-root MuiInputAdornment-positionStart"><div class="MuiAvatar-root MuiAvatar-square"><img src="https://s3-ap-southeast-1.amazonaws.com/s3-staging-justpayto-web-assets/p2p-assets/img/icons/flags/PH.svg" class="MuiAvatar-img"></div></div><div class="MuiInputAdornment-root MuiInputAdornment-positionEnd"><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="caret-down" class="svg-inline--fa fa-caret-down " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" color="#ccc"><path fill="currentColor" d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"></path></svg></div><input aria-invalid="false" autocomplete="new-password" id="country-code" name="mobileNumberCode" placeholder="Country Code" readonly="" type="text" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedStart MuiOutlinedInput-inputAdornedStart" value="" fdprocessedid="cmr8ac"><fieldset aria-hidden="true" class="jss54 MuiOutlinedInput-notchedOutline" style="padding-left: 8px;"><legend class="jss55" style="width: 0.01px;"><span>​</span></legend></fieldset></div></div></div><div class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-8"><div class="MuiFormControl-root MuiTextField-root jss38" inputmode="decimal"><div class="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-formControl MuiInputBase-adornedStart MuiOutlinedInput-adornedStart"><input aria-invalid="false" autocomplete="new-password" id="your-mobile-number" name="mobileNumber" placeholder="Your Mobile Number" type="number" inputmode="numeric" maxlength="15" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedStart MuiOutlinedInput-inputAdornedStart" value="" fdprocessedid="862off"><fieldset aria-hidden="true" class="jss54 MuiOutlinedInput-notchedOutline" style="padding-left: 8px;"><legend class="jss55" style="width: 0.01px;"><span>​</span></legend></fieldset></div></div></div></div><h6 class="MuiTypography-root jss84 jss88 MuiTypography-subtitle2">Card Number is required</h6><button class="MuiButtonBase-root MuiButton-root MuiButton-contained jss87" tabindex="0" type="submit" fdprocessedid="jn1l6"><span class="MuiButton-label">OK</span><span class="MuiTouchRipple-root"></span></button></form>

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