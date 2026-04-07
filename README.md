# 🎭 Playwright E2E Payment Testing Framework

A comprehensive test automation framework built with **Playwright** covering end-to-end, integration, and unit testing for payment gateway flows. Features a custom web-based GUI dashboard, OWASP ZAP security scanning integration, and Gmail API email verification — designed so both developers and non-technical QA members can run tests confidently.

> ⚠️ **Note:** All environment-specific URLs and credentials are stored in environment variables and are not included in this repository. See [Setup](#setup) for configuration instructions.

---

## 🗂️ Project Structure

```
├── e2e_tests/
│   ├── individual/          # Individual payment flow tests
│   ├── business/            # Business payment tests (delivery, regular, pick-up)
│   ├── donation/            # Donation flow tests
│   ├── bayadcenter/         # BayadCenter payment tests
│   ├── autosweep/           # AutoSweep RFID tests
│   └── meralco/             # Meralco payment tests
├── integration_tests/
│   └── api/                 # API integration tests
├── unit_tests/              # Unit tests per payment category
│   ├── autosweep_payment.spec.js
│   ├── bayadcenter_payment.spec.js
│   ├── business_payment.spec.js
│   ├── donation_payment.spec.js
│   ├── individual_payment.spec.js
│   └── meralco_payment.spec.js
├── gui/
│   ├── test-runner.js       # Express.js backend server
│   └── public/
│       └── index.html       # Web dashboard UI
├── helpers/
│   └── gmail-helper.js      # Gmail API email verification helpers
├── fixtures/                # Test data
├── playwright-report/       # Auto-generated HTML reports
├── .env.example             # Environment variable template
├── playwright.config.js     # Playwright configuration
├── RUN_TEST_SUITE.bat       # Windows one-click launcher
└── CREATE_DESKTOP_SHORTCUT.bat
```

---

## ✨ Key Features

### 🖥️ Custom GUI Dashboard
A web-based test runner dashboard built with **Express.js** so non-technical QA members can run tests with zero command-line knowledge.

- Select and run any test from a visual list organized by type (E2E, Integration, Unit)
- Choose from desktop browsers, mobile, and tablet device emulation
- Real-time test output streaming in the browser
- Stop, clear, and re-run tests with one click
- Built-in help and tips section

### 🛡️ OWASP ZAP Security Scanning
Integrated **ZAP proxy** support directly into the dashboard — toggle it on and all Playwright browser traffic is routed through ZAP for passive security scanning during test runs.

- One-click ZAP toggle in the GUI (off by default)
- Configurable host and port settings
- Built-in connection checker before running
- Automatically disabled for Unit Tests (not applicable)
- Catches issues like missing security headers, XSS, SQL injection, insecure cookies, and more
- Results viewable in ZAP's Alerts tab or exportable as an HTML report

### 📧 Gmail API Email Verification
Tests validate the **full transaction lifecycle** — not just the UI, but also confirming that the correct notification emails are sent and received after each payment.

- Integrated Gmail API with OAuth2 for automated inbox checking
- Supports multiple test email accounts with separate credentials
- Configurable wait times and subject/sender filtering
- Timestamp filtering to avoid false positives from older emails

### 🔀 Three-Layer Test Coverage
The framework covers all three testing layers with a unified dashboard and runner:

- **E2E Tests** — full browser-based payment flow testing
- **Integration Tests** — API-level integration verification
- **Unit Tests** — isolated payment logic per category

### 📱 Multi-Device Support
Tests can run across desktop browsers, mobile devices, and tablets:
- Desktop: Chromium, Firefox, WebKit, Microsoft Edge
- Mobile: iPhone 12, iPhone SE, Google Pixel 5, Samsung Galaxy S9+
- Tablet: iPad Pro, iPad Air, Google Pixel Tablet

### 🔒 Secure Credential Management
All credentials and environment-specific URLs are stored in `.env` — never hardcoded in test files. CI/CD uses GitHub Secrets.

---

## 🧩 Test Coverage

### E2E Tests
| Category | Payment Methods Tested |
|---|---|
| Individual | Credit Card, Bank Transfer, E-Wallet, Online Banking |
| Business | Delivery, Regular, Pick-Up flows |
| Donation | Donation payment flows |
| BayadCenter | BayadCenter payment integration |
| AutoSweep | RFID AutoSweep transactions |
| Meralco | Meralco bill payment |

Each E2E test validates:
- Page load and form rendering
- Form field interaction and submission
- Payment processing flow
- Success/error state handling
- Email confirmation delivery via Gmail API

### Integration Tests
- API endpoint verification
- Request/response validation
- Payment gateway API integration

### Unit Tests
Isolated unit-level tests per payment category: AutoSweep, BayadCenter, Business, Donation, Individual, Meralco.

---

## ⚙️ Setup

### Prerequisites
- Node.js v16+
- npm
- Gmail API credentials (for email verification tests)
- OWASP ZAP (optional, for security scanning)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
npm install
npx playwright install --with-deps
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

See `.env.example` for the full list of required variables.

---

## ▶️ Running Tests

### Option 1: GUI Dashboard (Recommended)
```powershell
# Windows
RUN_TEST_SUITE.bat

# Mac/Linux
node gui/test-runner.js
```
Then open `http://localhost:3000` in your browser.

Use the **E2E / Integration / Unit** tabs to switch between test types. Enable the **ZAP Security Scan** toggle if you want security scanning during the run.

### Option 2: Command Line

```bash
# Run all E2E tests
npx playwright test e2e_tests/

# Run all unit tests
npx playwright test unit_tests/

# Run integration tests
npx playwright test integration_tests/

# Run a specific test file
npx playwright test e2e_tests/individual/creditcard_payment.spec.js

# Run in headed mode (watch the browser)
npx playwright test --headed

# Run with a specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug
```

### Option 3: VS Code
Use the **Playwright Test** extension — click the ▶️ play button next to any test name.

---

## 🛡️ ZAP Security Scanning

OWASP ZAP can be enabled directly from the dashboard for passive security scanning during E2E and integration test runs.

### Quick Setup
1. Install Java 17+ from https://adoptium.net
2. Download and install ZAP from https://www.zaproxy.org/download/
3. Open ZAP — confirm proxy is running on `localhost:8080`
4. In the test dashboard, toggle **ZAP Security Scan** ON
5. Click **Check Connection** to verify ZAP is reachable
6. Run any E2E or Integration test — all traffic will route through ZAP

### Viewing Results
- **Alerts tab** in ZAP — color-coded by severity (High/Medium/Low/Info)
- **Report → Generate Report** — export as HTML for sharing with the team

### Common Alerts Detected
- Missing security headers (CSP, X-Frame-Options, HSTS)
- Cookies without Secure or SameSite flags
- Information disclosure via debug errors
- X-Content-Type-Options header missing

---

## 📊 Test Reports

```bash
npx playwright show-report
```

Reports include pass/fail results, screenshots, video recordings, and detailed logs.

---

## 🧠 Technical Highlights

- **Express.js GUI** — custom test runner dashboard with E2E/Integration/Unit tabs, device selection, and ZAP toggle
- **ZAP proxy integration** — TCP socket connection checker, env var injection, conditional `playwright.config.js` proxy config
- **Gmail API integration** — automated inbox verification with OAuth2, timestamp filtering, and multi-account support
- **Multi-device emulation** — desktop, mobile, and tablet configurations in a single dropdown
- **Multi-tab flow handling** — uses `context.waitForEvent('page')` to handle payment redirects that open new tabs
- **Graceful error handling** — tests report detailed failure messages with context rather than generic assertion errors
- **GitHub Actions CI/CD** — automated test runs on push with secrets management
- **Three-layer test architecture** — E2E, Integration, and Unit tests in a unified framework and dashboard