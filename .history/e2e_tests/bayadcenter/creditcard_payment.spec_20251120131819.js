import {test, expect} from '@playwright/test';
import path from 'path';
// import { checkEmail, checkMerchantEmail } from '../../../helpers/gmail-helper.js';


// Biller configuration - defines what fields each biller needs
const BILLER_CONFIGS = {
    'cignal': {
        category: 'TV/Telecom',
        name: 'Cignal',
        fields: {
            accountNumber: '1234567890',
            accountName: 'Juan Dela Cruz',
            amount: '1500'
        },
        selectors: {
            accountNumber: 'input[name="accountNumber"]',
            accountName: 'input[name="accountName"]',
            amount: 'input[name="amount"]'
        }
    },
    'maynilad': {
        category: 'Water',
        name: 'Maynilad',
        fields: {
            accountNumber: '53039157',
            amount: '800'
        },
        selectors: {
            accountNumber: 'input[name="referenceNumber"]',
            amount: 'input#amount[name="amount"]'
        }
    },
    'meralco': {
        category: 'Electricity',
        name: 'Meralco',
        fields: {
            accountNumber: '1122334455',
            accountName: 'Maria Santos',
            amount: '2000'
        },
        selectors: {
            accountNumber: 'input[name="accountNumber"]',
            accountName: 'input[name="accountName"]',
            amount: 'input[name="amount"]'
        }
    },
    'pldt': {
        category: 'TV/Telecom',
        name: 'PLDT',
        fields: {
            accountNumber: '0212345678',
            accountName: 'Pedro Santos',
            amount: '1200'
        },
        selectors: {
            accountNumber: 'input[name="accountNumber"]',
            accountName: 'input[name="accountName"]',
            amount: 'input[name="amount"]'
        }
    }
};


const BILLERS_TO_TEST = ['maynilad']; // Only test these

// Filter the configs based on selection
const activeBillers = Object.entries(BILLER_CONFIGS)
    .filter(([id]) => BILLERS_TO_TEST.includes(id));

// Helper function to fill biller-specific fields
async function fillBillerFields(page, billerConfig) {
    console.log(`📝 Filling fields for ${billerConfig.name}`);
    
    await page.waitForTimeout(1500);
    
    for (const [fieldName, fieldValue] of Object.entries(billerConfig.fields)) {
        const selector = billerConfig.selectors[fieldName];
        if (selector && fieldValue) {
            console.log(`  ➡️ Attempting to fill ${fieldName}: ${fieldValue}`);
            
            try {
                // Wait for the field to be visible before filling
                await page.locator(selector).waitFor({ state: 'visible', timeout: 10000 });
                
                await page.locator(selector).clear();
                
                // Fill the field
                await page.locator(selector).fill(fieldValue);
                
                const filledValue = await page.locator(selector).inputValue();
                if (filledValue === fieldValue) {
                    console.log(`  ✅ ${fieldName} filled successfully`);
                } else {
                    console.log(`  ⚠️ ${fieldName} value mismatch: expected "${fieldValue}", got "${filledValue}"`);
                }
                
                await page.waitForTimeout(300);
                
            } catch (error) {
                console.error(`  ❌ Failed to fill ${fieldName}:`, error.message);
                // Log available fields for debugging
                const availableInputs = await page.locator('input').count();
                console.log(`  📊 Available input fields on page: ${availableInputs}`);
                throw error;
            }
        }
    }
    
    console.log('✅ All required fields filled');
}

