const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const OpenAI = require('openai');

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(express.static(__dirname));

const MENU = [
  { name: 'Margherita Pizza', price: 399, tags: ['Vegetarian'], allergens: ['Wheat', 'Milk'], description: 'Fresh tomato sauce, mozzarella, basil' },
  { name: 'Paneer Tikka Wrap', price: 249, tags: ['Vegetarian'], allergens: ['Wheat', 'Milk'], description: 'Tandoori paneer, onion, mint chutney, lettuce' },
  { name: 'Veg Loaded Nachos', price: 289, tags: ['Vegetarian'], allergens: ['Wheat', 'Milk'], description: 'Crispy tortilla chips, beans, salsa, cheese, jalapeños' },
  { name: 'Butter Chicken Bowl', price: 399, tags: ['Non-veg'], allergens: ['Milk'], description: 'Grilled chicken, rice, butter masala, peas' },
  { name: 'Chicken Tikka Roll', price: 329, tags: ['Non-veg'], allergens: ['Wheat'], description: 'Chicken tikka, salad, chutney, wrap' },
  { name: 'Classic Masala Dosa', price: 179, tags: ['Vegetarian'], allergens: ['Rice', 'Lentils'], description: 'Crispy rice crepe, potato masala, sambar, chutneys' },
  { name: 'Vegan Chickpea Curry', price: 299, tags: ['Vegan', 'Gluten-free'], allergens: ['Coconut'], description: 'Chickpeas, tomatoes, spinach, coconut' },
  { name: 'Masala Fries', price: 149, tags: ['Vegan'], allergens: [], description: 'Crispy fries with peri-peri seasoning' },
  { name: 'Mint Lime Soda', price: 89, tags: ['Vegan'], allergens: [], description: 'Refreshing chilled soda' },
  { name: 'Mango Lassi', price: 119, tags: ['Vegetarian'], allergens: ['Milk'], description: 'Sweet yogurt drink' },
];

const systemPrompt = `
You are Bella, the cheerful virtual assistant for Amr shop, a family-run Indian café in Jalandhar.

Rules:
- Be warm, short, and casual.
- Use only the menu data provided below.
- If a customer asks about dietary info, mention the tags and add: "Please double-check with staff for severe allergies."
- For order-taking, confirm item name, quantity, and total before treating it as final.
- Never invent menu items, prices, or ingredients.
- Redirect rude or off-topic requests with: "Happy to help with anything food-related! What can I get started for you?"
- If a request is outside scope (refunds, complaints, catering, jobs), collect the name and contact and say a team member will follow up.
- Never process payment; direct customers to checkout via website, app, or phone.
- Keep replies focused and concise.

Menu data:
${JSON.stringify(MENU, null, 2)}

Store info:
- Hours: 11:00 AM – 9:00 PM, daily
- Location: Jalandhar
- Delivery/Pickup: Dine-in only
- Current promo: First-time order 10% off
`;

function getItemByName(name) {
  const normalized = name.toLowerCase();
  return MENU.find((item) => item.name.toLowerCase() === normalized || item.name.toLowerCase().includes(normalized));
}

function fallbackReply(message) {
  const text = message.trim();
  const lower = text.toLowerCase();

  if (!text) return 'I’m here to help with the menu and your order.';

  if (['hi', 'hello', 'hey'].some((phrase) => lower.includes(phrase))) {
    return 'Hi! I can help with the menu, dietary info, or placing an order at Amr shop. What would you like to know?';
  }

  if (lower.includes('hours') || lower.includes('open')) {
    return 'We’re open daily from 11:00 AM to 9:00 PM.';
  }

  if (lower.includes('location') || lower.includes('address')) {
    return 'Amr shop is in Jalandhar.';
  }

  if (lower.includes('delivery') || lower.includes('pickup')) {
    return 'We currently offer dine-in only.';
  }

  if (lower.includes('promo') || lower.includes('offer')) {
    return 'Current promo: first-time order 10% off.';
  }

  if (lower.includes('vegetarian')) {
    const items = MENU.filter((item) => item.tags.includes('Vegetarian')).map((item) => item.name).join(', ');
    return `Great choice! We’ve got ${items}. Want details on any of these?`;
  }

  if (lower.includes('vegan')) {
    const items = MENU.filter((item) => item.tags.includes('Vegan')).map((item) => item.name).join(', ');
    return `Our vegan picks are ${items}. Please double-check with staff for severe allergies.`;
  }

  if (lower.includes('gluten') && lower.includes('free')) {
    const items = MENU.filter((item) => item.tags.includes('Gluten-free')).map((item) => item.name).join(', ');
    return `Gluten-free options include ${items}. Please double-check with staff for severe allergies.`;
  }

  const item = MENU.find((menuItem) => lower.includes(menuItem.name.toLowerCase()));
  if (item) {
    const allergyText = item.allergens.length ? `Contains: ${item.allergens.join(', ')}.` : 'Contains: None listed.';
    return `${item.name} — ${item.description}. Price: ₹${item.price}. ${item.tags.join(', ')}. ${allergyText} Please double-check with staff for severe allergies.`;
  }

  if (lower.includes('menu')) {
    return `Our menu includes: ${MENU.map((entry) => `${entry.name} — ₹${entry.price}`).join(', ')}.`;
  }

  if (lower.includes('complaint') || lower.includes('refund') || lower.includes('catering') || lower.includes('job')) {
    return 'I can help get that to the right team. Please share your name and contact number, and a team member will follow up.';
  }

  if (lower.includes('rude') || lower.includes('off topic')) {
    return 'Happy to help with anything food-related! What can I get started for you?';
  }

  return 'I can help with the menu, dietary info, or placing an order. Try asking for vegetarian items, a specific dish, or store hours.';
}

const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
const openaiBaseUrl = process.env.OPENAI_BASE_URL || (provider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined);
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      ...(openaiBaseUrl ? { baseURL: openaiBaseUrl } : {}),
    })
  : null;

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    if (!openai) {
      return res.json({ reply: fallbackReply(message) });
    }

    const completion = await openai.chat.completions.create({
      model: process.env.MODEL_NAME || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.json({ reply: fallbackReply(message) });
    }

    return res.json({ reply });
  } catch (error) {
    const fallbackMessage = (req.body && typeof req.body.message === 'string') ? req.body.message : '';
    console.error('OpenAI error:', error.response?.data || error.message);
    return res.json({ reply: fallbackReply(fallbackMessage) });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, name: 'Amr Shop Bella' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Bella chatbot running at http://localhost:${port}`);
});
