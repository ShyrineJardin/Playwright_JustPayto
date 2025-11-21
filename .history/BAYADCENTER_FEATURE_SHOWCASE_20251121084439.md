# 🏦 Bayadcenter GUI - Feature Showcase

## What You Get

A complete web-based testing interface for JustPayto's Bayadcenter payment system. No coding knowledge required!

---

## 🎯 Main Features at a Glance

### 1. Biller Selection
Select from 5 different billers, each with their own test account data:

```
📺 CIGNAL          💧 MAYNILAD        ⚡ MERALCO
Cable/Internet     Water              Electricity
Account: 9006567   Account: 5303915   Account: 0116417
Amount: ₱1,500     Amount: ₱800       Amount: ₱2,000

💳 BANKARD         📦 AVON
Credit Cards       Distribution
Account: 4573580   Account: 8888888
Amount: ₱800       Amount: ₱800
```

### 2. Payment Method Testing
Test each biller with all 4 payment methods:

```
💳 Credit Card      📱 E-Wallet         🏦 Bank Transfer    🪶 Online Bank
VISA/Mastercard     GCash/PayMaya       ACH Transfer        Institutional
```

### 3. Browser Flexibility
```
🌐 Chromium (Chrome)  - Recommended, fastest
🌐 Firefox            - Cross-browser testing
🌐 WebKit (Safari)    - Safari compatibility
```

### 4. Display Modes
```
👁️ HEADED           🚀 HEADLESS
See the browser     Runs quietly
Good for debugging  Good for speed
Takes longer        Faster
```

### 5. Real-Time Monitoring
Watch test execution in real-time:

```
⏳ Starting test...
🌐 Navigating to JustPayto Bayadcenter...
📋 Selecting Meralco biller...
📝 Filling account number: 0116417010
📝 Filling amount: ₱2,000
💳 Selecting E-Wallet payment method...
✅ Payment completed successfully!
✉️ Verifying confirmation email...
       ↓
✅ TEST PASSED! (45s)
```

---

## 🎨 User Interface Design

### Clean, Modern Layout
```
┌─ BREADCRUMB ────────────────────────────┐
│ 🏠 Home › 🏦 Bayadcenter Billers       │
└─────────────────────────────────────────┘

┌─ HEADER ────────────────────────────────┐
│ 🏦 Bayadcenter Biller Test Runner     │
│ Select a biller and payment method...  │
└─────────────────────────────────────────┘

┌─ BILLERS ─────────────────┬─ SETTINGS ──────────────┐
│                           │                         │
│  [📺 Cignal]              │  📋 Selected: Meralco  │
│  [💧 Maynilad]            │  💰 Category: Elect.   │
│  [✓ Meralco]  ← Selected  │  💳 Method: E-Wallet   │
│  [💳 Bankard]             │                         │
│  [📦 Avon]                │  Payment Methods:       │
│                           │  [💳] [📱] [🏦] [🪶]   │
│                           │                         │
│                           │  Browser: [▼ Chromium]  │
│                           │  Mode: [▼ Headed]       │
│                           │                         │
│                           │  [▶️ RUN TEST]          │
│                           │  [🗑️ CLEAR]             │
│                           │                         │
│                           │  Status: ⚫ Ready       │
└─ BILLERS ─────────────────┴─ SETTINGS ──────────────┘

┌─ OUTPUT ───────────────────────────────────┐
│ [Test Output] [Help & Tips]                │
│                                            │
│ ✅ TEST PASSED! (45s)                     │
│                                            │
└────────────────────────────────────────────┘
```

### Interactive Elements
- **Color-coded status** - See at a glance if test is running/passed/failed
- **Visual feedback** - Buttons highlight on hover
- **Card selection** - Click to select, checkmark appears
- **Live output** - Real-time terminal-style output
- **Help available** - Click "Help & Tips" tab anytime

---

## 🚀 Quick Workflow

### 3 Steps to Run a Test

**STEP 1: Select Biller**
```
Click on any biller card
↓
Your selection is highlighted
```

**STEP 2: Choose Payment Method**
```
Click on payment method card
↓
Your selection is highlighted
↓
Summary updates on the right
```

