let cart = JSON.parse(localStorage.getItem('vieCart')) || [];

const cartButton = document.getElementById('cartButton');
const quantitySpan = cartButton?.querySelector('.quantity');
const cartSidebar = document.getElementById('cartSidebar');
const closeCart = document.getElementById('closeCart');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalSpan = document.getElementById('cartTotal');

function updateCartCount() {
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (quantitySpan) quantitySpan.textContent = total;
}

function updateCartSidebar() {
  if (!cartItemsContainer || !cartTotalSpan) return;

  cartItemsContainer.innerHTML = '';
  let totalPrice = 0;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p style="text-align:center; opacity:0.6;">Cart is empty</p>';
  } else {
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
  }

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

// Abrir/cerrar sidebar del carrito
if (cartButton && cartSidebar) {
  cartButton.addEventListener('click', () => {
    cartSidebar.classList.toggle('active');
  });

  closeCart?.addEventListener('click', () => {
    cartSidebar.classList.remove('active');
  });
}

// Vaciar carrito
document.getElementById('clearCartBtn')?.addEventListener('click', () => {
  if (confirm("Are you sure you want to empty the cart?")) {
    cart = [];
    localStorage.removeItem('vieCart');
    updateCartSidebar();
  }
});

// Checkout con Stripe
document.getElementById('checkoutBtn')?.addEventListener('click', async () => {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  const stripeItems = cart.map(item => ({
    priceId: item.id, // debe ser el priceId de Stripe
    quantity: item.quantity
  }));

  try {
    const response = await fetch('https://stripe-server-s9yi.onrender.com/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: stripeItems })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al crear sesión de pago');
    }

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Error connecting to Stripe.");
    }
  } catch (error) {
    console.error("Checkout error:", error);
    alert("An error occurred during checkout: " + error.message);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  updateCartSidebar();

  // Botón Añadir al carrito
  document.querySelectorAll('.add-to-cart-btn').forEach(button => {
    button.addEventListener('click', () => {
      const productContainer = button.closest('.product0-container');
      if (!productContainer) return;

      const id = productContainer.getAttribute('data-price-id') || productContainer.getAttribute('data-id') || 'default-id';
      
      let name = '';
      const prevH1 = productContainer.previousElementSibling;
      if (prevH1 && prevH1.tagName === 'H1') {
        name = prevH1.textContent.trim();
      } else {
        name = productContainer.querySelector('.product-name')?.textContent.trim() || 'Producto';
      }

      const priceText = productContainer.querySelector('.price0')?.textContent.trim() || '0';
      const price = parseFloat(priceText.replace(',', '.').replace(/[^0-9.]/g, '')) || 0;

      const image = productContainer.querySelector('img')?.src || '';

      const quantityInput = productContainer.querySelector('.quantity-input');
      let quantity = 1;
      if (quantityInput) {
        quantity = parseInt(quantityInput.value);
        if (isNaN(quantity) || quantity < 1) quantity = 1;
      }

      const existing = cart.find(item => item.id === id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.push({ id, name, price, image, quantity });
      }

      updateCartSidebar();

      window.location.href = '../shop.html';
    });
  });

  // Botón Comprar Ahora (Apple Pay / Stripe directo)
  document.querySelectorAll('.apple-pay').forEach(button => {
    button.addEventListener('click', async () => {
      const productContainer = button.closest('.product0-container');
      if (!productContainer) return;

      const priceId = productContainer.getAttribute('data-price-id');
      const quantityInput = productContainer.querySelector('.quantity-input');
      let quantity = 1;
      if (quantityInput) {
        quantity = parseInt(quantityInput.value);
        if (isNaN(quantity) || quantity < 1) quantity = 1;
      }

      if (!priceId) {
        alert("No se encontró el precio del producto para Stripe.");
        return;
      }

      const stripeItems = [{ priceId, quantity }];

      try {
        const response = await fetch('https://stripe-server-s9yi.onrender.com/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: stripeItems })
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Error desconocido");
        }

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          alert("Error al iniciar Stripe.");
        }
      } catch (error) {
        console.error("Error al conectar con Stripe:", error);
        alert("Error: " + error.message);
      }
    });
  });
});
