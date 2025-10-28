/* script.js - Versão Corrigida */
const CONFIG = {
  whatsappNumber: '55DDDNÚMERO',
  btcToBrl: 350000,
  pixQrPath: 'assets/pix-qrcode.png',
  btcQrPath: 'assets/btc-qrcode.png'
};

// Elementos DOM
const productsGrid = document.getElementById('productsGrid');
const cartIcon = document.getElementById('cartIcon');
const cartCountEl = document.getElementById('cartCount');
const cartModal = document.getElementById('cartModal');
const closeModalBtn = document.getElementById('closeModal');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalBtcEl = document.getElementById('cartTotalBtc');
const cartTotalFiatEl = document.getElementById('cartTotalFiat');
const checkoutBtn = document.getElementById('checkoutBtn');
const backToCartBtn = document.getElementById('backToCartBtn');
const confirmOrderBtn = document.getElementById('confirmOrderBtn');
const deliveryForm = document.getElementById('deliveryForm');
const confirmationSection = document.getElementById('confirmationSection');
const orderSummaryEl = document.getElementById('orderSummary');
const orderTotalBtcEl = document.getElementById('orderTotalBtc');
const orderTotalFiatEl = document.getElementById('orderTotalFiat');
const btcRateEl = document.getElementById('btcRate');

// Estado
let products = [];
let cart = [];

/* ---------- Utilitários ---------- */
function formatBrl(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatBtc(value) {
  return `${value.toFixed(4)} BTC`;
}

/* ---------- Carregar Produtos ---------- */
async function loadProducts() {
  try {
    const res = await fetch('produtos.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Falha ao carregar produtos');
    products = await res.json();
    renderProducts();
  } catch (err) {
    console.error(err);
    productsGrid.textContent = 'Erro ao carregar produtos. Verifique produtos.json';
  }
}

/* ---------- Render Produtos com Carrossel ---------- */
function renderProducts() {
  productsGrid.innerHTML = '';
  
  products.forEach(prod => {
    const card = document.createElement('article');
    card.className = 'product-card';

    // Container da imagem com carrossel
    const imgContainer = document.createElement('div');
    imgContainer.className = 'product-image';

    // Carrossel
    const carousel = document.createElement('div');
    carousel.className = 'carousel';
    
    // Imagem principal
    const img = document.createElement('img');
    img.alt = prod.name;
    img.src = prod.images && prod.images.length > 0 ? prod.images[0] : '';
    
    // Botões do carrossel (só mostra se tiver mais de 1 imagem)
    if (prod.images && prod.images.length > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'carousel-btn carousel-prev';
      prevBtn.innerHTML = '‹';
      prevBtn.setAttribute('aria-label', 'Imagem anterior');
      
      const nextBtn = document.createElement('button');
      nextBtn.className = 'carousel-btn carousel-next';
      nextBtn.innerHTML = '›';
      nextBtn.setAttribute('aria-label', 'Próxima imagem');

      let currentImageIndex = 0;

      function updateImage() {
        img.src = prod.images[currentImageIndex];
      }

      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentImageIndex = (currentImageIndex - 1 + prod.images.length) % prod.images.length;
        updateImage();
      });

      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentImageIndex = (currentImageIndex + 1) % prod.images.length;
        updateImage();
      });

      carousel.appendChild(prevBtn);
      carousel.appendChild(img);
      carousel.appendChild(nextBtn);
    } else {
      carousel.appendChild(img);
    }

    imgContainer.appendChild(carousel);

    // Informações do produto
    const info = document.createElement('div');
    info.className = 'product-info';
    
    const title = document.createElement('h3');
    title.className = 'product-title';
    title.textContent = prod.name;
    
    const desc = document.createElement('p');
    desc.className = 'product-description';
    desc.textContent = prod.description || '';
    
    const price = document.createElement('div');
    price.className = 'product-price';
    
    const priceBtc = document.createElement('span');
    priceBtc.className = 'price-btc';
    priceBtc.textContent = formatBtc(prod.price);
    
    const priceFiat = document.createElement('span');
    priceFiat.className = 'price-fiat';
    priceFiat.textContent = ` (${formatBrl(prod.price * CONFIG.btcToBrl)})`;
    
    price.appendChild(priceBtc);
    price.appendChild(priceFiat);

    // Botão adicionar ao carrinho
    const addBtn = document.createElement('button');
    addBtn.className = 'btn add-to-cart';
    addBtn.type = 'button';
    addBtn.textContent = prod.stock > 0 ? 'Adicionar ao Carrinho' : 'Sem Estoque';
    addBtn.disabled = prod.stock <= 0;
    
    if (prod.stock > 0) {
      addBtn.addEventListener('click', () => addToCart(prod.id));
    }

    // Montagem do card
    info.appendChild(title);
    info.appendChild(desc);
    info.appendChild(price);
    info.appendChild(addBtn);
    
    card.appendChild(imgContainer);
    card.appendChild(info);
    
    productsGrid.appendChild(card);
  });
}

