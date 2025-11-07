import {test, expect} from '@playwright/test';
import path from 'path';
import { checkEmail, checkMerchantEmail } from '../../../helpers/gmail-helper.js';

test('🏦 Online bank payment for business user - delivery', async ({page, context, baseURL, browserName, playwright}) => {
    test.setTimeout(120000);

});