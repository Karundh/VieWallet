// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// CORS abierto (puedes restringir después a tu dominio)
app.use(cors({
  origin: '*'
}));

app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items inválidos' });
    }

    const line_items = items.map(item => ({
      price: item.priceId,
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
       success_url: 'https://viewallet.shop/success.html',
cancel_url: 'https://viewallet.shop/shop.html',
      allow_promotion_codes: true,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creando sesión Stripe:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
