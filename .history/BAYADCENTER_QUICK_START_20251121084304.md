# 🏦 Bayadcenter GUI - Quick Start Guide

## Start the Server

```powershell
cd c:\Users\Shyrine\Documents\GitHub\Playwright_JustPayto
node gui/test-runner.js
```

✅ Server starts at: **http://localhost:3000**

## Access the GUI

1. **From Main Dashboard:**
   - Click "🏦 Bayadcenter Billers" button

2. **Direct URL:**
   - http://localhost:3000/bayadcenter.html

## Quick Workflow

```
1. Select a Biller (left side)
   ↓
2. Choose Payment Method (right side)
   ↓
3. Pick Browser & Mode (Chrome, Firefox, Safari / Headed or Headless)
   ↓
4. Click "▶️ Run Test"
   ↓
5. Watch output below
```

## Available Billers & Categories

| Biller | Category | Icon | Test Data |
|--------|----------|------|-----------|
| Cignal | Cable/Internet | 📺 | Account: 9006567444, Amount: ₱1,500 |
| Maynilad | Water | 💧 | Account: 53039157, Amount: ₱800 |
| Meralco | Electricity | ⚡ | Account: 0116417010, Amount: ₱2,000 |
| Bankard | Credit Cards | 💳 | Card: 4573580400000020, Amount: ₱800 |
| Avon | Distribution | 📦 | Order: 8888888888888, Amount: ₱800 |

## Payment Methods (Test All 4!)

- 💳 **Credit Card** - Standard payment card
- 📱 **E-Wallet** - GCash/PayMaya
- 🏦 **Bank Transfer** - ACH/Online Banking
- 🪶 **Online Bank** - Institutional Transfer

## What Each Test Does

1. Navigate to JustPayto Bayadcenter page
2. Select your chosen biller from dropdown
3. Fill account details (pre-configured)
4. Choose selected payment method
5. Complete payment with test credentials
6. Verify success email received
7. Report results ✅ or ❌

## Browser Recommendations

| Mode | Best For | Speed |
|------|----------|-------|
| **Chromium** | Default, fastest | ⚡ Fastest |
| **Firefox** | Cross-browser testing | 🔄 Medium |
| **WebKit** | Safari compatibility | 🔄 Medium |

| Display | Best For | Visibility |
|---------|----------|-----------|
| **Headed** | Debugging issues | 👀 See browser |
| **Headless** | CI/CD, batch runs | 🚀 Faster |

## Real-Time Monitoring

The output section shows:
- ⏳ Current step being executed
- ⚠️ Warnings and timeouts
- ✅ Success confirmations
- ❌ Error messages with details

## Need Help?

**Check the Help Tab** (click "Help & Tips" button)
- Full billers information
- Status indicator meanings
- Payment method details
- Troubleshooting tips

**Run from CLI for advanced debugging:**
```powershell
npx playwright test e2e_tests/bayadcenter/creditcard_payment.spec.js --headed
```

---

**No Coding Required!** Just click, select, and run. 🎯
