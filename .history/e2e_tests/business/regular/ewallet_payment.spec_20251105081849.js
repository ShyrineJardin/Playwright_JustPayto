import {test, expect} from '@playwright/test';
import path from 'path';
import { checkEmail, checkMerchantEmail } from '../../../helpers/gmail-helper';

test('📱 eWallet payment for business user', async({page, context, baseUrl}) => {
    test.setTimeout(12000);

    console.log('💻 Complete eWallet Payment Flow for business');
    console.log(`🔗 URL: ${process.env.BUSINESS_PAYMENT_URL}`);

    
});