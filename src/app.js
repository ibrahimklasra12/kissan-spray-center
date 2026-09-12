/**
 * KISSAN SPRAY CENTER - ERP & POS System
 * Location: Pull 88,000 | Contact: 03426400074
 */

// =========================================================================
// 1. FIREBASE CONFIGURATION & INITIALIZATION
// =========================================================================
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

let db = null;
let auth = null;
let isFirebaseReady = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId && window.firebase) {
    window.firebase.initializeApp(firebaseConfig);
    auth = window.firebase.auth();
    db = window.firebase.firestore();
    isFirebaseReady = true;
    console.log("Firebase initialized successfully");
  } else {
    console.log("Using LocalStorage fallback storage (Firebase keys not provided)");
  }
} catch (err) {
  console.warn("Firebase initialization failed, falling back to LocalStorage:", err);
  isFirebaseReady = false;
}

// =========================================================================
// 2. DATA STATE (COLLECTIONS: products, sales, farmers, suppliers, expenses)
// ALL COUNTERS & TABLES START AT ZERO (0) / EMPTY STATE
// =========================================================================
const STORAGE_KEYS = {
  PRODUCTS: 'ksc_products_v1',
  SALES: 'ksc_sales_v1',
  FARMERS: 'ksc_farmers_v1',
  SUPPLIERS: 'ksc_suppliers_v1',
  EXPENSES: 'ksc_expenses_v1',
  AUTH: 'ksc_user_auth_v1'
};

let appData = {
  products: [],
  sales: [],
  farmers: [],
  suppliers: [],
  expenses: []
};

let currentUser = null;

// Currency Formatter
function formatPKR(val) {
  const num = Number(val) || 0;
  return 'Rs. ' + num.toLocaleString('en-US');
}

// Toast helper
function showToast(title, message, isSuccess = true) {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toastIcon');
  if (!toast) return;
  document.getElementById('toastTitle').innerText = title;
  document.getElementById('toastMessage').innerText = message;
  icon.className = isSuccess 
    ? 'w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0'
    : 'w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs shrink-0';
  icon.innerText = isSuccess ? '✓' : '!';
  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
}

// =========================================================================
// 3. PERSISTENCE & STORAGE HELPERS (Firestore + LocalStorage fallback)
// =========================================================================
function loadLocalData() {
  appData.products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
  appData.sales = JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES) || '[]');
  appData.farmers = JSON.parse(localStorage.getItem(STORAGE_KEYS.FARMERS) || '[]');
  appData.suppliers = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPPLIERS) || '[]');
  appData.expenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
}

function saveLocalData(collectionKey) {
  if (collectionKey) {
    localStorage.setItem(STORAGE_KEYS[collectionKey.toUpperCase()], JSON.stringify(appData[collectionKey]));
  } else {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(appData.products));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(appData.sales));
    localStorage.setItem(STORAGE_KEYS.FARMERS, JSON.stringify(appData.farmers));
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(appData.suppliers));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(appData.expenses));
  }
}

// Async Firestore Sync
async function syncCollectionToFirestore(colName, item) {
  if (!isFirebaseReady || !db) return;
  try {
    await db.collection(colName).doc(String(item.id)).set(item);
  } catch (e) {
    console.error(`Firestore write error on ${colName}:`, e);
  }
}

// =========================================================================
// 4. AUTHENTICATION (Immediate Local Auth + Optional Google Sign-In)
// =========================================================================
function initAuth() {
  const authScreen = document.getElementById('authScreen');
  const appContainer = document.getElementById('appContainer');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (isLoggedIn) {
    if (authScreen) authScreen.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');

    currentUser = {
      name: 'Kisan Admin',
      email: 'kisan@spraycenter.pk',
      avatar: 'K'
    };
    const savedUser = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
      } catch (e) {}
    }
    renderUserProfile();
  } else {
    if (authScreen) authScreen.classList.remove('hidden');
    if (appContainer) appContainer.classList.add('hidden');
  }

  // Non-blocking Firebase Auth sync (only if Firebase is loaded)
  if (isFirebaseReady && auth) {
    try {
      auth.onAuthStateChanged((user) => {
        if (user) {
          currentUser = {
            name: user.displayName || 'Kisan Admin',
            email: user.email || 'ibrahimklasra12@gmail.com',
            avatar: user.photoURL || 'K'
          };
          localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(currentUser));
          localStorage.setItem('isLoggedIn', 'true');
          renderUserProfile();
          if (authScreen) authScreen.classList.add('hidden');
          if (appContainer) appContainer.classList.remove('hidden');
        }
      });
    } catch (e) {
      console.warn("Firebase auth listener error (ignored):", e);
    }
  }
}

function showAuthScreen() {
  const screen = document.getElementById('authScreen');
  const app = document.getElementById('appContainer');
  if (screen) screen.classList.remove('hidden');
  if (app) app.classList.add('hidden');
}

function hideAuthScreen() {
  const screen = document.getElementById('authScreen');
  const app = document.getElementById('appContainer');
  if (screen) screen.classList.add('hidden');
  if (app) app.classList.remove('hidden');
}

function renderUserProfile() {
  if (!currentUser) return;
  const nameEl = document.getElementById('userName');
  const emailEl = document.getElementById('userEmail');
  const avatarEl = document.getElementById('userAvatar');
  if (nameEl) nameEl.innerText = currentUser.name;
  if (emailEl) emailEl.innerText = currentUser.email;
  if (avatarEl) {
    if (currentUser.avatar && currentUser.avatar.startsWith('http')) {
      avatarEl.innerHTML = `<img src="${currentUser.avatar}" class="w-full h-full rounded-full object-cover">`;
    } else {
      avatarEl.innerText = (currentUser.name || 'K').charAt(0).toUpperCase();
    }
  }
}

async function handleGoogleSignIn() {
  if (isFirebaseReady && auth && window.firebase) {
    try {
      const provider = new window.firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
      localStorage.setItem('isLoggedIn', 'true');
      hideAuthScreen();
      showToast('Google Sign-In Success', 'Welcome to Kissan Spray Center ERP');
      return;
    } catch (err) {
      console.warn("Google Sign-In failed or cancelled, using local session:", err);
    }
  }
  // Immediate local auth fallback
  demoLoginFallback();
}