**STEP 3: Run Test**
```
Choose Browser (Chromium recommended)
↓
Choose Mode (Headed for debugging, Headless for speed)
↓
Click "▶️ Run Test"
↓
Watch output below
↓
See ✅ or ❌ result
```

---

## 📊 Test Coverage

### Billers × Payment Methods

```
5 Billers × 4 Payment Methods = 20 Test Scenarios

┌─────────┬────────────┬──────────┬─────────┬────────────┐
│ Biller  │ Credit     │ E-Wallet │ Bank    │ Online     │
│         │ Card       │          │ Trans.  │ Bank       │
├─────────┼────────────┼──────────┼─────────┼────────────┤
│ Cignal  │ ✅ Test 1  │ ✅ Test 2 │ ✅ Test 3 │ ✅ Test 4  │
│ Maynilad│ ✅ Test 5  │ ✅ Test 6 │ ✅ Test 7 │ ✅ Test 8  │
│ Meralco │ ✅ Test 9  │ ✅ Test 10│ ✅ Test 11│ ✅ Test 12 │
│ Bankard │ ✅ Test 13 │ ✅ Test 14│ ✅ Test 15│ ✅ Test 16 │
│ Avon    │ ✅ Test 17 │ ✅ Test 18│ ✅ Test 19│ ✅ Test 20 │
└─────────┴────────────┴──────────┴─────────┴────────────┘
```

Each test:
- Fills out biller-specific account information
- Selects the payment method
- Completes the full payment flow
- Verifies success via email
- Reports results

---

## 💡 What Each Test Does

### Test Flow (Same for all combinations)

```
1. NAVIGATE
   ↓
   Open JustPayto Bayadcenter page
   (Wait up to 90 seconds for page to load)

2. SELECT BILLER
   ↓
   Find and click biller in dropdown
   (e.g., "Meralco" for electricity)

3. FILL ACCOUNT DETAILS
   ↓
   Auto-fill account numbers
   (Pre-configured: "0116417010" for Meralco)
   
4. ENTER AMOUNT
   ↓
   Fill payment amount
   (Pre-configured: "2000" for ₱2,000)

5. SELECT PAYMENT METHOD
   ↓
   Choose your payment method
   (Credit Card, E-Wallet, Bank Transfer, or Online Bank)

6. COMPLETE PAYMENT
   ↓
   Follow the payment gateway flow
   (Uses test credentials automatically)

7. VERIFY SUCCESS
   ↓
   Check for success message on page
   AND verify confirmation email received

8. REPORT RESULTS
   ↓
   ✅ PASS - Test completed successfully
   or
   ❌ FAIL - Error occurred, see output for details
```

---

## 🎛️ Configuration Options

### Browser Selection
```
Chromium  ← Recommended (fastest, most compatible)
Firefox   ← For cross-browser testing
WebKit    ← For Safari compatibility
```

### Display Mode
```
HEADED    ← See the browser window
          ← Good for debugging
          ← Slower (tests take 45-60s)
          
HEADLESS  ← Run invisibly in background
          ← Good for batch testing
          ← Faster (tests take 30-45s)
```

---

## 📈 Status Monitoring

### Live Status Indicator
```
⚫ Idle        → Ready to run
🟡 Running     → Test in progress...
🟢 Success     → All tests passed ✅
🔴 Error       → Test failed ❌
```

### Output Tracking
```
Watch the output box for:
- ⏳ Loading messages
- 📝 Form filling steps
- 💳 Payment processing
- ✅ Success confirmations
- ⚠️ Warnings or timeouts
- ❌ Errors with details
```

---

## 🛠️ Technical Architecture

### How It Works

```
USER GUI (browser)
    ↓
    │ Selects biller: "meralco"
    │ Selects method: "ewallet"
    │
    ▼
BACKEND (Node.js/Express)
    ↓
    │ Sets env: BAYADCENTER_BILLER=meralco
    │ Spawns Playwright test
    │
    ▼
TEST FILE (Playwright)
    ↓
    │ Reads env: BAYADCENTER_BILLER
    │ Uses matching config
    │ Runs e2e test
    │ Outputs to stdout
    │
    ▼
BACKEND (capturing)
    ↓
    │ Captures all test output
    │ Tracks exit code
    │ Stores in memory
    │
    ▼
GUI POLLS (every 500ms)
    ↓
    │ Requests current status
    │ Gets output
    │ Updates display
    │
    ▼
USER SEES (real-time)
    ↓
    Test progress, status, results
```

