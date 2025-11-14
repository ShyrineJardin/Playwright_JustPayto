# 🚀 Playwright JustPayTo - Setup Guide for New Developers

This guide explains how to pull the code from GitHub and get everything working on your device.

## ✅ Prerequisites (Install First)

Before cloning the repository, make sure you have these installed:

### 1. Node.js (Required)
- **Download**: https://nodejs.org/ (LTS version recommended)
- **Verify installation**:
  ```powershell
  node --version
  npm --version
  ```

### 2. Git (Required)
- **Download**: https://git-scm.com/
- **Verify installation**:
  ```powershell
  git --version
  ```

### 3. Visual Studio Code (Optional, for developers)
- **Download**: https://code.visualstudio.com/
- Install Playwright Test extension for debugging

---

## 📥 Step 1: Clone the Repository

Open PowerShell and run:

```powershell
# Navigate to where you want the project
cd C:\Users\YourUsername\Documents

# Clone the repository
git clone https://github.com/ShyrineJardin/Playwright_JustPayto.git

# Go into the project folder
cd Playwright_JustPayto
```

---

## 🔧 Step 2: Install Dependencies

```powershell
# Install all npm packages
npm install

# Install Playwright browsers
npx playwright install --with-deps
```

This installs:
- ✅ Playwright testing framework
- ✅ Express.js (for the GUI dashboard)
- ✅ All other dependencies

**First run may take 5-10 minutes** (downloading browsers, etc.)

---

## 📋 Step 3: Setup Environment Variables

The project needs credentials and URLs to run tests. Follow one of these approaches:

### Option A: Get .env File from Team (Easiest)
1. Ask your team lead for the `.env` file
2. Place it in the project root folder: `Playwright_JustPayto/.env`
3. File should contain all necessary test credentials

### Option B: Create .env File Manually
Create file: `Playwright_JustPayto/.env`

Copy and fill in your values:
```dotenv
# Base configuration
BASE_URL=https://dashboard-dev.justpay.to
LOGIN_EMAIL=your_email@example.com
LOGIN_USERNAME=your_username
LOGIN_PASSWORD=your_password
API_URL=https://staging.justpay.to/api

# Individual payment tests
INDIVIDUAL_PAYMENT_URL=https://dev.justpay.to/coopersmith
INDIVIDUAL_USER_NAME=Test User
INDIVIDUAL_USER_EMAIL=test@gmail.com
INDIVIDUAL_USER_MOBILE=9204591518
INDIVIDUAL_USER_ADDRESS=Makati
INDIVIDUAL_USER_NATIONALITY=Filipino
INDIVIDUAL_USER_BIRTHDATE=010101
INDIVIDUAL_USER_BIRTHPLACE=Makati

# Test card info
INDIVIDUAL_CARD_NUMBER=4242424242424242
INDIVIDUAL_CARD_EXP=05/31
INDIVIDUAL_CARD_CVV=100
INDIVIDUAL_CARD_STREETLINE_1=123 Test Ave
INDIVIDUAL_CARD_STREETLINE_2=Apt 4B
INDIVIDUAL_CARD_PROVINCE=CA
INDIVIDUAL_CARD_POSTAL=94105

# Merchant email
INDIVIDUAL_MERCHANT_EMAIL=merchant@gmail.com

# Business tests
BUSINESS_PAYMENT_URL=https://dev.justpay.to/mochigallery
BUSINESS_USER_NAME=Juan Dela Cruz
BUSINESS_USER_EMAIL=business@gmail.com
BUSINESS_MERCHANT_EMAIL=merchant@gmail.com
BUSINESS_USER_MOBILE=9204591518
BUSINESS_USER_DELIVERY_ADDRESS=123 Katipunan Avenue

# Other payment links
BAYADCENTER_PAYMENT_URL=https://dev.justpay.to/bayadcenter
GAWADKALINGA_PAYMENT_URL=https://dev.justpay.to/gawadkalinga
AUTOSWEEP_PAYMENT_URL=https://dev.justpay.to/autosweeprfid
AUTOSWEEP_PLATE_NUMBER=AAA111
```

---

## 🎯 Step 4: Run Tests (Choose Your Method)

### Method 1: GUI Dashboard (Non-Technical QA)
Easiest way - no terminal commands needed!

**Windows:**
```powershell
# Double-click this file:
RUN_TEST_SUITE.bat
```

Browser opens at `http://localhost:3000` with the test dashboard.

**Mac/Linux:**
```bash
node gui/test-runner.js
```

Then open browser: `http://localhost:3000`

### Method 2: Command Line (Developers)

Run all tests:
```powershell
npx playwright test
```

Run specific test file:
```powershell
npx playwright test e2e_tests/individual/creditcard_payment.spec.js
```