function demoLoginFallback() {
  currentUser = {
    name: 'Kisan Admin',
    email: 'kisan@spraycenter.pk',
    avatar: 'K'
  };
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(currentUser));
  localStorage.setItem('isLoggedIn', 'true');
  renderUserProfile();
  hideAuthScreen();
  updateDashboard();
  showToast('Logged In', 'Welcome to Kissan Spray Center');
}

function handleDemoLogin(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }

  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');
  const errEl = document.getElementById('loginError');
  const authScreen = document.getElementById('authScreen');
  const appContainer = document.getElementById('appContainer');

  const u = usernameInput ? usernameInput.value.trim() : '';
  const p = passwordInput ? passwordInput.value.trim() : '';

  if (u === 'kisan' && p === 'kisan123') {
    if (errEl) errEl.classList.add('hidden');

    // Hide authScreen and remove hidden from appContainer
    if (authScreen) authScreen.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');

    // Store isLoggedIn = true in localStorage
    localStorage.setItem('isLoggedIn', 'true');

    currentUser = {
      name: 'Kisan Admin',
      email: 'kisan@spraycenter.pk',
      avatar: 'K'
    };
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(currentUser));
    renderUserProfile();
    updateDashboard();
    showToast('Logged In', 'Welcome to Kissan Spray Center');
    return false;
  } else {
    if (errEl) errEl.classList.remove('hidden');
    showToast('Login Failed', 'Invalid credentials. Enter kisan / kisan123', false);
    return false;
  }
}

function handleLogout() {
  if (isFirebaseReady && auth) {
    try {
      auth.signOut().catch(() => {});
    } catch (e) {}
  }
  currentUser = null;
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem(STORAGE_KEYS.AUTH);
  showAuthScreen();
  showToast('Logged Out', 'Session ended securely');
}

// =========================================================================
// 5. MODAL MANAGEMENT (Simple JavaScript Show/Hide/Toggle Functions)
// =========================================================================
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');

  // Populate dynamic select options when opening modals
  if (id === 'saleModal') {
    populateSaleProductsSelect();
    calcSaleTotals();
  } else if (id === 'farmerPaymentModal') {
    populateFarmerSelect();
  } else if (id === 'inventoryModal') {
    renderInventoryTable();
  } else if (id === 'farmerLedgerModal') {
    renderFarmerLedgers();
  } else if (id === 'supplierLedgerModal') {
    renderSupplierLedgers();
  } else if (id === 'reportsModal') {
    renderReports();
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function showModal(id) {
  openModal(id);
}

function hideModal(id) {
  closeModal(id);
}

function toggleModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.classList.contains('hidden')) {
    openModal(id);
  } else {
    closeModal(id);
  }
}

window.addEventListener('click', (e) => {
  ['saleModal', 'purchaseModal', 'farmerPaymentModal', 'expenseModal', 'inventoryModal', 'farmerLedgerModal', 'supplierLedgerModal', 'reportsModal'].forEach(id => {
    const modal = document.getElementById(id);
    if (e.target === modal) closeModal(id);
  });
});

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (!sb) return;
  sb.classList.toggle('-translate-x-full');
}

function navigateView(view) {
  // Mobile sidebar close on nav
  const sb = document.getElementById('sidebar');
  if (sb && window.innerWidth < 768) {
    sb.classList.add('-translate-x-full');
  }
}

// =========================================================================
// 6. DASHBOARD AUTO-CALCULATIONS & METRIC ENGINES
// =========================================================================
function updateDashboard() {
  // 1. Financial summary cards
  let totalSales = 0;
  let totalReceivable = 0;
  appData.sales.forEach(s => {
    totalSales += Number(s.totalAmount || 0);
    totalReceivable += Number(s.creditDue || 0);
  });

  let totalPurchase = 0;
  let totalPayable = 0;
  appData.suppliers.forEach(sup => {
    totalPurchase += Number(sup.totalPurchased || 0);
    totalPayable += Number(sup.payableDue || 0);
  });

  document.getElementById('cardTotalSales').innerText = formatPKR(totalSales);
  document.getElementById('cardTotalPurchase').innerText = formatPKR(totalPurchase);
  document.getElementById('cardReceivable').innerText = formatPKR(totalReceivable);
  document.getElementById('cardPayable').innerText = formatPKR(totalPayable);

  // 2. Expiry alert banner calculation
  updateExpiryAlerts();

  // 3. Low stock & out of stock
  updateStockAlerts();

  // 4. Top Farmers & Top Suppliers
  renderTopPartners();
}

