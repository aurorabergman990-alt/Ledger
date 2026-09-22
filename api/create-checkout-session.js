const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/create-checkout-session
// body: { email: "user@example.com" }
// Returns: { url: "https://checkout.stripe.com/..." }
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      managed_payments: { enabled: true },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Ledger — Remove watermark (lifetime)',
              description: 'Removes the "Made with Ledger" mark from all your invoices and quotes, forever.',
              tax_code: 'txcd_10103001'
            },
            unit_amount: 900
          },
          quantity: 1
        }
      ],
      success_url: `${process.env.APP_URL}/?unlocked=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/?canceled=1`,
      metadata: { email }
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe session creation failed:', err.message);
    return res.status(500).json({ error: 'Could not start checkout. Please try again.' });
  }
};
