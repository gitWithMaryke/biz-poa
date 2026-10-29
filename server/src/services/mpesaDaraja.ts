import { config } from '../config/env.js';

interface STKPushRequest {
  phone: string;
  amount: number;
  accountReference: string;
  transactionDesc?: string;
}

interface STKPushResponse {
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
  simulated?: boolean;
}

export async function initiateSTKPush(params: STKPushRequest): Promise<STKPushResponse> {
  const { phone, amount, accountReference, transactionDesc = 'Bizpoa POS Sale' } = params;
  const mpesaConfig = config.mpesa;

  // Check if live credentials exist
  if (!mpesaConfig.consumerKey || !mpesaConfig.consumerSecret || !mpesaConfig.passkey) {
    // Return simulated immediate checkout request
    const simulatedCheckoutId = `ws_CO_${Date.now()}_${Math.floor(Math.random() * 999999)}`;
    return {
      merchantRequestId: `REQ_${Date.now()}`,
      checkoutRequestId: simulatedCheckoutId,
      responseCode: '0',
      responseDescription: 'Success. Request accepted for processing',
      customerMessage: `STK prompt sent to ${phone}. Enter M-Pesa PIN on handset to authorize KES ${amount}.`,
      simulated: true
    };
  }

  // Live Daraja STK Push implementation
  const authUrl = mpesaConfig.env === 'production'
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  const authHeader = Buffer.from(`${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`).toString('base64');
  const tokenRes = await fetch(authUrl, {
    headers: { Authorization: `Basic ${authHeader}` }
  });
  const tokenData: any = await tokenRes.json();
  const accessToken = tokenData.access_token;

  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(`${mpesaConfig.shortcode}${mpesaConfig.passkey}${timestamp}`).toString('base64');

  const stkUrl = mpesaConfig.env === 'production'
    ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

  const response = await fetch(stkUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      BusinessShortCode: mpesaConfig.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phone.replace('+', ''),
      PartyB: mpesaConfig.shortcode,
      PhoneNumber: phone.replace('+', ''),
      CallBackURL: `https://bizpoa.example.com/api/mpesa/callback`,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc
    })
  });

  const data: any = await response.json();
  return {
    merchantRequestId: data.MerchantRequestID,
    checkoutRequestId: data.CheckoutRequestID,
    responseCode: data.ResponseCode,
    responseDescription: data.ResponseDescription,
    customerMessage: data.CustomerMessage
  };
}
