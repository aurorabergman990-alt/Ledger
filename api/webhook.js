const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { supabase } = require('../lib/supabase');

// Vercel-specific: we need the raw request body to verify the Stripe signature,
// so we turn off Vercel's automatic JSON body parsing for this route.
module.exports.config = {
  api: { bodyParser: false }
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// POST /api/webhook  (configured in the Stripe dashboard, not called by your app directly)
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const rawBody = await readRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_email || session.metadata?.email;

    if (email) {
      const { error } = await supabase
        .from('unlocked_users')
        .upsert({ email: email.toLowerCase(), unlocked_at: new Date().toISOString() }, { onConflict: 'email' });

      if (error) console.error('Supabase upsert failed:', error.message);
      else console.log(`Unlocked: ${email}`);
    }
  }

  res.status(200).json({ received: true });
};