/* ---------- Funcionalidades do Carrinho ---------- */
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  if (product.stock <= 0) {
    alert('Produto sem estoque.');
    return;
  }

  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    if (existingItem.quantity >= product.stock) {
      alert('Quantidade máxima em estoque atingida.');
      return;
    }
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images && product.images.length > 0 ? product.images[0] : '',
      quantity: 1
    });
  }

  updateCart();
  showNotification(`${product.name} adicionado ao carrinho.`);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCart();
}

function updateQuantity(productId, newQuantity) {
  if (newQuantity < 1) {
    removeFromCart(productId);
    return;
  }
  
  const product = products.find(p => p.id === productId);
  const item = cart.find(i => i.id === productId);
  
  if (item && product) {
    if (newQuantity > product.stock) {
      alert(`Só temos ${product.stock} unidades em estoque.`);
      return;
    }
    item.quantity = newQuantity;
    updateCart();
  }
}

function updateCart() {
  // Atualizar contador
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountEl.textContent = totalItems;

  // Atualizar itens do carrinho
  cartItemsEl.innerHTML = '';
  
  if (cart.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.style.textAlign = 'center';
    emptyMsg.style.padding = '2rem';
    emptyMsg.textContent = 'Seu carrinho está vazio';
    cartItemsEl.appendChild(emptyMsg);
    checkoutBtn.disabled = true;
  } else {
    checkoutBtn.disabled = false;
    
    cart.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      
      // Lado esquerdo: imagem e detalhes
      const leftSide = document.createElement('div');
      leftSide.className = 'cart-item-left';
      
      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.name;
      
      const details = document.createElement('div');
      details.className = 'cart-item-details';
      
      const name = document.createElement('h4');
      name.textContent = item.name;
      
      const price = document.createElement('div');
      price.textContent = formatBtc(item.price);
      
      details.appendChild(name);
      details.appendChild(price);
      leftSide.appendChild(img);
      leftSide.appendChild(details);
      
      // Lado direito: quantidade e remover
      const rightSide = document.createElement('div');
      rightSide.className = 'cart-item-controls';
      
      const quantityControls = document.createElement('div');
      quantityControls.className = 'quantity-controls';
      
      const minusBtn = document.createElement('button');
      minusBtn.className = 'quantity-btn';
      minusBtn.textContent = '-';
      minusBtn.addEventListener('click', () => updateQuantity(item.id, item.quantity - 1));
      
      const quantityDisplay = document.createElement('span');
      quantityDisplay.className = 'quantity-display';
      quantityDisplay.textContent = item.quantity;
      
      const plusBtn = document.createElement('button');
      plusBtn.className = 'quantity-btn';
      plusBtn.textContent = '+';
      plusBtn.addEventListener('click', () => updateQuantity(item.id, item.quantity + 1));
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-item';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => removeFromCart(item.id));
      
      quantityControls.appendChild(minusBtn);
      quantityControls.appendChild(quantityDisplay);
      quantityControls.appendChild(plusBtn);
      
      rightSide.appendChild(quantityControls);
      rightSide.appendChild(removeBtn);
      
      itemEl.appendChild(leftSide);
      itemEl.appendChild(rightSide);
      cartItemsEl.appendChild(itemEl);
    });
  }
  
  // Atualizar totais
  const totalBtc = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalFiat = totalBtc * CONFIG.btcToBrl;
  
  cartTotalBtcEl.textContent = formatBtc(totalBtc);
  cartTotalFiatEl.textContent = `(${formatBrl(totalFiat)})`;
}

