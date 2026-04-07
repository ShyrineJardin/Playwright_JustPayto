# 📚 Playwright Payment Testing Framework - Complete Documentation

> **All guides in one place!** This document covers setup, QA usage, and implementation details.

---

## 📖 Table of Contents

1. [Quick Start](#quick-start)
2. [For Non-Technical QA](#-for-non-technical-qa)
3. [For New Developers](#-for-new-developers)
4. [Gmail API Setup Guide](#-gmail-api-setup-guide-for-email-testing)
5. [ZAP Security Testing Guide](#-zap-security-testing-guide)
6. [For System Implementation](#-for-system-implementation)
7. [Troubleshooting](#-troubleshooting)

---

# ⚡ Quick Start

## The Fastest Way to Get Started (2 Minutes)

### For QA Users
```
1. Open the project folder in your File Explorer
2. Double-click: RUN_TEST_SUITE.bat
3. Browser opens automatically with test dashboard
4. Select a test → Click "Run Test"
5. Done! 🎉
```

### For Developers
```powershell
cd /path/to/your/repository
npm install
npx playwright install --with-deps
npx playwright test
```

---

# 🧪 For Non-Technical QA

## How to Run Tests (No Coding Required!)

### Step 1: Start the Dashboard
1. Open **Windows Explorer** (File Manager)
2. Navigate to the project folder
3. Find and **double-click**: `RUN_TEST_SUITE.bat`
4. Wait for browser to open automatically
5. You'll see the test dashboard 🎨

### Step 2: Choose Your Test Type
Use the tabs at the top of the test list:
- **🧪 E2E Tests** — Full browser payment flow tests (most comprehensive)
- **🔗 Integration Tests** — API-level tests
- **⚙️ Unit Tests** — Isolated logic tests per payment category

### Step 3: Run a Test
1. **Select a test** from the left list (click to highlight)
2. **Choose device**: Leave as "Chromium" for desktop, or pick a mobile/tablet device
3. **Choose display mode**:
   - "Headed (Show Browser)" = Watch the test run ✅ Best for learning
   - "Headless (Hidden)" = Run quietly in background ✅ Faster
4. **ZAP Security Scan** (optional): Toggle ON if you want security scanning — make sure ZAP is open first
5. **Click** "▶️ Run Test"

### Step 4: Check Results
- Look for **✅ TEST PASSED!** or **❌ TEST FAILED** in the output
- Green checkmark = Success! 🎉
- Red X = Something went wrong (check error message)

---

## ❓ Common Questions & Answers

### Q: The browser won't open
**A:**
1. Check the command window - it should say "Test Runner started"
2. Wait 10 seconds (it's starting the server)
3. Manually open browser and go to: `http://localhost:3000`
4. If still no luck, restart the `.bat` file

### Q: I see an error message
**A:** Look at the red text in the output:
- **"credentials expired"** → Ask admin to update `.env` file
- **"Element not found"** → Website layout may have changed, ask developer
- **"timeout"** → Website too slow, try again later
- **"email not found"** → Email server delay, tests check after 30 seconds

### Q: Can I run multiple tests at the same time?
**A:** No, but you can run them one after another:
1. Wait for first test to finish (check for ✅ or ❌)
2. Click "Clear Output" to clean the screen
3. Select a different test and click "Run Test" again

### Q: How do I stop a running test?
**A:**
1. Click the **"⏹️ Stop Test"** button
2. Test stops immediately

### Q: What is ZAP and should I enable it?
**A:** ZAP is a security scanning tool. When enabled, it watches all the network traffic during a test and flags any security issues it finds.
- Enable it when you want a security check alongside your regular test
- Make sure ZAP application is open on your computer before enabling
- ZAP is **not available** for Unit Tests (it's automatically disabled)
- After the test, open ZAP and check the Alerts tab for findings

### Q: What credentials do I need?
**A:** None! Tests use predefined test data configured by the IT team:
- Test email addresses
- Test payment methods (that don't actually charge)
- Test merchant accounts

---

## 💡 Pro Tips for QA Power Users

### Tip 1: Use Headless Mode for Speed
- Tests run ~20% faster in "Headless (Hidden)" mode
- Use "Headed (Show Browser)" only when debugging

### Tip 2: Run ZAP Scans Before Release
- Enable ZAP toggle for E2E tests before major releases
- Check ZAP Alerts tab after each run
- Generate an HTML report to share with developers

### Tip 3: Use the Right Test Type
- **Unit Tests** — fast, isolated, good for quick sanity checks
- **Integration Tests** — verify APIs are working correctly
- **E2E Tests** — full flow validation including email confirmation

### Tip 4: Test During Off-Peak Hours
- Tests are faster when website load is low
- Avoid testing right after website deployments

### Tip 5: Desktop Shortcut
- Run `CREATE_DESKTOP_SHORTCUT.bat` once to get a shortcut on your desktop

---

# 👨‍💻 For New Developers

## Prerequisites (Install First)

### 1. Node.js (Required)
- **Download**: https://nodejs.org/ (LTS version)
- **Verify**:
  ```powershell
  node --version
  npm --version
  ```

### 2. Git (Required)
- **Download**: https://git-scm.com/
- **Verify**:
  ```powershell
  git --version
  ```

### 3. Visual Studio Code (Recommended)
- **Download**: https://code.visualstudio.com/
- Install the **Playwright Test** extension from the Extensions panel

---

## Setup Steps

### Step 1: Clone the Repository

```powershell
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### Step 2: Install Dependencies

```powershell
npm install
npx playwright install --with-deps
```

### Step 3: Setup Environment Variables

```powershell
cp .env.example .env
# Fill in the values — ask your team lead for credentials
```

### Step 4: Verify Setup

```powershell
npx playwright test --help
```

---

## Running Tests

### Method 1: GUI Dashboard (Recommended for QA)
```powershell
# Windows
RUN_TEST_SUITE.bat

# Mac/Linux
node gui/test-runner.js

# Then open: http://localhost:3000
```

### Method 2: Command Line

```powershell
# Run all E2E tests
npx playwright test e2e_tests/

# Run all unit tests
npx playwright test unit_tests/

# Run integration tests
npx playwright test integration_tests/

# Run specific file
npx playwright test e2e_tests/individual/creditcard_payment.spec.js

# Run with specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run in headed mode
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

### Method 3: VS Code
Click the ▶️ play buttons next to test names in any `.spec.js` file.

---

## View Test Reports

```powershell
npx playwright show-report
```

Reports include: ✅/❌ results, 📸 screenshots, 🎥 video recordings, 📝 detailed logs, ⏱️ timing.

---

## Project Structure

```
├── e2e_tests/                    # Full browser payment flow tests
│   ├── individual/
│   ├── business/
│   ├── donation/
│   ├── bayadcenter/
│   ├── autosweep/
│   └── meralco/
├── integration_tests/            # API integration tests
│   └── api/
├── unit_tests/                   # Isolated unit tests per category
│   ├── autosweep_payment.spec.js
│   ├── bayadcenter_payment.spec.js
│   ├── business_payment.spec.js
│   ├── donation_payment.spec.js
│   ├── individual_payment.spec.js
│   └── meralco_payment.spec.js
├── gui/
│   ├── test-runner.js
│   └── public/index.html
├── helpers/
│   └── gmail-helper.js
├── fixtures/
├── playwright-report/
├── test-results/
├── .env
├── .gitignore
├── playwright.config.js
├── package.json
├── DOCUMENTATION.md
├── RUN_TEST_SUITE.bat
└── CREATE_DESKTOP_SHORTCUT.bat
```

---

## Common Development Workflows

### Workflow 1: Writing a New Test
```powershell
# 1. Create test file in the appropriate folder
# e2e_tests/mycategory/mytest.spec.js

# 2. Use Playwright Inspector to generate selectors
npx playwright codegen https://your-target-url.com

# 3. Write test logic using Playwright API

# 4. Run test to verify
npx playwright test e2e_tests/mycategory/mytest.spec.js --headed

# 5. Debug if needed
npx playwright test e2e_tests/mycategory/mytest.spec.js --debug

# 6. Commit changes
git add .
git commit -m "Add new test for my feature"
git push
```

### Workflow 2: Debugging a Failing Test
```powershell
# Run in debug mode
npx playwright test path/to/test.spec.js --debug

# Playwright Inspector opens — step through test line by line
# Use DevTools to inspect page elements
# Find the issue, fix the code, run again to verify
```

---

# 📧 Gmail API Setup Guide for Email Testing

Each Gmail account requires its own OAuth credentials. Follow these steps to set up a new email account for testing.

## Step 1: Environment Configuration

### 1.1 Add Email to `.env` File
```
TEST_MERCHANT_EMAIL=your.test.email@gmail.com
```

### 1.2 Update `playwright.config.js`
```javascript
TEST_MERCHANT_EMAIL: process.env.TEST_MERCHANT_EMAIL,
```

## Step 2: Gmail API Credential Paths
Add credential and token file paths to `helpers/gmail-helper.js`:

```javascript
const credentialPath = path.resolve(process.cwd(), 'playwright_credentials.json');
const tokenPath = path.resolve(process.cwd(), 'playwright_token.json');
```

## Step 3: Create OAuth Credentials in Google Cloud Console

1. Go to Google Cloud Console → Gmail API Credentials
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Desktop App** as Application type
4. Enter a descriptive name and click **Create**
5. Download the JSON credentials file
6. Rename it to match your credential path and place it in the project root

## Step 4: Generate Authentication Token

```powershell
node node_modules/gmail-tester/init.js credentials.json token.json your.email@gmail.com
```

A browser window will open — authorize the application. The token file will be created in the project root.

## Step 5: Configure `checkEmail` in `helpers/gmail-helper.js`

```javascript
export async function checkEmail(options) {
  const { from, to, subject, wait_time_sec = 20, max_wait_time_sec = 120, after } = options;

  try {
    let credentialPath, tokenPath;

    // Route to correct credentials based on recipient
    if (to === process.env.BUSINESS_USER_EMAIL) {
      credentialPath = credentialPathBusinessUser;
      tokenPath = tokenPathBusinessUser;
    } else {
      credentialPath = credentialPathIndividualUser;
      tokenPath = tokenPathIndividualUser;
    }

    const afterDate = after ? new Date(after) : undefined;

    const email = await gmail.check_inbox(credentialPath, tokenPath, {
      subject, to, from,
      include_body: true,
      wait_time_sec,
      max_wait_time_sec,
      after: afterDate
    });

    if (email) console.log('✅ Email found');
    return email;
  } catch (error) {
    console.error('❌ Gmail check error:', error.message);
    return null;
  }
}
```

## Step 6: Use in Test Files

```javascript
import { checkEmail } from '../../helpers/gmail-helper.js';

// In your test:
const testTriggerTime = Date.now();
const searchTime = new Date(testTriggerTime - 30 * 1000); // 30s buffer

const email = await checkEmail({
  from: 'noreply@your-app.com',
  to: process.env.USER_EMAIL,
  subject: 'Payment confirmation',
  wait_time_sec: 20,
  max_wait_time_sec: 180,
  after: searchTime.toISOString(),
});

if (!email) {
  throw new Error(`❌ No confirmation email received for: ${process.env.USER_EMAIL}`);
}
console.log('✅ Confirmation email received.');
```

## Task Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| from | string | required | Sender email address |
| to | string | required | Recipient email address |
| subject | string | required | Email subject to search for |
| wait_time_sec | number | 20 | Time between inbox checks (seconds) |
| max_wait_time_sec | number | 120 | Maximum wait time (seconds) |
| after | string (ISO) | required | Only find emails received after this timestamp |

## Troubleshooting Email Issues

- **Token Expired** → Re-run the token generation command, delete old token file first
- **Email Not Found** → Verify subject/to/from, increase `max_wait_time_sec`, check `after` timestamp buffer
- **Credentials Error** → Verify file paths exist and match the correct email account

---

# 🛡️ ZAP Security Testing Guide

## What is OWASP ZAP?

OWASP ZAP (Zed Attack Proxy) is a free, open-source security testing tool. When integrated with Playwright, it acts as a **proxy** between the browser and your app — intercepting all HTTP/HTTPS traffic and automatically flagging security vulnerabilities.

```
Playwright Browser → ZAP Proxy (localhost:8080) → Your App
```

> ZAP is available for **E2E** and **Integration** tests. It is automatically disabled for Unit Tests.

---

## Step 1: Install Java (Required by ZAP)

1. Download **Temurin 17 (LTS)** from https://adoptium.net (Windows x64 `.msi`)
2. During install, make sure these are checked:
   - ✅ Set `JAVA_HOME` variable
   - ✅ Add to PATH
3. Verify in a new Command Prompt:
   ```powershell
   java -version
   ```

---

## Step 2: Install OWASP ZAP

1. Download from https://www.zaproxy.org/download/ (Windows Installer)
2. Run the installer — if prompted to locate Java, run `where java` in Command Prompt to find the path (e.g. `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`) and point to that folder
3. Launch ZAP from Start Menu

---

## Step 3: Configure ZAP Proxy

In ZAP, go to: **Tools → Options → Network → Local Servers/Proxies**

Confirm:
- **Address:** `localhost`
- **Port:** `8080`

Keep ZAP open the entire time your test is running.

---

## Step 4: Enable ZAP in the Test Dashboard

1. Open the dashboard: `RUN_TEST_SUITE.bat` → `http://localhost:3000`
2. Select any **E2E** or **Integration** test
3. In the Test Configuration panel, toggle **🛡️ ZAP Security Scan** to **ON**
4. Click **"🔍 Check Connection"** — you should see: `✅ ZAP is reachable at localhost:8080`
5. Click **▶️ Run Test**

The output will show:
```
🛡️ ZAP Security Proxy ENABLED (localhost:8080)
📡 All browser traffic will be intercepted by ZAP
```

---

## Step 5: Viewing ZAP Results

### Alerts Tab (Quick Check)
In ZAP, click the **Alerts** tab:

| Color | Severity | Action |
|-------|----------|--------|
| 🔴 Red | High | Fix immediately |
| 🟠 Orange | Medium | Should be addressed |
| 🟡 Yellow | Low | Low priority |
| 🔵 Blue | Informational | Awareness only |

Click any alert for details: what it is, which URL triggered it, why it's a risk, and how to fix it.

### Generate a Report
**Report → Generate Report → HTML** → Open in browser to share with the team.

### History Tab
View every HTTP request Playwright made during the test — useful to confirm ZAP is intercepting traffic.

---

## Common Alerts You May See

| Alert | Risk | Meaning |
|-------|------|---------|
| Missing Anti-clickjacking Header | Medium | Pages lack `X-Frame-Options` |
| Content Security Policy Not Set | Medium | No script load restrictions |
| Cookie Without Secure Flag | Medium | Cookies sent over non-HTTPS |
| Cookie Without SameSite Attribute | Low | Cross-site cookie risk |
| X-Content-Type-Options Missing | Low | Browser may misinterpret file types |
| Strict-Transport-Security Not Set | Low | HTTPS not enforced via HSTS |
| Information Disclosure - Debug Errors | Medium | Stack traces visible to users |

---

## ZAP Tips

- Use **Headed Mode** with ZAP for your first run — watch traffic populate in the History tab to confirm it's working
- Run ZAP-enabled tests on **staging** before every major release
- ZAP passive scanning does **not** replace manual penetration testing — use it as a first layer

---

## ZAP Troubleshooting

| Problem | Solution |
|---|---|
| "ZAP not reachable" in dashboard | Make sure ZAP is fully open. Confirm port in Tools → Options → Network |
| ZAP History tab empty after test | Config not applied — restart the `.bat` server after saving `playwright.config.js` |
| SSL errors when ZAP is ON | `ignoreHTTPSErrors: true` is set in `playwright.config.js` automatically — confirm the file was saved |
| ZAP crashes or freezes | ZAP needs 4GB+ RAM — close other heavy applications |
| Java not found during install | Run `where java`, then use Locate dialog in installer to point to your JDK folder (not the `/bin` subfolder) |

---

# 🔧 For System Implementation

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│  QA Dashboard (Web Browser)                          │
│  - Test type tabs (E2E / Integration / Unit)         │
│  - Device & display mode selection                   │
│  - ZAP Security toggle with host/port config         │
│  - Real-time output streaming                        │
└────────────┬─────────────────────────────────────────┘
             │ HTTP Requests
             ↓
┌──────────────────────────────────────────────────────┐
│  Backend Server (Express.js)                         │
│  GET  /api/tests          - List tests by type       │
│  POST /api/run-test       - Execute test             │
│  GET  /api/test-status    - Poll status/output       │
│  POST /api/stop-test      - Kill running test        │
│  POST /api/clear-test     - Reset output             │
│  GET  /api/zap-status     - TCP check ZAP port       │
└────────────┬─────────────────────────────────────────┘
             │ Process spawn (with ZAP env vars if enabled)
             ↓
┌──────────────────────────────────────────────────────┐
│  Playwright Test Engine                              │
│  - Launches browser (with ZAP proxy if enabled)      │
│  - Executes selected test file                       │
│  - Captures stdout/stderr                            │
└────────────┬─────────────────────────────────────────┘
             │ (optional)
             ↓
┌──────────────────────────────────────────────────────┐
│  ZAP Proxy (localhost:8080)                          │
│  - Intercepts all HTTP/HTTPS traffic                 │
│  - Passive security scan in real time                │
│  - Stores alerts and history                         │
└──────────────────────────────────────────────────────┘
```

## Key Implementation Details

### ZAP Integration
```javascript
// Backend: inject ZAP env vars before spawning test process
if (zapEnabled) {
  envVars.ZAP_ENABLED = 'true';
  envVars.ZAP_HOST = zapHost;
  envVars.ZAP_PORT = String(zapPort);
  envVars.HTTP_PROXY = `http://${zapHost}:${zapPort}`;
  envVars.HTTPS_PROXY = `http://${zapHost}:${zapPort}`;
}

// playwright.config.js: conditionally set proxy
...(process.env.ZAP_ENABLED === 'true' ? {
  proxy: { server: `http://${process.env.ZAP_HOST}:${process.env.ZAP_PORT}` }
} : {}),
ignoreHTTPSErrors: process.env.ZAP_ENABLED === 'true',
```

### ZAP Connection Check (TCP Socket)
```javascript
// Uses TCP socket — not HTTP — because proxy ports don't respond to plain HTTP
app.get('/api/zap-status', (req, res) => {
  const socket = new net.Socket();
  socket.connect(port, host, () => {
    res.json({ reachable: true });
  });
  socket.on('error', () => res.json({ reachable: false }));
});
```

### Test Type Discovery
```javascript
// Backend: scan different folders based on type query param
const typeMap = {
  'e2e': 'e2e_tests',
  'integration': 'integration_tests',
  'unit': 'unit_tests'
};
const testDir = path.join(__dirname, '..', typeMap[testType]);
```

### Features Implemented
- ✅ E2E / Integration / Unit test type tabs
- ✅ Desktop, mobile, and tablet device selection
- ✅ ZAP toggle with expandable host/port settings
- ✅ ZAP TCP connection checker
- ✅ ZAP auto-disabled for Unit Tests
- ✅ Real-time output streaming
- ✅ Stop/clear test controls
- ✅ GitHub Actions CI/CD

---

# 🐛 Troubleshooting

## Tests Pass Locally but Fail in GitHub CI/CD
1. **Environment Variables Not Set** → GitHub repo → Settings → Secrets and variables → Actions
2. **Different OS** → GitHub uses Linux; check `.github/workflows/playwright.yml`
3. **Timeout Issues** → CI servers are slower; increase timeouts in `playwright.config.js`

## "Element not found" Error
```powershell
# Run headed to see what's happening
npx playwright test path/to/test.spec.js --headed

# Step through in debug mode
npx playwright test path/to/test.spec.js --debug

# Regenerate selectors
npx playwright codegen https://your-target-url.com
```

## Email Verification Failing
- Verify `from`, `to`, `subject` parameters
- Increase `max_wait_time_sec`
- Check the `after` timestamp has enough buffer
- Re-run token generation if credentials expired

## Dashboard Won't Open
1. Wait 10 seconds after running the `.bat` file
2. Check port 3000: `netstat -ano | findstr :3000`
3. Manually open: `http://localhost:3000`
4. Check browser console (F12) for errors

## "Command not found" Error
```powershell
# node not found → reinstall from https://nodejs.org/
# git not found → install from https://git-scm.com/
# Always restart PowerShell after installing
```

## Credentials Not Working
1. Verify `.env` exists: `Test-Path .\.env`
2. Check all required variables are present
3. Confirm values are current — ask team lead
4. Ensure `.env` is in `.gitignore`

---

## Quick Reference: Essential Commands

```powershell
# Start dashboard
RUN_TEST_SUITE.bat

# Run all E2E tests
npx playwright test e2e_tests/

# Run unit tests
npx playwright test unit_tests/

# Run integration tests
npx playwright test integration_tests/

# Run specific test
npx playwright test e2e_tests/individual/creditcard_payment.spec.js

# Run headed
npx playwright test --headed

# Debug mode
npx playwright test --debug

# View HTML report
npx playwright show-report

# Generate selectors
npx playwright codegen https://your-target-url.com

# Check Java (for ZAP)
java -version

# Find Java path (for ZAP Locate dialog)
where java
```

---

## Setup Checklists

### First Time Setup
- [ ] Install Node.js from https://nodejs.org/
- [ ] Install Git from https://git-scm.com/
- [ ] Clone repository and `cd` into it
- [ ] Run `npm install`
- [ ] Run `npx playwright install --with-deps`
- [ ] Get `.env` file from team lead
- [ ] Place `.env` in project root
- [ ] Run `RUN_TEST_SUITE.bat` and verify dashboard opens

### ZAP Security Testing Setup
- [ ] Install Java 17+ from https://adoptium.net
- [ ] Verify: `java -version` in Command Prompt
- [ ] Download ZAP from https://www.zaproxy.org/download/
- [ ] Open ZAP — confirm proxy at Tools → Options → Network → port `8080`
- [ ] In dashboard, select an E2E or Integration test
- [ ] Toggle ZAP ON → click Check Connection → confirm ✅ green
- [ ] Run test and verify ZAP message appears in output
- [ ] Check ZAP History tab for intercepted traffic

### Before Running Tests
- [ ] `.env` file exists with all variables
- [ ] Website/API target is up and accessible
- [ ] No other app using port 3000
- [ ] If using ZAP: ZAP application is open and running

### Reporting Test Failures
- [ ] Test name and file path
- [ ] Browser/device used
- [ ] Display mode (Headed or Headless)
- [ ] Whether ZAP was enabled
- [ ] Full error message from output
- [ ] When it started failing
- [ ] Any recent changes to the website or API