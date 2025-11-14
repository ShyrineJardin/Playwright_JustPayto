# GitHub Secrets Setup Guide

Your GitHub workflow is now configured to use **GitHub Secrets** for sensitive credentials. This keeps your passwords, API keys, and test data secure.

## How to Add Secrets to GitHub

1. **Go to your repository settings:**
   - Navigate to: `https://github.com/ShyrineJardin/Playwright_JustPayto`
   - Click **Settings** (top menu)
   - Click **Secrets and variables** (left sidebar)
   - Click **Actions**

2. **Add each secret** by clicking "New repository secret" and entering:

### Required Secrets

Copy these values from your `.env` file and add them as GitHub Secrets:

| Secret Name | Value from .env |
|---|---|
| `BASE_URL` | `https://dashboard-dev.justpay.to` |
| `LOGIN_EMAIL` | `qa_user01@justpayto.com` |
| `LOGIN_USERNAME` | `MochiGallery` |
| `LOGIN_PASSWORD` | `K@yumangg1!` |
| `API_URL` | `https://staging.justpay.to/api` |
| `INDIVIDUAL_PAYMENT_URL` | `https://dev.justpay.to/coopersmith` |
| `INDIVIDUAL_USER_NAME` | `Maria Santos` |
| `INDIVIDUAL_USER_EMAIL` | `fpztest.sjardin@gmail.com` |
| `INDIVIDUAL_USER_MOBILE` | `9204591518` |
| `INDIVIDUAL_USER_ADDRESS` | `Makati` |
| `INDIVIDUAL_USER_NATIONALITY` | `Filipino` |
| `INDIVIDUAL_USER_BIRTHDATE` | `010101` |
| `INDIVIDUAL_USER_BIRTHPLACE` | `Makati` |
| `INDIVIDUAL_CARD_NUMBER` | `4242424242424242` |
| `INDIVIDUAL_CARD_EXP` | `05/31` |
| `INDIVIDUAL_CARD_CVV` | `100` |
| `INDIVIDUAL_CARD_STREETLINE_1` | `123 Test Ave` |
| `INDIVIDUAL_CARD_STREETLINE_2` | `Apt 4B` |
| `INDIVIDUAL_CARD_PROVINCE` | `CA` |
| `INDIVIDUAL_CARD_POSTAL` | `94105` |
| `INDIVIDUAL_MERCHANT_EMAIL` | `fpz.test1@gmail.com` |
| `BUSINESS_PAYMENT_URL` | `https://dev.justpay.to/mochigallery` |
| `BUSINESS_USER_NAME` | `Juan Dela Cruz` |
| `BUSINESS_USER_EMAIL` | `fpz.test1@gmail.com` |
| `BUSINESS_USER_MOBILE` | `9204591518` |
| `BUSINESS_USER_DELIVERY_ADDRESS` | `123 Katipunan Avenue, Barangay Loyola Heights` |
| `BUSINESS_MERCHANT_EMAIL` | `fpztest.sjardin@gmail.com` |
| `BAYADCENTER_PAYMENT_URL` | `https://dev.justpay.to/bayadcenter` |
| `GAWADKALINGA_PAYMENT_URL` | `https://dev.justpay.to/gawadkalinga` |
| `AUTOSWEEP_PAYMENT_URL` | `https://dev.justpay.to/autosweeprfid` |
| `AUTOSWEEP_PLATE_NUMBER` | `AAA111` |

## How to Add Secrets via GitHub CLI (Optional - Faster)

If you have [GitHub CLI](https://cli.github.com/) installed:

```bash
gh secret set BASE_URL --body "https://dashboard-dev.justpay.to"
gh secret set LOGIN_EMAIL --body "qa_user01@justpayto.com"
gh secret set LOGIN_PASSWORD --body "K@yumangg1!"
# ... repeat for all secrets
```

## Verify Setup

1. Go to **Settings > Secrets and variables > Actions**
2. You should see all secrets listed (values are hidden for security)
3. Push a commit to trigger the workflow
4. Check **Actions** tab to see if tests run with your secrets

## Security Notes

✅ **Good practices:**
- Secrets are encrypted and never shown in logs
- Only used when running GitHub Actions
- Rotated when passwords change

⚠️ **Never:**
- Commit `.env` file with real credentials
- Add secrets to code or logs
- Share secret values in issues/PRs

## Troubleshooting

If tests still fail in GitHub:

1. **Check Actions logs:**
   - Go to **Actions** tab
   - Click the failed workflow
   - Expand job logs to see what went wrong

2. **Verify all secrets are set:**
   - Missing secrets will show as empty (`null`) in tests

3. **Test locally first:**
   - Run tests locally: `npx playwright test --headed`
   - If they pass locally but fail in GitHub, it's usually missing secrets

