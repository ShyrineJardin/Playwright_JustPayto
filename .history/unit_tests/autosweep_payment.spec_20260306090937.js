import {test, expect} from '@playwright/test';

test.setTimeout(120000);

// check if payment page loads correctly FIRST TEST/CHECK
test.beforeAll(async ({browser}) => {
    const paymentURL = process.env.AUTOSWEEP_PAYMENT_URL;

    if (!paymentURL) {
        throw new Error('❌ AUTOSWEEP_PAYMENT_URL is not defined in environment variables');
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
        
        const autosweepModal = page.locator('section.modal.information')
        
        try {
            await autosweepModal.waitFor({ state: 'visible', timeout: 30000 });
            console.log('✅ Modal is visible - payment page loaded successfully!');
        } catch (error) {
            console.error('❌ Modal did not appear within 30 seconds');
            console.log('📄 Current page content:');
            const bodyText = await page.locator('body').innerText();
            console.log(bodyText.substring(0, 500));
            throw new Error('Payment page is stuck loading - Modal never appeared');
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


    test.describe('⚠️ Error Message Validation for empty fields', () => {
        test.beforeEach(async ({page}) => {
            const paymentUrl = process.env.AUTOSWEEP_PAYMENT_URL;
            if (!paymentUrl){
            throw new Error('❌ Environment variable AUTOSWEEP_PAYMENT_URL is not set');
            }
            await page.goto(paymentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForLoadState('load');

            console.log('📢 Close the Autosweep Announcement Modal')
        
            // Wait for the modal to appear
            const modal = page.locator('section.modal.information')
            await expect(modal).toBeVisible({ timeout: 10000 })
            
            // Verify modal content
            await expect(modal.locator('h3')).toHaveText('Announcement')
            await expect(modal.locator('iframe')).toBeVisible()
            
            // Click the close button
            const closeButton = modal.locator('button.close')
            await expect(closeButton).toBeEnabled()
            await closeButton.click()
            
            // Verify modal is closed
            await expect(modal).not.toBeVisible()
            console.log('✅ Announcement modal closed successfully')
        });

        test ('Empty Plate number field should show error message', async ({page}) => {
            console.log('🔎 Testing empty plate number field error handling...');
            console.log('💬 Verifying plate number field validation');
            console.log('👉 Blank plate number field should show an error');
            await page.getByRole('button', {name: 'Load Now'}).click();

            const plateError = (await page.locator('body').innerText()).toLowerCase();
            if (!platenumError.includes('plate no. / card no. is required')) {
                throw new Error('❌ Plate no. field validation failed: No error for blank message field');
            } else {
                console.log('✅ Plate no. field validation works as expected');
            }
        });

        test ('Empty Payment method field should show error message', async ({page}) => {
            console.log('🔎 Testing empty payment method field error handling...');

            console.log('✏️ Filling in plate number fields only')
            console.log('🔢 Entering Plate No.');
            await page.locator('input#plate-no-card-no').fill(process.env.AUTOSWEEP_PLATE_NUMBER);
            console.log('✅ Plate Number field filled successfully');

            console.log('👆 Clicking "Load Now" button with empty payment method field')

            await page.waitForTimeout(500); // Allow page to render error message
            const paymentError = (await page.locator('body').innerText()).toLowerCase();

            if (!paymentError.includes('please select a payment method first')) {
                throw new Error('❌ Payment method selection failed: No payment method selected');
            } else {
                console.log('✅ Payment method selection works as expected');
            }
        });

        

    });
});