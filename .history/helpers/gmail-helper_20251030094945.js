import gmail from 'gmail-tester';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gmail credentials paths for individual user
const credentialPathUser = path.resolve(process.cwd(), 'playwright_individual_user.json');
const tokenPathUser = path.resolve(process.cwd(), 'playwright_individual_token.json');

// Gmail credentials paths for individual merchant
const credentialPathMerchant = path.resolve(process.cwd(), 'playwright_individual_merchant.json');
const tokenPathMerchant = path.resolve(process.cwd(), 'playwright_individual_merchant_token.json');

/**
 * Check Gmail inbox for user/payer email
 * @param {Object} options - Email search options
 * @param {string} options.subject - Email subject to search for
 * @param {string} options.to - Recipient email
 * @param {string} [options.from] - Sender email (optional)
 * @param {number} [options.wait_time_sec=30] - Wait time between checks
 * @param {number} [options.max_wait_time_sec=60] - Maximum wait time
 * @param {Date} [options.after] - Search for emails after this date
 * @returns {Promise<Object|null>} Email object or null if not found
 */
export async function checkGmailUser(options) {
  const { 
    subject, 
    to, 
    from, 
    wait_time_sec = 30, 
    max_wait_time_sec = 60, 
    after 
  } = options;
  
  try {
    console.log('🔍 Checking Gmail (User)...');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   From: ${from || 'any'}`);
    console.log(`   After: ${after ? after.toISOString() : 'any time'}`);
    
    const email = await gmail.check_inbox(
      credentialPathUser,
      tokenPathUser,
      {
        subject: subject,
        to: to,
        from: from,
        include_body: true,
        wait_time_sec: wait_time_sec,
        max_wait_time_sec: max_wait_time_sec,
        after: after
      }
    );
    
    console.log('✅ Gmail check successful (User)');
    console.log(`   Email found: ${email ? 'Yes' : 'No'}`);
    if (email) {
      console.log(`   Subject: ${email.subject}`);
      console.log(`   From: ${email.from}`);
      console.log(`   Date: ${email.date}`);
    }
    
    return email;
  } catch (error) {
    console.error('❌ Gmail check error (User):', error.message);
    console.error(`   To: ${to}`);
    console.error(`   Subject: ${subject}`);
    console.error(`   Credentials path: ${credentialPathUser}`);
    console.error(`   Token path: ${tokenPathUser}`);
    
    // Return null instead of throwing to allow tests to handle gracefully
    return null;
  }
}

/**
 * Check Gmail inbox for merchant email
 * @param {Object} options - Email search options
 * @param {string} options.subject - Email subject to search for
 * @param {string} options.to - Recipient email
 * @param {string} [options.from] - Sender email (optional)
 * @param {number} [options.wait_time_sec=30] - Wait time between checks
 * @param {number} [options.max_wait_time_sec=60] - Maximum wait time
 * @param {Date} [options.after] - Search for emails after this date
 * @returns {Promise<Object|null>} Email object or null if not found
 */
export async function checkGmailMerchant(options) {
  const { 
    subject, 
    to, 
    from, 
    wait_time_sec = 30, 
    max_wait_time_sec = 60, 
    after 
  } = options;
  
  try {
    console.log('🔍 Checking Gmail (Merchant)...');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   From: ${from || 'any'}`);
    console.log(`   After: ${after ? after.toISOString() : 'any time'}`);
    
    const email = await gmail.check_inbox(
      credentialPathMerchant,
      tokenPathMerchant,
      {
        subject: subject,
        to: to,
        from: from,
        include_body: true,
        wait_time_sec: wait_time_sec,
        max_wait_time_sec: max_wait_time_sec,
        after: after
      }
    );
    
    console.log('✅ Gmail check successful (Merchant)');
    console.log(`   Email found: ${email ? 'Yes' : 'No'}`);
    if (email) {
      console.log(`   Subject: ${email.subject}`);
      console.log(`   From: ${email.from}`);
      console.log(`   Date: ${email.date}`);
    }
    
    return email;
  } catch (error) {
    console.error('❌ Gmail check error (Merchant):', error.message);
    console.error(`   To: ${to}`);
    console.error(`   Subject: ${subject}`);
    console.error(`   Credentials path: ${credentialPathMerchant}`);
    console.error(`   Token path: ${tokenPathMerchant}`);
    
    // Return null instead of throwing to allow tests to handle gracefully
    return null;
  }
}

/**
 * Extract OTP/verification code from email body
 * @param {Object} email - Email object from gmail-tester
 * @param {RegExp} [pattern=/\b\d{6}\b/] - Pattern to match OTP (default: 6 digits)
 * @returns {string|null} Extracted OTP or null
 */
export function extractOTP(email, pattern = /\b\d{6}\b/) {
  if (!email || !email.body) {
    console.log('❌ No email or email body to extract OTP from');
    return null;
  }
  
  // Try HTML body first, then plain text
  const htmlMatch = email.body.html ? email.body.html.match(pattern) : null;
  const textMatch = email.body.text ? email.body.text.match(pattern) : null;
  
  const otp = htmlMatch ? htmlMatch[0] : (textMatch ? textMatch[0] : null);
  
  if (otp) {
    console.log(`✅ Extracted OTP: ${otp}`);
  } else {
    console.log('❌ No OTP found in email');
  }
  
  return otp;
}

/**
 * Extract link/URL from email body
 * @param {Object} email - Email object from gmail-tester
 * @param {RegExp} [pattern=/https?:\/\/[^\s<>"]+/] - Pattern to match URL
 * @returns {string|null} Extracted URL or null
 */
export function extractLink(email, pattern = /https?:\/\/[^\s<>"]+/) {
  if (!email || !email.body) {
    console.log('❌ No email or email body to extract link from');
    return null;
  }
  
  // Try HTML body first, then plain text
  const htmlMatch = email.body.html ? email.body.html.match(pattern) : null;
  const textMatch = email.body.text ? email.body.text.match(pattern) : null;
  
  const link = htmlMatch ? htmlMatch[0] : (textMatch ? textMatch[0] : null);
  
  if (link) {
    console.log(`✅ Extracted link: ${link}`);
  } else {
    console.log('❌ No link found in email');
  }
  
  return link;
}

/**
 * Extract all links from email body
 * @param {Object} email - Email object from gmail-tester
 * @returns {string[]} Array of URLs found in email
 */
export function extractAllLinks(email) {
  if (!email || !email.body) {
    return [];
  }
  
  const pattern = /https?:\/\/[^\s<>"]+/g;
  const htmlLinks = email.body.html ? email.body.html.match(pattern) || [] : [];
  const textLinks = email.body.text ? email.body.text.match(pattern) || [] : [];
  
  // Combine and deduplicate
  const allLinks = [...new Set([...htmlLinks, ...textLinks])];
  
  console.log(`✅ Found ${allLinks.length} link(s) in email`);
  return allLinks;
}