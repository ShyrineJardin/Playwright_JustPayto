import { test, expect } from '@playwright/test';

test.setTimeout(120000);

// check if payment page loads correctly FIRST TEST/CHECK
test.beforeAll(async ({ browser }) => {
    const paymentURL = process.env.BAYADCENTER_PAYMENT_URL;

    if (!paymentURL) {
        throw new Error('❌ BAYADCENTER_PAYMENT_URL is not defined in environment variables');
    }

    console.log('🔎 Checking if payment page is accessible...');
    console.log('🔗 Navigating to:', paymentURL);

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('🌐 Attempting to load the page ...');

        try {
            await page.goto(paymentURL, { waitUntil: 'domcontentloaded', timeout: 90000 });
        } catch (error) {
            console.error('❌ Failed to load the page within 90 seconds');
            throw new Error(`Site is stuck loading or took too long to respond: ${error.message}`);
        }

        console.log('🔃 Waiting for page to finish loading...');

        const loadSpinner = page.locator('img[src*="processing.gif"]');

        await page.waitForTimeout(2000);

        const isLoading = await loadSpinner.isVisible().catch(() => false);

        if (isLoading) {
            console.log('⏳ Page is still loading, waiting for spinner to disappear...');

            try {
                await loadSpinner.waitFor({ state: 'hidden', timeout: 60000 });
                console.log('✅ Loading spinner disappeared.');
            } catch (error) {
                console.error('❌ Loading spinner did not disappear within 60 seconds');
                throw new Error(`Page is stuck loading: ${error.message}`);
            }
        } else {
            console.log('⚠️ No loading spinner detected, verifying content loaded...');
        }

        // check if URL indicates "not found" or redirect to onboarding
        console.log('🔍 Verifying if payment link is valid...');

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

            if (isOnboardingRedirect) {
                throw new Error('Payment link redirected to onboarding page. Please ensure the payment link is correct and the merchant has set up their account.');
            } else {
                throw new Error('Payment link is invalid or not found. Please verify the payment link.');
            }
        }

        console.log('🔍 Verifying if button is visible...');

        const sendMoneyButton = page.getByRole('button', { name: /pay now/i });

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

test.describe('🎨 Bayadcenter Payment UI Page Tests', () => {
    test.beforeEach(async ({ page }) => {
        const paymentUrl = process.env.BAYADCENTER_PAYMENT_URL;
        if (!paymentUrl) {
            throw new Error('❌ Environment variable BAYADCENTER_PAYMENT_URL is not set');
        }
        await page.goto(paymentUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('load', { timeout: 60000 });
    });

    test('should display correct payment page with matching slug', async ({ page }) => {
        const paymentUrl = process.env.BAYADCENTER_PAYMENT_URL;
        let expectedSlug = '';
        try {
            const urlObj = new URL(paymentUrl);
            expectedSlug = urlObj.pathname.replace(/^\/+|\/+$/g, '');
        } catch (e) {
            throw new Error(`Invalid BAYADCENTER_PAYMENT_URL: ${paymentUrl}`);
        }

        await expect(page).toHaveURL(new RegExp(expectedSlug, 'i'));

        await page.locator('h1, h2, h3, h4, h5, h6').first().waitFor({
            state: 'visible',
            timeout: 10000
        });

        const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
        const hasMatchingTitle = headings.some(text =>
            text.toLowerCase().includes(expectedSlug.toLowerCase())
        );

        expect(hasMatchingTitle).toBeTruthy();
        console.log(`✅ Found matching page title for slug: ${expectedSlug}`);
    });

    test('should not show location permission error when permission is granted', async ({ page }) => {
        await page.context().grantPermissions(['geolocation']);

        const bodyText = (await page.locator('body').innerText()).toLowerCase();
        expect(bodyText).not.toContain('turn on location');

        console.log('✅ Location permission error not shown when granted');
    });

    test('should have working social media links', async ({ page }) => {
        console.log('🔍 Checking for social media links...');

        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const allLinks = await page.locator('a[href]').all();
        console.log(`📊 Total links found: ${allLinks.length}`);

        const socialPlatforms = {
            'facebook.com': 'Facebook',
            'fb.com': 'Facebook',
            'twitter.com': 'Twitter',
            'x.com': 'Twitter/X',
            't.co': 'Twitter',
            'instagram.com': 'Instagram',
            'linkedin.com': 'LinkedIn'
        };

        const foundLinks = [];

        for (const link of allLinks) {
            const href = (await link.getAttribute('href')) || '';

            if (href) {
                const lowerHref = href.toLowerCase();

                for (const [domain, platform] of Object.entries(socialPlatforms)) {
                    if (lowerHref.includes(domain)) {
                        if (!foundLinks.find(l => l.href === href)) {
                            foundLinks.push({ href, platform });
                            console.log(`✅ Found ${platform}: ${href}`);
                        }
                        break;
                    }
                }
            }
        }

        if (foundLinks.length === 0) {
            console.error('❌ No social media links found');
        } else {
            console.log(`✅ Found ${foundLinks.length} social media link(s)`);
        }

        expect(foundLinks.length).toBeGreaterThan(0);

        // Verify links are accessible
        console.log('🔍 Verifying link accessibility...');
        const checkedUrls = new Set();

        for (const { href, platform } of foundLinks) {
            if (checkedUrls.has(href) || !href.startsWith('http')) {
                continue;
            }
            checkedUrls.add(href);

            try {
                console.log(`⏳ Testing ${platform}: ${href}`);

                let response;
                try {
                    response = await page.request.head(href, {
                        timeout: 15000,
                        maxRedirects: 5
                    });
                } catch (e) {
                    console.log('  ⚠️ HEAD failed, trying GET...');
                    response = await page.request.get(href, {
                        timeout: 15000,
                        maxRedirects: 5
                    });
                }

                const status = response.status();

                if ((status >= 200 && status < 400) || status === 999) {
                    console.log(`✅ ${platform} is accessible (Status: ${status})`);
                } else if (status === 403 || status === 405) {
                    console.log(`⚠️ ${platform} returned ${status} (may block bots, likely valid)`);
                } else {
                    throw new Error(`Unexpected status ${status}`);
                }

            } catch (error) {
                console.error(`❌ ${platform} link failed: ${error.message}`);
                throw new Error(`Social media link "${platform}" (${href}) is not accessible: ${error.message}`);
            }
        }

        console.log('✅ All social media links are working');
    });

    test('should open Terms and Conditions in new tab', async ({ page, context }) => {
        console.log('🔍 Testing Terms and Conditions link...');

        const termsLink = page.getByRole('link', { name: /terms and conditions/i });
        await termsLink.waitFor({ state: 'visible', timeout: 10000 });

        const [termsPage] = await Promise.all([
            context.waitForEvent('page'),
            termsLink.click()
        ]);

        await termsPage.waitForLoadState('domcontentloaded');
        console.log(`✅ New tab opened: ${termsPage.url()}`);

        await expect(termsPage).toHaveURL(/terms-conditions|terms/);
        console.log('✅ Terms page URL is correct');

        await termsPage.close();
        await page.bringToFront();
        console.log('✅ Returned to payment page');
    });

    test('should have required payment page elements', async ({ page }) => {
        console.log('🔍 Checking for required page elements...');

        const avatar = page.locator('img[alt*="avatar"], img[class*="avatar"], .MuiAvatar-img');
        await expect(avatar.first()).toBeVisible({ timeout: 10000 });
        console.log('✅ User avatar is visible');

        const mainHeading = page.locator('h1, h2, h3').first();
        await expect(mainHeading).toBeVisible();
        console.log('✅ Main heading is visible');

        const buttons = await page.locator('button, a[role="button"]').count();
        expect(buttons).toBeGreaterThan(0);
        console.log(`✅ Found ${buttons} interactive button(s)`);
    });
});


test.describe('⚠️ Error Message Validation for empty fields', () => {
    test.beforeEach(async ({ page }) => {
        const paymentUrl = process.env.BAYADCENTER_PAYMENT_URL;
        if (!paymentUrl) {
            throw new Error('❌ Environment variable BAYADCENTER_PAYMENT_URL is not set');
        }
        await page.goto(paymentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForLoadState('load', { timeout: 30000 });
    });

    test('Empty Biller Field should show error message', async ({ page }) => {
        console.log('🔍 Testing empty biller field error handling...');

        console.log('👆 Clicking "Pay Now" button with empty biller');
        await page.getByRole('button', { name: /pay now/i }).click();

        console.log('⏳ Waiting for error message to appear...');
        const messageError = (await page.locator('body').innerText()).toLowerCase();

        if (!messageError.includes('biller is required')) {
            throw new Error('❌ Biller field validation failed: No error for blank biller field');
        } else {
            console.log('✅ Biller field validation works as expected');
        }
    });

    test('Empty Account Number field should show error message', async ({ page }) => {
        console.log('🔍 Testing empty account number error handling...');

        console.log('👆 Clicking biller information');
        const billerInput = page.locator('input#biller-information');
        if (await billerInput.isVisible()) {
            await billerInput.click();
        }

        console.log('💬 Verifying account number field validation');
        console.log('👉 Blank account number field should show an error');
        const okButton = page.getByRole('button', { name: /ok/i });
        if (await okButton.isVisible()) {
            await okButton.click();
        }
        await page.waitForTimeout(500); // Allow page to render error message
        const accountnumError = (await page.locator('body').innerText()).toLowerCase();

        if (!accountnumError.includes('account number is required')) {
            throw new Error('❌ Account number field validation failed: No error for blank account number field');
        } else {
            console.log('✅ Account number field validation works as expected');
        }
    });

    test('Empty Payment Method field should show error message', async ({ page }) => {
        console.log('🔍 Testing empty payment method error handling...');

        console.log('✏️ Filling in account number');
        const accountField = page.locator('input#account-number[name=referenceNumber]');
        if (await accountField.isVisible()) {
            await accountField.fill(process.env.MERALCO_ACCOUNT_NUMBER || '12345678');
        }

        console.log('✏️ Filling in amount field');
        const amountField = page.locator('input#amount');
        if (await amountField.isVisible()) {
            await amountField.fill('100');
        }

        console.log('👆 Clicking "Pay Now" without selecting payment method');
        await page.getByRole('button', { name: /pay now/i }).click();

        console.log('💬 Verifying payment method selection validation');
        console.log('👉 No payment method selected should show an error');

        const paymentError = (await page.locator('body').innerText()).toLowerCase();

        if (!paymentError.includes('please select a payment method first')) {
            throw new Error('❌ Payment method selection failed: No payment method selected');
        } else {
            console.log('✅ Payment method selection works as expected');
        }
    });

    test('Submit all fields without accepting terms and conditions should show error message', async ({ page }) => {
        console.log('🔍 Testing terms and conditions acceptance error handling...');

        console.log('✏️ Filling in account number');
        const accountField = page.locator('input#account-number[name=referenceNumber]');
        if (await accountField.isVisible()) {
            await accountField.fill(process.env.MERALCO_ACCOUNT_NUMBER || '12345678');
        }

        console.log('✏️ Filling in amount field');
        const amountField = page.locator('input#amount');
        if (await amountField.isVisible()) {
            await amountField.fill('900');
        }

        console.log('✏️ Selecting payment method');
        const paymentMethodToggle = page.locator('#payment-method');
        if (await paymentMethodToggle.isVisible()) {
            await paymentMethodToggle.click();

            // Try to select a bank option
            const bankOption = page.getByAltText('bpi').first();
            if (await bankOption.isVisible()) {
                await bankOption.locator('..').first().click();
            } else {
                // Fallback: click first available payment option
                const firstOption = page.locator('.payment-option').first();
                if (await firstOption.isVisible()) {
                    await firstOption.click();
                }
            }
        }

        console.log('👆 Clicking "Pay Now" button without accepting terms and conditions');
        await page.getByRole('button', { name: /pay now|send money/i }).click();

        console.log('⏳ Waiting for error message to appear...');

        const termsErrorMessage = (await page.locator('body').innerText()).toLowerCase();
        if (!termsErrorMessage.includes('terms and conditions is required')) {
            throw new Error('❌ Expected error message for unaccepted terms and conditions not found');
        } else {
            console.log('✅ Correct error message displayed for unaccepted terms and conditions');
        }
    });
});