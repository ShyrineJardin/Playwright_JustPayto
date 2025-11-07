import {test, expect} from '@playwright/test';
import path from 'path';


test('🏦 Bank Transfer payment for individual user', async ({page, context, baseURL, browserName, playwright}) => {

    console.log('💻 Complete Bank Transfer Payment Flow');
    console.log(`🔗 URL: ${process.env.INDIVIDUAL_PAYMENT_URL}`);
    await page.goto(process.env.INDIVIDUAL_PAYMENT_URL);
    await expect(page).toHaveURL(/justpay\.to/);
    console.log('✅ Payment page loaded successfully');

    // Verify message field validation
    console.log('💬 Verifying message field validation');
    console.log('👉 Blank message field should show an error');
    await page.getByRole('button', {name: 'Send Money'}).click();

    const messageError = (await page.locator('body').innerText()).toLowerCase();

    if (!messageError.includes('message is required')) {
        throw new Error('❌ Message field validation failed: No error for blank message field');
    } else {
        console.log('✅ Message field validation works as expected');
    }

    // Fill in message field
    const testMessage = 'BankTransferTest12345';
    console.log(`💬 Filling in message field with: ${testMessage}`)
    await page.locator('#message-order-items-ref').fill(testMessage);
    console.log('✅ Message field filled successfully');

    // Proceed to payment
    console.log('💵 Proceeding to payment');
    await page.getByRole('button', {name: 'Send Money'}).click();
    
    const paymentError = (await page.locator('body').innerText()).toLowerCase();

    if (!paymentError.includes('please select a payment method first')) {
        throw new Error('❌ Payment method selection failed: No payment method selected');
    } else {
        console.log('✅ Payment method selection works as expected');
    }

    // Select credit card payment method
    console.log('💳 Selecting bank transfer payment method');
    await page.locator('#payment-method').click();

    await page.getByAltText('bank_fund_transfer').click();

    console.log('Selecting Philippines as bank transfer country');
    await page.getByAltText('PH').click();
    console.log('✅ Philippines selected as bank transfer country');

    console.log('Selecting BPI for bank transfer')
    await page.getByAltText('bpi').locator('..').first().click();
    console.log('✅ Bank transfer payment method selected');

    await page.getByRole('button', {name: 'Send Money'}).click();

    // Checking for amount error message
    console.log('💬 Checking for amount error message');
    const amountError = (await page.locator('body').innerText()).toLowerCase();

    if (!amountError.includes('please enter an amount first')) {
        throw new Error('❌ Amount error message not displayed');
    } else {
        console.log('✅ Amount error message displayed as expected');
    }

    console.log('💵 Filling in amount');
    await page.locator('#amount-to-pay').fill('100');
    console.log('✅ Amount filled successfully');

    // check if the currency dropdown is working
    console.log('💬 Checking currency dropdown functionality');
    await page.locator('#php[name="currency"]').click();
    await expect (page.locator('ul.MuiList-root')).toBeVisible();
    console.log('✅ Currency dropdown is working as expected');

    console.log('🔙 Looking for Back button')
    await page.getByText('Back').click();

    //clicking send money without clicking the T&C
    console.log('💵 Clicking Send Money without accepting T&C - should error');
    await page.getByRole('button', {name: 'Send Money'}).click();
    const tcError = (await page.locator('body').innerText()).toLowerCase();

    if (!tcError.includes('terms and conditions is required')) {
        throw new Error('❌ T&C error message not displayed when T&C not accepted');
    } else {
        console.log('✅ T&C error message displayed as expected when T&C not accepted');
    }

    //clicking the TC should open new tab
    console.log('💬 Clicking on Terms and Conditions link to open T&C page');
    const [termsPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('a').getByText('Terms and Conditions').click()
    ]);
    await termsPage.waitForLoadState();
    console.log(`✅ New tab opened with URL: ${termsPage.url()}`);
    await expect(termsPage).toHaveURL(/terms-conditions/);
    console.log('✅ T&C page loaded successfully');

    // Close the T&C tab
    await termsPage.close();
    console.log('🔒 T&C page closed');

    // Continue on the main/original tab
    await page.bringToFront();
    console.log('↩️ Back to main payment page');


    // checking the T&C checkbox
    console.log('✅ Accepting Terms and Conditions');
    await page.getByRole('checkbox').check();
    console.log('✅ T&C accepted');
    
    await page.getByRole('button', {name: 'Send Money'}).click();

    //payment page contact information for verification
    console.log('💬 Verifying contact information on payment page');

    await page.getByText('OK').click();
   
    //checking name message error
    const nameError = (await page.locator('body').innerText()).toLowerCase();
    if (!nameError.includes('payer/sender name is required')) {
        throw new Error('❌ Name error message not displayed');
    } else {
        console.log('✅ Name error message displayed as expected');
    }
    console.log('📛 Filling in sender name');

    await page.locator('#your-name').fill(process.env.INDIVIDUAL_USER_NAME);
    console.log('✅ Sender name filled successfully');

    await page.getByText('OK').click();

    //checking email message error
    const emailError = (await page.locator('body').innerText()).toLowerCase();
    if (!emailError.includes('payer/sender email is required')) {
        throw new Error('❌ Email error message not displayed');
    } else {
        console.log('✅ Email error message displayed as expected');
    }

    //filling in email
    console.log('📧 Filling in sender email');
    await page.locator('#your-email').fill(process.env.INDIVIDUAL_USER_EMAIL);
    console.log('✅ Sender email filled successfully');

    await page.getByText('OK').click();

    //checking mobile message error
    const mobileError = (await page.locator('body').innerText()).toLowerCase(); 
    if (!mobileError.includes('payer/sender mobile number is required')) {
        throw new Error('❌ Mobile number error message not displayed');
    } else {
        console.log('✅ Mobile number error message displayed as expected');
    }

    //filling in mobile number
    console.log('📱 Filling in sender mobile number');
    await page.locator('#your-mobile-number').fill(process.env.INDIVIDUAL_USER_MOBILE);
    console.log('✅ Sender mobile number filled successfully');

    await page.getByText('OK').click();

    // Check if KYC fields exist (address field indicates KYC is required)
    const bodyText = await page.locator('body').innerText();
    const addressFieldExists = await page.locator('#your-residential-address').count() > 0;

    if (addressFieldExists && bodyText.toLowerCase().includes('residential address is required')) {
        console.log('🔐 KYC section detected - Processing KYC fields');

        console.log('🏡 Filling in sender residential address for KYC');
        await page.locator('#your-residential-address').fill(process.env.INDIVIUDUAL_USER_ADDRESS);
        console.log('✅ Sender residential address filled successfully');

        await page.getByText('OK').click();

        //check for nationality error
        const nationalityError = (await page.locator('body').innerText()).toLowerCase();
        if (!nationalityError.includes('nationality is required')) {
            throw new Error('❌ Nationality error message not displayed');
        } else {
            console.log('✅ Nationality error message displayed as expected');
        }
        
        //filling in nationality
        console.log('🌎 Filling in nationality');
        await page.locator('#nationality').fill(process.env.INDIVIDUAL_USER_NATIONALITY);
        console.log('✅ Nationality filled successfully');

        await page.getByText('OK').click();

        //check for birthdate error
        const birthdateError = (await page.locator('body').innerText()).toLowerCase();

        if (!birthdateError.includes('birth date is required')) {
            throw new Error('❌ Birthdate error message not displayed');
        } else {
            console.log('✅ Birthdate error message displayed as expected');
        }

        //filling in birthdate
        console.log('🎂 Filling in birthdate');
        await page.locator('#birth-date').fill(process.env.INDIVIDUAL_USER_BIRTHDATE);
        console.log('✅ Birthdate filled successfully');

        await page.getByText('OK').click();

        //check for birthplace error
        const birthplaceError = (await page.locator('body').innerText()).toLowerCase();
        if (!birthplaceError.includes('birth place is required')) {
            throw new Error('❌ Birthplace error message not displayed');
        } else {
            console.log('✅ Birthplace error message displayed as expected');
        }

        //filling in birthplace
        console.log('🏙️ Filling in birthplace');
        await page.locator('#your-place-of-birth').fill(process.env.INDIVIDUAL_USER_BIRTHPLACE);
        console.log('✅ Birthplace filled successfully');

        await page.getByText('OK').click();

        //check for government ID error
        const govIDError = (await page.locator('body').innerText()).toLowerCase();
        if (!govIDError.includes('government-issued id is required')) {
            throw new Error('❌ Government ID error message not displayed');
        } else {
            console.log('✅ Government ID error message displayed as expected');
        }

        const filePath = path.resolve('tests/fixtures/test-image.jpg');

        // Upload Government ID 
        console.log('🆔 Uploading government-issued ID for KYC');
        const govIdInput = page.locator('input[type="file"].FileUpload').first();

        await expect(govIdInput).toBeVisible({ timeout: 10000 });
        await govIdInput.setInputFiles(filePath);
        console.log('✅ Government-issued ID uploaded successfully');

        // Verify file was attached
        const govIdInfo = await govIdInput.evaluate((input) => {
            const file = input.files?.[0];
            if (!file) return null;
            return { name: file.name, sizeMB: (file.size / 1024 / 1024).toFixed(2) };
        });

        if (govIdInfo) {
            console.log(`✅ Government ID attached: ${govIdInfo.name} (${govIdInfo.sizeMB} MB)`);
        } else {
            console.log('⚠️ Could not verify file attachment');
        }

        await page.waitForTimeout(1000);

        // Submit form after ID upload 
        console.log('📨 Submitting form with uploaded ID');
        await page.getByRole('button', { name: 'OK' }).click();
        await page.waitForTimeout(2000);

        // Check for ID validation 
        const bodyTextAfterUpload = (await page.locator('body').innerText()).toLowerCase();
            if (bodyTextAfterUpload.includes('government-issued id is required')) {
                console.error('❌ Form still showing ID required error after valid upload');
                throw new Error('❌ Valid ID upload not recognized by form');
            } else {
                console.log('✅ Form accepted government ID - proceeding to next step');
            }

            // Check for e-signature error 
            if (!bodyTextAfterUpload.includes('e-signature is required')) {
                throw new Error('❌ E-signature error message not displayed');
            } else {
                console.log('✅ E-signature error message displayed as expected');
            }

            // Upload e-signature 
            console.log('✍️ Uploading e-signature');
            const eSignInput = page.locator('input[type="file"].FileUpload').nth(1); // 2nd input for e-signature
            await expect(eSignInput).toBeVisible({ timeout: 10000 });
            await eSignInput.setInputFiles(filePath);
            console.log('✅ E-signature uploaded successfully');

            // Verify e-signature attachment
            const eSignInfo = await eSignInput.evaluate((input) => {
                const file = input.files?.[0];
                if (!file) return null;
                return { name: file.name, sizeMB: (file.size / 1024 / 1024).toFixed(2) };
            });

            if (eSignInfo) {
                console.log(`✅ E-signature attached: ${eSignInfo.name} (${eSignInfo.sizeMB} MB)`);
            } else {
                console.log('⚠️ Could not verify e-signature attachment');
            }

            await page.waitForTimeout(1000);

            // Submit form after e-signature upload 
            console.log('📨 Submitting form with e-signature');
            await page.getByRole('button', { name: 'OK' }).click();

            console.log('🎉 Form submitted successfully after e-signature upload')

            console.log('✅ KYC fields completed successfully');

    } else {
        console.log('🔓 No KYC section detected - Skipping KYC fields');
    }

    //Check if SMS or Email OTP is being used
    console.log('🔐 Checking for OTP verification step');
    const otpPrompt = (await page.locator('body').innerText()).toLowerCase();
    if (otpPrompt.includes('sent to your mobile') && !otpPrompt.includes('email')) {
        console.log('📱 SMS OTP verification detected');

        //Manual OTP entry required
    }else{
        // Email OTP flow
        console.log('📧 Email OTP verification detected');

        const testTriggerTime = Date.now();
        console.log('⌛ Test Trigger time: ', new Date(testTriggerTime).toISOString());

        //search for emails from 30 seconds before test trigger time
        const searchTime = new Date(testTriggerTime - 30000).toISOString();

        const email = await checkEmail({
            from: 'hello@justpay.to',
            to: process.env.INDIVIDUAL_USER_EMAIL,
            subject: 'Verify your Email Address',
            wait_time_sec: 20,
            max_wait_time_sec: 120,
            after: searchTime.toString()
        });

        if(!email){
            throw new Error('❌ OTP email not received within expected time');
        }

    }   
    
});