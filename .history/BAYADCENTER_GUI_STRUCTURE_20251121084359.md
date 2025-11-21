# 🏦 Bayadcenter GUI - Visual Structure

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🏠 Home › 🏦 Bayadcenter Billers                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🏦 Bayadcenter Biller Test Runner                             │
│  Select a biller and payment method to test.                   │
│  Each biller has pre-configured account details.               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────────────────┐
│                              │                                  │
│  💳 SELECT BILLER            │  ⚙️ PAYMENT METHOD & SETTINGS   │
│                              │                                  │
│  ┌──────────────────────┐    │  📋 Selected Biller: Meralco    │
│  │  📺 Cignal           │    │  💰 Category: Electricity       │
│  │  Cable/Internet      │    │  💳 Payment Method: None        │
│  └──────────────────────┘    │                                  │
│                              │  Payment Methods Available:      │
│  ┌──────────────────────┐    │                                  │
│  │  💧 Maynilad  ✓      │    │  ┌─────────┬─────────┐          │
│  │  Water       [SEL]   │    │  │ 💳 CC   │ 📱 EWL  │          │
│  └──────────────────────┘    │  ├─────────┼─────────┤          │
│                              │  │ 🏦 BT   │ 🪶 OB   │          │
│  ┌──────────────────────┐    │  └─────────┴─────────┘          │
│  │  ⚡ Meralco          │    │                                  │
│  │  Electricity         │    │  🌐 Browser                     │
│  └──────────────────────┘    │  [Chromium ▼]                   │
│                              │                                  │
│  ┌──────────────────────┐    │  👁️ Display Mode                │
│  │  💳 Bankard          │    │  [Headed (Show Browser) ▼]      │
│  │  Credit Cards        │    │                                  │
│  └──────────────────────┘    │  [▶️ Run Test] [🗑️ Clear]       │
│                              │                                  │
│  ┌──────────────────────┐    │  Status: ⚫ Ready               │
│  │  📦 Avon             │    │                                  │
│  │  Distribution        │    │                                  │
│  └──────────────────────┘    │                                  │
│                              │                                  │
└──────────────────────────────┴──────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  📊 TEST OUTPUT                                                 │
│  [Test Output] [Help & Tips]                                   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ⏳ Starting test...                                       │ │
│  │ 🌐 Navigating to JustPayto Bayadcenter...              │ │
│  │ 📋 Selecting Meralco biller...                          │ │
│  │ 📝 Filling account number: 0116417010                  │ │
│  │ 📝 Filling amount: ₱2,000                              │ │
│  │ 💳 Selecting E-Wallet payment method...                │ │
│  │ ✅ Payment completed successfully!                     │ │
│  │ ✉️ Verifying confirmation email...                    │ │
│  │                                                        │ │
│  │ ✅ TEST PASSED!                                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
bayadcenter.html
├── Header Section
│   ├── Breadcrumb Navigation
│   │   └── 🏠 Home › 🏦 Bayadcenter Billers
│   └── Title & Description
│
├── Main Grid (2-column layout)
│   │
│   ├── Left Column: Biller Selection Card
│   │   ├── H2 Title: "💳 Select Biller"
│   │   └── Biller Grid
│   │       ├── Biller Card (Cignal)
│   │       ├── Biller Card (Maynilad)
│   │       ├── Biller Card (Meralco) [SELECTED]
│   │       ├── Biller Card (Bankard)
│   │       └── Biller Card (Avon)
│   │
│   └── Right Column: Configuration Card
│       ├── H2 Title: "⚙️ Payment Method & Settings"
│       ├── Summary Box
│       │   ├── Selected Biller
│       │   ├── Category
│       │   └── Payment Method
│       │
│       ├── Method Section
│       │   ├── H3: "Payment Methods Available:"
│       │   └── Method Grid (2x2)
│       │       ├── 💳 Credit Card
│       │       ├── 📱 E-Wallet
│       │       ├── 🏦 Bank Transfer
│       │       └── 🪶 Online Bank
│       │
│       ├── Controls Section
│       │   ├── Browser Select Dropdown
│       │   └── Display Mode Select Dropdown
│       │
│       ├── Button Group
│       │   ├── ▶️ Run Test (Primary)
│       │   └── ⏹️ Stop Test (Hidden until running)
│       │
│       ├── Clear Button
│       └── Status Indicator
│           ├── Status Dot
│           └── Status Text
│
└── Output Section (Full Width)
    ├── H2 Title: "📊 Test Output"
    ├── Tab Buttons
    │   ├── Test Output [ACTIVE]
    │   └── Help & Tips
    │
    ├── Output Tab Content
    │   └── Output Box (Terminal-style, black background)
    │
    └── Help Tab Content
        ├── How to Use Instructions
        ├── About Billers Information
        ├── Status Indicators Explanation
        └── Payment Methods Reference
