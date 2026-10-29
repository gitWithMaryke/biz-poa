import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '5050', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  shop: {
    name: process.env.SHOP_NAME || 'Mama Njeri Duka',
    till: process.env.TILL_NUMBER || '5012345',
    ownerPhone: process.env.OWNER_PHONE || '+254722000111',
    currency: process.env.CURRENCY || 'KES',
    dailyReportTime: process.env.DAILY_REPORT_TIME || '20:00',
    dailyReportEnabled: true,
  },
  africasTalking: {
    username: process.env.AT_USERNAME || 'sandbox',
    apiKey: process.env.AT_API_KEY || '',
    senderId: process.env.AT_SENDER_ID || '',
    isSandbox: process.env.AT_IS_SANDBOX !== 'false',
  },
  mpesa: {
    env: process.env.MPESA_ENV || 'sandbox',
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    passkey: process.env.MPESA_PASSKEY || '',
    shortcode: process.env.MPESA_SHORTCODE || '174379',
  }
};