function updateExpiryAlerts() {
  let expired = 0;
  let in3Days = 0;
  let in15Days = 0;
  let in30Days = 0;
  const alertItems = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  appData.products.forEach(p => {
    if (!p.expiryDate) return;
    const exp = new Date(p.expiryDate);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      expired++;
      alertItems.push({ product: p.name, expiry: p.expiryDate, stock: p.quantity, batch: p.batchNo, badge: `${Math.abs(diffDays)}d ago`, type: 'EXPIRED', color: 'red' });
    } else if (diffDays <= 3) {
      in3Days++;
      alertItems.push({ product: p.name, expiry: p.expiryDate, stock: p.quantity, batch: p.batchNo, badge: `${diffDays}d left`, type: '&le; 3 DAYS', color: 'amber' });
    } else if (diffDays <= 15) {
      in15Days++;
      alertItems.push({ product: p.name, expiry: p.expiryDate, stock: p.quantity, batch: p.batchNo, badge: `${diffDays}d left`, type: '&le; 15 DAYS', color: 'amber' });
    } else if (diffDays <= 30) {
      in30Days++;
      alertItems.push({ product: p.name, expiry: p.expiryDate, stock: p.quantity, batch: p.batchNo, badge: `${diffDays}d left`, type: '&le; 30 DAYS', color: 'amber' });
    }
  });

  const total = expired + in3Days + in15Days + in30Days;
  document.getElementById('expiryBadgeTotal').innerText = `${total} items`;
  document.getElementById('cntExpired').innerText = expired;
  document.getElementById('cnt3Days').innerText = in3Days;
  document.getElementById('cnt15Days').innerText = in15Days;
  document.getElementById('cnt30Days').innerText = in30Days;

  const container = document.getElementById('expiryItemsList');
  if (alertItems.length === 0) {
    container.innerHTML = `
      <div class="p-3 bg-emerald-50/50 border border-dashed border-emerald-200 rounded-lg text-center flex items-center justify-center gap-2 text-emerald-800">
        <i class="fa-regular fa-circle-check text-emerald-600"></i>
        <span class="text-xs font-semibold">No Expiry Alerts Found. All agrochemicals are well within shelf life.</span>
      </div>`;
  } else {
    container.innerHTML = alertItems.map(item => `
      <div class="flex items-center justify-between p-2.5 bg-${item.color}-50/40 rounded-lg border border-${item.color}-200 hover:bg-${item.color}-50/80 transition">
        <div class="flex items-center gap-2.5">
          <span class="w-2.5 h-2.5 rounded-full bg-${item.color === 'red' ? 'red-600 ring-4 ring-red-100' : 'amber-500 ring-4 ring-amber-100'} shrink-0"></span>
          <div>
            <h4 class="font-bold text-xs text-slate-900 uppercase">${item.product}</h4>
            <p class="text-[11px] text-slate-500">Batch: <span class="font-medium text-slate-700 font-mono">${item.batch || 'N/A'}</span> &bull; Exp: <span class="font-medium text-slate-700">${item.expiry}</span> &bull; Stock: <span class="font-semibold text-slate-800">${item.stock} Pack</span></p>
          </div>
        </div>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-${item.color}-100 text-${item.color}-800 border border-${item.color}-200">
          ${item.badge}
        </span>
      </div>
    `).join('');
  }
}

function updateStockAlerts() {
  const lowStock = appData.products.filter(p => Number(p.quantity) > 0 && Number(p.quantity) < 5);
  const outOfStock = appData.products.filter(p => Number(p.quantity) <= 0);

  document.getElementById('badgeLowStock').innerText = lowStock.length;
  document.getElementById('badgeOutOfStock').innerText = outOfStock.length;

  const lowContainer = document.getElementById('containerLowStock');
  if (lowStock.length === 0) {
    lowContainer.innerHTML = `
      <div class="w-10 h-10 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
        <i class="fa-solid fa-check"></i>
      </div>
      <p class="font-semibold text-slate-700">No items running low on stock.</p>
      <p class="text-[11px] text-slate-400">All inventory is optimal.</p>`;
  } else {
    lowContainer.innerHTML = `<div class="divide-y divide-slate-100 text-left">` + 
      lowStock.map(p => `
        <div class="py-2 px-1 flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-800">${p.name}</span>
          <span class="px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">${p.quantity} Pack</span>
        </div>
      `).join('') + `</div>`;
  }

  const outContainer = document.getElementById('containerOutOfStock');
  if (outOfStock.length === 0) {
    outContainer.innerHTML = `
      <div class="w-10 h-10 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
        <i class="fa-solid fa-circle-check"></i>
      </div>
      <p class="font-semibold text-slate-700">No out-of-stock items detected.</p>
      <p class="text-[11px] text-slate-400">Warehouse status normal.</p>`;
  } else {
    outContainer.innerHTML = `<div class="divide-y divide-slate-100 text-left">` + 
      outOfStock.map(p => `
        <div class="py-2 px-1 flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-800">${p.name}</span>
          <span class="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[11px] border border-red-200">Out of Stock</span>
        </div>
      `).join('') + `</div>`;
  }
}

function renderTopPartners() {
  // Top Farmers
  const custContainer = document.getElementById('topCustomersList');
  if (appData.farmers.length === 0) {
    custContainer.innerHTML = `
      <div class="py-8 px-4 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
        <i class="fa-solid fa-user-slash text-slate-300 text-2xl mb-2"></i>
        <p class="text-xs font-semibold text-slate-600">No customer sales or ledger transactions recorded yet.</p>
        <p class="text-[11px] text-slate-400 mt-0.5">Click "+ New Sale" to log transactions.</p>
      </div>`;
  } else {
    const sortedFarmers = [...appData.farmers].sort((a, b) => (b.balanceDue || 0) - (a.balanceDue || 0)).slice(0, 5);
    custContainer.innerHTML = sortedFarmers.map(f => `
      <div class="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition border border-slate-100 bg-white">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
            ${f.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span class="text-xs font-semibold text-slate-800 truncate block max-w-[180px]">${f.name}</span>
            <span class="text-[10px] text-slate-400">${f.location || 'Pull 88,000'}</span>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs font-bold ${f.balanceDue > 0 ? 'text-amber-700' : 'text-slate-500'}">
            ${formatPKR(f.balanceDue || 0)}
          </span>
          <span class="block text-[9px] uppercase font-semibold text-slate-400">${f.balanceDue > 0 ? 'Udhaar' : 'Clear'}</span>
        </div>
      </div>
    `).join('');
  }

  // Top Suppliers
  const supContainer = document.getElementById('topSuppliersList');
  if (appData.suppliers.length === 0) {
    supContainer.innerHTML = `
      <div class="py-8 px-4 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
        <i class="fa-solid fa-building-circle-exclamation text-slate-300 text-2xl mb-2"></i>
        <p class="text-xs font-semibold text-slate-600">No supplier purchase records found.</p>
        <p class="text-[11px] text-slate-400 mt-0.5">Click "+ New Purchase" to record inventory arrival.</p>
      </div>`;
  } else {
    const sortedSuppliers = [...appData.suppliers].sort((a, b) => (b.payableDue || 0) - (a.payableDue || 0)).slice(0, 5);
    supContainer.innerHTML = sortedSuppliers.map(s => `
      <div class="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition border border-slate-100 bg-white">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-full bg-emerald-900 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-300/40">
            ${s.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span class="text-xs font-semibold text-slate-800 truncate block max-w-[180px]">${s.name}</span>
            <span class="text-[10px] text-slate-400">Total: ${formatPKR(s.totalPurchased || 0)}</span>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs font-bold ${s.payableDue > 0 ? 'text-red-600' : 'text-slate-500'}">
            ${formatPKR(s.payableDue || 0)}
          </span>
          <span class="block text-[9px] uppercase font-semibold text-slate-400">${s.payableDue > 0 ? 'Payable' : 'Settled'}</span>
        </div>
      </div>
    `).join('');
  }
}