Run with specific browser:
```powershell
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

Run with headed mode (see browser):
```powershell
npx playwright test --headed
```

### Method 3: VS Code (Developers)
1. Open project in VS Code
2. Install "Playwright Test" extension
3. Click green play button next to test names
4. Or use command palette: `Ctrl+Shift+P` → "Playwright: Run test"

---

## 📊 View Test Results

After tests run, view detailed HTML report:

```powershell
npx playwright show-report
```

This opens an interactive report showing:
- ✅/❌ Test results
- 📸 Screenshots
- 🎥 Video recordings (if enabled)
- 📝 Test logs

---

## 🔐 GitHub CI/CD Setup (Optional)

Tests can run automatically when you push to GitHub:

### Step 1: Add Secrets to GitHub
1. Go to: `https://github.com/ShyrineJardin/Playwright_JustPayto/settings/secrets/actions`
2. Click "New repository secret"
3. Add all environment variables from your `.env` file

See `GITHUB_SECRETS_SETUP.md` for detailed instructions.

### Step 2: Commit and Push
```powershell
git add .
git commit -m "Setup CI/CD"
git push
```

Tests will now run automatically on GitHub!

---

## 🐛 Troubleshooting

### Issue: "npm: command not found"
**Solution**: Install Node.js from https://nodejs.org/

### Issue: "npx: command not found"
**Solution**: Reinstall Node.js, ensure it's in your PATH

### Issue: Tests fail with missing credentials
**Solution**: 
1. Check `.env` file exists in project root
2. Verify all required variables are set
3. Get updated `.env` from team lead

### Issue: Browser won't open
**Solution**:
1. Check Node.js is running properly
2. Try accessing `http://localhost:3000` manually
3. Ensure port 3000 is not in use

### Issue: "Test file not found"
**Solution**:
1. Verify test files exist in `e2e_tests/` folder
2. Check file names match exactly
3. Run `npm install` again

---

## 📁 Project Structure

```
Playwright_JustPayto/
├── e2e_tests/                    # All test files
│   ├── individual/               # Individual payment tests
│   ├── business/                 # Business tests
│   │   ├── delivery/
│   │   ├── regular/
│   │   └── pick-up/
│   ├── donation/                 # Donation tests
│   ├── bayadcenter/              # BayadCenter tests
│   └── autosweep/                # AutoSweep tests
├── gui/                          # GUI dashboard
│   ├── test-runner.js            # Backend server
│   └── public/
│       └── index.html            # Frontend dashboard
├── helpers/                      # Helper functions
├── fixtures/                     # Test fixtures
├── .env                          # Environment variables (CREATE THIS)
├── playwright.config.js          # Playwright configuration
├── package.json                  # Dependencies
└── README.md                     # This file
```

---

## 🎯 Common Workflows

### For QA Testing
```powershell
# 1. Navigate to project
cd Playwright_JustPayto

# 2. Run GUI dashboard
RUN_TEST_SUITE.bat

# 3. In browser, select test and click "Run Test"
```

### For Developers (Local Testing)
```powershell
# 1. Make code changes
# 2. Run specific test
npx playwright test e2e_tests/individual/creditcard_payment.spec.js --headed

# 3. Debug with VS Code or Playwright Inspector
npx playwright test --debug
```

### For CI/CD (Automatic Testing)
```powershell
# 1. Push to GitHub
git add .
git commit -m "Your message"
git push

# 2. Tests run automatically on GitHub
# 3. Check results in Actions tab
```

---

## 📚 Additional Resources

- **Playwright Docs**: https://playwright.dev
- **Playwright Inspector**: `npx playwright codegen https://justpay.to`
- **Test Reports**: `npx playwright show-report`
- **Configuration**: See `playwright.config.js`
- **Environment Setup**: See `GITHUB_SECRETS_SETUP.md`

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Node.js installed (`node --version` shows version)
- [ ] Git installed (`git --version` shows version)
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install` completed)
- [ ] Browsers installed (`npx playwright install` completed)
- [ ] `.env` file created with credentials
- [ ] Can start GUI (`RUN_TEST_SUITE.bat` opens browser)
- [ ] Can select and run a test
- [ ] Test completes with ✅ or ❌

---

## 🚀 You're Ready!

Your Playwright automation system is set up. You can now:

✅ Run tests via GUI dashboard (non-technical QA)
✅ Run tests from command line (developers)
✅ Run tests from VS Code (developers)
✅ Run tests automatically in GitHub (CI/CD)

**Questions?** Check the specific guide files:
- `QA_GUIDE.md` - For non-technical QA
- `GITHUB_SECRETS_SETUP.md` - For GitHub CI/CD
- `AUTOMATION_SETUP.md` - For technical setup overview

---

**Happy Testing!** 🧪🚀
