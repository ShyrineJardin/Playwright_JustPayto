import {test, expect} from '@playwright/test';
// import { checkEmail, checkMerchantEmail } from '../../helpers/gmail-helper.js';


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

    console.log('💻 Complete bank transfer payment flow for bayadcenter');
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

    // Click OK button 
    await page.getByText('OK').click();

        console.log(`✅ Test completed for ${billerConfig.name}`);
        }
    
        // Generate tests for selected billers
        for (const [billerId, billerConfig] of activeBillers) {
            test(`💳 Creditcard Payment for BayadCenter - ${billerConfig.name}`, async({page, context}) => {
                test.setTimeout(120000);
                await runBayadCenterTest(page, billerConfig, context);
        });

}