// =========================================================================
// 7. POS SALE TRANSACTIONS
// =========================================================================
function populateSaleProductsSelect() {
  const select = document.getElementById('saleProductSelect');
  if (!select) return;
  select.innerHTML = '<option value="">-- Choose from active stock --</option>' + 
    appData.products.map(p => `
      <option value="${p.id}" data-name="${p.name}" data-price="${p.salePrice || 0}" data-batch="${p.batchNo || ''}" data-exp="${p.expiryDate || ''}">
        ${p.name} (Stock: ${p.quantity} | Rs. ${p.salePrice || 0})
      </option>
    `).join('') + '<option value="custom">+ Type Custom Agrochemical</option>';
}

function onSaleProductChange() {
  const select = document.getElementById('saleProductSelect');
  const opt = select.options[select.selectedIndex];
  if (!opt || !opt.value) return;

  if (opt.value === 'custom') {
    document.getElementById('saleProductName').value = '';
    document.getElementById('salePrice').value = 0;
    document.getElementById('saleBatchNo').value = '';
    document.getElementById('saleExpiryDate').value = '';
  } else {
    document.getElementById('saleProductName').value = opt.getAttribute('data-name') || '';
    document.getElementById('salePrice').value = opt.getAttribute('data-price') || 0;
    document.getElementById('saleBatchNo').value = opt.getAttribute('data-batch') || '';
    document.getElementById('saleExpiryDate').value = opt.getAttribute('data-exp') || '';
  }
  calcSaleTotals();
}

function onPaymentTypeChange() {
  const type = document.getElementById('salePaymentType').value;
  const qty = Number(document.getElementById('saleQty').value) || 0;
  const price = Number(document.getElementById('salePrice').value) || 0;
  const total = qty * price;

  const cashInput = document.getElementById('saleCashReceived');
  if (type === 'Cash') {
    cashInput.value = total;
  } else {
    cashInput.value = 0;
  }
  calcSaleTotals();
}

function calcSaleTotals() {
  const qty = Number(document.getElementById('saleQty').value) || 0;
  const price = Number(document.getElementById('salePrice').value) || 0;
  const total = qty * price;
  document.getElementById('saleTotalDisplay').innerText = formatPKR(total);

  const cashRec = Number(document.getElementById('saleCashReceived').value) || 0;
  const creditDue = Math.max(0, total - cashRec);
  document.getElementById('saleCreditDue').value = creditDue;
}

function submitSale(e) {
  e.preventDefault();
  const farmerName = document.getElementById('saleFarmerName').value.trim();
  const location = document.getElementById('saleLocation').value.trim() || 'Pull 88,000';
  const phone = document.getElementById('saleFarmerPhone').value.trim() || '03426400074';
  const prodName = document.getElementById('saleProductName').value.trim();
  const batchNo = document.getElementById('saleBatchNo').value.trim();
  const expiryDate = document.getElementById('saleExpiryDate').value;
  const qty = Number(document.getElementById('saleQty').value) || 1;
  const salePrice = Number(document.getElementById('salePrice').value) || 0;
  const paymentType = document.getElementById('salePaymentType').value;
  const totalAmount = qty * salePrice;
  const cashReceived = Number(document.getElementById('saleCashReceived').value) || 0;
  const creditDue = Math.max(0, totalAmount - cashReceived);

  // 1. Create Sale Record
  const newSale = {
    id: Date.now(),
    date: new Date().toISOString(),
    farmerName,
    location,
    phone,
    productName: prodName,
    batchNo,
    expiryDate,
    quantity: qty,
    salePrice,
    totalAmount,
    paymentType,
    cashReceived,
    creditDue
  };

  appData.sales.unshift(newSale);
  saveLocalData('sales');
  syncCollectionToFirestore('sales', newSale);

  // 2. Update Stock in Products
  const matchingProduct = appData.products.find(p => p.name.toLowerCase() === prodName.toLowerCase());
  if (matchingProduct) {
    matchingProduct.quantity = Math.max(0, Number(matchingProduct.quantity) - qty);
    saveLocalData('products');
    syncCollectionToFirestore('products', matchingProduct);
  } else {
    // Register product with zero stock if not existing
    const newProd = {
      id: Date.now() + 1,
      name: prodName,
      category: 'Pesticide',
      batchNo,
      expiryDate,
      purchasePrice: Math.round(salePrice * 0.8),
      salePrice,
      quantity: 0
    };
    appData.products.push(newProd);
    saveLocalData('products');
    syncCollectionToFirestore('products', newProd);
  }

  // 3. Update Farmer Ledger
  let farmer = appData.farmers.find(f => f.name.toLowerCase() === farmerName.toLowerCase());
  if (!farmer) {
    farmer = {
      id: Date.now() + 2,
      name: farmerName,
      location,
      phone,
      totalPurchases: totalAmount,
      balanceDue: creditDue
    };
    appData.farmers.push(farmer);
  } else {
    farmer.totalPurchases = (farmer.totalPurchases || 0) + totalAmount;
    farmer.balanceDue = (farmer.balanceDue || 0) + creditDue;
    if (phone && phone !== farmer.phone) farmer.phone = phone;
  }
  saveLocalData('farmers');
  syncCollectionToFirestore('farmers', farmer);

  updateDashboard();
  closeModal('saleModal');
  showToast('Sale Registered!', `${formatPKR(totalAmount)} logged for ${farmerName}.`);

  // Prompt WhatsApp Invoice option if credit or phone exists
  if (creditDue > 0 || phone) {
    setTimeout(() => {
      const askWA = confirm(`Open WhatsApp Invoice Receipt for ${farmerName}?`);
      if (askWA) {
        sendWhatsAppReceipt(farmerName, phone, totalAmount, cashReceived, creditDue, prodName, qty);
      }
    }, 400);
  }

  // Reset form
  document.getElementById('saleForm').reset();
  document.getElementById('saleLocation').value = 'Pull 88,000';
  calcSaleTotals();
}

