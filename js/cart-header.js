let cart = JSON.parse(localStorage.getItem('vieCart')) || [];

const cartButton = document.getElementById('cartButton');
const quantitySpan = cartButton?.querySelector('.quantity');
const cartSidebar = document.getElementById('cartSidebar');
const closeCart = document.getElementById('closeCart');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalSpan = document.getElementById('cartTotal');

function updateCartCount() {
  let total = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (quantitySpan) quantitySpan.textContent = total;
}

function updateCartSidebar() {
  if (!cartItemsContainer || !cartTotalSpan) return;
  cartItemsContainer.innerHTML = '';
  let totalPrice = 0;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p style="text-align:center; opacity:0.6;">Cart is empty</p>';
  }

  cart.forEach(item => {
    totalPrice += item.price * item.quantity;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'cart-item';
    itemDiv.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-details">
        <div>${item.name}</div>
        <div class="cart-item-qty">
          <button onclick="changeQty('${item.id}', -1)">-</button>
          <span>${item.quantity}</span>
          <button onclick="changeQty('${item.id}', 1)">+</button>
        </div>
      </div>
    `;
    cartItemsContainer.appendChild(itemDiv);
  });

  cartTotalSpan.textContent = totalPrice.toFixed(2);
  updateCartCount();
  localStorage.setItem('vieCart', JSON.stringify(cart));
}

function changeQty(id, delta) {
  const index = cart.findIndex(item => item.id === id);
  if (index >= 0) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    updateCartSidebar();
  }
}

if (cartButton && cartSidebar) {
  cartButton.addEventListener('click', () => {
    cartSidebar.classList.toggle('active');
  });

  closeCart?.addEventListener('click', () => {
    cartSidebar.classList.remove('active');
  });
}

document.getElementById('clearCartBtn')?.addEventListener('click', () => {
  if (confirm("Are you sure you want to empty the cart?")) {
    cart = [];
    localStorage.removeItem('vieCart');
    updateCartSidebar();
  }
});

document.getElementById('checkoutBtn')?.addEventListener('click', async () => {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  try {
    const response = await fetch('/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart })
    });

    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Error connecting to Stripe.");
    }
  } catch (error) {
    console.error("Checkout error:", error);
    alert("An error occurred during checkout.");
  }
});

window.addEventListener('DOMContentLoaded', () => {
  updateCartSidebar();
});
