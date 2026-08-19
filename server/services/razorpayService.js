const Razorpay = require('razorpay');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────
// Detect if we have real Razorpay keys or placeholders
// ─────────────────────────────────────────────────────
const keyId = process.env.RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
const isSimulated = !keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')
    || keyId === 'rzp_test_your_key_here'
    || keySecret === 'your_razorpay_secret_here';

if (isSimulated) {
    console.log('⚠️  Razorpay running in SIMULATED mode (placeholder keys detected)');
    console.log('   To use real payments, update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
}

// Initialize Razorpay instance (only if keys are real)
let razorpay = null;
if (!isSimulated) {
    razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
}

/**
 * Create a Razorpay order for a given amount (in INR)
 * In simulated mode, returns a mock order object
 */
const createOrder = async (amount, receipt, notes = {}) => {
    const amountInPaise = Math.round(amount * 100);

    if (isSimulated) {
        // Return a mock order for development/testing
        const mockOrderId = 'order_sim_' + crypto.randomBytes(12).toString('hex');
        return {
            id: mockOrderId,
            amount: amountInPaise,
            currency: 'INR',
            receipt,
            status: 'created',
            notes,
        };
    }

    const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes,
    };

    const order = await razorpay.orders.create(options);
    return order;
};

/**
 * Verify the payment signature returned by Razorpay checkout
 * In simulated mode, accepts any signature starting with 'sim_'
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
    if (isSimulated) {
        // In simulated mode, accept if the signature matches our mock format
        return signature === 'sim_signature_valid';
    }

    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body)
        .digest('hex');

    return expectedSignature === signature;
};

/**
 * Verify the webhook signature sent by Razorpay in headers
 */
const verifyWebhookSignature = (rawBody, signature) => {
    if (isSimulated) {
        return signature === 'sim_webhook_valid';
    }

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
        .update(rawBody)
        .digest('hex');

    return expectedSignature === signature;
};

module.exports = {
    razorpay,
    createOrder,
    verifyPaymentSignature,
    verifyWebhookSignature,
    isSimulated,
};