---

## 📚 Help & Documentation

Built-in help includes:

1. **How to Use**
   - Step-by-step instructions
   - Workflow explanation

2. **About Billers**
   - Detailed info on each biller
   - Test account details
   - Expected fields

3. **Status Indicators**
   - Meaning of each color
   - What to expect

4. **Payment Methods**
   - Explanation of each method
   - When to use which

---

## ✨ Key Advantages

### For QA Staff
- ✅ No terminal required
- ✅ No code knowledge needed
- ✅ Intuitive visual interface
- ✅ Can run anytime, anywhere
- ✅ Real-time feedback
- ✅ Pre-filled test data

### For Testing
- ✅ Consistent test data
- ✅ Multiple payment methods
- ✅ Multiple browsers
- ✅ Reproducible results
- ✅ Complete documentation
- ✅ Email verification

### For Development
- ✅ Easy to extend
- ✅ Environment variable driven
- ✅ No code changes needed to test different billers
- ✅ Modular design
- ✅ Automated output capture
- ✅ Real-time monitoring

---

## 🎓 Example Workflows

### Scenario 1: Quick Test (5 minutes)
```
1. Start GUI server (10 sec)
2. Select Meralco (2 sec)
3. Select Credit Card (2 sec)
4. Click Run (1 sec)
5. Wait for result (45-60 sec)
   → ✅ PASS or ❌ FAIL
```

### Scenario 2: Full Coverage Test (30 minutes)
```
Run all 20 combinations:

Meralco + CC           ✅ 45s
Meralco + E-Wallet     ✅ 45s
Meralco + Bank Trans.  ✅ 45s
Meralco + Online Bank  ✅ 45s
Bankard + CC           ✅ 45s
... (repeat for other 15 combinations)

Total: ~15 minutes for all tests
```

### Scenario 3: Debugging (15 minutes)
```
1. Select problematic biller (2 sec)
2. Select payment method (2 sec)
3. Switch to HEADED mode (2 sec)
4. Click Run (1 sec)
5. Watch browser open with test running (60 sec)
6. See exactly where error happens
7. Check output for error message (30 sec)
```

---

## 📱 Mobile Responsive

Works on:
- 💻 Desktop (1920x1080)
- 💻 Laptop (1366x768)
- 📱 Tablet (768x1024)
- 📱 Large Phone (414x896)

Adjusts layout automatically:
```
Desktop: 2-column layout (billers + settings side by side)
         2-column biller grid

Mobile:  1-column layout (billers above settings)
         2-column biller grid (or 1-column on tiny screens)
         1-column payment method grid
```

---

## 🚀 Performance

### Test Timing
```
Page Load:        0-90 seconds (waits for page)
Form Filling:     5-10 seconds (account details)
Payment Method:   3-5 seconds (selection + click)
Payment Flow:     20-40 seconds (gateway processing)
Email Check:      5-10 seconds (verify inbox)
                  ────────────────────────
Total Per Test:   45-60 seconds (headed)
                  30-45 seconds (headless)
```

### GUI Responsiveness
```
Selection:     Instant (< 100ms)
Update UI:     Instant (< 100ms)
Start Test:    < 1 second
Output Update: Every 500ms
Status Check:  Every 500ms
```

---

## 🎯 Next Steps

Ready to use? Just:

1. Start the server:
   ```powershell
   node gui/test-runner.js
   ```

2. Browser opens automatically at:
   ```
   http://localhost:3000
   ```

3. Click "🏦 Bayadcenter Billers"

4. Select, configure, and run! 🚀

---

**Created:** November 21, 2025  
**Status:** ✅ Ready to Use  
**Billers:** 5 Available  
**Payment Methods:** 4 Available  
**Total Test Scenarios:** 20  