```

---

## Biller Card Structure

```
┌─────────────────────────┐
│ 📺 Cignal         (✓)   │  ← Icon, Name, Checkmark (selected)
│                         │
│ CABLE/INTERNET          │  ← Category (uppercase, gray)
└─────────────────────────┘
```

**States:**
- **Unselected:** Gray background, no checkmark
- **Hover:** Slightly elevated (translateY), shadow effect
- **Selected:** Dark blue background, white text, checkmark visible

---

## Payment Method Card Structure

```
┌──────────────┐
│   💳         │  ← Payment icon
├──────────────┤
│ Credit Card  │  ← Payment method name
└──────────────┘
```

**States:**
- **Unselected:** Light blue background, bordered
- **Hover:** Blue border, light blue background
- **Selected:** Dark blue background, white text

---

## Status Indicators

### Status Dot Colors & Animations

```
⚫ Idle    → Gray dot, no animation
🟡 Running → Orange dot, pulsing animation (0.5s opacity change)
🟢 Success → Green dot, no animation
🔴 Error  → Red dot, no animation
```

### Status Text Examples

```
"Ready to run tests"                    [Idle]
"Running: Meralco - E-Wallet"          [Running]
"Meralco - E-Wallet - 45s"             [Completed]
"Test stopped"                          [Stopped]
```

---

## Color Scheme

```
Primary Blue:     #1e3c72   (Dark headers, buttons, selected items)
Secondary Blue:   #2a5298   (Button hover, active states)
Light Blue:       #f0f4f8   (Cards, input backgrounds)
Gray:            #e9ecef / #ddd  (Borders, unselected cards)
White:           #ffffff   (Backgrounds)
Dark:            #333      (Text)
Light Text:      #666 / #999  (Subtext, descriptions)

Success Green:    #27ae60
Error Red:        #e74c3c
Warning Orange:   #f39c12
Terminal:        #1e1e1e (background), #00ff00 (text)
```

---

## Responsive Breakpoints

**Desktop (> 900px):**
- 2-column main grid
- Biller grid: 2 columns
- Payment method grid: 2 columns

**Tablet/Mobile (≤ 900px):**
- 1-column main grid
- Biller grid: 2 columns
- Payment method grid: 1 column

---

## Data Flow Diagram

```
┌─────────────────────┐
│   User Interaction  │
│                     │
│ 1. Click Biller    │
│ 2. Select Method   │
│ 3. Click Run       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  bayadcenter.html   │
│                     │
│ - Updates UI state │
│ - Collects form data│
│ - Sends POST request│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  test-runner.js     │
│  (/api/run-test)    │
│                     │
│ - Receives request  │
│ - Extracts biller ID│
│ - Sets env variable │
│ - Spawns process    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Playwright Test    │
│ (*.spec.js)         │
│                     │
│ - Reads env var     │
│ - Uses biller config│
│ - Runs test flow    │
│ - Outputs to stdout │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  test-runner.js     │
│  (stdout capture)   │
│                     │
│ - Captures output   │
│ - Stores in memory  │
│ - Tracks exit code  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Poll /api/status    │
│                     │
│ - Check if running  │
│ - Get latest output │
│ - Update UI every   │
│   500ms             │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Update GUI Display │
│                     │
│ - Show output       │
│ - Update status     │
│ - Enable/disable btn│
└─────────────────────┘
```

---

## Form Data Structure

**When "Run Test" is clicked:**

```javascript
{
    testPath: "e2e_tests/bayadcenter/ewallet_payment.spec.js",
    browser: "chromium",
    headed: true,
    biller: "meralco"
}
```

**Sent to:** `POST /api/run-test`

---

## Environment Variables

**Backend sets:**
```
BAYADCENTER_BILLER = "meralco"
```

**Test file reads:**
```javascript
const BILLERS_TO_TEST = process.env.BAYADCENTER_BILLER 
    ? [process.env.BAYADCENTER_BILLER] 
    : ['meralco'];
```

---

## Keyboard Navigation

- **Tab** - Cycle through interactive elements
- **Enter** - Click selected button or select biller/method card
- **Escape** - (Could be used to stop test, currently not implemented)

---

## Accessibility Features

✅ Semantic HTML headings (H1, H2, H3)  
✅ Proper form labels and inputs  
✅ Color + icon/text distinction (not color-only)  
✅ Readable contrast ratios  
✅ Focus indicators on interactive elements  
✅ Descriptive button text (not just icons)  

---

## Screen Dimensions

**Minimum:** 320px (mobile)  
**Optimal:** 1200px (desktop)  
**Maximum:** Responsive scales infinitely  

---

**Last Updated:** November 21, 2025
