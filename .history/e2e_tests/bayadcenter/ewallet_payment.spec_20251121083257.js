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
    await page.getByText('Philippines', { exact: true }).click();
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

    // Payment summary verification
    console.log('💬 Verifying payment summary page');

    await page.getByText('Payment Summary').waitFor({ state: 'visible', timeout: 15000});

    console.log('✅ Payment summary page loaded successfully');

    // Verify Biller Information
    console.log('🏢 Verifying Biller Information from Summary Table');

    console.log('🔍 Checking Selected Biller...');
    const billerRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Selected Biller' });
    const billerName = await billerRow.locator('td').nth(1).innerText();
    console.log(`✅ Selected Biller verified: ${billerName}`);
    expect(billerName).toBeTruthy(); // Just verify it exists and has a value

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
    expect(paymentDescText).toContain(billerName); // Should contain the biller name
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
    expect(paymentMethod).toContain('GCash');

    // IP Address
    console.log('🌐 Verifying IP Address Information');
    const ipText = await page.locator('.MuiTypography-h6', { hasText: 'your current IP address' }).locator('span').innerText();
    const cleanedIP = ipText.replace(/[()]/g, '').trim();
    console.log(`✅ IP Address logged: ${cleanedIP}`);
    expect(cleanedIP).toMatch(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);

    console.log('🎉 All Payment Summary validations passed successfully');
    console.log('✅ Payment Summary Validation Complete');

    // Click confirm button
    const confirmButton = page.locator('button', { hasText: 'Confirm' }).first();
    await confirmButton.click();
    console.log('✅ Confirm button clicked - Processing payment');

    console.log('🔃 Processing Transaction')

    console.log('Checkin/Agreeing Authentication Checkbox');
    await page.locator('input[name="acknowledge"]').check();


    console.log('👆 Clicking Continue button')

    await page.waitForTimeout(1000);

    const continueButton = page.locator('button:has-text("Continue"):not([disabled])').first();
    await continueButton.waitFor({ state: 'visible', timeout: 10000 });

    console.log('✅ Continue button is enabled, clicking to open bank popup');

    const [popup] = await Promise.all([
        context.waitForEvent('page'), // Wait for popup to open
        continueButton.click() // Click Continue
    ]);

    console.log('✅ eWallet test popup opened');
    await popup.waitForLoadState('domcontentloaded');
    console.log(`🏦 eWallet mock page URL: ${popup.url()}`);

    // Verify we're on the bank mock page
    await expect(popup).toHaveURL(/ewallet-mock-connector\.xendit\.co/);

    console.log('💬 Click Proceed to Pay button in mock page');

    await popup.locator('button#proceed-button').click();

    await page.waitForTimeout(15000); // wait for 15 seconds for processing

    console.log('🔎 Checking Transaction Status')
    await page.waitForTimeout(2000);
    const successMessage = await page.locator('body').innerText();

    if (!successMessage.toLowerCase().includes('transaction successful')) {
        throw new Error('❌ Payment not successful - Success message not found');
    } else {
        console.log('✅ Payment completed successfully - Success message verified');
    }

    const testTriggerTime1 = Date.now();
    const searchTime1 = new Date(testTriggerTime1 - 30 * 1000);
    
    await page.locator('button', { hasText: 'Ok' }).click();

    //email verification for user
    console.log('📧 Verifying payment confirmation email for individual user');

    console.log('📬 Waiting for confirmation email for payer...');

    await page.waitForTimeout(2000); // short delay before checking

    const payerEmail = await checkEmail({
    from: 'hello@justpay.to',
    to: process.env.INDIVIDUAL_USER_EMAIL,
    subject: 'Successful payment of',
    wait_time_sec: 30,
    max_wait_time_sec: 180,
    after: searchTime1.toISOString(),
    });

    if (!payerEmail) {
    throw new Error(`❌ No confirmation email received for payer: ${process.env.INDIVIDUAL_USER_EMAIL}`);
    }

    console.log('✅ Payer confirmation email received.');
    console.log(`📧 To: ${process.env.INDIVIDUAL_USER_EMAIL}`);
    console.log(`🕒 Received at: ${payerEmail.date || 'unknown'}`);

    console.log(`✅ Test completed for ${billerConfig.name}`);
    }

    // Generate tests for selected billers
    for (const [billerId, billerConfig] of activeBillers) {
        test(`💳 Bank Transfer Payment for BayadCenter - ${billerConfig.name}`, async({page, context}) => {
            test.setTimeout(120000);
            await runBayadCenterTest(page, billerConfig, context);
    });

}