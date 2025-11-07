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