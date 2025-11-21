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
            accountNumber: '9876543210',
            amount: '800'
        },
        selectors: {
            accountNumber: 'input[name="accountNumber"]',
            amount: 'input[name="amount"]'
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


// Uncomment ONE of these options:

// Option A: Test specific billers only
const BILLERS_TO_TEST = ['cignal', 'maynilad']; // Only test these

// Option B: Test all billers
// const BILLERS_TO_TEST = Object.keys(BILLER_CONFIGS); // Test all

/ ============================================
// Filter the configs based on selection
const activeBillers = Object.entries(BILLER_CONFIGS)
    .filter(([id]) => BILLERS_TO_TEST.includes(id));

// Helper function to fill biller-specific fields
async function fillBillerFields(page, billerConfig) {
    console.log(`📝 Filling fields for ${billerConfig.name}`);
    
    for (const [fieldName, fieldValue] of Object.entries(billerConfig.fields)) {
        const selector = billerConfig.selectors[fieldName];
        if (selector && fieldValue) {
            console.log(`  ➡️ ${fieldName}: ${fieldValue}`);
            await page.locator(selector).fill(fieldValue);
        }
    }
    
    console.log('✅ All required fields filled');
}
test('💳 Creditcard Payment for BayadCenter', async({page, context, baseURL, browserName, playwright})=> {
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

    //choose biller -
    console.log('🏪 Choosing biller');
    await page.locator('input#choose-a-bill-to-pay').click();
        

})