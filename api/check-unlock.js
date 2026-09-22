const { supabase } = require('../lib/supabase');

// GET /api/check-unlock?email=user@example.com
// Returns: { unlocked: true|false }
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const email = (req.query.email || '').toLowerCase().trim();
  if (!email) return res.status(400).json({ error: 'email is required' });

  const { data, error } = await supabase
    .from('unlocked_users')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('Supabase lookup failed:', error.message);
    return res.status(500).json({ error: 'Lookup failed' });
  }

  return res.status(200).json({ unlocked: !!data });
};