// WhatsApp Receipt Formatter
function sendWhatsAppReceipt(farmerName, phone, total, paid, balance, item, qty) {
  const cleanPhone = (phone || '03426400074').replace(/[^0-9]/g, '');
  let waNumber = cleanPhone;
  if (waNumber.startsWith('03')) {
    waNumber = '92' + waNumber.substring(1);
  } else if (!waNumber.startsWith('92')) {
    waNumber = '923426400074';
  }

  const dateStr = new Date().toLocaleDateString('en-PK');
  const text = `*KISSAN SPRAY CENTER - PULL 88,000*
*Contact:* 03426400074
*Official Sales Receipt*
--------------------------------
*Date:* ${dateStr}
*Farmer:* ${farmerName}
*Location:* Pull 88,000
--------------------------------
*Item:* ${item}
*Qty:* ${qty} Pack
*Total Bill:* Rs. ${Number(total).toLocaleString()}
*Paid:* Rs. ${Number(paid).toLocaleString()}
*Remaining Udhaar:* Rs. ${Number(balance).toLocaleString()}
--------------------------------
Thank you for trusting Kissan Spray Center!`;

  const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

// =========================================================================
// 8. PURCHASE TRANSACTIONS & INVENTORY CREATION
// =========================================================================
function calcPurchTotals() {
  const cost = Number(document.getElementById('purchCostPrice').value) || 0;
  const qty = Number(document.getElementById('purchStockQty').value) || 0;
  const total = cost * qty;
  document.getElementById('purchTotalBill').value = total;

  const paid = Number(document.getElementById('purchPaid').value) || 0;
  const payable = Math.max(0, total - paid);
  document.getElementById('purchBalancePayable').value = payable;
}

function submitPurchase(e) {
  e.preventDefault();
  const supplierName = document.getElementById('purchSupplier').value.trim();
  const category = document.getElementById('purchCategory').value;
  const productName = document.getElementById('purchProduct').value.trim();
  const batchNo = document.getElementById('purchBatch').value.trim();
  const expiryDate = document.getElementById('purchExpiry').value;
  const costPrice = Number(document.getElementById('purchCostPrice').value) || 0;
  const salePrice = Number(document.getElementById('purchSalePrice').value) || 0;
  const qty = Number(document.getElementById('purchStockQty').value) || 1;
  const totalBill = costPrice * qty;
  const paid = Number(document.getElementById('purchPaid').value) || 0;
  const payableDue = Math.max(0, totalBill - paid);

  // 1. Update or Create Product in Inventory
  let product = appData.products.find(p => p.name.toLowerCase() === productName.toLowerCase() && p.batchNo === batchNo);
  if (product) {
    product.quantity = Number(product.quantity) + qty;
    product.purchasePrice = costPrice;
    product.salePrice = salePrice;
    product.expiryDate = expiryDate;
  } else {
    product = {
      id: Date.now(),
      name: productName,
      category,
      batchNo,
      expiryDate,
      purchasePrice: costPrice,
      salePrice,
      quantity: qty
    };
    appData.products.push(product);
  }
  saveLocalData('products');
  syncCollectionToFirestore('products', product);

  // 2. Update Supplier Ledger
  let supplier = appData.suppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
  if (!supplier) {
    supplier = {
      id: Date.now() + 1,
      name: supplierName,
      totalPurchased: totalBill,
      amountPaid: paid,
      payableDue: payableDue
    };
    appData.suppliers.push(supplier);
  } else {
    supplier.totalPurchased = (supplier.totalPurchased || 0) + totalBill;
    supplier.amountPaid = (supplier.amountPaid || 0) + paid;
    supplier.payableDue = (supplier.payableDue || 0) + payableDue;
  }
  saveLocalData('suppliers');
  syncCollectionToFirestore('suppliers', supplier);

  updateDashboard();
  closeModal('purchaseModal');
  showToast('Stock Purchased!', `Added ${qty} packs of ${productName} from ${supplierName}.`);

  document.getElementById('purchaseForm').reset();
  calcPurchTotals();
}

// =========================================================================
// 9. FARMER RECOVERY (PAYMENT TOWARDS UDHAAR)
// =========================================================================
function populateFarmerSelect() {
  const sel = document.getElementById('recFarmerSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Choose Farmer --</option>' + 
    appData.farmers.map(f => `
      <option value="${f.id}" data-due="${f.balanceDue || 0}">${f.name} (Udhaar: ${formatPKR(f.balanceDue || 0)})</option>
    `).join('');
  onRecFarmerChange();
}

function onRecFarmerChange() {
  const sel = document.getElementById('recFarmerSelect');
  const opt = sel.options[sel.selectedIndex];
  const due = opt ? (opt.getAttribute('data-due') || 0) : 0;
  document.getElementById('recFarmerBalance').innerText = formatPKR(due);
}

function submitFarmerRecovery(e) {
  e.preventDefault();
  const farmerId = Number(document.getElementById('recFarmerSelect').value);
  const amount = Number(document.getElementById('recAmount').value) || 0;
  const notes = document.getElementById('recNotes').value.trim();

  const farmer = appData.farmers.find(f => f.id === farmerId);
  if (!farmer) return;

  farmer.balanceDue = Math.max(0, (farmer.balanceDue || 0) - amount);
  saveLocalData('farmers');
  syncCollectionToFirestore('farmers', farmer);

  // Also reduce outstanding in sales table for this farmer proportionally
  let remainingAmount = amount;
  for (const sale of appData.sales) {
    if (sale.farmerName.toLowerCase() === farmer.name.toLowerCase() && sale.creditDue > 0) {
      const deduction = Math.min(sale.creditDue, remainingAmount);
      sale.creditDue -= deduction;
      sale.cashReceived += deduction;
      remainingAmount -= deduction;
      if (remainingAmount <= 0) break;
    }
  }
  saveLocalData('sales');

  updateDashboard();
  closeModal('farmerPaymentModal');
  showToast('Recovery Recorded!', `Received ${formatPKR(amount)} from ${farmer.name}.`);
  document.getElementById('farmerPaymentForm').reset();
}

// =========================================================================
// 10. EXPENSES RECORDING
// =========================================================================
function submitExpense(e) {
  e.preventDefault();
  const category = document.getElementById('expCategory').value;
  const amount = Number(document.getElementById('expAmount').value) || 0;
  const date = document.getElementById('expDate').value || new Date().toISOString().split('T')[0];
  const note = document.getElementById('expNote').value.trim();

  const newExp = {
    id: Date.now(),
    category,
    amount,
    date,
    note
  };

  appData.expenses.unshift(newExp);
  saveLocalData('expenses');
  syncCollectionToFirestore('expenses', newExp);

  updateDashboard();
  closeModal('expenseModal');
  showToast('Expense Logged', `${formatPKR(amount)} for ${category}.`);
  document.getElementById('expenseForm').reset();
}

// =========================================================================
// 11. INVENTORY TABLE VIEW & ACTIONS (EDIT / DELETE)
// =========================================================================
function renderInventoryTable() {
  const query = (document.getElementById('inventorySearch')?.value || '').toLowerCase();
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;

  const filtered = appData.products.filter(p => 
    p.name.toLowerCase().includes(query) || 
    (p.category && p.category.toLowerCase().includes(query)) ||
    (p.batchNo && p.batchNo.toLowerCase().includes(query))
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-6 text-slate-400 italic">No products found in inventory.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const isOut = Number(p.quantity) <= 0;
    const isLow = Number(p.quantity) > 0 && Number(p.quantity) < 5;
    let statusPill = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Optimal</span>`;
    if (isOut) {
      statusPill = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">Out of Stock</span>`;
    } else if (isLow) {
      statusPill = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Low Stock</span>`;
    }

    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-2.5 font-bold text-slate-800">${p.name}</td>
        <td class="p-2.5 text-slate-500">${p.category || 'General'}</td>
        <td class="p-2.5 font-mono text-slate-600">${p.batchNo || '-'}</td>
        <td class="p-2.5 font-bold font-mono ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-800'}">${p.quantity} Pack</td>
        <td class="p-2.5 font-mono text-slate-600">${formatPKR(p.purchasePrice || 0)}</td>
        <td class="p-2.5 font-mono font-semibold text-emerald-700">${formatPKR(p.salePrice || 0)}</td>
        <td class="p-2.5 text-slate-600">${p.expiryDate || '-'}</td>
        <td class="p-2.5">${statusPill}</td>
        <td class="p-2.5 text-right space-x-2">
          <button onclick="editProductStock(${p.id})" class="text-teal-700 hover:text-teal-900 font-bold text-xs" title="Adjust Stock">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button onclick="deleteProduct(${p.id})" class="text-red-500 hover:text-red-700 font-bold text-xs" title="Delete Product">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function editProductStock(id) {
  const p = appData.products.find(item => item.id === id);
  if (!p) return;
  const newQty = prompt(`Update stock quantity for "${p.name}":`, p.quantity);
  if (newQty !== null && !isNaN(newQty)) {
    p.quantity = Math.max(0, Number(newQty));
    saveLocalData('products');
    syncCollectionToFirestore('products', p);
    updateDashboard();
    renderInventoryTable();
    showToast('Stock Updated', `${p.name} quantity set to ${p.quantity}`);
  }
}

function deleteProduct(id) {
  const p = appData.products.find(item => item.id === id);
  if (!p) return;
  if (confirm(`Are you sure you want to remove "${p.name}" from inventory?`)) {
    appData.products = appData.products.filter(item => item.id !== id);
    saveLocalData('products');
    updateDashboard();
    renderInventoryTable();
    showToast('Deleted', `Product removed from inventory.`);
  }
}

// =========================================================================
// 12. FARMER LEDGERS MODAL
// =========================================================================
function renderFarmerLedgers() {
  const query = (document.getElementById('farmerSearch')?.value || '').toLowerCase();
  const tbody = document.getElementById('farmerTableBody');
  if (!tbody) return;

  const filtered = appData.farmers.filter(f => 
    f.name.toLowerCase().includes(query) || (f.phone && f.phone.includes(query))
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-400 italic">No farmer accounts logged.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(f => {
    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-2.5 font-bold text-slate-800">${f.name}</td>
        <td class="p-2.5 text-slate-500">${f.location || 'Pull 88,000'}</td>
        <td class="p-2.5 font-mono text-slate-600">${f.phone || '03426400074'}</td>
        <td class="p-2.5 font-mono text-slate-700">${formatPKR(f.totalPurchases || 0)}</td>
        <td class="p-2.5 font-mono font-bold ${f.balanceDue > 0 ? 'text-amber-700' : 'text-slate-400'}">
          ${formatPKR(f.balanceDue || 0)}
        </td>
        <td class="p-2.5 text-right space-x-2">
          <button onclick="sendWhatsAppReceipt('${f.name}', '${f.phone || '03426400074'}', ${f.totalPurchases || 0}, ${(f.totalPurchases || 0) - (f.balanceDue || 0)}, ${f.balanceDue || 0}, 'Agrochemicals Ledger', 1)" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs inline-flex items-center gap-1">
            <i class="fa-brands fa-whatsapp text-xs"></i> Send Receipt
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// =========================================================================
// 13. SUPPLIER LEDGERS MODAL
// =========================================================================
function renderSupplierLedgers() {
  const tbody = document.getElementById('supplierTableBody');
  if (!tbody) return;

  if (appData.suppliers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400 italic">No supplier ledger entries found.</td></tr>`;
    return;
  }

  tbody.innerHTML = appData.suppliers.map(s => `
    <tr class="hover:bg-slate-50 transition">
      <td class="p-2.5 font-bold text-slate-800">${s.name}</td>
      <td class="p-2.5 font-mono text-slate-700">${formatPKR(s.totalPurchased || 0)}</td>
      <td class="p-2.5 font-mono text-emerald-700">${formatPKR(s.amountPaid || 0)}</td>
      <td class="p-2.5 font-mono font-bold ${s.payableDue > 0 ? 'text-red-600' : 'text-slate-400'}">
        ${formatPKR(s.payableDue || 0)}
      </td>
      <td class="p-2.5 text-right">
        <button onclick="paySupplierBill(${s.id})" class="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[11px] font-bold">
          Pay Bill
        </button>
      </td>
    </tr>
  `).join('');
}

function paySupplierBill(id) {
  const s = appData.suppliers.find(sup => sup.id === id);
  if (!s) return;
  const amt = prompt(`Enter payment amount to supplier "${s.name}" (Outstanding: ${formatPKR(s.payableDue)}):`, s.payableDue);
  if (amt !== null && !isNaN(amt) && Number(amt) > 0) {
    const payAmt = Number(amt);
    s.amountPaid = (s.amountPaid || 0) + payAmt;
    s.payableDue = Math.max(0, (s.payableDue || 0) - payAmt);
    saveLocalData('suppliers');
    syncCollectionToFirestore('suppliers', s);
    updateDashboard();
    renderSupplierLedgers();
    showToast('Payment Saved', `Paid ${formatPKR(payAmt)} to ${s.name}`);
  }
}

// =========================================================================
// 14. REPORTS & PROFIT CALCULATOR
// =========================================================================
function renderReports() {
  let grossSales = 0;
  let totalCost = 0;

  appData.sales.forEach(s => {
    grossSales += Number(s.totalAmount || 0);
    // Find cost price from product or estimate 80%
    const p = appData.products.find(prod => prod.name.toLowerCase() === s.productName.toLowerCase());
    const unitCost = p ? (p.purchasePrice || s.salePrice * 0.8) : (s.salePrice * 0.8);
    totalCost += unitCost * Number(s.quantity || 1);
  });

  let totalExpenses = 0;
  appData.expenses.forEach(e => {
    totalExpenses += Number(e.amount || 0);
  });

  const grossProfit = grossSales - totalCost;
  const netProfit = grossProfit - totalExpenses;

  document.getElementById('repGrossSales').innerText = formatPKR(grossSales);
  document.getElementById('repTotalExpenses').innerText = formatPKR(totalExpenses);
  document.getElementById('repNetProfit').innerText = formatPKR(netProfit);

  const expContainer = document.getElementById('repExpenseList');
  if (appData.expenses.length === 0) {
    expContainer.innerHTML = `<p class="text-slate-400 italic">No expenses logged yet.</p>`;
  } else {
    expContainer.innerHTML = appData.expenses.map(e => `
      <div class="p-2 bg-slate-50 border border-slate-200 rounded flex justify-between items-center text-xs">
        <div>
          <span class="font-bold text-slate-800">${e.category}</span>
          <span class="text-slate-400 text-[10px] ml-2">${e.date}</span>
          ${e.note ? `<p class="text-[11px] text-slate-500">${e.note}</p>` : ''}
        </div>
        <span class="font-mono font-bold text-red-600">${formatPKR(e.amount)}</span>
      </div>
    `).join('');
  }
}

// =========================================================================
// 15. EXCEL / CSV BACKUP EXPORT
// =========================================================================
function exportAllCSV() {
  const collections = [
    { name: 'Products_Inventory', data: appData.products },
    { name: 'Sales_Transactions', data: appData.sales },
    { name: 'Farmer_Ledgers', data: appData.farmers },
    { name: 'Supplier_Payables', data: appData.suppliers },
    { name: 'Shop_Expenses', data: appData.expenses }
  ];

  let combinedCSV = `KISSAN SPRAY CENTER - DATABASE BACKUP\nPull 88,000 | Contact: 03426400074\nDate: ${new Date().toLocaleString()}\n\n`;

  collections.forEach(col => {
    combinedCSV += `=== ${col.name.toUpperCase()} ===\n`;
    if (col.data.length === 0) {
      combinedCSV += `No records\n\n`;
      return;
    }
    const headers = Object.keys(col.data[0]);
    combinedCSV += headers.join(',') + '\n';
    col.data.forEach(row => {
      const line = headers.map(h => {
        let val = row[h] ?? '';
        if (typeof val === 'string' && (val.includes(',') || val.includes('\n') || val.includes('"'))) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',');
      combinedCSV += line + '\n';
    });
    combinedCSV += '\n';
  });

  const blob = new Blob([combinedCSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Kissan_Spray_Center_Backup_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Backup Exported', 'Downloaded complete database CSV');
}

// =========================================================================
// 16. DEMO DATA LOADER & RESET ENGINE
// =========================================================================
function loadSampleDemoData() {
  const confirmLoad = confirm("Load realistic Pakistani agrochemical demo data for Kissan Spray Center?");
  if (!confirmLoad) return;

  appData.products = [
    { id: 101, name: "UREA 50 KG", category: "Fertilizer", batchNo: "ENG-881", expiryDate: "2026-11-20", purchasePrice: 3800, salePrice: 4200, quantity: 3 },
    { id: 102, name: "KAMAN SUPER -08 KG", category: "Pesticide", batchNo: "KMN-904", expiryDate: "2026-09-12", purchasePrice: 3100, salePrice: 3600, quantity: 2 },
    { id: 103, name: "BESTOW GR.10KG", category: "Pesticide", batchNo: "BST-112", expiryDate: "2026-09-15", purchasePrice: 2400, salePrice: 2900, quantity: 1 },
    { id: 104, name: "GREENO 10 KG", category: "Fertilizer", batchNo: "GRN-441", expiryDate: "2026-09-28", purchasePrice: 2000, salePrice: 2500, quantity: 1 },
    { id: 105, name: "K PLUS GR. 25 KG", category: "Fertilizer", batchNo: "KPL-009", expiryDate: "2027-01-10", purchasePrice: 4800, salePrice: 5500, quantity: 2 },
    { id: 106, name: "YARKER", category: "Pesticide", batchNo: "YRK-101", expiryDate: "2026-01-01", purchasePrice: 1800, salePrice: 2200, quantity: 35 },
    { id: 107, name: "GAWARA PAK ARAB-50 KG", category: "Seed", batchNo: "GWR-505", expiryDate: "2026-12-30", purchasePrice: 6000, salePrice: 6800, quantity: 0 },
    { id: 108, name: "AEGIS 800 ML", category: "Pesticide", batchNo: "AGS-303", expiryDate: "2026-08-01", purchasePrice: 1500, salePrice: 1850, quantity: 0 }
  ];

  appData.farmers = [
    { id: 201, name: "ASHFAQ KHAN GURMANI SB", location: "Pull 88,000", phone: "03426400074", totalPurchases: 25000, balanceDue: 6800 },
    { id: 202, name: "MAHER MAQBOOL KLASRA", location: "Pull 88,000", phone: "03426400074", totalPurchases: 42000, balanceDue: 0 },
    { id: 203, name: "MALIK FAROOQ TAHIR", location: "Pull 88,000", phone: "03426400074", totalPurchases: 18000, balanceDue: 4200 },
    { id: 204, name: "HAJI MUHAMMAD NAWAZ", location: "Pull 88,000", phone: "03426400074", totalPurchases: 65000, balanceDue: 12500 }
  ];

  appData.suppliers = [
    { id: 301, name: "Satallion Life Sciences Pvt.ltd", totalPurchased: 45000, amountPaid: 45000, payableDue: 0 },
    { id: 302, name: "Ag Pharma", totalPurchased: 80000, amountPaid: 80000, payableDue: 0 },
    { id: 303, name: "Suncrop Pesticides", totalPurchased: 95000, amountPaid: 95000, payableDue: 0 },
    { id: 304, name: "Engro Fertilizers Ltd", totalPurchased: 120000, amountPaid: 101600, payableDue: 18400 }
  ];

  appData.sales = [
    { id: 401, date: "2026-09-08", farmerName: "HAJI MUHAMMAD NAWAZ", location: "Pull 88,000", phone: "03426400074", productName: "DAP FERTILIZER", batchNo: "DAP-11", expiryDate: "2027-05-10", quantity: 5, salePrice: 11500, totalAmount: 57500, paymentType: "Credit", cashReceived: 45000, creditDue: 12500 },
    { id: 402, date: "2026-09-09", farmerName: "ASHFAQ KHAN GURMANI SB", location: "Pull 88,000", phone: "03426400074", productName: "KAMAN SUPER -08 KG", batchNo: "KMN-904", expiryDate: "2026-09-12", quantity: 4, salePrice: 3600, totalAmount: 14400, paymentType: "Credit", cashReceived: 7600, creditDue: 6800 },
    { id: 403, date: "2026-09-10", farmerName: "MAHER MAQBOOL KLASRA", location: "Pull 88,000", phone: "03426400074", productName: "UREA 50 KG", batchNo: "ENG-881", expiryDate: "2026-11-20", quantity: 10, salePrice: 4200, totalAmount: 42000, paymentType: "Cash", cashReceived: 42000, creditDue: 0 }
  ];

  appData.expenses = [
    { id: 501, category: "Tea", amount: 1200, date: "2026-09-10", note: "Weekly tea & refreshments for farmers" },
    { id: 502, category: "Electricity", amount: 8500, date: "2026-09-05", note: "Shop bill" }
  ];

  saveLocalData();
  updateDashboard();
  showToast('Demo Data Loaded', 'Populated realistic inventory, farmers & sales');
}

function resetAllDataToZero() {
  const confirmReset = confirm("Reset all counters, tables, and financial metrics back to ZERO (0)?");
  if (!confirmReset) return;

  appData.products = [];
  appData.sales = [];
  appData.farmers = [];
  appData.suppliers = [];
  appData.expenses = [];

  saveLocalData();
  updateDashboard();
  showToast('Reset to ZERO', 'All metrics and tables are now at zero state.');
}

// =========================================================================
// 17. GLOBAL BINDINGS & INITIALIZATION
// =========================================================================
function setupEventListeners() {
  const loginForm = document.getElementById('demoLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      if (e && e.preventDefault) e.preventDefault();
      handleDemoLogin(e);
    });
  }

  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', function(e) {
      if (e && e.preventDefault) e.preventDefault();
      handleDemoLogin(e);
    });
  }

  const googleBtn = document.getElementById('btnGoogleLogin');
  if (googleBtn) {
    googleBtn.addEventListener('click', function(e) {
      if (e && e.preventDefault) e.preventDefault();
      handleGoogleSignIn();
    });
  }
}

