import {test, expect} from '@playwright/test';

test.setTimeout(120000);

test.describe('🎨 Individual Payment Unit Tests', () => {
  
test.describe('🎨 Individual Payment UI Page Tests', () => {
  let paymentUrl;

  test.beforeAll(async ({ browser }) => {
    paymentUrl = process.env.INDIVIDUAL_PAYMENT_URL;
    if (!paymentUrl) {
      throw new Error('❌ Environment variable INDIVIDUAL_PAYMENT_URL is not set');
    }

    console.log('🔍 Validating payment URL before running tests...');
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Allow longer navigation timeout for slow environments
      await page.goto(paymentUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.warn('⚠️ Network idle timeout - continuing anyway');
      });
      
      const currentUrl = page.url();
      const urlObj = new URL(currentUrl);
      const status = urlObj.searchParams.get('status') || '';
      const username = urlObj.searchParams.get('username') || '';
      const pathLower = urlObj.pathname.toLowerCase();
      const hostLower = urlObj.hostname.toLowerCase();

      const isNotFound = status.toLowerCase().includes('not_found') || 
                        status.toLowerCase().includes('not-found') || 
                        pathLower.includes('not-found') || 
                        pathLower.includes('not_found');
      const isOnboardingRedirect = hostLower.includes('onboarding') && pathLower.includes('early-access');

      if ((isOnboardingRedirect && isNotFound && username) || isNotFound) {
        throw new Error(`❌ Payment link not found or inactive: ${paymentUrl} -> ${currentUrl}`);
      }

      console.log('✅ Payment URL is valid');
    } finally {
      await context.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    if (!paymentUrl) {
      throw new Error('❌ Environment variable INDIVIDUAL_PAYMENT_URL is not set');
    }
    
    // Allow longer navigation timeout in case the page is slow to respond
    await page.goto(paymentUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Wait for the page to be fully loaded (give it up to 60s)
    await page.waitForLoadState('load', { timeout: 60000 });
  });

  test('should display correct payment page with matching slug', async ({ page }) => {
    let expectedSlug = '';
    try {
      const urlObj = new URL(paymentUrl);
      expectedSlug = urlObj.pathname.replace(/^\/+|\/+$/g, '');
    } catch (e) {
      throw new Error(`Invalid INDIVIDUAL_PAYMENT_URL: ${paymentUrl}`);
    }

    // Verify URL contains the expected slug
    await expect(page).toHaveURL(new RegExp(expectedSlug));

    await page.locator('h1, h2, h3, h4, h5, h6').first().waitFor({ 
      state: 'visible', 
      timeout: 10000 
    });
    
    // Get all heading texts and check if any contains the slug
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    const hasMatchingTitle = headings.some(text => 
      text.toLowerCase().includes(expectedSlug.toLowerCase())
    );
    
    expect(hasMatchingTitle).toBeTruthy();
    console.log(`✅ Found matching page title for slug: ${expectedSlug}`);
  });

  test('should not show location permission error when permission is granted', async ({ page }) => {
    // Grant geolocation permission
    await page.context().grantPermissions(['geolocation']);
    
    // Verify location error message is not present
    const errorMessage = page.getByText('Turn On Location', { exact: false });
    await expect(errorMessage).toHaveCount(0);

    console.log('✅ Location permission error not shown when granted');
  });

  test('should have working social media links', async ({ page }) => {
    console.log('🔍 Checking for social media links...');
    
    // Wait for page to fully load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); 
    
    await page.locator('.MuiCardContent-root, .MuiBox-root, body').first().waitFor({ 
      state: 'visible', 
      timeout: 10000 
    });
    
    // Find all links on the page
    const allLinks = await page.locator('a[href]').all();
    console.log(`📊 Total links found: ${allLinks.length}`);
    
    // Debug: Log ALL hrefs to see what we're getting
    console.log('📋 All link hrefs on page:');
    for (let i = 0; i < Math.min(allLinks.length, 20); i++) {
      const href = await allLinks[i].getAttribute('href');
      console.log(`  ${i + 1}. ${href}`);
    }
    
    // Social media platforms to check
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
    
    // Identify social media links
    for (const link of allLinks) {
      const href = (await link.getAttribute('href')) || '';
      const title = (await link.getAttribute('title')) || '';
      
      // Log each link we're checking
      if (href) {
        const lowerHref = href.toLowerCase();
        console.log(`  Checking: ${href}`);
        
        for (const [domain, platform] of Object.entries(socialPlatforms)) {
          if (lowerHref.includes(domain)) {
            // Avoid duplicates
            if (!foundLinks.find(l => l.href === href)) {
              foundLinks.push({ href, title, platform });
              console.log(`✅ MATCHED ${platform}: ${href}`);
            }
            break;
          }
        }
      }
    }
    
    // Debug output if no links found
    if (foundLinks.length === 0) {
      console.error('❌ No social media links found');
      console.log('📋 All links on page:');
      for (let i = 0; i < allLinks.length; i++) {
        const href = await allLinks[i].getAttribute('href') || 'no-href';
        const title = await allLinks[i].getAttribute('title') || 'no-title';
        console.log(`  ${i + 1}. href="${href}" title="${title}"`);
      }
      
      // Also check if the text "facebook.com" exists in page HTML
      const htmlContent = await page.content();
      if (htmlContent.includes('facebook.com')) {
        console.log('⚠️ WARNING: "facebook.com" found in HTML but not in link hrefs!');
        console.log('   This might indicate the page is still loading or using JavaScript to render links.');
      }
    } else {
      console.log(`✅ Found ${foundLinks.length} social media link(s): ${foundLinks.map(l => l.platform).join(', ')}`);
    }
    
    expect(foundLinks.length).toBeGreaterThan(0);
    
    // Verify links are accessible
    console.log('🔍 Verifying link accessibility...');
    const checkedUrls = new Set();
    
    for (const { href, platform } of foundLinks) {
      // Skip duplicates and non-HTTP links
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
        
        // Validate response status
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
    
    // Wait for the T&C link to be visible
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
    
    // Verify main page is still active
    await page.bringToFront();
    console.log('✅ Returned to payment page');
  });

  test('should have required payment page elements', async ({ page }) => {
    console.log('🔍 Checking for required page elements...');
    
    // Check for profile/user information
    const avatar = page.locator('img[alt*="avatar"], img[class*="avatar"], .MuiAvatar-img');
    await expect(avatar.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ User avatar is visible');
    
    // Check for username/title heading
    const mainHeading = page.locator('h1, h2, h3').first();
    await expect(mainHeading).toBeVisible();
    console.log('✅ Main heading is visible');
    
    // Verify page has some interactable content
    const buttons = await page.locator('button, a[role="button"]').count();
    expect(buttons).toBeGreaterThan(0);
    console.log(`✅ Found ${buttons} interactive button(s)`);
  });

});


test.describe('⚠️ Error Message Validation for empty fields', () => {
  test.beforeEach(async ({ page }) => {
    const paymentUrl = process.env.INDIVIDUAL_PAYMENT_URL;
    if (!paymentUrl){
      throw new Error('❌ Environment variable INDIVIDUAL_PAYMENT_URL is not set');
    }
    await page.goto(paymentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('load');
  });

  test('Empty Message Field should show error message', async({page}) => {
    console.log('🔍 Testing empty message field error handling...');

    console.log('👆 Clicking "Send Money" button with empty message')
    await page.getByRole('button', {name:/send money/i}).click();

    console.log('⏳ Waiting for error message to appear...');
    const errorMessage = (await page.locator('body').innerText()).toLowerCase();

    if(!errorMessage.includes('message is required')){
      throw new Error('❌ Expected error message for empty message field not found');
    } else {
      console.log('✅ Correct error message displayed for empty message field');
    }
  })

  test('Empty Payment Merthod field should show error message', async ({page}) => {
    console.log('🔍 Testing empty payment method error handling...');

    console.log('✏️ Filling in message field only')
    await page.locator('#message-order-items-ref').fill('Test Message for unit testing');

    console.log('👆 Clicking "Send Money" button with emty payment method')
    await page.getByRole('button', {name:/send money/i}).click();
    console.log('⏳ Waiting for error message to appear...');

    const paymentErrorMessage = (await page.locator('body').innerText()).toLowerCase();

    if(!paymentErrorMessage.includes ('please select a payment method first')){
      throw new Error('❌ Expected error message for empty payment method not found');
    } else {
      console.log('✅ Correct error message displayed for empty payment method');
    }
  })

  test ('Empty Amount field should show error message', async ({page}) => {
    console.log('🔍 Testing empty amount field error handling...');

    console.log('✏️ Filling in message field only')
    await page.locator('#message-order-items-ref').fill('Test Message for unit testing');

    console.log('✏️ Selecting payment method')
    await page.locator('#payment-method').click();
    await page.getByAltText('bank_fund_transfer').click();
    await page.getByAltText('PH').click();
    await page.getByAltText('bpi').first().click();

    console.log('👆 Clicking "Send Money" button with empty amount')
    await page.getByRole('button', {name:/send money/i}).click();
    console.log('⏳ Waiting for error message to appear...');

    const amountErrorMessage = (await page.locator('body').innerText()).toLowerCase();

    if(!amountErrorMessage.includes('please enter an amount first')){
      throw new Error('❌ Expected error message for empty amount field not found');
    } else {
      console.log('✅ Correct error message displayed for empty amount field');
    }
  });

  test ('Submit all fields without accepting terms and conditions should show error message', async({page}) => {
    console.log('🔍 Testing terms and conditions acceptance error handling...');
    console.log('✏️ Filling in message field')
    await page.locator('#message-order-items-ref').fill('Test Message for unit testing');

    console.log('✏️ Selecting payment method')
    await page.locator('#payment-method').click();
    await page.getByAltText('bank_fund_transfer').click();
    await page.getByAltText('PH').click();
    await page.getByAltText('bpi').first().click();

    console.log('✏️ Filling in amount field')
    await page.locator('#amount-to-pay').fill('100');

    // check if the currency dropdown is working
    console.log('💬 Checking currency dropdown functionality');
    await page.locator('#php[name="currency"]').click();
    await expect (page.locator('ul.MuiList-root')).toBeVisible();
    console.log('✅ Currency dropdown is working as expected');

    console.log('🔙 Looking for Back button')
    await page.getByText('Back').click();

    console.log('👆 Clicking "Send Money" button without accepting terms and conditions' )
    await page.getByRole('button', {name:/send money/i}).click();
    console.log('⏳ Waiting for error message to appear...');

    const termsErrorMessage = (await page.locator('body').innerText()).toLowerCase();
    if(!termsErrorMessage.includes('terms and conditions is required')){
      throw new Error('❌ Expected error message for unaccepted terms and conditions not found');
    } else {
      console.log('✅ Correct error message displayed for unaccepted terms and conditions');
    }

  })

})


test.describe('💳 Payment Method Availability Checker', () => {
  test('Log all available and unavailable payment methods', async ({ page }) => {
    const paymentUrl = process.env.INDIVIDUAL_PAYMENT_URL;

    if (!paymentUrl) {
      throw new Error('❌ Environment variable INDIVIDUAL_PAYMENT_URL is not set');
    }

    console.log('🌐 Navigating to payment page...');
    await page.goto(paymentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('load');
    console.log('✅ Page loaded successfully');

    console.log('💳 Opening payment method selection...');
    await page.locator('message-order-items-ref').fill('Test Message for unit testing - payment method availability check');
    await page.locator('#payment-method').click();
    await page.waitForTimeout(2000); 

    const paymentMethods = page.locator('ul .MuiList-root li');
    const count = await paymentMethods.count();
    console.log(`🔍 Found ${count} payment method(s) to check:`);

    for (let i = 0; i < count; i++) {
      const method = paymentMethods.nth(i);
      const methodName = (await method.innerText()).trim();
      try {
        await method.click();
        console.log(`✅ Payment method available: ${methodName}`);
      } catch (error) {
        console.log(`❌ Payment method NOT available: ${methodName}`);
      }
    }

    

  });
});

test.describe('⚠️ Credit Card Payment Error Message Validation for empty fields', () => {
  test.beforeEach(async ({ page }) => {
    const paymentUrl = process.env.INDIVIDUAL_PAYMENT_URL;

    if (!paymentUrl){
      throw new Error('❌ Environment variable INDIVIDUAL_PAYMENT_URL is not set');
    } else {
      await page.goto(paymentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForLoadState('load');
    }
    console.log('💳 Selecting Credit Card payment method');

    console.log('✏️ Filling in message field')
    await page.locator('#message-order-items-ref').fill('Test Message for unit testing - credit card field validation');

    console.log('✏️ Selecting Credit Card payment method')
    await page.locator('#payment-method').click();
    await page.getByAltText('mastercard_visa').click();
    await page.getByAltText('credit_card').click();
    console.log('✅ Credit card payment method selected');

  });

  test('Empty Account Card holder name should show error', async ({ page }) => {
    console.log('🔍 Testing credit card name field validation...');

    await page.getByText('OK').click();

    const accountnameErrorMessage = (await page.locator('body').innerText()).toLowerCase();

    if(!accountnameErrorMessage.includes('card holder name is required')){
      throw new Error('❌ Expected error message for empty card holder name not found');
    } else {
      console.log('✅ Correct error message displayed for empty card holder name');
    }
    
  });

  test('Empty card number should show error', async ({page}) => {
    console.log('🔍 Testing credit card number field validation...');
    
    console.log('✏️ Filling in card holder name')
    await page.locator('input#account-holder-s-full-name').fill(process.env.INDIVIDUAL_USER_NAME);
    console.log('✅ Account name field filled successfully');

    await page.getByText('OK').click();
    const cardnumberErrorMessage = (await page.locator('body').innerText()).toLowerCase();

    if(!cardnumberErrorMessage.includes('card number is required')){
      throw new Error('❌ Expected error message for empty card number not found');
    } else {
      console.log('✅ Correct error message displayed for empty card number');
    }
  })

  test('Empty card expiration date should show error', async ({page}) => {
    console.log('🔍 Testing credit card expiration date field validation...');
    console.log('✏️ Filling in card holder name')
    await page.locator('input#account-holder-s-full-name').fill(process.env.INDIVIDUAL_USER_NAME);
    console.log('✅ Account name field filled successfully');

    console.log('✏️ Filling in card number')
    await page.locator('input#card-number').fill(process.env.INDIVIDUAL_CARD_NUMBER);
    console.log('✅ Card number field filled successfully');

    await page.getByText('OK').click();
    const cardexpErrorMessage = (await page.locator('body').innerText()).toLowerCase();
    if (!cardexpErrorMessage.includes('expiration date (mm/yy) is required')) {
      throw new Error('❌ Expected error message for empty card expiration date not found');
    } else {
      console.log('✅ Correct error message displayed for empty card expiration date');
    }
  });

  test('Empty CVV should show error', async ({page}) => {
    console.log('🔍 Testing credit card CVV field validation...');
    console.log('✏️ Filling in card holder name')
    await page.locator('input#account-holder-s-full-name').fill(process.env.INDIVIDUAL_USER_NAME);
    console.log('✅ Account name field filled successfully');

    console.log('✏️ Filling in card number')
    await page.locator('input#card-number').fill(process.env.INDIVIDUAL_CARD_NUMBER);
    console.log('✅ Card number field filled successfully');

    console.log('✏️ Filling in card expiration date')
    await page.locator('input#expiration-date-mm-yy').fill(process.env.INDIVIDUAL_CARD_EXP);
    console.log('✅ Card expiration date field filled successfully');

    await page.getByText('OK').click();
    const cvvErrorMessage = (await page.locator('body').innerText()).toLowerCase();
    if (!cvvErrorMessage.includes('ccv or cvc (back of the card) is required')) {
      throw new Error('❌ Expected error message for empty CVV not found');
    } else {
      console.log('✅ Correct error message displayed for empty CVV');
    }
  });

  test('Empty Email field should show error', async ({page}) => {
    console.log('🔍 Testing credit card email field validation...');
    console.log('✏️ Filling in card holder name')
    await page.locator('input#account-holder-s-full-name').fill(process.env.INDIVIDUAL_USER_NAME);
    console.log('✅ Account name field filled successfully');

    console.log('✏️ Filling in card number')
    await page.locator('input#card-number').fill(process.env.INDIVIDUAL_CARD_NUMBER);
    console.log('✅ Card number field filled successfully');

    console.log('✏️ Filling in card expiration date')
    await page.locator('input#expiration-date-mm-yy').fill(process.env.INDIVIDUAL_CARD_EXP);
    console.log('✅ Card expiration date field filled successfully');

    console.log('✏️ Filling in CVV')
    await page.locator('input#ccv-or-cvc-back-of-the-card').fill(process.env.INDIVIDUAL_CARD_CVV);
    console.log('✅ CVV field filled successfully');

    await page.getByText('OK').click();
    const emailErrorMessage = (await page.locator('body').innerText()).toLowerCase();
    if (!emailErrorMessage.includes('payer/sender email is required')) {
      throw new Error('❌ Expected error message for empty email not found');
    } else {
      console.log('✅ Correct error message displayed for empty email');
    }

  });

  test('Empty Phone Number field should show error', async ({page}) => {
    console.log('🔍 Testing credit card phone number field validation...');
    console.log('✏️ Filling in card holder name')
    await page.locator('input#account-holder-s-full-name').fill(process.env.INDIVIDUAL_USER_NAME);
    console.log('✅ Account name field filled successfully');

    console.log('✏️ Filling in card number')
    await page.locator('input#card-number').fill(process.env.INDIVIDUAL_CARD_NUMBER);
    console.log('✅ Card number field filled successfully');

    console.log('✏️ Filling in card expiration date')
    await page.locator('input#expiration-date-mm-yy').fill(process.env.INDIVIDUAL_CARD_EXP);
    console.log('✅ Card expiration date field filled successfully');

    console.log('✏️ Filling in CVV')
    await page.locator('input#ccv-or-cvc-back-of-the-card').fill(process.env.INDIVIDUAL_CARD_CVV);
    console.log('✅ CVV field filled successfully');

    console.log('✏️ Filling in Email')
    await page.locator('#your-email').fill(process.env.INDIVIDUAL_USER_EMAIL);
    console.log('✅ Email field filled successfully');

    await page.getByText('OK').click();
    const phoneErrorMessage = (await page.locator('body').innerText()).toLowerCase();   
    if (!phoneErrorMessage.includes('payer/sender mobile number is required')) {
      throw new Error('❌ Expected error message for empty phone number not found');
    } else {
      console.log('✅ Correct error message displayed for empty phone number');
    }
  });
});

test.describe('⚠️ International Credit Card Payment Error Message Validation for empty fields', () => {
  test.beforeEach(async ({ page }) => {
    const paymentUrl = process.env.INDIVIDUAL_PAYMENT_URL;
    if (!paymentUrl){
      throw new Error('❌ Environment variable INDIVIDUAL_PAYMENT_URL is not set');
    } else {
      await page.goto(paymentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForLoadState('load');
    }

    console.log('💳 Selecting International Credit Card payment method');

    console.log('✏️ Filling in message field')
    await page.locator('#message-order-items-ref').fill('Test Message for unit testing - international credit card field validation');

    console.log('✏️ Selecting Credit Card payment method')
    await page.locator('#payment-method').click();
    await page.getByAltText('mastercard_visa').click();
    await page.getByAltText('credit_card').click();
    console.log('✅ Credit card payment method selected');

    await page.locator('input#account-holder-s-full-name').fill(process.env.INDIVIDUAL_USER_NAME);
    await page.locator('input#card-number').fill(process.env.INDIVIDUAL_CARD_NUMBER_INTERNATIONAL);
    await page.locator('input#expiration-date-mm-yy').fill(process.env.INDIVIDUAL_CARD_EXP);
    await page.locator('input#ccv-or-cvc-back-of-the-card').fill(process.env.INDIVIDUAL_CARD_CVV);
    await page.locator('#your-email').fill(process.env.INDIVIDUAL_USER_EMAIL);
  });

  test('Empty Billing Street Line 1 Address should show error', async ({page}) => {
    console.log('🔍 Testing credit card billing street address field validation...');
    await page.getByText('OK').click();

    const streetline1Error = (await page.locator('body').innerText()).toLowerCase(); 
      if (!streetline1Error.includes('card street line 1 is required')) {
          throw new Error('❌  Expected error message "Card Street Line 1 is required" not found.');
      } else {
          console.log('✅ Error message for street line 1 appeared');
      } 
  });

  test('Empty Billing Street Line 2 Address should show error', async ({page}) => {
    console.log('🔍 Testing credit card billing street line 2 field validation...');
    console.log('✏️ Filling in Billing Street Line 1 Address')
    await page.locator('input#your-card-street-line-1').fill(process.env.INDIVIDUAL_CARD_STREETLINE_1);
    console.log('✅ Billing Street Line 1 field filled successfully');

    await page.getByText('OK').click();
    const streetline2Error = (await page.locator('body').innerText()).toLowerCase();
    if (!streetline2Error.includes('card street line 2 is required')) {
      throw new Error('❌  Expected error message "Card Street Line 2 is required" not found.');
    } else {
      console.log('✅ Error message for street line 2 appeared');
    }
  });

  test('Empty province state should show error', async ({page}) => {
    console.log('🔍 Testing credit card billing province/state field validation...')
    console.log('✏️ Filling in Billing Street Line 1 Address')
    await page.locator('input#your-card-street-line-1').fill(process.env.INDIVIDUAL_CARD_STREETLINE_1);
    console.log('✅ Billing Street Line 1 field filled successfully')
    
    console.log('✏️ Filling in Billing Street Line 2 Address')
    await page.locator('input#your-card-street-line-2').fill('Unit Testing Address Line 2');
    console.log('✅ Billing Street Line 2 field filled successfully')
    
    await page.getByText('OK').click()
    
    const provinceStateError = (await page.locator('body').innerText()).toLowerCase()
    if (!provinceStateError.includes('card province state is required')) {
      throw new Error('❌  Expected error message "Card Province State is required" not found.');
    } else {
      console.log('✅ Error message for province/state appeared');
    }
  });

  test('Empty Postal Code should show error', async({ page }) => {
    console.log('🔍 Testing credit card billing postal code field validation...');

    console.log('✏️ Filling in Billing Street Line 1 Address')
    await page.locator('input#your-card-street-line-1').fill(process.env.INDIVIDUAL_CARD_STREETLINE_1);
    console.log('✅ Billing Street Line 1 field filled successfully')

    console.log('✏️ Filling in Billing Street Line 2 Address')
    await page.locator('input#your-card-street-line-2').fill('Unit Testing Address Line 2');
    console.log('✅ Billing Street Line 2 field filled successfully')

    console.log('✏️ Filling in Province/State')
    await page.locator('input#your-card-province-state').fill(process.env.INDIVIDUAL_CARD_PROVINCE);
    console.log('✅ Card Province State filled successfully');

    await page.getByText('OK').click();
    const postalCodeError = (await page.locator('body').innerText()).toLowerCase();
    if (!postalCodeError.includes('card postal code is required')) {
      throw new Error('❌  Expected error message "Card Postal Code is required" not found.');
    }
    else {
      console.log('✅ Error message for postal code appeared');
    }

  })

});