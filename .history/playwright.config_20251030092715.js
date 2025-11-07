// @ts-check
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import gmail from 'gmail-tester';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// path for individual user credentials and token
const credentialPathUser = path.resolve(__dirname, 'playwright_individual_user.json');
const tokenPathUser = path.resolve(__dirname, 'playwright_individual_token.json');

//path for individual merchant credentials and token
const credentialPathMerchant = path.resolve(__dirname, 'playwright_individual_merchant.json');
const tokenPathMerchant = path.resolve(__dirname, 'playwright_individual_merchant_token.json');

/**
 * Check inbox for user email
 */
export async function checkUserEmail(options) {
  const { subject, to, from, wait_time_sec = 30, max_wait_time_sec = 60, after } = options;
  
  try {
    const email = await gmail.check_inbox(
      credentialPathUser,
      tokenPathUser,
      {
        subject,
        to,
        from,
        include_body: true,
        wait_time_sec,
        max_wait_time_sec,
        after,
      }
    );
    
    console.log('✅ Gmail check successful (User)');
    console.log('   To:', to);
    console.log('   Subject:', subject);
    console.log('   Email found:', email ? 'Yes' : 'No');
    
    return email;
  } catch (error) {
    console.error('❌ Gmail check error (User):', error.message);
    console.error('   To:', to);
    console.error('   Subject:', subject);
    throw error;
  }
}

/**
 * Check inbox for merchant email
 */
export async function checkMerchantEmail(options) {
  const { subject, to, from, wait_time_sec = 30, max_wait_time_sec = 60, after } = options;
  
  try {
    const email = await gmail.check_inbox(
      credentialPathMerchant,
      tokenPathMerchant,
      {
        subject,
        to,
        from,
        include_body: true,
        wait_time_sec,
        max_wait_time_sec,
        after,
      }
    );
    
    console.log('✅ Gmail check successful (Merchant)');
    console.log('   To:', to);
    console.log('   Subject:', subject);
    console.log('   Email found:', email ? 'Yes' : 'No');
    
    return email;
  } catch (error) {
    console.error('❌ Gmail check error (Merchant):', error.message);
    console.error('   To:', to);
    console.error('   Subject:', subject);
    throw error;
  }
}


/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e_tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    permissions: ['geolocation'], // 👈 allow location globally

    baseUrl: process.env.BASE_URL,
    loginEmail: process.env.LOGIN_EMAIL,
    loginUsername: process.env.LOGIN_USERNAME,
    loginPassword: process.env.LOGIN_PASSWORD,

    //merchant email
    INDIVIDUAL_MERCHANT_EMAIL: process.env.INDIVIDUAL_MERCHANT_EMAIL,

    //user info
    INDIVIDUAL_USER_NAME: process.env.INDIVIDUAL_USER_NAME,
    INDIVIDUAL_USER_EMAIL: process.env.INDIVIDUAL_USER_EMAIL,
    INDIVIDUAL_USER_MOBILE: process.env.INDIVIDUAL_USER_MOBILE,
    INDIVIUDUAL_USER_ADDRESS: process.env.INDIVIUDUAL_USER_ADDRESS,
    INDIVIDUAL_USER_NATIONALITY: process.env.INDIVIDUAL_USER_NATIONALITY,
    INDIVIDUAL_USER_BIRTHDATE: process.env.INDIVIDUAL_USER_BIRTHDATE,
    INDIVIDUAL_USER_BIRTHPLACE: process.env.INDIVIDUAL_USER_BIRTHPLACE,

    // individual payment link
    INDIVIDUAL_PAYMENT_URL: process.env.INDIVIDUAL_PAYMENT_URL,
    INDIVIDUAL_CARD_NUMBER: process.env.INDIVIDUAL_CARD_NUMBER,
    INDIVIDUAL_CARD_EXP: process.env.INDIVIDUAL_CARD_EXP,
    INDIVIDUAL_CARD_CVV: process.env.INDIVIDUAL_CARD_CVV,
    INDIVIDUAL_CARD_STREETLINE_1: process.env.INDIVIDUAL_CARD_STREETLINE_1,
    INDIVIDUAL_CARD_STREETLINE_2: process.env.INDIVIDUAL_CARD_STREETLINE_2,
    INDIVIDUAL_CARD_PROVINCE: process.env.INDIVIDUAL_CARD_PROVINCE,
    INDIVIDUAL_CARD_POSTAL: process.env.INDIVIDUAL_CARD_POSTAL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