/* ---------- Notificações ---------- */
function showNotification(message, duration = 3000) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, duration);
}

/* ---------- Processo de Pedido ---------- */
function generateOrderCode() {
  return 'MA' + Date.now() + Math.random().toString(36).slice(2, 7).toUpperCase();
}

function validateDeliveryForm() {
  const fields = [
    'customerName', 'customerEmail', 'customerPhone', 
    'deliveryAddress', 'deliveryCity', 'deliveryState', 'deliveryZip'
  ];
  
  for (const fieldId of fields) {
    const field = document.getElementById(fieldId);
    if (!field.value.trim()) {
      alert(`Por favor, preencha o campo: ${field.previousElementSibling.textContent.trim()}`);
      field.focus();
      return false;
    }
  }
  
  // Validação básica de email
  const email = document.getElementById('customerEmail').value;
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    alert('Por favor, insira um e-mail válido.');
    return false;
  }
  
  // Validação básica de telefone
  const phone = document.getElementById('customerPhone').value.replace(/\D/g, '');
  if (phone.length < 10) {
    alert('Por favor, insira um telefone válido.');
    return false;
  }
  
  return true;
}

function getDeliveryInfo() {
  return {
    name: document.getElementById('customerName').value.trim(),
    email: document.getElementById('customerEmail').value.trim(),
    phone: document.getElementById('customerPhone').value.trim(),
    address: document.getElementById('deliveryAddress').value.trim(),
    city: document.getElementById('deliveryCity').value.trim(),
    state: document.getElementById('deliveryState').value.trim(),
    zip: document.getElementById('deliveryZip').value.trim()
  };
}

function finalizeOrder() {
  if (cart.length === 0) {
    alert('Seu carrinho está vazio.');
    return null;
  }
  
  if (!validateDeliveryForm()) {
    return null;
  }
  
  const deliveryInfo = getDeliveryInfo();
  const orderCode = generateOrderCode();
  const totalBtc = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const order = {
    code: orderCode,
    date: new Date().toISOString(),
    items: cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })),
    delivery: deliveryInfo,
    total: totalBtc,
    status: 'aguardando_pagamento'
  };
  
  // Salvar localmente
  saveOrderLocally(order);
  showOrderConfirmation(order);
  
  return order;
}

function saveOrderLocally(order) {
  const orders = JSON.parse(localStorage.getItem('maStoreOrders') || '[]');
  orders.push(order);
  localStorage.setItem('maStoreOrders', JSON.stringify(orders));
}

function showOrderConfirmation(order) {
  // Preencher resumo do pedido
  orderSummaryEl.innerHTML = '';
  order.items.forEach(item => {
    const itemEl = document.createElement('p');
    itemEl.textContent = `${item.quantity}x ${item.name} — ${formatBtc(item.price * item.quantity)}`;
    orderSummaryEl.appendChild(itemEl);
  });
  
  orderTotalBtcEl.textContent = formatBtc(order.total);
  orderTotalFiatEl.textContent = `(${formatBrl(order.total * CONFIG.btcToBrl)})`;
  
  // Mostrar seção de confirmação
  deliveryForm.hidden = true;
  confirmationSection.hidden = false;
  backToCartBtn.hidden = false;
  confirmOrderBtn.hidden = false;
  checkoutBtn.hidden = true;
  
  // Guardar pedido para uso posterior
  confirmOrderBtn.dataset.order = JSON.stringify(order);
}

