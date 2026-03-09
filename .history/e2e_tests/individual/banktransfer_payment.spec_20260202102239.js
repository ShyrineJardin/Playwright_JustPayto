import {test, expect} from '@playwright/test';
import path from 'path';
import { checkEmail, extractOTP, checkMerchantEmail } from '../../helpers/gmail-helper.js';

// check if individual payment page loads correctly FIRST TEST/CHECK
test.beforeAll(async ({browser}) => {
    const paymentURL = process.env.INDIVIDUAL_PAYMENT_URL;

    if (!paymentURL) {
        throw new Error('❌ INDIVIDUAL_PAYMENT_URL is not defined in environment variables');
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

        console.log('🔍 Verifying "Send Money" button is visible...');
        
        const sendMoneyButton = page.getByRole('button', { name: /send money/i });
        
        try {
            await sendMoneyButton.waitFor({ state: 'visible', timeout: 30000 });
            console.log('✅ "Send Money" button is visible - payment page loaded successfully!');
        } catch (error) {
            console.error('❌ "Send Money" button did not appear within 30 seconds');
            console.log('📄 Current page content:');
            const bodyText = await page.locator('body').innerText();
            console.log(bodyText.substring(0, 500));
            throw new Error('Payment page is stuck loading - "Send Money" button never appeared');
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

test.describe('🎨 Individual Payment UI Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    const paymentUrl = process.env.INDIVIDUAL_PAYMENT_URL;
    await page.goto(paymentUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('load', { timeout: 60000 });
  });

  test('should display correct payment page with matching slug', async ({ page }) => {
    const paymentUrl = process.env.INDIVIDUAL_PAYMENT_URL;
    let expectedSlug = '';
    try {
      const urlObj = new URL(paymentUrl);
      expectedSlug = urlObj.pathname.replace(/^\/+|\/+$/g, '');
    } catch (e) {
      throw new Error(`Invalid INDIVIDUAL_PAYMENT_URL: ${paymentUrl}`);
    }

    await expect(page).toHaveURL(new RegExp(expectedSlug));

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
    
    const errorMessage = page.getByText('Turn On Location', { exact: false });
    await expect(errorMessage).toHaveCount(0);

    console.log('✅ Location permission error not shown when granted');
  });

  test('should have working social media links', async ({ page }) => {
    console.log('🔍 Checking for social media links...');
    
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); 
    
    await page.locator('.MuiCardContent-root, .MuiBox-root, body').first().waitFor({ 
      state: 'visible', 
      timeout: 10000 
    });
    
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
          console.log(`  ⚠️ HEAD failed, trying GET...`);
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
    
    await expect(termsPage).toHaveURL(/terms-conditions/);
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

test('🏦 Bank Transfer payment for individual user', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

    console.log('💻 Complete Bank Transfer Payment Flow');
    console.log(`🔗 URL: ${process.env.INDIVIDUAL_PAYMENT_URL}`);
    
    
    
    await expect(page).toHaveURL(/justpay\.to/);

    // Check if the page actually loaded with content - use longer timeout for GUI
    console.log('⏳ Waiting for Send Money button to be visible...');
    const isButtonVisible = await page.locator('button:has-text("Send Money")')
        .waitFor({state: 'visible', timeout: 60000})
        .then(() => true)
        .catch(() => false); 
    
    if (!isButtonVisible) {
        console.error('❌ FAILED: Individual Payment page did not load properly - may be down or loading slowly');
        console.log('📄 Current page content:');
        console.log((await page.locator('body').innerText()).substring(0, 500));
        throw new Error('Individual page failed to load - The page may be down or loading slowly');
    } else {
        console.log('✅ Individual Payment page loaded successfully');
    }

    // // Verify message field validation
    // console.log('💬 Verifying message field validation');
    // console.log('👉 Blank message field should show an error');
    // await page.getByRole('button', {name: 'Send Money'}).click();
    // await page.waitForTimeout(500); // Allow page to render error message
    // const messageError = (await page.locator('body').innerText()).toLowerCase();

    // if (!messageError.includes('message is required')) {
    //     throw new Error('❌ Message field validation failed: No error for blank message field');
    // } else {
    //     console.log('✅ Message field validation works as expected');
    // }

    // Fill in message field
    const testMessage = 'BankTransferTest12345';
    console.log(`💬 Filling in message field with: ${testMessage}`)
    await page.locator('#message-order-items-ref').fill(testMessage);
    console.log('✅ Message field filled successfully');

    // Proceed to payment
    console.log('💵 Proceeding to payment');
    // await page.getByRole('button', {name: 'Send Money'}).click();
    // await page.waitForTimeout(500); // Allow page to render error message
    // const paymentError = (await page.locator('body').innerText()).toLowerCase();

    // if (!paymentError.includes('please select a payment method first')) {
    //     throw new Error('❌ Payment method selection failed: No payment method selected');
    // } else {
    //     console.log('✅ Payment method selection works as expected');
    // }

    console.log('💳 Selecting bank transfer payment method');
    await page.locator('#payment-method').click();

    await page.getByAltText('bank_fund_transfer').click();

    console.log('Selecting Philippines as bank transfer country');
    await page.getByAltText('PH').click();
    console.log('✅ Philippines selected as bank transfer country');

    console.log('Selecting BPI for bank transfer')
    await page.getByAltText('bpi').locator('..').first().click();
    console.log('✅ Bank transfer payment method selected');

    await page.getByRole('button', {name: 'Send Money'}).click();

    // Checking for amount error message
    // console.log('💬 Checking for amount error message');
    // // Wait for error message to appear before reading page text
    // await page.waitForTimeout(500);
    // const amountError = (await page.locator('body').innerText()).toLowerCase();

    // if (!amountError.includes('please enter an amount first')) {
    //     throw new Error('❌ Amount error message not displayed');
    // } else {
    //     console.log('✅ Amount error message displayed as expected');
    // }

    console.log('💵 Filling in amount');
    await page.locator('#amount-to-pay').fill('100');
    console.log('✅ Amount filled successfully');

    // check if the currency dropdown is working
    console.log('💬 Checking currency dropdown functionality');
    await page.locator('#php[name="currency"]').click();
    await expect (page.locator('ul.MuiList-root')).toBeVisible();
    console.log('✅ Currency dropdown is working as expected');

    console.log('🔙 Looking for Back button')
    await page.getByText('Back').click();

    // //clicking send money without clicking the T&C
    // console.log('💵 Clicking Send Money without accepting T&C - should error');
    // await page.getByRole('button', {name: 'Send Money'}).click();
    // await page.waitForTimeout(500); // Allow page to render error message
    // const tcError = (await page.locator('body').innerText()).toLowerCase();

    // if (!tcError.includes('terms and conditions is required')) {
    //     throw new Error('❌ T&C error message not displayed when T&C not accepted');
    // } else {
    //     console.log('✅ T&C error message displayed as expected when T&C not accepted');
    // }

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
    
    await page.getByRole('button', {name: 'Send Money'}).click();

    //payment page contact information for verification
    console.log('💬 Verifying contact information on payment page');

    await page.getByText('OK').click();
    await page.waitForTimeout(500); // Allow page to render error message
   
    //checking name message error
    // const nameError = (await page.locator('body').innerText()).toLowerCase();
    // if (!nameError.includes('payer/sender name is required')) {
    //     throw new Error('❌ Name error message not displayed');
    // } else {
    //     console.log('✅ Name error message displayed as expected');
    // }
    console.log('📛 Filling in sender name');

    await page.locator('#your-name').fill(process.env.INDIVIDUAL_USER_NAME);
    console.log('✅ Sender name filled successfully');

    // await page.getByText('OK').click();
    // await page.waitForTimeout(500);

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
    // await page.waitForTimeout(500); // Allow page to render error message

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

    // Check if KYC fields exist (address field indicates KYC is required)
    const bodyText = await page.locator('body').innerText();
    const addressFieldExists = await page.locator('#your-residential-address').count() > 0;

    if (addressFieldExists && bodyText.toLowerCase().includes('residential address is required')) {
        console.log('🔐 KYC section detected - Processing KYC fields');

        console.log('🏡 Filling in sender residential address for KYC');
        await page.locator('#your-residential-address').fill(process.env.INDIVIDUAL_USER_ADDRESS);
        console.log('✅ Sender residential address filled successfully');

        await page.getByText('OK').click();
        await page.waitForTimeout(500); // Allow page to render error message

        //check for nationality error
        const nationalityError = (await page.locator('body').innerText()).toLowerCase();
        if (!nationalityError.includes('nationality is required')) {
            throw new Error('❌ Nationality error message not displayed');
        } else {
            console.log('✅ Nationality error message displayed as expected');
        }
        
        //filling in nationality
        console.log('🌎 Filling in nationality');
        await page.locator('#nationality').fill(process.env.INDIVIDUAL_USER_NATIONALITY);
        console.log('✅ Nationality filled successfully');

        await page.getByText('OK').click();
        await page.waitForTimeout(500); // Allow page to render error message

        //check for birthdate error
        const birthdateError = (await page.locator('body').innerText()).toLowerCase();

        if (!birthdateError.includes('birth date is required')) {
            throw new Error('❌ Birthdate error message not displayed');
        } else {
            console.log('✅ Birthdate error message displayed as expected');
        }

        //filling in birthdate
        console.log('🎂 Filling in birthdate');
        await page.locator('#birth-date').fill(process.env.INDIVIDUAL_USER_BIRTHDATE);
        console.log('✅ Birthdate filled successfully');

        await page.getByText('OK').click();
        await page.waitForTimeout(500); // Allow page to render error message

        //check for birthplace error
        const birthplaceError = (await page.locator('body').innerText()).toLowerCase();
        if (!birthplaceError.includes('birth place is required')) {
            throw new Error('❌ Birthplace error message not displayed');
        } else {
            console.log('✅ Birthplace error message displayed as expected');
        }

        //filling in birthplace
        console.log('🏙️ Filling in birthplace');
        await page.locator('#your-place-of-birth').fill(process.env.INDIVIDUAL_USER_BIRTHPLACE);
        console.log('✅ Birthplace filled successfully');

        await page.getByText('OK').click();
        await page.waitForTimeout(500); // Allow page to render error message

        //check for government ID error
        const govIDError = (await page.locator('body').innerText()).toLowerCase();
        if (!govIDError.includes('government-issued id is required')) {
            throw new Error('❌ Government ID error message not displayed');
        } else {
            console.log('✅ Government ID error message displayed as expected');
        }

        const filePath = path.resolve('tests/fixtures/test-image.jpg');

        // Upload Government ID 
        console.log('🆔 Uploading government-issued ID for KYC');
        const govIdInput = page.locator('input[type="file"].FileUpload').first();

        await expect(govIdInput).toBeVisible({ timeout: 10000 });
        await govIdInput.setInputFiles(filePath);
        console.log('✅ Government-issued ID uploaded successfully');

        // Verify file was attached
        const govIdInfo = await govIdInput.evaluate((input) => {
            const file = input.files?.[0];
            if (!file) return null;
            return { name: file.name, sizeMB: (file.size / 1024 / 1024).toFixed(2) };
        });

        if (govIdInfo) {
            console.log(`✅ Government ID attached: ${govIdInfo.name} (${govIdInfo.sizeMB} MB)`);
        } else {
            console.log('⚠️ Could not verify file attachment');
        }

        await page.waitForTimeout(1000);

        // Submit form after ID upload 
        console.log('📨 Submitting form with uploaded ID');
        await page.getByRole('button', { name: 'OK' }).click();
        await page.waitForTimeout(2000);

        // Check for ID validation 
        const bodyTextAfterUpload = (await page.locator('body').innerText()).toLowerCase();
            if (bodyTextAfterUpload.includes('government-issued id is required')) {
                console.error('❌ Form still showing ID required error after valid upload');
                throw new Error('❌ Valid ID upload not recognized by form');
            } else {
                console.log('✅ Form accepted government ID - proceeding to next step');
            }

            // Check for e-signature error 
            if (!bodyTextAfterUpload.includes('e-signature is required')) {
                throw new Error('❌ E-signature error message not displayed');
            } else {
                console.log('✅ E-signature error message displayed as expected');
            }

            // Upload e-signature 
            console.log('✍️ Uploading e-signature');
            const eSignInput = page.locator('input[type="file"].FileUpload').nth(1); // 2nd input for e-signature
            await expect(eSignInput).toBeVisible({ timeout: 10000 });
            await eSignInput.setInputFiles(filePath);
            console.log('✅ E-signature uploaded successfully');

            // Verify e-signature attachment
            const eSignInfo = await eSignInput.evaluate((input) => {
                const file = input.files?.[0];
                if (!file) return null;
                return { name: file.name, sizeMB: (file.size / 1024 / 1024).toFixed(2) };
            });

            if (eSignInfo) {
                console.log(`✅ E-signature attached: ${eSignInfo.name} (${eSignInfo.sizeMB} MB)`);
            } else {
                console.log('⚠️ Could not verify e-signature attachment');
            }

            await page.waitForTimeout(1000);

            // Submit form after e-signature upload 
            console.log('📨 Submitting form with e-signature');
            await page.getByRole('button', { name: 'OK' }).click();

            console.log('🎉 Form submitted successfully after e-signature upload')

            console.log('✅ KYC fields completed successfully');

    } else {
        console.log('🔓 No KYC section detected - Skipping KYC fields');
    }

    //Check if SMS or Email OTP is being used
    console.log('🔐 Checking for OTP verification step');

    await page.waitForTimeout(2000);
    
    // Debug: Check what's on the page
    const pageContentBeforeOTP = await page.locator('body').innerText();
    console.log('📄 Current page content (checking for OTP field):');
    console.log(pageContentBeforeOTP.substring(0, 800));
    
    try {
        await page.locator('input#enter-the-code').waitFor({ state: 'visible', timeout: 30000 });
    } catch (error) {
        console.error('❌ OTP input field did not appear within timeout');
        console.log('📄 Page when OTP input not found:');
        const pageText = await page.locator('body').innerText();
        console.log(pageText.substring(0, 1000));
        throw error;
    }

    // Get the specific OTP instruction text (not entire page)
    const otpInstruction = await page.locator('p:has-text("Enter the code")').innerText();
    const instructionLower = otpInstruction.toLowerCase();

    console.log('📄 OTP instruction text:', otpInstruction);

    const isSmsOtp = (
        (instructionLower.includes('mobile') || instructionLower.includes('phone')) &&
        !instructionLower.includes('email')
    );
    
    if (isSmsOtp) {
        console.log('📱 SMS OTP verification detected');

        // Increase timeout for manual entry
        test.setTimeout(120000); // 2 minutes total
        
        console.log('⚠️ Manual SMS OTP entry required - cannot proceed automatically');
        console.log('📲 Waiting for SMS OTP ...')
        console.log('⏸️ Test Pause - Please enter the complete 6-digit OTP');

        const otpInput = page.locator('input#enter-the-code');
        
        // Wait for the user to enter a complete 6-character OTP
        await page.waitForFunction(
            (selector) => {
                const input = document.querySelector(selector);
                return input && input.value.length === 6;
            },
            'input#enter-the-code',
            { timeout: 90000 } // 90 seconds to enter OTP
        );

       console.log('✅ Complete OTP detected (6 digits entered)');
    
        // Small delay to ensure form validation completes
        await page.waitForTimeout(1000);
        
        // Now click the submit button
        console.log('📥 Submitting OTP code...');
        await page.locator('button[type="submit"]').first().click();

        const bodyText = await page.locator('body').innerText();
        if (bodyText.toLowerCase().includes('invalid code')) {
            throw new Error('❌ OTP submission failed: Invalid or expired code');
        } else {
            console.log('✅ OTP submitted successfully and verified - Proceeding to payment summary');
        }
        
    }else{
        // Email OTP flow
        console.log('📧 Email OTP verification detected');

        const testTriggerTime = Date.now();
        console.log('⌛ Test Trigger time: ', new Date(testTriggerTime).toISOString());

        //search for emails from 30 seconds before test trigger time
        const searchTime = new Date(testTriggerTime - 30000).toISOString();

        const email = await checkEmail({
            from: 'hello@justpay.to',
            to: process.env.INDIVIDUAL_USER_EMAIL,
            subject: 'Verify your Email Address',
            wait_time_sec: 20,
            max_wait_time_sec: 120,
            after: searchTime.toString()
        });

        if(!email){
            throw new Error('❌ OTP email not received within expected time');
        }

        console.log('✅ OTP email received');
        
        const emailContent = JSON.stringify(email);

        console.log('💬 Extracting OTP from email content:', emailContent.length);
        console.log('📄 Email content snippet: ', emailContent.substring(0, 500));

        const otpCode = extractOTP(email);

         // Validate OTP was extracted
        if (!otpCode) {
            const emailContent = JSON.stringify(email);
            console.log('❌ Failed to extract OTP from email');
            console.log('📄 Full email content for debugging:', emailContent.substring(0, 1000));
            throw new Error('Could not extract OTP code from email content');
        }
        
        // Validate OTP format
        expect(otpCode, 'OTP should be 6 characters').toHaveLength(6);
        expect(otpCode, 'OTP should be alphanumeric').toMatch(/^[A-Z0-9]{6}$/i);
        
        console.log('✅ Valid OTP code extracted:', otpCode);

        //entering OTP code
        const otpInput = page.locator('input#enter-the-code');
        console.log('⌨️ Entering OTP code into input field');
        await otpInput.fill(otpCode);
        console.log('✅ OTP code entered successfully');

        await page.locator('button[type="submit"]').first().click();

        //verifify otp submission result
        const bodyText = await page.locator('body').innerText();
        if (bodyText.toLowerCase().includes('invalid code')) {
            throw new Error('❌ OTP submission failed: Invalid or expired code');
        } else {
            console.log('✅ OTP submitted successfully and verified');
        }
    } 

    // Payment summary verification
    console.log('💬 Verifying payment summary page');

    await page.getByText('Payment Summary').waitFor({ state: 'visible', timeout: 15000});

    console.log('✅ Payment summary page loaded successfully');

    //verify payment details
    await expect(page.getByText('BankTransferTest12345')).toBeVisible();
    console.log('✅ Message Verified');

    console.log('💸 Verifying Payment Amount from the Summary Table');
    const subTotalRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Sub Total' });
    const subTotal = await subTotalRow.locator('td').nth(1).innerText();
    console.log(`✅ Sub Total: ${subTotal}`);
    expect(subTotal).toContain('100.00');

    // KYC Information verification
    console.log('🔍 Verifying KYC Information from Summary Table');

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

    // Address
    console.log('📍 Checking Address...');
    const addressExists = await page.locator('.MuiTable-root tbody tr', { hasText: 'Your Address' }).count();
    if (addressExists > 0) {
      const addressRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Address' });
      const address = await addressRow.locator('td').nth(1).innerText();
      console.log(`✅ Address verified: ${address}`);
      expect(address.toLowerCase()).toContain(process.env.INDIVIDUAL_USER_ADDRESS.toLowerCase());
    } else {
      console.log('ℹ️ Address field not found - skipping');
    }

    // Nationality
    console.log('🗺️ Checking Nationality...');
    const nationalityExists = await page.locator('.MuiTable-root tbody tr', { hasText: 'Your Nationality' }).count();
    if (nationalityExists > 0) {
      const nationalityRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Nationality' });
      const nationality = await nationalityRow.locator('td').nth(1).innerText();
      console.log(`✅ Nationality verified: ${nationality}`);
      expect(nationality.toLowerCase()).toContain(process.env.INDIVIDUAL_USER_NATIONALITY.toLowerCase());
    } else {
      console.log('ℹ️ Nationality field not found - skipping');
    }

    // Date of Birth
    console.log('📅 Checking Date of Birth...');
    const dobExists = await page.locator('.MuiTable-root tbody tr', { hasText: 'Your Date of Birth' }).count();
    if (dobExists > 0) {
      const dobRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Date of Birth' });
      const dob = await dobRow.locator('td').nth(1).innerText();
      console.log(`✅ Date of Birth verified: ${dob}`);

      const actualDob = dob.replace(/\D/g, ''); // removes all non-digits
      const expectedDob = (process.env.INDIVIDUAL_USER_BIRTHDATE ?? '').replace(/\D/g, '');

      expect(actualDob).toContain(expectedDob);
    } else {
      console.log('ℹ️ Date of Birth field not found - skipping');
    }

    // Place of Birth
    console.log('🚼 Checking Place of Birth...');
    const pobExists = await page.locator('.MuiTable-root tbody tr', { hasText: 'Your Place of Birth' }).count();
    if (pobExists > 0) {
      const pobRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Place of Birth' });
      const pob = await pobRow.locator('td').nth(1).innerText();
      console.log(`✅ Place of Birth verified: ${pob}`);
      expect(pob.toLowerCase()).toContain(process.env.INDIVIDUAL_USER_BIRTHPLACE.toLowerCase());
    } else {
      console.log('ℹ️ Place of Birth field not found - skipping');
    }

    // Payment Method
    console.log('💳 Checking Payment Method...');
    const paymentRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Payment Method' });
    const paymentMethod = await paymentRow.locator('td').nth(1).innerText();
    console.log(`✅ Payment Method verified: ${paymentMethod}`);
    expect(paymentMethod).toContain('Bank of the Philippine Islands');

    // IP Address
    console.log('🌐 Verifying IP Address Information');
    const ipText = await page.locator('.MuiTypography-h6', { hasText: 'your current IP address' }).locator('span').innerText();
    const cleanedIP = ipText.replace(/[()]/g, '').trim();
    console.log(`✅ IP Address logged: ${cleanedIP}`);
    expect(cleanedIP).toMatch(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);

    console.log('🎉 All Payment Summary validations passed successfully');
    console.log('✅ Payment Summary Validation Complete');

    // scroll to button
    const confirmButton = page.locator('button', { hasText: 'Confirm' }).first();
    await confirmButton.click();


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

    console.log('✅ Bank authentication popup opened');
    await popup.waitForLoadState('domcontentloaded');
    console.log(`🏦 Bank mock page URL: ${popup.url()}`);

    // Verify we're on the bank mock page
    await expect(popup).toHaveURL(/bank-web-mock\.xendit\.co/);

    // Wait for the form to be fully loaded
    console.log('⏳ Waiting for login form to load...');
    await popup.locator('input[name="username"]').waitFor({ state: 'visible', timeout: 10000 });


    console.log('💬 Filling in MoneyBank mock login credentials');
    await popup.locator('input[name="username"]').fill('91284');
    await popup.locator('input[name="password"]').fill('strongpassword');

    await popup.locator('button[type="submit"]').click();

    console.log('🔐 Filling in OTP on bank popup');
    await popup.locator('input[name="otp"]').fill('222000');
    await popup.locator('button:has-text("Confirm")').click();

    test.setTimeout(180000); // 3 minutes to accommodate processing time

    console.log('⏳ Waiting for transaction to process (20 seconds)...');
    await page.waitForTimeout(20000); // wait for 20 seconds for processing

    console.log('🔎 Checking Transaction Status')
    await page.waitForTimeout(2000);
    const successMessage = await page.locator('body').innerText();

    if (!successMessage.toLowerCase().includes('transaction successful')) {
        throw new Error('❌ Payment not successful - Success message not found');
    } else {
        console.log('✅ Payment completed successfully - Success message verified');
    }

    await page.screenshot({ path: `banktransfer_individual_${browserName}.png`, fullPage: true });

    await page.locator('button', { hasText: 'Ok' }).click();
    console.log('🎉 Individual Bank Transfer Payment Flow Test Completed Successfully');

    const testTriggerTime1 = Date.now();
    const searchTime1 = new Date(testTriggerTime1 - 30 * 1000);

    const testTriggerTime2 = Date.now();
    const searchTime2 = new Date(testTriggerTime2 - 30 * 1000);

    //email verification for user
    console.log('📧 Verifying payment confirmation email for individual user');

    console.log('📬 Waiting for confirmation email for payer...');

    await page.waitForTimeout(2000); // short delay before checking

    const payerEmail = await checkEmail({
    from: 'hello@justpay.to',
    to: process.env.INDIVIDUAL_USER_EMAIL,
    subject: 'You are sending',
    wait_time_sec: 20,
    max_wait_time_sec: 180,
    after: searchTime1.toISOString(),
    });

    if (!payerEmail) {
    throw new Error(`❌ No confirmation email received for payer: ${process.env.INDIVIDUAL_USER_EMAIL}`);
    }

    console.log('✅ Payer confirmation email received.');
    console.log(`📧 To: ${process.env.INDIVIDUAL_USER_EMAIL}`);
    console.log(`🕒 Received at: ${payerEmail.date || 'unknown'}`);

    // --- EMAIL VERIFICATION FOR MERCHANT (You are receiving) ---
    console.log('📬 Waiting for confirmation email for merchant...');

    await page.waitForTimeout(2000); // slight pause before checking merchant inbox

    const merchantEmail = await checkMerchantEmail({
    from: 'hello@justpay.to',
    to: process.env.INDIVIDUAL_MERCHANT_EMAIL,
    subject: 'You are receiving',
    wait_time_sec: 20,
    max_wait_time_sec: 180,
    after: searchTime2.toISOString(),
    });

    if (!merchantEmail) {
    throw new Error(`❌ No confirmation email received for merchant: ${process.env.INDIVIDUAL_MERCHANT_EMAIL}`);
    }

    console.log('✅ Merchant confirmation email received.');
    console.log(`📧 To: ${process.env.INDIVIDUAL_MERCHANT_EMAIL}`);
    console.log(`🕒 Received at: ${merchantEmail.date || 'unknown'}`);

    // --- FINAL VALIDATION ---
    console.log('🎉 Email verification for both payer and merchant completed successfully!');
    
});