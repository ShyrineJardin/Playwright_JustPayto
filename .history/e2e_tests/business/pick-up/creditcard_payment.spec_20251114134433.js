import {test, expect} from '@playwright/test';
import path from 'path';
import { checkEmail, checkMerchantEmail } from '../../../helpers/gmail-helper.js';

test('🏦 Credit card payment for business user', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

    console.log('💻 Complete Credit Card Payment Flow for business - pickup');