function sendToWhatsApp(order) {
  const phone = CONFIG.whatsappNumber.replace(/\D/g, '');
  
  let message = `🛍️ *NOVO PEDIDO MASTORE* 🛍️\n\n`;
  message += `*Código:* ${order.code}\n`;
  message += `*Data:* ${new Date().toLocaleString('pt-BR')}\n\n`;
  message += `*👤 CLIENTE:*\n`;
  message += `Nome: ${order.delivery.name}\n`;
  message += `Email: ${order.delivery.email}\n`;
  message += `Telefone: ${order.delivery.phone}\n`;
  message += `Endereço: ${order.delivery.address}\n`;
  message += `Cidade: ${order.delivery.city} - ${order.delivery.state}\n`;
  message += `CEP: ${order.delivery.zip}\n\n`;
  message += `*🛒 ITENS:*\n`;
  
  order.items.forEach(item => {
    message += `▫️ ${item.quantity}x ${item.name}\n`;
    message += `   ${formatBtc(item.price * item.quantity)} (${formatBrl(item.price * item.quantity * CONFIG.btcToBrl)})\n`;
  });
  
  message += `\n*💰 TOTAL:* ${formatBtc(order.total)} (${formatBrl(order.total * CONFIG.btcToBrl)})`;
  message += `\n\n*💳 FORMA DE PAGAMENTO:* PIX/Bitcoin`;
  message += `\n\n_O pedido foi salvo localmente e aguarda confirmação de pagamento._`;
  
  if (phone && !phone.includes('DDD') && !phone.includes('NÚMERO')) {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  } else {
    navigator.clipboard.writeText(message).then(() => {
      alert('Número do WhatsApp não configurado. Pedido copiado para área de transferência!');
    }).catch(() => {
      alert('Número do WhatsApp não configurado. Copie manualmente:\n\n' + message);
    });
  }
}

/* ---------- Event Listeners ---------- */
cartIcon.addEventListener('click', () => {
  cartModal.setAttribute('aria-hidden', 'false');
  cartModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
  cartModal.setAttribute('aria-hidden', 'true');
  cartModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === cartModal) {
    cartModal.setAttribute('aria-hidden', 'true');
    cartModal.style.display = 'none';
  }
});

checkoutBtn.addEventListener('click', () => {
  deliveryForm.scrollIntoView({ behavior: 'smooth' });
});

backToCartBtn.addEventListener('click', () => {
  deliveryForm.hidden = false;
  confirmationSection.hidden = true;
  backToCartBtn.hidden = true;
  confirmOrderBtn.hidden = true;
  checkoutBtn.hidden = false;
});

confirmOrderBtn.addEventListener('click', () => {
  try {
    const order = JSON.parse(confirmOrderBtn.dataset.order);
    if (order) {
      sendToWhatsApp(order);
      cart = [];
      updateCart();
      cartModal.setAttribute('aria-hidden', 'true');
      cartModal.style.display = 'none';
      showNotification('Pedido enviado com sucesso! Verifique o WhatsApp.');
      
      // Resetar formulário
      deliveryForm.reset();
    }
  } catch (error) {
    console.error('Erro ao processar pedido:', error);
    alert('Erro ao processar pedido. Tente novamente.');
  }
});

// Finalizar compra
checkoutBtn.addEventListener('click', (e) => {
  if (cart.length > 0) {
    const order = finalizeOrder();
    if (order) {
      // Pedido processado com sucesso
    }
  }
});

/* ---------- Inicialização ---------- */
function init() {
  // Configurar taxa BTC
  btcRateEl.textContent = `R$ ${CONFIG.btcToBrl.toLocaleString('pt-BR')}`;
  
  // Carregar produtos
  loadProducts();
  updateCart();
}

// Iniciar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}