import {test, expect} from '@playwright/test';
import { checkEmail, extractOTP, checkMerchantEmail } from '../../helpers/gmail-helper.js';


test('🏦 Credit Card payment for meralco', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

    console.log('💻 Complete Credit Card Payment Flow');
    console.log(`🔗 URL: ${process.env.MERALCO_PAYMENT_URL}`);
    
    try {
        // Increase timeout to 90 seconds for slow network/GUI conditions
        await page.goto(process.env.MERALCO_PAYMENT_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
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
        throw new Error('❌ Biller field validation failed: No error for blank message field');
    } else {
        console.log('✅ Biller field validation works as expected');
    }

    //click biller
    console.log('👆 Clicking biller information');
    await page.locator('input#biller-information').click();

    // Verify account number field validation
    console.log('💬 Verifying account number field validation');
    console.log('👉 Blank message field should show an error');
    await page.getByText('OK').click();
    await page.waitForTimeout(500); // Allow page to render error message
    const accountnumError = (await page.locator('body').innerText()).toLowerCase();

    if (!accountnumError.includes('account number is required')) {
        throw new Error('❌ Account number field validation failed: No error for blank message field');
    } else {
        console.log('✅ Account number field validation works as expected');
    }

    // fill account number field
    console.log('💵 Filling in account number');
    await page.locator('input#account-number[name=referenceNumber]').fill(process.env.MERALCO_ACCOUNT_NUMBER);
    console.log('✅ Account number filled successfully');

    // Verify amount field validation
    console.log('💬 Verifying amount field validation');
    console.log('👉 Blank message field should show an error');
    await page.getByText('OK').click();
    await page.waitForTimeout(500); // Allow page to render error message
    const amountError = (await page.locator('body').innerText()).toLowerCase();

    if (!amountError.includes('amount is required')) {
        throw new Error('❌ Amount field validation failed: No error for blank message field');
    } else {
        console.log('✅ Amount field validation works as expected');
    }

    // fill amount field
    console.log('💵 Filling in amount');
    await page.locator('input#amount').fill('900');
    console.log('✅ Account number filled successfully');

    await page.getByText('OK').click();

    await page.getByRole('button', {name: 'Pay Now'}).click();

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

     // Verify the amount matches
    console.log('💰 Verifying amount to pay matches the declared amount');
    await page.waitForTimeout(1000); // Wait for payment confirmation page to load

    const amountInput = page.locator('input#amount-to-pay[name="amount"]');
    await amountInput.waitFor({ state: 'visible', timeout: 10000 });

    const displayedAmount = await amountInput.inputValue();
    const expectedAmount = '900'; 

    // Remove commas and parse to float for comparison
    const displayedNum = parseFloat(displayedAmount.replace(/,/g, ''));
    const expectedNum = parseFloat(expectedAmount);

    console.log(`  Expected amount: ${expectedAmount}`);
    console.log(`  Displayed amount: ${displayedAmount}`);

    if (displayedNum === expectedNum) {
        console.log('✅ Amount matches successfully');
    } else {
        throw new Error(`❌ Amount mismatch: Expected ${expectedNum} but got ${displayedNum} (displayed as "${displayedAmount}")`);
    }

    await page.getByRole('button', {name: 'Pay Now'}).click();

    console.log('💵 Clicking Pay Now without accepting T&C - should error');

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

    //payment page contact information for verification
    console.log('💬 Verifying contact information on payment page');

    await page.getByText('OK').click();

    //checking name message error
    const nameError = (await page.locator('body').innerText()).toLowerCase();
    if (!nameError.includes('payer/sender name is required')) {
        throw new Error('❌ Name error message not displayed');
    } else {
        console.log('✅ Name error message displayed as expected');
    }
    console.log('📛 Filling in sender name');
    
    await page.locator('#your-name').fill(process.env.INDIVIDUAL_USER_NAME);
    console.log('✅ Sender name filled successfully');
    
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

    // Payment summary verification
    console.log('💬 Verifying payment summary page');

    await page.getByText('Payment Summary').waitFor({ state: 'visible', timeout: 15000});

    console.log('✅ Payment summary page loaded successfully');

    // Verify Biller Information
    console.log('🏢 Verifying Biller Information from Summary Table');

    console.log('🔢 Checking Account Number...');
    const accountRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Account Number' });
    const accountNumber = await accountRow.locator('td').nth(1).innerText();
    console.log(`✅ Account Number verified: ${accountNumber}`);
    expect(accountNumber).toBeTruthy(); // Verify account number exists

    console.log('💰 Checking Amount Due...');
    const amountDueRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Amount Due' });
    const amountDue = await amountDueRow.locator('td').nth(1).innerText();
    console.log(`✅ Amount Due verified: ${amountDue}`);
    expect(amountDue).toMatch(/₱[\d,]+\.\d{2}/); // Verify it's in currency format

    // Verify Payment Description
    console.log('💸 Verifying Payment Description');
    const paymentDescRow = page.locator('.MuiTable-root tbody tr', { hasText: 'You are sending a payment to' });
    const paymentDescText = await paymentDescRow.locator('td').first().innerText();
    const paymentDescAmount = await paymentDescRow.locator('td').nth(1).innerText();
    console.log(`✅ Payment description: ${paymentDescText}`);
    console.log(`✅ Payment amount: ${paymentDescAmount}`);
    expect(paymentDescAmount).toMatch(/₱[\d,]+\.\d{2}/);

    // Verify Fee Breakdown
    console.log('💳 Verifying Fee Breakdown from Summary Table');

    console.log('💵 Checking Base Payment Amount...');
    const basePaymentRow = page.locator('.MuiTable-root tbody tr', { hasText: 'You are paying' });
    const basePayment = await basePaymentRow.locator('td').nth(1).innerText();
    console.log(`✅ Base Payment Amount: ${basePayment}`);
    expect(basePayment).toMatch(/₱[\d,]+\.\d{2}/);

    // Extract numeric value from base payment for validation
    const basePaymentValue = parseFloat(basePayment.replace(/[₱,]/g, ''));

    console.log('🔧 Checking Processing Fee...');
    const processingFeeRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Processing Fee' });
    const processingFee = await processingFeeRow.locator('td').nth(1).innerText();
    console.log(`✅ Processing Fee: ${processingFee}`);
    expect(processingFee).toMatch(/₱[\d,]+\.\d{2}/);
    const processingFeeValue = parseFloat(processingFee.replace(/[₱,]/g, ''));

    console.log('⚙️ Checking System Fee...');
    const systemFeeRow = page.locator('.MuiTable-root tbody tr', { hasText: 'System Fee' });
    const systemFee = await systemFeeRow.locator('td').nth(1).innerText();
    console.log(`✅ System Fee: ${systemFee}`);
    expect(systemFee).toMatch(/₱[\d,]+\.\d{2}/);
    const systemFeeValue = parseFloat(systemFee.replace(/[₱,]/g, ''));

    console.log('📋 Checking Other Fees (Biller Pass-on)...');
    const otherFeesRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Other Fees (Biller Pass-on)' });
    const otherFees = await otherFeesRow.locator('td').nth(1).innerText();
    console.log(`✅ Other Fees: ${otherFees}`);
    expect(otherFees).toMatch(/₱[\d,]+\.\d{2}/);

    // Verify User Information
    console.log('🔍 Verifying User Information from Summary Table');

    // Name
    console.log('📛 Checking Name...');
    const nameRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Name' });
    const name = await nameRow.locator('td').nth(1).innerText();
    console.log(`✅ Name verified: ${name}`);
    expect(name.toLowerCase()).toContain(process.env.INDIVIDUAL_USER_NAME.toLowerCase());

    // Email
    console.log('📧 Checking Email...');
    const emailRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Email' });
    const email = await emailRow.locator('td').nth(1).innerText();
    console.log(`✅ Email verified: ${email}`);
    expect(email.toLowerCase()).toBe(process.env.INDIVIDUAL_USER_EMAIL.toLowerCase());

    // Mobile
    console.log('📱 Checking Mobile Number...');
    const mobileRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Mobile Number' });
    const mobile = await mobileRow.locator('td').nth(1).innerText();
    console.log(`✅ Mobile verified: ${mobile}`);
    expect(mobile).toContain(process.env.INDIVIDUAL_USER_MOBILE);

    // Payment Method
    console.log('💳 Checking Payment Method...');
    const paymentRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Payment Method' });
    const paymentMethod = await paymentRow.locator('td').nth(1).innerText();
    console.log(`✅ Payment Method verified: ${paymentMethod}`);
    expect(paymentMethod).toContain('Credit Card');

    // IP Address
    console.log('🌐 Verifying IP Address Information');
    const ipText = await page.locator('.MuiTypography-h6', { hasText: 'your current IP address' }).locator('span').innerText();
    const cleanedIP = ipText.replace(/[()]/g, '').trim();
    console.log(`✅ IP Address logged: ${cleanedIP}`);
    expect(cleanedIP).toMatch(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);

    console.log('🎉 All Payment Summary validations passed successfully');
    console.log('✅ Payment Summary Validation Complete');

});