import {test, expect} from '@playwright/test';
import path from 'path';
import { checkEmail, extractOTP, checkMerchantEmail } from '../../helpers/gmail-helper.js';


test('🤲 Credit Card payment for Donation', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

    console.log('💻 Complete Credit Card Payment Flow for donation');
    console.log(`🔗 URL: ${process.env.GAWADKALINGA_PAYMENT_URL}`);

    await page.goto(process.env.GAWADKALINGA_PAYMENT_URL);
    await expect(page).toHaveURL(/justpay\.to/);
    console.log('✅ GawadKalinga Payment page loaded successfully');

    console.log('💸 Click "Donate Now" button')
    await page.locator('button:has-text("Donate Now")').click();
    console.log('✅ "Donate Now" button clicked');

    console.log('💬 Verifying message field validation');
    console.log('👉 Blank message field should show an error');
    await page.getByRole('button', {name: 'Donate Now'}).click();

    const messageError = (await page.locator('body').innerText()).toLowerCase();

    if (!messageError.includes('message is required')) {
        throw new Error('❌ Message field validation failed: No error for blank message field');
    } else {
        console.log('✅ Message field validation works as expected');
    }

    // Fill in message field
    const testMessage = 'CreditCardDonationTest12345';
    console.log(`💬 Filling in message field with: ${testMessage}`)
    await page.locator('#what-is-your-donation-for-add-a-message-or-additional-notes').fill(testMessage);
    console.log('✅ Message field filled successfully');

    await page.getByRole('button', {name: 'Donate Now'}).click();

    // payment error validation
    console.log('💬 Verifying payment method selection validation');
    console.log('👉 No payment method selected should show an error');
    await page.getByRole('button', {name: 'Donate Now'}).click();

    const paymentError = (await page.locator('body').innerText()).toLowerCase();

    if (!paymentError.includes('please select a payment method first')) {
        throw new Error('❌ Payment method selection failed: No payment method selected');
    } else {
        console.log('✅ Payment method selection works as expected');
    }

    // Select credit card payment method
    console.log('💳 Selecting credit card payment method');
    await page.locator('#payment-method').click();

    await page.getByAltText('mastercard_visa').click();
    await page.getByAltText('credit_card').click();
    console.log('✅ Credit card payment method selected');

    // Test Credit Card Form Validation
    console.log('💳 Testing Credit Card Form Validation');
    console.log('⚠️ Clicking OK with empty Account holder name should show error');

    
    // Click OK button 
    await page.getByText('OK').click();

    // Check for the account holder name error
    const accountnameError = (await page.locator('body').innerText()).toLowerCase(); 
    if (!accountnameError.includes('account holder name is required')) {
        throw new Error('❌ Expected error message "Account Holder Name is required" not found.');
    } else {
        console.log('✅ Error message for account holder name appeared');
    }

    
    // Fill Account Name Holder
    console.log('🪪 Entering Account Name Holder');
    await page.locator('input#account-holder-s-full-name').fill(process.env.INDIVIDUAL_USER_NAME);
    console.log('✅ Account name field filled successfully');

    // await page.getByText('OK').click();

    // // Check for the card number error
    // const cardnumError = (await page.locator('body').innerText()).toLowerCase(); 
    // if (!cardnumError.includes('card number is required')) {
    //     throw new Error('❌ Expected error message "Card Number is required" not found');
    // } else {
    //     console.log('✅ Error message for card number appeared');
    // }

    // Fill Card number
    console.log('🔢 Entering Card Number');
    await page.locator('input#card-number').fill(process.env.INDIVIDUAL_CARD_NUMBER);
    console.log('✅ Card Number field filled successfully');

    // await page.getByText('OK').click();

    // // Check for the card expiration date error
    // const cardexpError = (await page.locator('body').innerText()).toLowerCase();
    // if (!cardexpError.includes('expiration date (mm/yy) is required')) {
    //     throw new Error('❌ Expected error message "Expiration Date (MM/YY) is required" not found.');
    // } else {
    //     console.log('✅ Error message for expiration date appeared');
    // }

    // Fill Expiration Date
    console.log('🔢 Entering Card Expiration Date');
    await page.locator('input#expiration-date-mm-yy').fill(process.env.INDIVIDUAL_CARD_EXP);
    console.log('✅ Card expiration field filled successfully');

    // await page.getByText('OK').click();

    // // Check for the card ccv error
    // const ccvErrorr = (await page.locator('body').innerText()).toLowerCase();
    // if (!ccvError.includes('ccv or cvc (back of the card) is required')) {
    //     throw new Error('❌ Expected error message "CCV or CVC (back of the card) is required" not found.');
    // } else {
    //     console.log('✅ Error message for ccv appeared');
    // }

    // Fill CCV
    console.log('🔢 Entering Card CCV');
    await page.locator('input#ccv-or-cvc-back-of-the-card').fill(process.env.INDIVIDUAL_CARD_CVV);
    console.log('✅ Card ccv field filled successfully');

    // await page.getByText('OK').click();

    // //checking email message error
    // const emailError = (await page.locator('body').innerText()).toLowerCase();
    // if (!emailError.includes('payer/sender email is required')) {
    //     throw new Error('❌ Email error message not displayed');
    // } else {
    //     console.log('✅ Email error message displayed as expected');
    // }
    
    //filling in email
    console.log('📧 Filling in sender email');
    await page.locator('#your-email').fill(process.env.INDIVIDUAL_USER_EMAIL);
    console.log('✅ Sender email filled successfully');

    // await page.getByText('OK').click();

    // //checking mobile message error
    // const mobileError = (await page.locator('body').innerText()).toLowerCase(); 
    // if (!mobileError.includes('payer/sender mobile number is required')) {
    //     throw new Error('❌ Mobile number error message not displayed');
    // } else {
    //     console.log('✅ Mobile number error message displayed as expected');
    // }
    
    //filling in mobile number
    console.log('📱 Filling in sender mobile number');
    await page.locator('#your-mobile-number').fill(process.env.INDIVIDUAL_USER_MOBILE);
    console.log('✅ Sender mobile number filled successfully');

    await page.getByText('OK').click();

    // Check if address fields are required (for non-Philippine cards)
    console.log('🌍 Checking if international card address fields are required');

    const streetLine1Input = page.locator('input#your-card-street-line-1');
    const isStreetLine1Visible = await streetLine1Input.isVisible().catch(() => false);
    if (isStreetLine1Visible) {
        console.log('🌎 International card detected - Address fields are required');
        
        //checking mobile message error
        const streetline1Error = (await page.locator('body').innerText()).toLowerCase(); 
        if (!streetline1Error.includes('card street line 1 is required')) {
            throw new Error('❌  Expected error message "Card Street Line 1 is required" not found.');
        } else {
            console.log('✅ Error message for street line 1 appeared');
        }

        // Fill street line 1
        console.log('📧 Entering Card Street Line 1');
        await page.locator('input#your-card-street-line-1').fill(process.env.INDIVIDUAL_CARD_STREETLINE_1);
        console.log('✅  Card Street Line 1 filled successfully');

        await page.getByText('OK').click();

        // Check for street line 2 error
        const streetline2Error = (await page.locator('body').innerText()).toLowerCase(); 
        if (!streetline2Error.includes('card street line 2 is required')) {
            throw new Error('❌ Expected error message "Card Street Line 2 is required" not found.');
        } else {
            console.log('✅ Error message for street line 2 appeared');
        }

        // Fill street line 2
        console.log('📧 Entering Card Street Line 2');
        await page.locator('input#your-card-street-line-2').fill(process.env.INDIVIDUAL_CARD_STREETLINE_2);
        console.log('✅ Card Street Line 2 filled successfully');

        await page.getByText('OK').click();

        // Check for province state error
        const provinceError = (await page.locator('body').innerText()).toLowerCase(); 
        if (!provinceError.includes('card province state is required')) {
            throw new Error('❌ Expected error message "Card Province State is required" not found.');
        } else {
            console.log('✅ Error message for province state appeared');
        }

        // Fill province state
        console.log('📧 Entering Card Province State');
        await page.locator('input#your-card-province-state').fill(process.env.INDIVIDUAL_CARD_PROVINCE);
        console.log('✅ Card Province State filled successfully');

        await page.getByText('OK').click();

        // Check for postal code error
        const postalError = (await page.locator('body').innerText()).toLowerCase(); 
        if (!postalError.includes('card postal code is required')) {
            throw new Error('❌ Expected error message "Card Postal Code is required" not found.');
        } else {
            console.log('✅ Error message for postal code appeared');
        }

        // Fill postal code
        console.log('📧 Entering Card Postal Code');
        await page.locator('input#your-card-postal-code').fill(process.env.INDIVIDUAL_CARD_POSTAL);
        console.log('✅ Card Postal Code filled successfully');

        await page.getByText('OK').click();

    } else {
        console.log('🇵🇭 Philippine card detected - Address fields not required, skipping');
    }

    console.log('✅ Credit card form submitted successfully');

    await page.getByRole('button', {name: 'Donate Now'}).click();

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
    await page.getByRole('button', {name: 'Donate Now'}).click();
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
    
    await page.getByRole('button', {name: 'Donate Now'}).click();

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
        console.log('📛 Re-enter sender name');
    
        await page.locator('#your-name').fill(process.env.INDIVIDUAL_USER_NAME);
        console.log('✅ Sender name filled successfully');
    
        await page.getByText('OK').click();
    
    // Check if email field is already filled
const emailValue = await page.locator('#your-email').inputValue();

if (!emailValue || emailValue.trim() === '') {
    console.log('📧 Email field is empty, proceeding with validation...');
    
    // Click to trigger email error
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
} else {
    console.log('✅ Email field already filled, skipping email validation');
}

// Check if mobile number field is already filled
const mobileValue = await page.locator('#your-mobile-number').inputValue();

if (!mobileValue || mobileValue.trim() === '') {
    console.log('📱 Mobile number field is empty, proceeding with validation...');
    
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
    } else {
        console.log('✅ Mobile number field already filled, skipping mobile validation');
    }

    // Check if KYC fields exist (address field indicates KYC is required)
     const bodyText = await page.locator('body').innerText();
     const addressFieldExists = await page.locator('#your-residential-address').count() > 0;

     if (addressFieldExists && bodyText.toLowerCase().includes('residential address is required')) {
         console.log('🔐 KYC section detected - Processing KYC fields');

         console.log('🏡 Filling in sender residential address for KYC');
         await page.locator('#your-residential-address').fill(process.env.INDIVIDUAL_USER_ADDRESS);
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

    await page.locator('input#enter-the-code').waitFor({ state: 'visible', timeout: 15000 });

    // Get the specific OTP instruction text (not entire page)
    const otpInstruction = await page.locator('p:has-text("Enter the code")').innerText();
    const instructionLower = otpInstruction.toLowerCase();

    console.log('📄 OTP instruction text:', otpInstruction);

    const isSmsOtp = (
        (instructionLower.includes('mobile') || instructionLower.includes('phone')) &&
        !instructionLower.includes('email')
    );
    
    if (isSmsOtp) {
        console.log('📱 SMS OTP verification detected');    
        // Increase timeout for manual entry
        test.setTimeout(120000); // 2 minutes total
        
        console.log('⚠️ Manual SMS OTP entry required - cannot proceed automatically');
        console.log('📲 Waiting for SMS OTP ...')
        console.log('⏸️ Test Pause - Please enter the complete 6-digit OTP');    
        const otpInput = page.locator('input#enter-the-code');
        
        // Wait for the user to enter a complete 6-character OTP
        await page.waitForFunction(
            (selector) => {
                const input = document.querySelector(selector);
                return input && input.value.length === 6;
            },
            'input#enter-the-code',
            { timeout: 90000 } // 90 seconds to enter OTP
        );  

        console.log('✅ Complete OTP detected (6 digits entered)');

        // Small delay to ensure form validation completes
        await page.waitForTimeout(1000);

        // Now click the submit button
        console.log('📥 Submitting OTP code...');
        await page.locator('button[type="submit"]').first().click();    
        const bodyText = await page.locator('body').innerText();
        if (bodyText.toLowerCase().includes('invalid code')) {
            throw new Error('❌ OTP submission failed: Invalid or expired code');
        } else {
            console.log('✅ OTP submitted successfully and verified - Proceeding to payment summary');
        }

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
    
            console.log('✅ OTP email received');
            
            const emailContent = JSON.stringify(email);
    
            console.log('💬 Extracting OTP from email content:', emailContent.length);
            console.log('📄 Email content snippet: ', emailContent.substring(0, 500));
    
            const otpCode = extractOTP(email);
    
             // Validate OTP was extracted
            if (!otpCode) {
                const emailContent = JSON.stringify(email);
                console.log('❌ Failed to extract OTP from email');
                console.log('📄 Full email content for debugging:', emailContent.substring(0, 1000));
                throw new Error('Could not extract OTP code from email content');
            }
            
            // Validate OTP format
            expect(otpCode, 'OTP should be 6 characters').toHaveLength(6);
            expect(otpCode, 'OTP should be alphanumeric').toMatch(/^[A-Z0-9]{6}$/i);
            
            console.log('✅ Valid OTP code extracted:', otpCode);
    
            //entering OTP code
            const otpInput = page.locator('input#enter-the-code');
            console.log('⌨️ Entering OTP code into input field');
            await otpInput.fill(otpCode);
            console.log('✅ OTP code entered successfully');
    
            await page.locator('button[type="submit"]').first().click();
    
            //verifify otp submission result
            const bodyText = await page.locator('body').innerText();
            if (bodyText.toLowerCase().includes('invalid code')) {
                throw new Error('❌ OTP submission failed: Invalid or expired code');
            } else {
                console.log('✅ OTP submitted successfully and verified');
            }
        } 
    
    // Payment summary verification
    console.log('💬 Verifying payment summary page')
    await page.getByText('Payment Summary').waitFor({ state: 'visible', timeout: 15000});

    console.log('✅ Payment summary page loaded successfully');

    //verify payment details
    await expect(page.getByText('CreditCardDonationTest12345')).toBeVisible();
    console.log('✅ Message Verified');

    console.log('💸 Verifying Payment Amount from the Summary Table');
    const subTotalRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Sub Total' });
    const subTotal = await subTotalRow.locator('td').nth(1).innerText();
    console.log(`✅ Sub Total: ${subTotal}`);
    expect(subTotal).toContain('100.00');

    // KYC Information verification
    console.log('🔍 Verifying KYC Information from Summary Table');

    // Name
    console.log('📛 Checking Name...');
    const nameRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Name' });
    const name = await nameRow.locator('td').nth(1).innerText();
    console.log(`✅ Name verified: ${name}`);
    expect(name.toLowerCase()).toContain(process.env.INDIVIDUAL_USER_NAME.toLowerCase());

    // Email
    console.log('📧 Checking Email...');
    const emailRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Email' });
    const email = await emailRow.locator('td').nth(1).innerText();
    console.log(`✅ Email verified: ${email}`);
    expect(email.toLowerCase()).toBe(process.env.INDIVIDUAL_USER_EMAIL.toLowerCase());

    // Mobile
    console.log('📱 Checking Mobile Number...');
    const mobileRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Mobile Number' });
    const mobile = await mobileRow.locator('td').nth(1).innerText();
    console.log(`✅ Mobile verified: ${mobile}`);
    expect(mobile).toContain(process.env.INDIVIDUAL_USER_MOBILE);

    // Address
    console.log('📍 Checking Address...');
    const addressExists = await page.locator('.MuiTable-root tbody tr', { hasText: 'Your Address' }).count();
    if (addressExists > 0) {
      const addressRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Address' });
      const address = await addressRow.locator('td').nth(1).innerText();
      console.log(`✅ Address verified: ${address}`);
      expect(address.toLowerCase()).toContain(process.env.INDIVIDUAL_USER_ADDRESS.toLowerCase());
    } else {
      console.log('ℹ️ Address field not found - skipping');
    }

    // Nationality
    console.log('🗺️ Checking Nationality...');
    const nationalityExists = await page.locator('.MuiTable-root tbody tr', { hasText: 'Your Nationality' }).count();
    if (nationalityExists > 0) {
      const nationalityRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Nationality' });
      const nationality = await nationalityRow.locator('td').nth(1).innerText();
      console.log(`✅ Nationality verified: ${nationality}`);
      expect(nationality.toLowerCase()).toContain(process.env.INDIVIDUAL_USER_NATIONALITY.toLowerCase());
    } else {
      console.log('ℹ️ Nationality field not found - skipping');
    }

    // Date of Birth
    console.log('📅 Checking Date of Birth...');
    const dobExists = await page.locator('.MuiTable-root tbody tr', { hasText: 'Your Date of Birth' }).count();
    if (dobExists > 0) {
      const dobRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Date of Birth' });
      const dob = await dobRow.locator('td').nth(1).innerText();
      console.log(`✅ Date of Birth verified: ${dob}`);

      const actualDob = dob.replace(/\D/g, ''); // removes all non-digits
      const expectedDob = (process.env.INDIVIDUAL_USER_BIRTHDATE ?? '').replace(/\D/g, '');

      expect(actualDob).toContain(expectedDob);
    } else {
      console.log('ℹ️ Date of Birth field not found - skipping');
    }

    // Place of Birth
    console.log('🚼 Checking Place of Birth...');
    const pobExists = await page.locator('.MuiTable-root tbody tr', { hasText: 'Your Place of Birth' }).count();
    if (pobExists > 0) {
      const pobRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Your Place of Birth' });
      const pob = await pobRow.locator('td').nth(1).innerText();
      console.log(`✅ Place of Birth verified: ${pob}`);
      expect(pob.toLowerCase()).toContain(process.env.INDIVIDUAL_USER_BIRTHPLACE.toLowerCase());
    } else {
      console.log('ℹ️ Place of Birth field not found - skipping');
    }

    // Payment Method
    console.log('💳 Checking Payment Method...');
    const paymentRow = page.locator('.MuiTable-root tbody tr', { hasText: 'Source of Fund' });
    const paymentMethod = await paymentRow.locator('td').nth(1).innerText();
    console.log(`✅ Payment Method verified: ${paymentMethod}`);
    expect(paymentMethod).toContain('Credit Card');

    // IP Address
    console.log('🌐 Verifying IP Address Information');
    const ipText = await page.locator('.MuiTypography-h6', { hasText: 'your current IP address' }).locator('span').innerText();
    const cleanedIP = ipText.replace(/[()]/g, '').trim();
    console.log(`✅ IP Address logged: ${cleanedIP}`);
    expect(cleanedIP).toMatch(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);

    console.log('🎉 All Payment Summary validations passed successfully');
    console.log('✅ Payment Summary Validation Complete');

    // scroll to button
    const confirmButton = page.locator('button', { hasText: 'Confirm' }).first();
    await confirmButton.click();


    console.log('🔃 Processing Transaction')
    console.log('Checkin/Agreeing Authentication Checkbox');
    await page.locator('input[name="acknowledge"]').check();
    
    
    console.log('👆 Clicking Continue button')
});