async function runBayadCenterTest(page, billerConfig, context) {
    test.setTimeout(120000);

    console.log('💻 Complete creditcard payment flow for bayadcenter');
    console.log(`🔗 URL: ${process.env.BAYADCENTER_PAYMENT_URL}`);

    try {
        // Increase timeout to 90 seconds for slow network/GUI conditions
        await page.goto(process.env.BAYADCENTER_PAYMENT_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    } catch (error) {
        console.error('❌ page.goto timeout:', error.message);
        console.log('⏳ Waiting for page content to appear anyway...');
    }

    // Check if the page actually loaded with content - use longer timeout for GUI
    console.log('⏳ Waiting for Pay Now button to be visible...');
    const payNowButton = page.locator('button:has-text("Pay Now")');
    const isButtonVisible = await payNowButton.waitFor({state: 'visible', timeout: 60000}).then(() => true).catch(() => false);
    
    if (!isButtonVisible) {
        console.error('❌ FAILED: BayadCenter Payment page did not load properly - may be down or loading slowly');
        console.log('📄 Current page content:');
        console.log((await page.locator('body').innerText()).substring(0, 500));
        throw new Error('BayadCenter page failed to load - The page may be down or loading slowly');
    } else {
        console.log('✅ BayadCenter Payment page loaded successfully');
    }

    await expect(page).toHaveURL(/justpay\.to/);

    console.log('💸 Click "Pay Now" button')
    await page.locator('button:has-text("Pay Now")').click();
    console.log('✅ "Pay Now" button clicked');

    console.log('💬 Verifying Biller validation');
    console.log('👉 Blank biller field should show an error');
    await page.getByRole('button', {name: 'Pay Now'}).click();

    const billerError = (await page.locator('body').innerText()).toLowerCase();

    if (!billerError.includes('biller is required')) {
        throw new Error('❌ Biller field validation failed: No error for blank message field');
    } else {
        console.log('✅ Biller field validation works as expected');
    }
    
    // Choose biller
    console.log(`🏪 Selecting biller: ${billerConfig.category} -> ${billerConfig.name}`);
    await page.locator('input#choose-a-bill-to-pay').click();
    
    // Select category (adjust selectors based on actual UI)
    await page.locator(`text="${billerConfig.category}"`).click();
    console.log(`✅ Category "${billerConfig.category}" selected`);
    
    // Select specific biller
    await page.getByText(new RegExp(billerConfig.name, 'i')).click();
    console.log(`✅ Biller "${billerConfig.name}" selected`);
    
    // Fill biller-specific fields
    await fillBillerFields(page, billerConfig);

    await page.locator('button:has-text("OK")').click();

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
    // await page.getByText('OK').click();

    // // Check for the account holder name error
    // const accountnameError = (await page.locator('body').innerText()).toLowerCase(); 
    // if (!accountnameError.includes('account holder name is required')) {
    //     throw new Error('❌ Expected error message "Account Holder Name is required" not found.');
    // } else {
    //     console.log('✅ Error message for account holder name appeared');
    // }

    
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

        // Verify the amount matches
    console.log('💰 Verifying amount to pay matches the declared amount');
    await page.waitForTimeout(1000); // Wait for payment confirmation page to load
    
    const amountInput = page.locator('input#amount-to-pay[name="amount"]');
    await amountInput.waitFor({ state: 'visible', timeout: 10000 });
    
    const displayedAmount = await amountInput.inputValue();
    const expectedAmount = billerConfig.fields.amount;
    
    // Convert both to numbers for comparison (handles "800" vs "800.00")
    const displayedNum = parseFloat(displayedAmount);
    const expectedNum = parseFloat(expectedAmount);
    
    console.log(`  Expected amount: ${expectedAmount}`);
    console.log(`  Displayed amount: ${displayedAmount}`);
    
    if (displayedNum === expectedNum) {
        console.log('✅ Amount matches successfully');
    } else {
        throw new Error(`❌ Amount mismatch: Expected ${expectedAmount} but got ${displayedAmount}`);
    }

    console.log('💵 Clicking Send Money without accepting T&C - should error');

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

    


    // Add remaining payment flow steps here
    console.log(`✅ Test completed for ${billerConfig.name}`);
    }

    // Generate tests for selected billers
    for (const [billerId, billerConfig] of activeBillers) {
        test(`💳 Creditcard Payment for BayadCenter - ${billerConfig.name}`, async({page, context}) => {
            test.setTimeout(120000);
            await runBayadCenterTest(page, billerConfig, context);
    });
}