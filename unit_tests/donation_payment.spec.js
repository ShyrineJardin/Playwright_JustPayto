import {test, expect} from '@playwright/test';

test.setTimeout(120000);

// check if payment page loads correctly FIRST TEST/CHECK
test.beforeAll(async ({browser}) => {
    const paymentURL = process.env.DONATION_PAYMENT_URL;

    if (!paymentURL) {
        throw new Error('❌ DONATION_PAYMENT_URL is not defined in environment variables');
    }

    console.log('🔎 Checking if payment page is accessible...');
    console.log('🔗 Navigating to:', paymentURL);

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('🌐 Attempting to load the page ...');

        try{
            await page.goto(paymentURL, { waitUntil: 'domcontentloaded', timeout: 90000 });
        } catch (error) {
            console.error('❌ Failed to load the page within 90 seconds')
            throw new Error(`Site is stuck loading or took too long to respond: ${error.message}`);
        }

        console.log('🔃 Waiting for page to finish loading...');

        // Wait for either spinner to appear OR payment content to show
        const loadSpinner = page.locator('img[src*="processing.gif"]');
        
        // Wait a moment for the spinner to potentially appear
        await page.waitForTimeout(2000);
        
        const isLoading = await loadSpinner.isVisible().catch(() => false);

        if (isLoading){
            console.log('⏳ Page is still loading, waiting for spinner to disappear...');

            try{
                await loadSpinner.waitFor({state: 'hidden', timeout: 60000});
                console.log('✅ Loading spinner disappeared.');
            } catch (error) {
                console.error('❌ Loading spinner did not disappear within 60 seconds');
                throw new Error(`Page is stuck loading: ${error.message}`);
            }
        } else{
            console.log('⚠️ No loading spinner detected, verifying content loaded...');
        }

        // check if URL indicates "not found" or redirect to onboarding
        console.log ('🔍 Verifying if payment link is valid...');

        const currentURL = page.url();
        const urlObj = new URL(currentURL);
        const status = urlObj.searchParams.get('status') || '';
        const pathLower = urlObj.pathname.toLowerCase();
        const hostLower = urlObj.hostname.toLowerCase();

        const hasNotFoundStatus = status.toLowerCase().includes('not_found') || status.toLowerCase().includes('not-found');
        const hasNotFoundPath = pathLower.includes('not_found') || pathLower.includes('not-found') || pathLower.includes('onboarding');
        const isOnboardingRedirect = hostLower.includes('onboarding') && pathLower.includes('early-access');

        if (hasNotFoundStatus || hasNotFoundPath || isOnboardingRedirect) {
            console.error('❌ Payment link appears to be invalid or redirected to onboarding.');
            console.log(`Current URL: ${currentURL}`);
            console.log(`Original Payment URL: ${paymentURL}`);

            if(isOnboardingRedirect){
                throw new Error('Payment link redirected to onboarding page. Please ensure the payment link is correct and the merchant has set up their account.');
            } else{
                throw new Error('Payment link is invalid or not found. Please verify the payment link.');
            }    
        }

        console.log('🔍 Verifying if button is visible...');
        
        const sendMoneyButton = page.getByRole('button', { name: /donate now/i });
        
        try {
            await sendMoneyButton.waitFor({ state: 'visible', timeout: 30000 });
            console.log('✅ Button is visible - payment page loaded successfully!');
        } catch (error) {
            console.error('❌ Button did not appear within 30 seconds');
            console.log('📄 Current page content:');
            const bodyText = await page.locator('body').innerText();
            console.log(bodyText.substring(0, 500));
            throw new Error('Payment page is stuck loading - Button never appeared');
        }

        console.log('✅ Payment link is valid and accessible');
        console.log(`✅ Current page: ${currentURL}`);
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎯 Proceeding to run test suites...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');

    } catch (error) {
        console.error('');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ SITE ACCESSIBILITY CHECK FAILED');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error(`Error: ${error.message}`);
        console.error('');
        console.error('⚠️  All tests will be skipped because the site is not accessible');
        console.error('');
        throw error;
    } finally {
        await context.close();
    }
});