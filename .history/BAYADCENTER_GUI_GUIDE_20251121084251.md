# 🏦 Bayadcenter Biller Test Runner GUI

## Overview

A specialized web interface for testing JustPayto's Bayadcenter payment flows with different billers. This GUI allows QA staff to select specific billers and payment methods without needing to touch code.

## Features

✅ **Biller Selection** - Choose from 5 available billers:
- 📺 **Cignal** - Cable/Internet billing
- 💧 **Maynilad** - Water utility billing  
- ⚡ **Meralco** - Electricity billing
- 💳 **Bankard** - Credit card bill payments
- 📦 **Avon** - Distribution orders

✅ **Payment Method Testing** - Test all 4 payment methods:
- 💳 Credit Card
- 📱 E-Wallet (GCash, PayMaya)
- 🏦 Bank Transfer
- 🪶 Online Bank

✅ **Browser & Mode Selection**:
- Choose between Chromium, Firefox, or WebKit
- Run in Headed mode (see browser) or Headless (run quietly)

✅ **Real-time Output** - Watch test progress as it runs
✅ **Pre-configured Test Data** - Each biller has test accounts set up
✅ **Intuitive UI** - No coding knowledge required

## How to Access

1. **Start the GUI Server:**
   ```powershell
   cd c:\Users\Shyrine\Documents\GitHub\Playwright_JustPayto
   node gui/test-runner.js
   ```

2. **Open in Browser:**
   - Automatically opens http://localhost:3000
   - Click "🏦 Bayadcenter Billers" button

3. **Or go directly to:**
   - http://localhost:3000/bayadcenter.html

## How to Use

### Step 1: Select a Biller
Click on any biller card from the left panel:
- 📺 Cignal - Cable TV payments (requires customer name fields)
- 💧 Maynilad - Water bills (simple account number)
- ⚡ Meralco - Electricity bills (simple account number)
- 💳 Bankard - Credit card bills (requires account details)
- 📦 Avon - Avon orders (requires branch info)

### Step 2: Choose Payment Method
Select one of four payment methods:
- **💳 Credit Card** - Uses saved credit card details
- **📱 E-Wallet** - GCash or PayMaya digital wallet
- **🏦 Bank Transfer** - Online banking (ACH transfer)
- **🪶 Online Bank** - Institutional banking transfer

### Step 3: Configure Test Settings
- **🌐 Browser:** Chromium (recommended), Firefox, or WebKit
- **👁️ Display Mode:** 
  - Headed = See the browser window (good for debugging)
  - Headless = Run silently in background (faster)

### Step 4: Run Test
Click the **"▶️ Run Test"** button and watch the output below.

The test will:
1. Load the JustPayto Bayadcenter page
2. Select your chosen biller
3. Fill in pre-configured test account details
4. Choose your selected payment method
5. Complete the payment flow
6. Verify the transaction via email

## Test Data

Each biller has pre-configured test account information stored in the test files:

### Cignal
- Account Number: 9006567444
- Amount: ₱1,500
- Customer: Maria Santos

### Maynilad  
- Account Number: 53039157
- Amount: ₱800

### Meralco
- Account Number: 0116417010
- Amount: ₱2,000

### Bankard
- Account Number: 4573580400000020
- Amount: ₱800
- Account Name: Maria Santos
- Bill Date: 11/20/2025

### Avon
- Account Number: 8888888888888
- Amount: ₱800
- Customer: Maria Santos
- Branch: San Antonio

## Status Indicators

The test output section shows real-time progress:

- 🟡 **Running** - Test is currently executing
- 🟢 **Success** ✅ - All steps passed
- 🔴 **Error** ❌ - Test failed (check output for details)
- ⚫ **Idle** - Ready to run

## Tips & Best Practices

### Testing Strategy
1. **Start with Meralco** - It's the simplest (just account number)
2. **Test each payment method** - Use the same biller with all 4 methods
3. **Use Headed mode for debugging** - See exactly what's happening
4. **Use Headless mode for batch runs** - Faster for multiple tests

### Common Issues

**"Test file not found"**
- Make sure all 4 payment method test files exist in `e2e_tests/bayadcenter/`
- Files needed: `creditcard_payment.spec.js`, `ewallet_payment.spec.js`, `banktransfer_payment.spec.js`, `onlinebank_payment.spec.js`

**Tests take longer than expected**
- Network conditions affect payment gateway response times
- Tests include 90-second page load timeout for reliability
- Payment processing may take 30-60 seconds per test

**Browser window doesn't appear in headed mode**
- This is normal - it opens in a separate window
- Watch for it or minimize this window to see it
- The GUI will still capture and display the output

**Email verification fails**
- Verify test email credentials are set in environment variables
- Check Gmail account has access enabled for apps
- May need to wait a few seconds for email to arrive

## File Structure

```
gui/
├── public/
│   ├── index.html              # Main dashboard
│   └── bayadcenter.html        # Biller selector GUI (NEW)
└── test-runner.js              # Express backend (updated)

e2e_tests/bayadcenter/
├── creditcard_payment.spec.js  # Credit card tests (updated)
├── ewallet_payment.spec.js     # E-Wallet tests (updated)
├── banktransfer_payment.spec.js # Bank transfer tests (updated)
└── onlinebank_payment.spec.js  # Online bank tests (updated)
```

## How It Works (Technical)

1. **Frontend** (bayadcenter.html):
   - User selects biller and payment method
   - Sends test request to backend with biller ID

2. **Backend** (test-runner.js):
   - Receives request with `biller` parameter
   - Sets `BAYADCENTER_BILLER` environment variable
   - Spawns Playwright test for selected payment method

3. **Test Files** (bayadcenter/*.spec.js):
   - Read `BAYADCENTER_BILLER` from environment
   - Use matching biller config (account numbers, selectors, etc.)
   - Run test with selected biller data
   - Output results to GUI in real-time

## Support & Troubleshooting

- Check browser console (F12) for JavaScript errors
- Look at test output for detailed Playwright logs
- Verify environment variables are set (.env file)
- Run tests directly via CLI for detailed error traces:
  ```powershell
  npx playwright test e2e_tests/bayadcenter/creditcard_payment.spec.js --headed
  ```

## Next Steps

To add a new biller:
1. Add biller config to each `*.spec.js` file in `bayadcenter/` folder
2. Update `BILLERS` array in `bayadcenter.html`
3. Test all 4 payment methods with the new biller

---

**Created:** 2025-11-21  
**GUI Type:** Specialized Biller Selector  
**Testing Framework:** Playwright v1.56+  
**Backend:** Express.js  
