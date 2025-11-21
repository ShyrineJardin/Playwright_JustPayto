import {test, expect} from '@playwright/test';
import { checkEmail, checkMerchantEmail } from '../../helpers/gmail-helper.js';


// Biller configuration - defines what fields each biller needs
const BILLER_CONFIGS = {
     'cignal': {
        category: 'Cable/Internet',
        name: 'Cignal',
        fields: {
            accountNumber: '9006567444',
            amount: '1500',
            lastName: 'Santos',
            firstName: 'Maria',
            middleInitial: 'D'
        },
        selectors: {
            accountNumber: 'input[name="referenceNumber"]',  
            amount: 'input#amount[name="amount"]',
            lastName: 'input[name="LastName"]',
            firstName: 'input[name="FirstName"]',
            middleInitial: 'input[name="MI"]'
        },
        // radio button selector if needed
        radioButton: {
            name: 'ExternalEntityName',
            value: 'BAYAD'
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
    'bankard': {
        category: 'Credit Cards',
        name: 'Bankard',
        fields: {
            accountNumber: '4573580400000020',
            amount: '800',
            accountName: 'Maria Santos',
            billDate: '11202025'
        },
        selectors: {
            accountNumber: 'input[name="referenceNumber"]',
            amount: 'input#amount[name="amount"]',
            accountName: 'input#account-name[name="AccountName"]',
            billDate: 'input#bill-date-mm-dd-yyyy[name="BillDate"]'
        }
    },
    'avon': {
        category: 'Distribution',
        name: 'Avon',
        fields: {
            accountNumber: '8888888888888',
            amount: '800',
            accountName: 'Maria Santos',
            branch: 'San Antonio'
        },
        selectors: {
            accountNumber: 'input[name="referenceNumber"]',
            amount: 'input#amount[name="amount"]',
            accountName: 'input#name[name="Name"]',
            branch: 'input#branch[name="Branch"]'
        }
    },
    'meralco': {
        category: 'Electricity',
        name: 'Meralco',
        fields: {
            accountNumber: '0116417010',
            amount: '2000'
        },
        selectors: {
            accountNumber: 'input[name="referenceNumber"]',  
            amount: 'input#amount[name="amount"]'
        }
    }
    
};


const BILLERS_TO_TEST = ['meralco']; // Only test these

// Filter the configs based on selection
const activeBillers = Object.entries(BILLER_CONFIGS)
    .filter(([id]) => BILLERS_TO_TEST.includes(id));

// Helper function to fill biller-specific fields
async function fillBillerFields(page, billerConfig) {
    console.log(`📝 Filling fields for ${billerConfig.name}`);
    
    await page.waitForTimeout(1500);
    
    // Handle radio button selection if configured
    if (billerConfig.radioButton) {
        console.log(`  📻 Selecting radio button: ${billerConfig.radioButton.value}`);
        try {
            const radioSelector = `input[name="${billerConfig.radioButton.name}"][value="${billerConfig.radioButton.value}"]`;
            await page.locator(radioSelector).check();
            console.log(`  ✅ Radio button selected successfully`);
            await page.waitForTimeout(300);
        } catch (error) {
            console.error(`  ⚠️ Failed to select radio button:`, error.message);
        }
    }
    
    // Fill text fields
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

    console.log('💻 Complete ewallet payment flow for bayadcenter');
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
    await page.getByText(new RegExp(billerConfig.name, 'i')).first().click();
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

    console.log('💳 Selecting eWallet payment method');
    await page.locator('#payment-method').click();

    await page.getByAltText('e_wallet').click();

    console.log('Selecting Philippines as online bank transfer country');
    await page.getByAltText('PH').click();
    console.log('✅ Philippines selected as online bank transfer country');

    console.log('Selecting Gcash for eWallet option');
    await page.getByAltText('gcash').locator('..').first().click();
    console.log('✅ Gcash method selected');

    // Verify the amount matches
    console.log('💰 Verifying amount to pay matches the declared amount');
    await page.waitForTimeout(1000); // Wait for payment confirmation page to load

    const amountInput = page.locator('input#amount-to-pay[name="amount"]');
    await amountInput.waitFor({ state: 'visible', timeout: 10000 });

    const displayedAmount = await amountInput.inputValue();
    const expectedAmount = billerConfig.fields.amount;

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

}