// Global window exposure for inline HTML event handlers
window.openModal = openModal;
window.closeModal = closeModal;
window.showModal = showModal;
window.hideModal = hideModal;
window.toggleModal = toggleModal;
window.handleDemoLogin = handleDemoLogin;
window.handleLogout = handleLogout;
window.handleGoogleSignIn = handleGoogleSignIn;
window.submitSale = submitSale;
window.submitPurchase = submitPurchase;
window.submitFarmerRecovery = submitFarmerRecovery;
window.submitExpense = submitExpense;
window.exportAllCSV = exportAllCSV;
window.loadSampleDemoData = loadSampleDemoData;
window.resetAllDataToZero = resetAllDataToZero;
window.editProductStock = editProductStock;
window.deleteProduct = deleteProduct;
window.paySupplierBill = paySupplierBill;
window.sendWhatsAppReceipt = sendWhatsAppReceipt;
window.onSaleProductChange = onSaleProductChange;
window.onPaymentTypeChange = onPaymentTypeChange;
window.calcSaleTotals = calcSaleTotals;
window.calcPurchTotals = calcPurchTotals;
window.onRecFarmerChange = onRecFarmerChange;
window.navigateView = navigateView;
window.toggleSidebar = toggleSidebar;

function initApp() {
  loadLocalData();
  initAuth();
  setupEventListeners();
  updateDashboard();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
