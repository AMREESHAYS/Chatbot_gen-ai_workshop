const menu = [
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

const state = {
  order: [],
  finalOrderConfirmed: false,
};

const chatWindow = document.getElementById('chatWindow');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const orderList = document.getElementById('orderList');
const totalPrice = document.getElementById('totalPrice');

let awaitingBackendReply = false;

function addMessage(text, sender = 'bot') {
  const message = document.createElement('div');
  message.className = `message ${sender}`;
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function formatCurrency(value) {
  return `₹${value}`;
}

function getItemByName(name) {
  const normalized = name.toLowerCase();
  return menu.find((item) => item.name.toLowerCase() === normalized || item.name.toLowerCase().includes(normalized));
}

function renderOrder() {
  const currentOrder = state.order;
  orderList.innerHTML = '';

  if (!currentOrder.length) {
    orderList.innerHTML = '<li class="empty">Your cart is empty.</li>';
    totalPrice.textContent = formatCurrency(0);
    return;
  }

  let total = 0;

  currentOrder.forEach((entry) => {
    const item = getItemByName(entry.name);
    const line = document.createElement('li');
    const subtotal = item.price * entry.quantity;
    total += subtotal;
    line.innerHTML = `<span>${entry.quantity}x ${entry.name}</span><span>${formatCurrency(subtotal)}</span>`;
    orderList.appendChild(line);
  });

  totalPrice.textContent = formatCurrency(total);
}

function listMenu() {
  return menu
    .map(({ name, price }) => `${name} — ${formatCurrency(price)}`)
    .join('\n');
}

function addToOrder(itemName, quantity = 1) {
  const item = getItemByName(itemName);
  if (!item) return false;

  const existing = state.order.find((entry) => entry.name.toLowerCase() === item.name.toLowerCase());

  if (existing) {
    existing.quantity += quantity;
  } else {
    state.order.push({ name: item.name, quantity });
  }

  state.finalOrderConfirmed = false;
  renderOrder();
  return true;
}

function handleDietaryQuestion(itemName) {
  const match = getItemByName(itemName);
  if (!match) return null;

  const tags = match.tags.join(', ');
  const allergenText = match.allergens.length ? `Contains: ${match.allergens.join(', ')}.` : 'Contains: None listed.';

  return `The ${match.name} is ${tags}. ${allergenText} Please double-check with staff for severe allergies.`;
}

function confirmOrder() {
  if (!state.order.length) {
    return 'Your cart is still empty. Add a few items and I can help you confirm the order.';
  }

  const itemSummary = state.order.map((entry) => `${entry.quantity}x ${entry.name}`).join(', ');
  const subtotal = state.order.reduce((sum, entry) => {
    const item = getItemByName(entry.name);
    return sum + item.price * entry.quantity;
  }, 0);

  state.finalOrderConfirmed = true;
  return `Your order is confirmed: ${itemSummary}. Total: ${formatCurrency(subtotal)}. Please proceed to checkout via the website, app, or phone.`;
}

function getResponse(inputText) {
  const text = inputText.trim();
  if (!text) return 'I’m here to help with the menu and your order.';

  const lower = text.toLowerCase();

  if (['hi', 'hello', 'hey', 'hey bella', 'hello bella'].some((phrase) => lower.includes(phrase))) {
    return 'Hi! I can help with the menu, dietary info, or placing an order at Amr shop. What would you like to know?';
  }

  if (lower.includes('menu') || lower.includes('what do you have')) {
    return `Here’s our menu:\n${listMenu()}\nWant to know more about a dish or add something to your order?`;
  }

  if (lower.includes('open') || lower.includes('hours')) {
    return 'We’re open daily from 11:00 AM to 9:00 PM.';
  }

  if (lower.includes('location') || lower.includes('address')) {
    return 'Amr shop is in Jalandhar.';
  }

  if (lower.includes('delivery') || lower.includes('pickup')) {
    return 'We currently offer dine-in service only.';
  }

  if (lower.includes('promo') || lower.includes('offer')) {
    return 'Current promo: first-time order 10% off.';
  }

  if (lower.includes('vegetarian')) {
    const vegetarianItems = menu.filter((item) => item.tags.includes('Vegetarian')).map((item) => item.name);
    return `Great choice! We’ve got ${vegetarianItems.join(', ')}. Want details on one of them or should I add one to your order?`;
  }

  if (lower.includes('vegan')) {
    const veganItems = menu.filter((item) => item.tags.includes('Vegan')).map((item) => item.name);
    return `Our vegan picks are ${veganItems.join(', ')}. Please double-check with staff for severe allergies.`;
  }

  if (lower.includes('gluten') && lower.includes('free')) {
    const glutenFreeItems = menu.filter((item) => item.tags.includes('Gluten-free')).map((item) => item.name);
    return `Gluten-free options include ${glutenFreeItems.join(', ')}. Please double-check with staff for severe allergies.`;
  }

  if (lower.includes('nut') || lower.includes('allergen')) {
    const allergenInfo = menu.map((item) => `${item.name}: ${item.allergens.length ? item.allergens.join(', ') : 'None listed'}`).join(' • ');
    return `Here’s the allergy info: ${allergenInfo}. Please double-check with staff for severe allergies.`;
  }

  const foundItem = menu.find((item) => lower.includes(item.name.toLowerCase()) || lower.includes(item.name.toLowerCase().split(' ').slice(0, 2).join(' ')));

  if (foundItem) {
    if (lower.includes('add') || lower.includes('order') || lower.includes('want') || lower.includes('get') || lower.includes('buy')) {
      const quantityMatch = text.match(/(\d+)/);
      const quantity = quantityMatch ? Number(quantityMatch[1]) : 1;
      addToOrder(foundItem.name, quantity);
      return `${quantity} ${foundItem.name} added to your order. Current total is ${formatCurrency(state.order.reduce((sum, entry) => {
        const item = getItemByName(entry.name);
        return sum + item.price * entry.quantity;
      }, 0))}. Want anything else?`;
    }

    const itemDetails = `${foundItem.name} — ${formatCurrency(foundItem.price)}. ${foundItem.description}. ${foundItem.tags.join(', ')}. Contains: ${foundItem.allergens.length ? foundItem.allergens.join(', ') : 'None listed'}. Please double-check with staff for severe allergies.`;
    return itemDetails;
  }

  if (lower.includes('confirm order') || lower.includes('finalize order')) {
    return confirmOrder();
  }

  if (lower.includes('order') || lower.includes('cart') || lower.includes('my order')) {
    if (!state.order.length) {
      return 'Your cart is empty right now. Add a dish and I’ll keep the total updated.';
    }

    const total = state.order.reduce((sum, entry) => {
      const item = getItemByName(entry.name);
      return sum + item.price * entry.quantity;
    }, 0);

    const summary = state.order.map((entry) => `${entry.quantity}x ${entry.name}`).join(', ');
    return `Your current order: ${summary}. Total: ${formatCurrency(total)}. Want me to confirm it?`;
  }

  if (lower.includes('clear order') || lower.includes('reset order')) {
    state.order = [];
    renderOrder();
    return 'Your order has been cleared. What would you like to add next?';
  }

  if (lower.includes('complaint') || lower.includes('refund') || lower.includes('catering') || lower.includes('job')) {
    return 'I can help get that to the right team. Please share your name and contact number, and a team member will follow up.';
  }

  if (lower.includes('rude') || lower.includes('off topic')) {
    return 'Happy to help with anything food-related! What can I get started for you?';
  }

  return 'I can help with menu items, dietary info, or building an order. Try asking for the vegetarian picks, a specific dish, or what’s in your cart.';
}

async function handleSubmit(event) {
  event.preventDefault();
  const input = userInput.value;
  if (!input.trim() || awaitingBackendReply) return;

  addMessage(input, 'user');
  userInput.value = '';
  awaitingBackendReply = true;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input }),
    });

    const data = await response.json();
    const text = data.reply || 'I could not answer that right now. Please try again.';
    addMessage(text, 'bot');
  } catch (error) {
    addMessage('I’m having trouble reaching the AI right now. Please try again in a moment.', 'bot');
  } finally {
    awaitingBackendReply = false;
  }
}

chatForm.addEventListener('submit', handleSubmit);

addMessage('Hi! I’m Bella at Amr shop — I can help with the menu, dietary questions, or placing your order. What would you like today?', 'bot');
renderOrder();
