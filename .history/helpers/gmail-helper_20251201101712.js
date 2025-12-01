// import gmail from 'gmail-tester';
// import path from 'path';

// // Gmail credentials paths matching your config
// const credentialPathUser = path.resolve(process.cwd(), 'playwright_individual_user.json');
// const tokenPathUser = path.resolve(process.cwd(), 'playwright_individual_token.json');

// const credentialPathMerchant = path.resolve(process.cwd(), 'playwright_individual_merchant.json');
// const tokenPathMerchant = path.resolve(process.cwd(), 'playwright_individual_merchant_token.json');

// /**
//  * Check email inbox - main function for your tests
//  * @param {Object} options - Email search options
//  * @param {string} options.from - Sender email
//  * @param {string} options.to - Recipient email
//  * @param {string} options.subject - Email subject to search for
//  * @param {number} [options.wait_time_sec=20] - Wait time between checks in seconds
//  * @param {number} [options.max_wait_time_sec=120] - Maximum wait time in seconds
//  * @param {string} [options.after] - ISO string - search for emails after this time
//  * @returns {Promise<Object|null>} Email object or null if not found
//  */
// export async function checkEmail(options) {
//   const { 
//     from, 
//     to, 
//     subject, 
//     wait_time_sec = 20, 
//     max_wait_time_sec = 120, 
//     after 
//   } = options;
  
//   try {
//     console.log('🔍 Checking Gmail inbox...');
//     console.log(`   From: ${from}`);
//     console.log(`   To: ${to}`);
//     console.log(`   Subject: ${subject}`);
//     console.log(`   After: ${after || 'any time'}`);
//     console.log(`   Wait time: ${wait_time_sec}s, Max: ${max_wait_time_sec}s`);
    
//     // Convert ISO string to Date if provided
//     const afterDate = after ? new Date(after) : undefined;
    
//     const email = await gmail.check_inbox(
//       credentialPathUser,
//       tokenPathUser,
//       {
//         subject: subject,
//         to: to,
//         from: from,
//         include_body: true,
//         wait_time_sec: wait_time_sec,
//         max_wait_time_sec: max_wait_time_sec,
//         after: afterDate
//       }
//     );

//     if (email) {
//         console.log('✅ User email found');
//         console.log(`   Subject: ${email.subject}`);
//         }
        
//         return email;
//     } catch (error) {
//         console.error('❌ Gmail check error:', error.message);
//         return null;
//     }
// }

// /**
//  * Check merchant email inbox
//  * @param {Object} options - Same as checkEmail
//  * @returns {Promise<Object|null>} Email object or null
//  */
// export async function checkMerchantEmail(options) {
//   const { 
//     from, 
//     to, 
//     subject, 
//     wait_time_sec = 20, 
//     max_wait_time_sec = 120, 
//     after 
//   } = options;
  
//   try {
//     console.log('🔍 Checking merchant Gmail inbox...');
//     console.log(`   From: ${from}`);
//     console.log(`   To: ${to}`);
//     console.log(`   Subject: ${subject}`);
    
//     const afterDate = after ? new Date(after) : undefined;
    
//     const email = await gmail.check_inbox(
//       credentialPathMerchant,
//       tokenPathMerchant,
//       {
//         subject: subject,
//         to: to,
//         from: from,
//         include_body: true,
//         wait_time_sec: wait_time_sec,
//         max_wait_time_sec: max_wait_time_sec,
//         after: afterDate
//       }
//     );
    
//     if (email) {
//       console.log('✅ Merchant email found');
//       console.log(`   Subject: ${email.subject}`);
//     }
    
//     return email;
//   } catch (error) {
//     console.error('❌ Merchant Gmail check error:', error.message);
//     return null;
//   }
// }

// /**
//  * Extract OTP code from email content
//  * Supports multiple patterns
//  * @param {Object} email - Email object from gmail-tester
//  * @returns {string|null} Extracted OTP code or null
//  */
// export function extractOTP(email) {
//   if (!email || !email.body) {
//     console.log('❌ No email or email body to extract OTP from');
//     return null;
//   }
  
