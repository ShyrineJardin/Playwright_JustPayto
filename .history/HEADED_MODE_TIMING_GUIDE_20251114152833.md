# Headed Mode Timing Best Practices

## Problem: Headed vs Headless Race Conditions

When running tests in **headless mode** vs **headed mode** through the GUI, you may encounter timing issues where:
- ✅ Headless tests pass (browser runs optimized without rendering to screen)
- ❌ Headed tests fail (browser must render to screen, adding variable delays)

The most common failure point is **error message assertions** that immediately follow user actions like button clicks or form submissions.

## Root Cause

In headed mode, the browser takes time to:
1. Process the user action (click, fill, etc.)
2. Execute JavaScript event handlers
3. Update the DOM with error messages or validation feedback
4. Render changes to the screen

Your assertion runs **before** the DOM update completes.

## Solution: Strategic Waits Before Error Message Checks

**When to add a wait:**
- After clicking a button
- After filling a form field
- After any user action that triggers validation
- **Before** reading the page content to check for error messages

**Recommended pattern:**

```javascript
// User action (click, fill, etc.)
await page.getByRole('button', {name: 'Send Money'}).click();

// Add wait to allow DOM to update
await page.waitForTimeout(500); // 500ms is typical minimum

// Now check for error message
const errorText = (await page.locator('body').innerText()).toLowerCase();
if (!errorText.includes('expected error message')) {
    throw new Error('❌ Error message not displayed');
}
```

## Standard Wait Times

| Scenario | Wait Time | Reason |
|----------|-----------|--------|
| Simple validation error | 300-500ms | DOM update is fast |
| File upload with processing | 1000-2000ms | File processing takes time |
| Page navigation | 1000-3000ms | Full page render |
| Form submission | 500-1000ms | Server response + DOM update |

## Examples from banktransfer_payment.spec.js

### Example 1: Message Validation
```javascript
// ❌ OLD (fails in headed mode)
await page.getByRole('button', {name: 'Send Money'}).click();
const messageError = (await page.locator('body').innerText()).toLowerCase();

// ✅ NEW (works in both modes)
await page.getByRole('button', {name: 'Send Money'}).click();
await page.waitForTimeout(500); // Allow page to render error message
const messageError = (await page.locator('body').innerText()).toLowerCase();
```

### Example 2: KYC Field Validation
```javascript
// ❌ OLD (fails in headed mode)
await page.getByText('OK').click();
const nameError = (await page.locator('body').innerText()).toLowerCase();

// ✅ NEW (works in both modes)
await page.getByText('OK').click();
await page.waitForTimeout(500); // Allow page to render error message
const nameError = (await page.locator('body').innerText()).toLowerCase();
```

## Testing Your Changes

After applying these fixes, test in both modes:

```bash
# Headless mode (should still work)
npm run test

# Headed mode (now should also work)
# Use the GUI at http://localhost:3000 or run:
npx playwright test <testfile> --project=chromium --headed
```

## Files Updated

✅ `e2e_tests/individual/banktransfer_payment.spec.js` - 11 waits added before error message checks

### Files That May Need Similar Fixes

Review these files for error message assertions without waits:
- `e2e_tests/individual/creditcard_payment.spec.js`
- `e2e_tests/individual/ewallet_payment.spec.js`
- `e2e_tests/individual/onlinebank_payment.spec.js`
- `e2e_tests/business/*/banktransfer_payment.spec.js` (delivery, regular, pick-up)
- `e2e_tests/business/*/creditcard_payment.spec.js`
- `e2e_tests/donation/banktransfer_payment.spec.js`
- And similar pattern across all payment test files

## Quick Checklist for New Tests

When writing new tests, use this checklist:

- [ ] After each `.click()` that triggers validation → Add `await page.waitForTimeout(500)`
- [ ] After each `.fill()` that triggers validation → Add `await page.waitForTimeout(300-500)`
- [ ] Before reading page content for error messages → Always add a wait
- [ ] Test in headed mode first to catch timing issues early
- [ ] Document any longer waits (>1000ms) with comments explaining why

## Performance Note

Adding 500ms waits increases test runtime slightly, but **reliability is more important than speed**. A 10-second test that fails randomly is worse than a 15-second test that always passes.

For CI/CD pipelines, all tests run in headless mode (which is faster), so the added waits only slightly impact overall pipeline time.

## Questions?

If tests still fail in headed mode after adding waits:
1. Check browser console for JavaScript errors
2. Increase wait time to 1000ms temporarily to isolate timing issues
3. Use `await page.screenshot()` to debug what the page looks like at failure point
4. Review Playwright documentation on `waitFor()` and `waitForFunction()` for alternative strategies
