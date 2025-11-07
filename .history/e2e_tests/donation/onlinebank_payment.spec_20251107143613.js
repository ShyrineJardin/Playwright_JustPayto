import {test, expect} from '@playwright/test';
import path from 'path';
import { checkEmail, extractOTP, checkMerchantEmail } from '../../helpers/gmail-helper.js';


test('🤲 Online Bank Transfer payment for Donation', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

});