//   const emailContent = JSON.stringify(email);
//   console.log('💬 Extracting OTP from email content');
  
//   let otpCode = null;
  
//   // Pattern 1: Inside <strong> tags
//   let match = emailContent.match(/<strong>([A-Z0-9]{6})<\/strong>/i);
//   if (match) {
//     otpCode = match[1];
//     console.log('✅ OTP found in <strong> tags:', otpCode);
//     return otpCode;
//   }
  
//   // Pattern 2: 6 consecutive alphanumeric characters
//   match = emailContent.match(/\b[A-Z0-9]{6}\b/i);
//   if (match) {
//     otpCode = match[0];
//     console.log('✅ OTP found (6 alphanumeric pattern):', otpCode);
//     return otpCode;
//   }
  
//   // Pattern 3: Look for "code" or "otp" followed by 6 characters
//   match = emailContent.match(/(?:code|otp)[:\s]+([A-Z0-9]{6})/i);
//   if (match) {
//     otpCode = match[1];
//     console.log('✅ OTP found after "code/otp" keyword:', otpCode);
//     return otpCode;
//   }
  
//   // Pattern 4: Inside any HTML tags
//   match = emailContent.match(/<[^>]*>([A-Z0-9]{6})<\/[^>]*>/i);
//   if (match) {
//     otpCode = match[1];
//     console.log('✅ OTP found in HTML tags:', otpCode);
//     return otpCode;
//   }
  
//   console.log('❌ Failed to extract OTP from email');
//   return null;
// }

import gmail from 'gmail-tester';
import path from 'path';

// Gmail credentials paths for individual accounts
const credentialPathIndividualUser = path.resolve(process.cwd(), 'playwright_individual_user.json');
const tokenPathIndividualUser = path.resolve(process.cwd(), 'playwright_individual_token.json');

const credentialPathIndividualMerchant = path.resolve(process.cwd(), 'playwright_individual_merchant.json');
const tokenPathIndividualMerchant = path.resolve(process.cwd(), 'playwright_individual_merchant_token.json');

// Business accounts REUSE existing credentials (same emails, just swapped roles)
// Business User = fpztest.sjardin@gmail.com (same as Individual Merchant)
const credentialPathBusinessUser = credentialPathIndividualMerchant;
const tokenPathBusinessUser = tokenPathIndividualMerchant;

// Business Merchant = fpz.test1@gmail.com (same as Individual User)
const credentialPathBusinessMerchant = credentialPathIndividualUser;
const tokenPathBusinessMerchant = tokenPathIndividualUser;

/**
 * Check email inbox - automatically detects which credentials to use based on recipient
 * @param {Object} options - Email search options
 * @param {string} options.from - Sender email
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject to search for
 * @param {number} [options.wait_time_sec=20] - Wait time between checks in seconds
 * @param {number} [options.max_wait_time_sec=120] - Maximum wait time in seconds
 * @param {string} [options.after] - ISO string - search for emails after this time
 * @returns {Promise<Object|null>} Email object or null if not found
 */
