const supabase = require('../config/supabase');
const asyncErrorHandler = require('../middlewares/helpers/asyncErrorHandler');
const ErrorHandler = require('../utils/errorHandler');
const paytm = require('paytmchecksum');
const https = require('https');
const { randomUUID } = require('crypto');

// ── Process payment (generate Paytm params) ──────────────────────
exports.processPayment = asyncErrorHandler(async (req, res, next) => {
  const { amount, email, phoneNo } = req.body;

  const params = {
    MID: process.env.PAYTM_MID,
    WEBSITE: process.env.PAYTM_WEBSITE,
    CHANNEL_ID: process.env.PAYTM_CHANNEL_ID,
    INDUSTRY_TYPE_ID: process.env.PAYTM_INDUSTRY_TYPE,
    ORDER_ID: 'oid' + randomUUID(),
    CUST_ID: process.env.PAYTM_CUST_ID,
    TXN_AMOUNT: JSON.stringify(amount),
    CALLBACK_URL: `https://${req.get('host')}/api/v1/callback`,
    EMAIL: email,
    MOBILE_NO: phoneNo,
  };

  const checksum = await paytm.generateSignature(params, process.env.PAYTM_MERCHANT_KEY);
  res.status(200).json({ paytmParams: { ...params, CHECKSUMHASH: checksum } });
});

// ── Paytm callback ───────────────────────────────────────────────
exports.paytmResponse = (req, res, next) => {
  const paytmChecksum = req.body.CHECKSUMHASH;
  delete req.body.CHECKSUMHASH;

  const isValid = paytm.verifySignature(req.body, process.env.PAYTM_MERCHANT_KEY, paytmChecksum);
  if (!isValid) { console.log('Checksum mismatch'); return; }

  const paytmParams = {
    body: { mid: req.body.MID, orderId: req.body.ORDERID },
  };

  paytm.generateSignature(JSON.stringify(paytmParams.body), process.env.PAYTM_MERCHANT_KEY).then((checksum) => {
    paytmParams.head = { signature: checksum };
    const post_data = JSON.stringify(paytmParams);

    const options = {
      hostname: 'securegw-stage.paytm.in',
      port: 443,
      path: '/v3/order/status',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': post_data.length },
    };

    let response = '';
    const post_req = https.request(options, (post_res) => {
      post_res.on('data', (chunk) => { response += chunk; });
      post_res.on('end', () => {
        const { body } = JSON.parse(response);
        addPayment(body);
        res.redirect(`https://${req.get('host')}/order/${body.orderId}`);
      });
    });
    post_req.write(post_data);
    post_req.end();
  });
};

const addPayment = async (data) => {
  try {
    await supabase.from('payments').insert([{
      result_status: data.resultInfo?.resultStatus ?? '',
      result_code:   data.resultInfo?.resultCode ?? '',
      result_msg:    data.resultInfo?.resultMsg ?? '',
      txn_id:        data.txnId ?? '',
      bank_txn_id:   data.bankTxnId ?? '',
      order_id:      data.orderId ?? '',
      txn_amount:    data.txnAmount ?? '',
      txn_type:      data.txnType ?? '',
      gateway_name:  data.gatewayName ?? '',
      bank_name:     data.bankName ?? '',
      mid:           data.mid ?? '',
      payment_mode:  data.paymentMode ?? '',
      refund_amt:    data.refundAmt ?? '',
      txn_date:      data.txnDate ?? '',
    }]);
  } catch (err) {
    console.error('Payment insert failed:', err.message);
  }
};

// ── Get payment status ───────────────────────────────────────────
exports.getPaymentStatus = asyncErrorHandler(async (req, res, next) => {
  const { data: payment, error } = await supabase
    .from('payments').select('*').eq('order_id', req.params.id).single();

  if (error || !payment) return next(new ErrorHandler('Payment details not found', 404));

  res.status(200).json({
    success: true,
    txn: { id: payment.txn_id, status: payment.result_status },
  });
});
