# 🧪 Playwright Test Runner - Non-Technical QA Guide

## For QA Team Members (No VS Code Required!)

This guide is for anyone who needs to run tests **without opening VS Code or a terminal**.

---

## ✅ Quick Start (2 Steps)

### Step 1: Install (First Time Only)
1. Open **Windows Explorer** (File Manager)
2. Navigate to: `C:\Users\Shyrine\Documents\GitHub\Playwright_JustPayto`
3. Look for file: **`RUN_TEST_SUITE.bat`**
4. **Double-click it** 🖱️
5. Wait for the browser to open automatically
6. On first run, it will install dependencies (~2 minutes)

### Step 2: Run Tests
1. Double-click **`RUN_TEST_SUITE.bat`** anytime you want to run tests
2. A beautiful dashboard opens in your browser
3. **Click on a test** from the list
4. **Click "Run Test"** button
5. Watch the test run in real-time! 👀

---

## 📊 The Dashboard Explained

When you run the `.bat` file, you'll see a web dashboard with:

### Left Side: Test Selection
- Shows all available tests organized by category
- **Click any test** to select it (it will highlight)
- Tests are grouped like: `individual/creditcard_payment`, `business/donation`, etc.

### Right Side: Test Configuration
- **🌐 Browser**: Choose which browser to test (Chromium, Firefox, Safari)
  - **Chromium** = Recommended (fastest)
  - **Firefox** = For cross-browser testing
  - **Safari** = For Apple compatibility

- **👁️ Display Mode**: 
  - **Headed (Show Browser)** = You see the browser window open and run the test ✅ Best for debugging
  - **Headless (Hidden)** = Test runs quietly in background ✅ Faster

- **▶️ Run Test Button**: Starts the selected test
- **⏹️ Stop Test Button**: Stops a running test
- **🗑️ Clear Output**: Clears the output log

### Bottom: Test Output
- Shows what the test is doing in real-time
- Green text on black background (like a terminal but nicer!)
- Watch for:
  - ✅ **`✅ TEST PASSED!`** = Success! 
  - ❌ **`❌ TEST FAILED`** = Something went wrong

---

## 🎯 Example: Running Your First Test

1. **Double-click** `RUN_TEST_SUITE.bat`
2. Browser opens with the dashboard
3. **Select** a test like `individual > creditcard_payment`
4. **Browser**: Leave as Chromium
5. **Display**: Select "Headed (Show Browser)" to watch it run
6. **Click** "▶️ Run Test"
7. Watch the magic happen! 🪄
   - Browser will open
   - Test will fill in form fields
   - Test will click buttons
   - Test will verify results

---

## ⏱️ How Long Do Tests Take?

- **Individual payment test** (~3-5 minutes)
- **Business payment test** (~4-6 minutes)
- **Multiple tests** (depends on what you select)

Tests automatically:
- ✅ Fill in form fields from your configuration
- ✅ Click buttons
- ✅ Verify payment went through
- ✅ Check confirmation emails
- ✅ Report if anything failed

---

## 🐛 Common Questions

### Q: The browser won't open
**A:** 
1. Make sure the command window says "Test Runner is starting"
2. Wait 5-10 seconds
3. Manually open browser and go to: `http://localhost:3000`

### Q: I see an error message
**A:** 
1. Check the output box - it shows what went wrong
2. Common issues:
   - Test credentials expired → Ask admin to update
   - Internet connection lost → Check WiFi
   - Environment variables missing → Ask IT team

### Q: Can I run multiple tests at once?
**A:** No, one at a time. But tests are fast! 
- Wait for one to finish (check for ✅ or ❌)
- Then select another and run it

### Q: I want to see the browser run the test
**A:** 
1. Select a test
2. Set **Display Mode** to "Headed (Show Browser)"
3. Click "Run Test"
4. Browser window will open and you can watch!

### Q: I want faster results
**A:**
1. Set **Display Mode** to "Headless (Hidden)"
2. Tests run ~20% faster since they don't have to render the browser window

### Q: How do I stop a running test?
**A:** 
1. Click the **"⏹️ Stop Test"** button
2. Test stops immediately
3. You can run another test

### Q: Where do I see test results?
**A:**
1. **Quick result**: See ✅ or ❌ at the bottom of the output
2. **Detailed results**: Click "Help & Tips" tab for status indicators
3. **Full report**: Check `playwright-report` folder (ask IT if you need this)

---

## 🔧 Advanced Tips (For Power Users)

### Customizing Test Data
Your test data is stored in: `.env` file
- Usernames, passwords, emails, card numbers
- Ask IT team if you need to change test credentials

### Viewing Detailed Reports
After a test runs:
1. Open **`playwright-report`** folder in project
2. Find **`index.html`** file
3. Open in browser to see detailed pass/fail results

### Running Specific Test Categories
Tests are organized by category. The dashboard shows them grouped:
- **individual/** = Individual payment tests
- **business/** = Business payment tests
- **donation/** = Donation tests
- **bayadcenter/** = Bayadcenter tests

---

## ✨ Benefits of This Approach

✅ **No Terminal** - Just click buttons in a nice dashboard
✅ **No VS Code** - No code editor needed
✅ **No Technical Skills** - If you can click a button, you can run tests
✅ **Real-Time Feedback** - Watch what's happening
✅ **Easy Debugging** - See error messages clearly
✅ **Repeatable** - Run same test 100 times consistently
✅ **Automated** - Tests do the work, you just watch

---

## 📞 Troubleshooting Support

If something doesn't work:

1. **Check the output** - It usually tells you what went wrong
2. **Try again** - Sometimes network hiccups happen
3. **Restart** - Close the dashboard and run `.bat` file again
4. **Ask IT Team** - If errors persist, share the error message

---

## 🎉 You're All Set!

You now have a professional test automation dashboard that requires:
- ✅ No coding knowledge
- ✅ No terminal commands
- ✅ Just point and click!

**Happy testing!** 🚀

---

**File Location:**
```
C:\Users\Shyrine\Documents\GitHub\Playwright_JustPayto\RUN_TEST_SUITE.bat
```

**Just double-click to get started!**