export async function checkEmail(options) {
  const { 
    from, 
    to, 
    subject, 
    wait_time_sec = 20, 
    max_wait_time_sec = 120, 
    after 
  } = options;
  
  try {
    console.log('🔍 Checking Gmail inbox...');
    console.log(`   From: ${from}`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   After: ${after || 'any time'}`);
    console.log(`   Wait time: ${wait_time_sec}s, Max: ${max_wait_time_sec}s`);
    
    // Determine which credentials to use based on recipient email
    let credentialPath, tokenPath;
    
    // Check if this is a business user email (fpztest.sjardin@gmail.com)
    if (to === process.env.BUSINESS_USER_EMAIL) {
      console.log('📧 Using BUSINESS USER credentials (reusing Individual Merchant creds)');
      credentialPath = credentialPathBusinessUser;
      tokenPath = tokenPathBusinessUser;
    } 
    // Default to individual user credentials (fpz.test1@gmail.com)
    else {
      console.log('📧 Using INDIVIDUAL USER credentials');
      credentialPath = credentialPathIndividualUser;
      tokenPath = tokenPathIndividualUser;
    }
    
    // Convert ISO string to Date if provided
    const afterDate = after ? new Date(after) : undefined;
    
    const email = await gmail.check_inbox(
      credentialPath,
      tokenPath,
      {
        subject: subject,
        to: to,
        from: from,
        include_body: true,
        wait_time_sec: wait_time_sec,
        max_wait_time_sec: max_wait_time_sec,
        after: afterDate
      }
    );

    if (email) {
      console.log('✅ User email found');
      console.log(`   Subject: ${email.subject}`);
    }
    
    return email;
  } catch (error) {
    console.error('❌ Gmail check error:', error.message);
    return null;
  }
}

/**
 * Check merchant email inbox - automatically detects which credentials to use
 * @param {Object} options - Same as checkEmail
 * @returns {Promise<Object|null>} Email object or null
 */
export async function checkMerchantEmail(options) {
  const { 
    from, 
    to, 
    subject, 
    wait_time_sec = 20, 
    max_wait_time_sec = 120, 
    after 
  } = options;
  
  try {
    console.log('🔍 Checking merchant Gmail inbox...');
    console.log(`   From: ${from}`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    
    // Determine which credentials to use based on recipient email
    let credentialPath, tokenPath;
    
    // Check if this is a business merchant email (fpz.test1@gmail.com)
    if (to === process.env.BUSINESS_MERCHANT_EMAIL) {
      console.log('📧 Using BUSINESS MERCHANT credentials (reusing Individual User creds)');
      credentialPath = credentialPathBusinessMerchant;
      tokenPath = tokenPathBusinessMerchant;
    } 
    // Default to individual merchant credentials (fpztest.sjardin@gmail.com)
    else {
      console.log('📧 Using INDIVIDUAL MERCHANT credentials');
      credentialPath = credentialPathIndividualMerchant;
      tokenPath = tokenPathIndividualMerchant;
    }
    
    const afterDate = after ? new Date(after) : undefined;
    
    const email = await gmail.check_inbox(
      credentialPath,
      tokenPath,
      {
        subject: subject,
        to: to,
        from: from,
        include_body: true,
        wait_time_sec: wait_time_sec,
        max_wait_time_sec: max_wait_time_sec,
        after: afterDate
      }
    );
    
    if (email) {
      console.log('✅ Merchant email found');
      console.log(`   Subject: ${email.subject}`);
    }
    
    return email;
  } catch (error) {
    console.error('❌ Merchant Gmail check error:', error.message);
    return null;
  }
}

/**
 * Extract OTP code from email content
 * Supports multiple patterns
 * @param {Object} email - Email object from gmail-tester
 * @returns {string|null} Extracted OTP code or null
 */
export function extractOTP(email) {
  if (!email || !email.body) {
    console.log('❌ No email or email body to extract OTP from');
    return null;
  }
  
  const emailContent = JSON.stringify(email);
  console.log('💬 Extracting OTP from email content');
  
  let otpCode = null;
  
  // Pattern 1: Inside <strong> tags
  let match = emailContent.match(/<strong>([A-Z0-9]{6})<\/strong>/i);
  if (match) {
    otpCode = match[1];
    console.log('✅ OTP found in <strong> tags:', otpCode);
    return otpCode;
  }
  
  // Pattern 2: 6 consecutive alphanumeric characters
  match = emailContent.match(/\b[A-Z0-9]{6}\b/i);
  if (match) {
    otpCode = match[0];
    console.log('✅ OTP found (6 alphanumeric pattern):', otpCode);
    return otpCode;
  }
  
  // Pattern 3: Look for "code" or "otp" followed by 6 characters
  match = emailContent.match(/(?:code|otp)[:\s]+([A-Z0-9]{6})/i);
  if (match) {
    otpCode = match[1];
    console.log('✅ OTP found after "code/otp" keyword:', otpCode);
    return otpCode;
  }
  
  // Pattern 4: Inside any HTML tags
  match = emailContent.match(/<[^>]*>([A-Z0-9]{6})<\/[^>]*>/i);
  if (match) {
    otpCode = match[1];
    console.log('✅ OTP found in HTML tags:', otpCode);
    return otpCode;
  }
  
  console.log('❌ Failed to extract OTP from email');
  return null;
}

// ============================================================================
// COMMENTED HELPER FUNCTIONS FOR OTHER MERCHANT TYPES
// Uncomment and adapt these when setting up additional email accounts
// ============================================================================

// /* BAYADCENTER USER EMAIL CHECKER */
// const credentialPathBayadcenterUser = path.resolve(process.cwd(), 'playwright_bayadcenter_user.json');
// const tokenPathBayadcenterUser = path.resolve(process.cwd(), 'playwright_bayadcenter_token.json');

// export async function checkBayadcenterUserEmail(options) {
//   const { 
//     from, 
//     to, 
//     subject, 
//     wait_time_sec = 20, 
//     max_wait_time_sec = 120, 
//     after 
//   } = options;
  
//   try {
//     console.log('🔍 Checking BayadCenter User Gmail inbox...');
//     console.log(`   From: ${from}`);
//     console.log(`   To: ${to}`);
//     console.log(`   Subject: ${subject}`);
    
//     const afterDate = after ? new Date(after) : undefined;
    
//     const email = await gmail.check_inbox(
//       credentialPathBayadcenterUser,
//       tokenPathBayadcenterUser,
//       {
//         subject: subject,
//         to: to,
//         from: from,
//         include_body: true,
//         wait_time_sec: wait_time_sec,
//         max_wait_time_sec: max_wait_time_sec,
//         after: afterDate
//       }
//     );

//     if (email) {
//       console.log('✅ BayadCenter user email found');
//       console.log(`   Subject: ${email.subject}`);
//     }
    
//     return email;
//   } catch (error) {
//     console.error('❌ BayadCenter user email check error:', error.message);
//     return null;
//   }
// }

// /* BAYADCENTER MERCHANT EMAIL CHECKER */
// const credentialPathBayadcenterMerchant = path.resolve(process.cwd(), 'playwright_bayadcenter_merchant.json');
// const tokenPathBayadcenterMerchant = path.resolve(process.cwd(), 'playwright_bayadcenter_merchant_token.json');

// export async function checkBayadcenterMerchantEmail(options) {
//   const { 
//     from, 
//     to, 
//     subject, 
//     wait_time_sec = 20, 
//     max_wait_time_sec = 120, 
//     after 
//   } = options;
  
//   try {
//     console.log('🔍 Checking BayadCenter Merchant Gmail inbox...');
//     console.log(`   From: ${from}`);
//     console.log(`   To: ${to}`);
//     console.log(`   Subject: ${subject}`);
    
//     const afterDate = after ? new Date(after) : undefined;
    
//     const email = await gmail.check_inbox(
//       credentialPathBayadcenterMerchant,
//       tokenPathBayadcenterMerchant,
//       {
//         subject: subject,
//         to: to,
//         from: from,
//         include_body: true,
//         wait_time_sec: wait_time_sec,
//         max_wait_time_sec: max_wait_time_sec,
//         after: afterDate
//       }
//     );
    
//     if (email) {
//       console.log('✅ BayadCenter merchant email found');
//       console.log(`   Subject: ${email.subject}`);
//     }
    
//     return email;
//   } catch (error) {
//     console.error('❌ BayadCenter merchant email check error:', error.message);
//     return null;
//   }
// }

// /* DONATION USER EMAIL CHECKER */
// const credentialPathDonationUser = path.resolve(process.cwd(), 'playwright_donation_user.json');
// const tokenPathDonationUser = path.resolve(process.cwd(), 'playwright_donation_token.json');

// export async function checkDonationUserEmail(options) {
//   const { 
//     from, 
//     to, 
//     subject, 
//     wait_time_sec = 20, 
//     max_wait_time_sec = 120, 
//     after 
//   } = options;
  
//   try {
//     console.log('🔍 Checking Donation User Gmail inbox...');
//     console.log(`   From: ${from}`);
//     console.log(`   To: ${to}`);
//     console.log(`   Subject: ${subject}`);
    
//     const afterDate = after ? new Date(after) : undefined;
    
//     const email = await gmail.check_inbox(
//       credentialPathDonationUser,
//       tokenPathDonationUser,
//       {
//         subject: subject,
//         to: to,
//         from: from,
//         include_body: true,
//         wait_time_sec: wait_time_sec,
//         max_wait_time_sec: max_wait_time_sec,
//         after: afterDate
//       }
//     );

//     if (email) {
//       console.log('✅ Donation user email found');
//       console.log(`   Subject: ${email.subject}`);
//     }
    
//     return email;
//   } catch (error) {
//     console.error('❌ Donation user email check error:', error.message);
//     return null;
//   }
// }

// /* DONATION MERCHANT EMAIL CHECKER */
// const credentialPathDonationMerchant = path.resolve(process.cwd(), 'playwright_donation_merchant.json');
// const tokenPathDonationMerchant = path.resolve(process.cwd(), 'playwright_donation_merchant_token.json');

// export async function checkDonationMerchantEmail(options) {
//   const { 
//     from, 
//     to, 
//     subject, 
//     wait_time_sec = 20, 
//     max_wait_time_sec = 120, 
//     after 
//   } = options;
  
//   try {
//     console.log('🔍 Checking Donation Merchant Gmail inbox...');
//     console.log(`   From: ${from}`);
//     console.log(`   To: ${to}`);
//     console.log(`   Subject: ${subject}`);
    
//     const afterDate = after ? new Date(after) : undefined;
    
//     const email = await gmail.check_inbox(
//       credentialPathDonationMerchant,
//       tokenPathDonationMerchant,
//       {
//         subject: subject,
//         to: to,
//         from: from,
//         include_body: true,
//         wait_time_sec: wait_time_sec,
//         max_wait_time_sec: max_wait_time_sec,
//         after: afterDate
//       }
//     );
    
//     if (email) {
//       console.log('✅ Donation merchant email found');
//       console.log(`   Subject: ${email.subject}`);
//     }
    
//     return email;
//   } catch (error) {
//     console.error('❌ Donation merchant email check error:', error.message);
//     return null;
//   }
// }

// /* AUTOSWEEP USER EMAIL CHECKER */
// const credentialPathAutosweepUser = path.resolve(process.cwd(), 'playwright_autosweep_user.json');
// const tokenPathAutosweepUser = path.resolve(process.cwd(), 'playwright_autosweep_token.json');

// export async function checkAutosweepUserEmail(options) {
//   const { 
//     from, 
//     to, 
//     subject, 
//     wait_time_sec = 20, 
//     max_wait_time_sec = 120, 
//     after 
//   } = options;
  
//   try {
//     console.log('🔍 Checking AutoSweep User Gmail inbox...');
//     console.log(`   From: ${from}`);
//     console.log(`   To: ${to}`);
//     console.log(`   Subject: ${subject}`);
    
//     const afterDate = after ? new Date(after) : undefined;
    
//     const email = await gmail.check_inbox(
//       credentialPathAutosweepUser,
//       tokenPathAutosweepUser,
//       {
//         subject: subject,
//         to: to,
//         from: from,
//         include_body: true,
//         wait_time_sec: wait_time_sec,
//         max_wait_time_sec: max_wait_time_sec,
//         after: afterDate
//       }
//     );

//     if (email) {
//       console.log('✅ AutoSweep user email found');
//       console.log(`   Subject: ${email.subject}`);
//     }
    
//     return email;
//   } catch (error) {
//     console.error('❌ AutoSweep user email check error:', error.message);
//     return null;
//   }
// }

// /* AUTOSWEEP MERCHANT EMAIL CHECKER */
// const credentialPathAutosweepMerchant = path.resolve(process.cwd(), 'playwright_autosweep_merchant.json');
// const tokenPathAutosweepMerchant = path.resolve(process.cwd(), 'playwright_autosweep_merchant_token.json');

// export async function checkAutosweepMerchantEmail(options) {
//   const { 
//     from, 
//     to, 
//     subject, 
//     wait_time_sec = 20, 
//     max_wait_time_sec = 120, 
//     after 
//   } = options;
  
//   try {
//     console.log('🔍 Checking AutoSweep Merchant Gmail inbox...');
//     console.log(`   From: ${from}`);
//     console.log(`   To: ${to}`);
//     console.log(`   Subject: ${subject}`);
    
//     const afterDate = after ? new Date(after) : undefined;
    
//     const email = await gmail.check_inbox(
//       credentialPathAutosweepMerchant,
//       tokenPathAutosweepMerchant,
//       {
//         subject: subject,
//         to: to,
//         from: from,
//         include_body: true,
//         wait_time_sec: wait_time_sec,
//         max_wait_time_sec: max_wait_time_sec,
//         after: afterDate
//       }
//     );
    
//     if (email) {
//       console.log('✅ AutoSweep merchant email found');
//       console.log(`   Subject: ${email.subject}`);
//     }
    
//     return email;
//   } catch (error) {
//     console.error('❌ AutoSweep merchant email check error:', error.message);
//     return null;
//   }
// }

// /* MERALCO USER EMAIL CHECKER */
// const credentialPathMeralcoUser = path.resolve(process.cwd(), 'playwright_meralco_user.json');
// const tokenPathMeralcoUser = path.resolve(process.cwd(), 'playwright_meralco_token.json');

// export async function checkMeralcoUserEmail(options) {
//   const { 
//     from, 
//     to, 
//     subject, 
//     wait_time_sec = 20, 
//     max_wait_time_sec = 120, 
//     after 
//   } = options;
  
//   try {
//     console.log('🔍 Checking Meralco User Gmail inbox...');
//     console.log(`   From: ${from}`);
//     console.log(`   To: ${to}`);
//     console.log(`   Subject: ${subject}`);
    
//     const afterDate = after ? new Date(after) : undefined;
    
//     const email = await gmail.check_inbox(
//       credentialPathMeralcoUser,
//       tokenPathMeralcoUser,
//       {
//         subject: subject,
//         to: to,
//         from: from,
//         include_body: true,
//         wait_time_sec: wait_time_sec,
//         max_wait_time_sec: max_wait_time_sec,
//         after: afterDate
//       }
//     );

//     if (email) {
//       console.log('✅ Meralco user email found');
//       console.log(`   Subject: ${email.subject}`);
//     }
    
//     return email;
//   } catch (error) {
//     console.error('❌ Meralco user email check error:', error.message);
//     return null;
//   }
// }

// /* MERALCO MERCHANT EMAIL CHECKER */
// const credentialPathMeralcoMerchant = path.resolve(process.cwd(), 'playwright_meralco_merchant.json');
// const tokenPathMeralcoMerchant = path.resolve(process.cwd(), 'playwright_meralco_merchant_token.json');

// export async function checkMeralcoMerchantEmail(options) {
//   const { 
//     from, 
//     to, 
//     subject, 
//     wait_time_sec = 20, 
//     max_wait_time_sec = 120, 
//     after 
//   } = options;
  
//   try {
//     console.log('🔍 Checking Meralco Merchant Gmail inbox...');
//     console.log(`   From: ${from}`);
//     console.log(`   To: ${to}`);
//     console.log(`   Subject: ${subject}`);
    
//     const afterDate = after ? new Date(after) : undefined;
    
//     const email = await gmail.check_inbox(
//       credentialPathMeralcoMerchant,
//       tokenPathMeralcoMerchant,
//       {
//         subject: subject,
//         to: to,
//         from: from,
//         include_body: true,
//         wait_time_sec: wait_time_sec,
//         max_wait_time_sec: max_wait_time_sec,
//         after: afterDate
//       }
//     );
    
//     if (email) {
//       console.log('✅ Meralco merchant email found');
//       console.log(`   Subject: ${email.subject}`);
//     }
    
//     return email;
//   } catch (error) {
//     console.error('❌ Meralco merchant email check error:', error.message);
//     return null;
//   }
// }