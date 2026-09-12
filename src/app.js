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
// 2. DATA STATE & STORAGE KEYS (100% Fresh Zero-Meter ERP Data Structures)
// Inventory, Customers, Suppliers, Invoices, Expenses, Cash Flow, Banks = []
// =========================================================================
const STORAGE_KEYS = {
  PRODUCTS: 'kat_products_v1',
  SALES: 'kat_sales_v1',
  FARMERS: 'kat_farmers_v1',
  SUPPLIERS: 'kat_suppliers_v1',
  EXPENSES: 'kat_expenses_v1',
  EMPLOYEES: 'kat_employees_v1',
  BANKS: 'kat_banks_v1',
  BANK_TRANSACTIONS: 'kat_bank_tx_v1',
  CASH_TRANSACTIONS: 'kat_cash_tx_v1',
  RETURNS: 'kat_returns_v1',
  AUTH: 'kat_user_auth_v1'
};

// Zero-meter fresh initialization: clears all dummy entries and legacy localStorage keys
(function clearOldDummyData() {
  const ZERO_METER_KEY = 'kat_zero_meter_clean_v1';
  if (localStorage.getItem(ZERO_METER_KEY) !== 'done') {
    const keysToRemove = [
      'ksc_products_v1', 'ksc_sales_v1', 'ksc_farmers_v1', 'ksc_suppliers_v1',
      'ksc_expenses_v1', 'ksc_employees_v1', 'ksc_banks_v1', 'ksc_bank_tx_v1',
      'ksc_cash_tx_v1', 'ksc_returns_v1', 'ksc_clean_zero_v1', 'ksc_clean_zero_v2',
      'kissan_agro_zero_meter_v1',
      'kat_products_v1', 'kat_sales_v1', 'kat_farmers_v1', 'kat_suppliers_v1',
      'kat_expenses_v1', 'kat_employees_v1', 'kat_banks_v1', 'kat_bank_tx_v1',
      'kat_cash_tx_v1', 'kat_returns_v1'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
    localStorage.setItem(ZERO_METER_KEY, 'done');
  }
})();

let appData = {
  products: [],
  sales: [],
  farmers: [],
  suppliers: [],
  expenses: [],
  employees: [],
  banks: [],
  bankTransactions: [],
  cashTransactions: [],
  returns: []
};

let currentUser = null;

// Currency Formatter
function formatPKR(val) {
  const num = Number(val) || 0;
  return 'Rs. ' + num.toLocaleString('en-US');
}

// Toast helper (Guaranteed 3-Second Auto-Dismiss)
let toastTimer = null;
function showToast(title, message, isSuccess = true) {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toastIcon');
  if (!toast) return;
  const tTitle = document.getElementById('toastTitle');
  if (tTitle) tTitle.innerText = title;
  const tMsg = document.getElementById('toastMessage');
  if (tMsg) tMsg.innerText = message || '';
  if (icon) {
    icon.className = isSuccess 
      ? 'w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0'
      : 'w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs shrink-0';
    icon.innerText = isSuccess ? '✓' : '!';
  }
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
  toast.classList.remove('translate-y-20', 'opacity-0');
  toastTimer = setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
    toastTimer = null;
  }, 3000);
}
window.showToast = showToast;

// Browser-native Web Audio API / Synthesis Feedback (Zero heavy external assets)
let erpAudioCtx = null;
function getAudioContext() {
  if (!erpAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      erpAudioCtx = new AudioContextClass();
    }
  }
  if (erpAudioCtx && erpAudioCtx.state === 'suspended') {
    erpAudioCtx.resume().catch(() => {});
  }
  return erpAudioCtx;
}

function playAudioFeedback(type = 'add') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'login') {
      // Pleasant 4-note ascending major chime (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });

      // Browser speech synthesis greeting
      if (window.speechSynthesis) {
        try {
          const utter = new SpeechSynthesisUtterance('Welcome to Kissan Agro Traders');
          utter.rate = 1.05;
          utter.pitch = 1.1;
          window.speechSynthesis.speak(utter);
        } catch (e) {}
      }
    } else if (type === 'add') {
      // Crisp, pleasant dual-tone success chime (F5 698Hz -> C6 1046Hz)
      [698.46, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.3);
      });
    } else if (type === 'delete') {
      // Distinct downward double-tone deletion chime (A4 440Hz -> E4 329Hz -> A3 220Hz)
      [440, 329.63, 220].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.26);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.29);
      });
    } else if (type === 'error') {
      // Low dual buzz tone for denial
      [220, 180].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.2);
      });
    }
  } catch (err) {
    console.warn('Audio feedback failed:', err);
  }
}
window.playAudioFeedback = playAudioFeedback;

// =========================================================================
// DOUBLE PIN VERIFICATION FOR DELETION (PIN: 1234)
// =========================================================================
let pendingDeleteTarget = null; // { moduleType, recordId, itemName }

function triggerProtectedDelete(moduleType, recordId, itemName = '') {
  pendingDeleteTarget = { moduleType, recordId, itemName };

  const summaryEl1 = document.getElementById('deleteItemSummary');
  if (summaryEl1) {
    summaryEl1.innerText = itemName ? `Item: ${itemName}` : `Record ID: ${recordId}`;
  }

  const pinInp1 = document.getElementById('deletePinInput1');
  if (pinInp1) pinInp1.value = '';

  const errEl1 = document.getElementById('deletePinError1');
  if (errEl1) errEl1.classList.add('hidden');

  openModal('deletePinStep1Modal');
  setTimeout(() => {
    if (pinInp1) pinInp1.focus();
  }, 100);
}
window.triggerProtectedDelete = triggerProtectedDelete;

function submitDeletePinStep1(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const pinInput = document.getElementById('deletePinInput1');
  const enteredPin = (pinInput?.value || '').trim();
  const errorEl = document.getElementById('deletePinError1');

  if (enteredPin !== '1234') {
    if (errorEl) errorEl.classList.remove('hidden');
    playAudioFeedback('error');
    showToast('Deletion Denied', 'Incorrect Security PIN! Deletion Denied.', false);
    return;
  }

  // Correct PIN 1234: Advance to Step 2 confirmation
  if (errorEl) errorEl.classList.add('hidden');
  closeModal('deletePinStep1Modal');

  const summaryEl2 = document.getElementById('deleteItemSummary2');
  if (summaryEl2 && pendingDeleteTarget) {
    summaryEl2.innerText = pendingDeleteTarget.itemName ? `Item: ${pendingDeleteTarget.itemName}` : `Record ID: ${pendingDeleteTarget.recordId}`;
  }

  const pinInp2 = document.getElementById('deletePinInput2');
  if (pinInp2) pinInp2.value = '';

  const errEl2 = document.getElementById('deletePinError2');
  if (errEl2) errEl2.classList.add('hidden');

  openModal('deletePinStep2Modal');
  setTimeout(() => {
    if (pinInp2) pinInp2.focus();
  }, 100);
}
window.submitDeletePinStep1 = submitDeletePinStep1;

function submitDeletePinStep2(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const pinInput = document.getElementById('deletePinInput2');
  const enteredPin = (pinInput?.value || '').trim();
  const errorEl = document.getElementById('deletePinError2');

  if (enteredPin !== '1234') {
    if (errorEl) errorEl.classList.remove('hidden');
    playAudioFeedback('error');
    showToast('Deletion Denied', 'Incorrect Security PIN! Deletion Denied.', false);
    return;
  }

  // Double PIN verified (1234 entered both times): Permanently remove from localStorage
  if (!pendingDeleteTarget) {
    closeModal('deletePinStep2Modal');
    return;
  }

  const { moduleType, recordId } = pendingDeleteTarget;

  try {
    switch (moduleType) {
      case 'product':
        appData.products = appData.products.filter(p => String(p.id) !== String(recordId));
        saveLocalData('products');
        break;
      case 'customer':
      case 'farmer':
        appData.farmers = appData.farmers.filter(f => String(f.id) !== String(recordId));
        saveLocalData('farmers');
        break;
      case 'supplier':
        appData.suppliers = appData.suppliers.filter(s => String(s.id) !== String(recordId));
        saveLocalData('suppliers');
        break;
      case 'sale':
        appData.sales = appData.sales.filter(s => String(s.id || s.invoiceId || s.invoiceNo) !== String(recordId));
        saveLocalData('sales');
        break;
      case 'expense':
        appData.expenses = appData.expenses.filter(e => String(e.id) !== String(recordId));
        saveLocalData('expenses');
        break;
      case 'cashTx':
        appData.cashTransactions = appData.cashTransactions.filter(c => String(c.id) !== String(recordId));
        saveLocalData('cashTransactions');
        break;
      case 'bank':
        appData.banks = appData.banks.filter(b => String(b.id) !== String(recordId));
        saveLocalData('banks');
        break;
      case 'bankTx':
        appData.bankTransactions = appData.bankTransactions.filter(t => String(t.id) !== String(recordId));
        saveLocalData('bankTransactions');
        break;
      case 'return':
        appData.returns = appData.returns.filter(r => String(r.id) !== String(recordId));
        saveLocalData('returns');
        break;
      case 'employee':
        appData.employees = appData.employees.filter(emp => String(emp.id) !== String(recordId));
        saveLocalData('employees');
        break;
      default:
        console.warn('Unknown moduleType for deletion:', moduleType);
    }
  } catch (err) {
    console.error('Deletion error:', err);
  }

  closeModal('deletePinStep2Modal');
  pendingDeleteTarget = null;

  // Dynamically refresh the dashboard stats/totals and all active view tables
  refreshAllERPViews();

  // Distinct deletion audio confirmation chime
  playAudioFeedback('delete');

  // Prominent green 3-second auto-dismiss popup
  showToast('Successfully Deleted!', 'Record permanently deleted from ERP.', true);
}
window.submitDeletePinStep2 = submitDeletePinStep2;

function cancelProtectedDelete() {
  closeModal('deletePinStep1Modal');
  closeModal('deletePinStep2Modal');
  pendingDeleteTarget = null;
}
window.cancelProtectedDelete = cancelProtectedDelete;

function refreshAllERPViews() {
  if (typeof updateDashboard === 'function') updateDashboard();
  if (typeof renderInventoryTable === 'function') renderInventoryTable();
  if (typeof renderFarmerLedgers === 'function') renderFarmerLedgers();
  if (typeof renderSupplierLedgers === 'function') renderSupplierLedgers();
  if (typeof renderSalesHistoryTable === 'function') renderSalesHistoryTable();
  if (typeof updateProfitReport === 'function') updateProfitReport();

  // Secondary views if rendered or open
  if (typeof renderInventoryViewTable === 'function') renderInventoryViewTable();
  if (typeof renderPurchaseHistoryViewTable === 'function') renderPurchaseHistoryViewTable();
  if (typeof renderSuppliersViewTable === 'function') renderSuppliersViewTable();
  if (typeof renderCustomersViewTable === 'function') renderCustomersViewTable();
  if (typeof renderSalesViewTable === 'function') renderSalesViewTable();
  if (typeof renderExpensesViewTable === 'function') renderExpensesViewTable();
  if (typeof renderEmployeesViewTable === 'function') renderEmployeesViewTable();
  if (typeof renderCashFlowView === 'function') renderCashFlowView();
  if (typeof renderBanksView === 'function') renderBanksView();
  if (typeof renderReturnsViewTable === 'function') renderReturnsViewTable();
}
window.refreshAllERPViews = refreshAllERPViews;

// Individual module delete entry points
function deleteProduct(id) {
  const p = appData.products.find(item => String(item.id) === String(id));
  triggerProtectedDelete('product', id, p ? p.name : 'Product');
}
window.deleteProduct = deleteProduct;

function deleteFarmer(id) {
  const f = appData.farmers.find(item => String(item.id) === String(id));
  triggerProtectedDelete('customer', id, f ? f.name : 'Customer Profile');
}
window.deleteFarmer = deleteFarmer;

function deleteSupplier(id) {
  const s = appData.suppliers.find(item => String(item.id) === String(id));
  triggerProtectedDelete('supplier', id, s ? s.name : 'Supplier Company');
}
window.deleteSupplier = deleteSupplier;

function deleteSale(id) {
  const s = appData.sales.find(item => String(item.id || item.invoiceId || item.invoiceNo) === String(id));
  triggerProtectedDelete('sale', id, s ? (s.invoiceNo || s.invoiceId || s.farmerName || 'Sale Invoice') : 'Sale Record');
}
window.deleteSale = deleteSale;

function deleteExpense(id) {
  const e = appData.expenses.find(item => String(item.id) === String(id));
  triggerProtectedDelete('expense', id, e ? `${e.category} (${formatPKR(e.amount)})` : 'Expense Entry');
}
window.deleteExpense = deleteExpense;

function deleteCashTx(id) {
  const c = appData.cashTransactions.find(item => String(item.id) === String(id));
  triggerProtectedDelete('cashTx', id, c ? `${c.flow}: ${c.category || c.source || ''} (${formatPKR(c.amount)})` : 'Cash Flow Entry');
}
window.deleteCashTx = deleteCashTx;

function deleteBank(id) {
  const b = appData.banks.find(item => String(item.id) === String(id));
  triggerProtectedDelete('bank', id, b ? `${b.name} (${b.accNo})` : 'Bank Account');
}
window.deleteBank = deleteBank;

function deleteBankTx(id) {
  const t = appData.bankTransactions.find(item => String(item.id) === String(id));
  triggerProtectedDelete('bankTx', id, t ? `${t.type} (${formatPKR(t.amount)})` : 'Bank Transaction');
}
window.deleteBankTx = deleteBankTx;

function deleteReturn(id) {
  const r = appData.returns.find(item => String(item.id) === String(id));
  triggerProtectedDelete('return', id, r ? `${r.type} - ${r.product}` : 'Return Item');
}
window.deleteReturn = deleteReturn;

function deleteEmployee(id) {
  const emp = appData.employees.find(item => String(item.id) === String(id));
  triggerProtectedDelete('employee', id, emp ? emp.name : 'Employee');
}
window.deleteEmployee = deleteEmployee;

// =========================================================================
// 3. PERSISTENCE & STORAGE HELPERS (Firestore + LocalStorage fallback)
// =========================================================================
function loadLocalData() {
  appData.products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
  appData.sales = JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES) || '[]');
  appData.farmers = JSON.parse(localStorage.getItem(STORAGE_KEYS.FARMERS) || '[]');
  appData.suppliers = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPPLIERS) || '[]');
  appData.expenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
  appData.employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
  appData.banks = JSON.parse(localStorage.getItem(STORAGE_KEYS.BANKS) || '[]');
  appData.bankTransactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.BANK_TRANSACTIONS) || '[]');
  appData.cashTransactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASH_TRANSACTIONS) || '[]');
  appData.returns = JSON.parse(localStorage.getItem(STORAGE_KEYS.RETURNS) || '[]');
}

function saveLocalData(collectionKey) {
  if (collectionKey) {
    const k = collectionKey.toUpperCase();
    if (STORAGE_KEYS[k]) {
      localStorage.setItem(STORAGE_KEYS[k], JSON.stringify(appData[collectionKey]));
    }
  } else {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(appData.products));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(appData.sales));
    localStorage.setItem(STORAGE_KEYS.FARMERS, JSON.stringify(appData.farmers));
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(appData.suppliers));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(appData.expenses));
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(appData.employees));
    localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(appData.banks));
    localStorage.setItem(STORAGE_KEYS.BANK_TRANSACTIONS, JSON.stringify(appData.bankTransactions));
    localStorage.setItem(STORAGE_KEYS.CASH_TRANSACTIONS, JSON.stringify(appData.cashTransactions));
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(appData.returns));
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
  } else if (id === 'excelExportModal') {
    updateExcelExportCounters();
  } else if (id === 'salesHistoryModal') {
    renderSalesHistoryTable();
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
  ['saleModal', 'purchaseModal', 'farmerPaymentModal', 'expenseModal', 'inventoryModal', 'farmerLedgerModal', 'supplierLedgerModal', 'reportsModal', 'excelExportModal', 'salesHistoryModal'].forEach(id => {
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

  const elTotalSales = document.getElementById('cardTotalSales');
  if (elTotalSales) elTotalSales.innerText = formatPKR(totalSales);
  const elTotalPurchase = document.getElementById('cardTotalPurchase');
  if (elTotalPurchase) elTotalPurchase.innerText = formatPKR(totalPurchase);
  const elReceivable = document.getElementById('cardReceivable');
  if (elReceivable) elReceivable.innerText = formatPKR(totalReceivable);
  const elPayable = document.getElementById('cardPayable');
  if (elPayable) elPayable.innerText = formatPKR(totalPayable);

  // 2. Expiry alert banner calculation
  updateExpiryAlerts();

  // 3. Low stock & out of stock
  updateStockAlerts();

  // 4. Top Farmers & Top Suppliers
  renderTopPartners();
}

function updateExpiryAlerts() {
  let expired = 0;
  let in30Days = 0;
  let in60Days = 0;
  let in90Days = 0;
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
    } else if (diffDays <= 30) {
      in30Days++;
      alertItems.push({ product: p.name, expiry: p.expiryDate, stock: p.quantity, batch: p.batchNo, badge: `${diffDays}d left`, type: '&le; 30 DAYS', color: 'orange' });
    } else if (diffDays <= 60) {
      in60Days++;
      alertItems.push({ product: p.name, expiry: p.expiryDate, stock: p.quantity, batch: p.batchNo, badge: `${diffDays}d left`, type: '&le; 60 DAYS', color: 'amber' });
    } else if (diffDays <= 90) {
      in90Days++;
      alertItems.push({ product: p.name, expiry: p.expiryDate, stock: p.quantity, batch: p.batchNo, badge: `${diffDays}d left`, type: '&le; 90 DAYS', color: 'slate' });
    }
  });

  const total = expired + in30Days + in60Days + in90Days;
  const expBadge = document.getElementById('expiryBadgeTotal');
  if (expBadge) expBadge.innerText = `${total} items`;
  const elExpired = document.getElementById('cntExpired');
  if (elExpired) elExpired.innerText = expired;
  const el30 = document.getElementById('cnt30Days');
  if (el30) el30.innerText = in30Days;
  const el60 = document.getElementById('cnt60Days');
  if (el60) el60.innerText = in60Days;
  const el90 = document.getElementById('cnt90Days');
  if (el90) el90.innerText = in90Days;

  const container = document.getElementById('expiryItemsList');
  if (container) {
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
}

function updateStockAlerts() {
  const lowStock = appData.products.filter(p => Number(p.quantity) > 0 && Number(p.quantity) < 5);
  const outOfStock = appData.products.filter(p => Number(p.quantity) <= 0);

  const elLow = document.getElementById('badgeLowStock');
  if (elLow) elLow.innerText = lowStock.length;
  const elOut = document.getElementById('badgeOutOfStock');
  if (elOut) elOut.innerText = outOfStock.length;

  const lowContainer = document.getElementById('containerLowStock');
  if (lowContainer) {
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
  }

  const outContainer = document.getElementById('containerOutOfStock');
  if (outContainer) {
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
}

function renderTopPartners() {
  // Top Farmers
  const custContainer = document.getElementById('topCustomersList');
  if (custContainer) {
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
  }

  // Top Suppliers
  const supContainer = document.getElementById('topSuppliersList');
  if (supContainer) {
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
  if (!select) return;
  const opt = select.options && select.selectedIndex >= 0 ? select.options[select.selectedIndex] : null;
  if (!opt || !opt.value) return;

  const pNameInput = document.getElementById('saleProductName');
  const pPriceInput = document.getElementById('salePrice');
  const pBatchInput = document.getElementById('saleBatchNo');
  const pExpInput = document.getElementById('saleExpiryDate');

  if (opt.value === 'custom') {
    if (pNameInput) pNameInput.value = '';
    if (pPriceInput) pPriceInput.value = 0;
    if (pBatchInput) pBatchInput.value = '';
    if (pExpInput) pExpInput.value = '';
  } else {
    if (pNameInput) pNameInput.value = opt.getAttribute('data-name') || '';
    if (pPriceInput) pPriceInput.value = opt.getAttribute('data-price') || 0;
    if (pBatchInput) pBatchInput.value = opt.getAttribute('data-batch') || '';
    if (pExpInput) pExpInput.value = opt.getAttribute('data-exp') || '';
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
  const qty = Number(document.getElementById('saleQty')?.value) || 0;
  const price = Number(document.getElementById('salePrice')?.value) || 0;
  const total = qty * price;
  const totalDisplay = document.getElementById('saleTotalDisplay');
  if (totalDisplay) totalDisplay.innerText = formatPKR(total);

  const cashRec = Number(document.getElementById('saleCashReceived')?.value) || 0;
  const creditDue = Math.max(0, total - cashRec);
  const creditDueInput = document.getElementById('saleCreditDue');
  if (creditDueInput) creditDueInput.value = creditDue;
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
  playAudioFeedback('add');
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
  const saleForm = document.getElementById('saleForm');
  if (saleForm) saleForm.reset();
  const saleLoc = document.getElementById('saleLocation');
  if (saleLoc) saleLoc.value = 'Pull 88,000';
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
  const cost = Number(document.getElementById('purchCostPrice')?.value) || 0;
  const qty = Number(document.getElementById('purchStockQty')?.value) || 0;
  const total = cost * qty;
  const totalBillInput = document.getElementById('purchTotalBill');
  if (totalBillInput) totalBillInput.value = total;

  const paid = Number(document.getElementById('purchPaid')?.value) || 0;
  const payable = Math.max(0, total - paid);
  const balInput = document.getElementById('purchBalancePayable');
  if (balInput) balInput.value = payable;
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
  playAudioFeedback('add');
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
  if (!sel) return;
  const opt = sel.options && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null;
  const due = opt ? (opt.getAttribute('data-due') || 0) : 0;
  const balEl = document.getElementById('recFarmerBalance');
  if (balEl) balEl.innerText = formatPKR(due);
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
  playAudioFeedback('add');
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
  playAudioFeedback('add');
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
          <button onclick="editProductStock('${p.id}')" class="text-teal-700 hover:text-teal-900 font-bold text-xs" title="Adjust Stock">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button onclick="deleteProduct('${p.id}')" class="text-red-500 hover:text-red-700 font-bold text-xs" title="Delete Product">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function editProductStock(id) {
  const p = appData.products.find(item => String(item.id) === String(id));
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
  const p = appData.products.find(item => String(item.id) === String(id));
  triggerProtectedDelete('product', id, p ? p.name : 'Product');
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
        <td class="p-2.5 text-right space-x-1.5">
          <button onclick="sendWhatsAppReceipt('${f.name}', '${f.phone || '03426400074'}', ${f.totalPurchases || 0}, ${(f.totalPurchases || 0) - (f.balanceDue || 0)}, ${f.balanceDue || 0}, 'Agrochemicals Ledger', 1)" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs inline-flex items-center gap-1">
            <i class="fa-brands fa-whatsapp text-xs"></i> Send Receipt
          </button>
          <button onclick="deleteFarmer('${f.id}')" title="Delete Farmer Profile" class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[11px] font-bold">
            <i class="fa-solid fa-trash"></i>
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
  const query = (document.getElementById('supplierSearch')?.value || '').toLowerCase();
  const tbody = document.getElementById('supplierTableBody');
  if (!tbody) return;

  const filtered = appData.suppliers.filter(s => 
    s.name.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400 italic">No supplier ledger entries found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(s => `
    <tr class="hover:bg-slate-50 transition">
      <td class="p-2.5 font-bold text-slate-800">${s.name}</td>
      <td class="p-2.5 font-mono text-slate-700">${formatPKR(s.totalPurchased || 0)}</td>
      <td class="p-2.5 font-mono text-emerald-700">${formatPKR(s.amountPaid || 0)}</td>
      <td class="p-2.5 font-mono font-bold ${s.payableDue > 0 ? 'text-red-600' : 'text-slate-400'}">
        ${formatPKR(s.payableDue || 0)}
      </td>
      <td class="p-2.5 text-right space-x-1">
        <button onclick="paySupplierBill('${s.id}')" class="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[11px] font-bold">
          Pay Bill
        </button>
        <button onclick="deleteSupplier('${s.id}')" title="Delete Supplier Profile" class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[11px] font-bold">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Sales History & Daily Transactions Log
function renderSalesHistoryTable() {
  const query = (document.getElementById('salesSearch')?.value || '').toLowerCase();
  const filterType = document.getElementById('salesFilterType')?.value || 'all';
  const tbody = document.getElementById('salesHistoryTableBody');
  if (!tbody) return;

  const filtered = appData.sales.filter(s => {
    const custName = (s.customerName || s.farmerName || '').toLowerCase();
    const prodName = (s.productName || '').toLowerCase();
    const invId = String(s.invoiceId || s.id || '').toLowerCase();
    const batch = (s.batchNo || '').toLowerCase();
    const matchesQuery = custName.includes(query) || prodName.includes(query) || invId.includes(query) || batch.includes(query);
    const matchesType = (filterType === 'all') || (s.paymentType === filterType);
    return matchesQuery && matchesType;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-6 text-slate-400 italic">No sales transactions found matching search criteria.</td></tr>`;
    return;
  }

  // Show latest sales first
  const sorted = [...filtered].reverse();

  tbody.innerHTML = sorted.map(s => {
    const isCredit = s.paymentType === 'Credit';
    const total = Number(s.totalAmount || 0);
    const cashPaid = s.cashPaid !== undefined ? Number(s.cashPaid) : (s.cashReceived !== undefined ? Number(s.cashReceived) : (isCredit ? 0 : total));
    const udhaar = s.creditRemaining !== undefined ? Number(s.creditRemaining) : (s.creditDue !== undefined ? Number(s.creditDue) : (isCredit ? Math.max(0, total - cashPaid) : 0));
    const custName = s.customerName || s.farmerName || 'Walk-in Farmer';
    const custPhone = s.customerPhone || s.phone || '03426400074';

    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-2.5">
          <span class="font-bold text-slate-800">${s.date || 'Today'}</span>
          <p class="font-mono text-[10px] text-slate-400">#${s.invoiceId || s.id}</p>
        </td>
        <td class="p-2.5">
          <span class="font-bold text-slate-800">${custName}</span>
          ${custPhone ? `<p class="font-mono text-[10px] text-slate-500">${custPhone}</p>` : ''}
        </td>
        <td class="p-2.5">
          <span class="font-bold text-slate-800">${s.productName}</span>
          ${s.batchNo ? `<span class="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono ml-1">${s.batchNo}</span>` : ''}
        </td>
        <td class="p-2.5 font-bold font-mono text-slate-700">${s.quantity || 1} Pack</td>
        <td class="p-2.5 font-mono font-bold text-slate-900">${formatPKR(total)}</td>
        <td class="p-2.5 font-mono text-emerald-700 font-semibold">${formatPKR(cashPaid)}</td>
        <td class="p-2.5 font-mono font-bold ${udhaar > 0 ? 'text-amber-700' : 'text-slate-400'}">${formatPKR(udhaar)}</td>
        <td class="p-2.5">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isCredit ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
            ${s.paymentType}
          </span>
        </td>
        <td class="p-2.5 text-right space-x-1">
          <button onclick="sendWhatsAppReceipt('${custName}', '${custPhone}', ${total}, ${cashPaid}, ${udhaar}, '${s.productName}', ${s.quantity || 1})" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold inline-flex items-center gap-1 shadow-xs" title="WhatsApp Receipt">
            <i class="fa-brands fa-whatsapp text-xs"></i> Receipt
          </button>
          <button onclick="deleteSale('${s.id || s.invoiceId}')" title="Delete Sale Record" class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[11px] font-bold">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
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

  const elGrossSales = document.getElementById('repGrossSales');
  if (elGrossSales) elGrossSales.innerText = formatPKR(grossSales);
  const elTotalExp = document.getElementById('repTotalExpenses');
  if (elTotalExp) elTotalExp.innerText = formatPKR(totalExpenses);
  const elNetProfit = document.getElementById('repNetProfit');
  if (elNetProfit) elNetProfit.innerText = formatPKR(netProfit);

  const expContainer = document.getElementById('repExpenseList');
  if (expContainer) {
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
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-red-600">${formatPKR(e.amount)}</span>
            <button onclick="deleteExpense('${e.id}')" title="Delete Expense" class="p-1 text-red-400 hover:text-red-600 rounded">
              <i class="fa-solid fa-trash text-xs"></i>
            </button>
          </div>
        </div>
      `).join('');
    }
  }
}

// =========================================================================
// 15. GRANULAR EXCEL & CSV REPORT EXPORT ENGINE
// =========================================================================

// Safe date formatter for filenames: DD-MM-YYYY
function getReportDateSuffix() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Pure JS CSV cell escaping (handles Urdu, commas, quotes, line breaks)
function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/\r\n|\r|\n/g, ' ').trim();
  if (str.includes(',') || str.includes('"') || str.includes(';') || str.includes('\t')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

// Native Pure JavaScript CSV downloader with UTF-8 BOM for Microsoft Excel
function downloadCSV(filename, csvContent) {
  try {
    // \uFEFF Byte Order Mark forces Excel to parse file as UTF-8 Unicode
    // This prevents Urdu text, Pakistani Rupee symbols, and commas from garbling
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
    showToast('Excel CSV Downloaded', `Saved ${filename}`);
  } catch (err) {
    console.error('CSV Download failed', err);
    showToast('Export Failed', 'Unable to initiate file download');
  }
}

// 1. Full Farmer Ledgers Report
function exportFarmerLedgerCSV() {
  const dateStr = getReportDateSuffix();
  const filename = `KISSAN_Farmer_Ledger_${dateStr}.csv`;

  let totalPurchases = 0;
  let totalPaid = 0;
  let totalBalance = 0;

  let csv = `"KISSAN SPRAY CENTER - Pull 88,000 | Contact: 03426400074"\n`;
  csv += `"Full Farmer Ledgers & Outstanding Udhaar Report"\n`;
  csv += `"Generated Date:","${new Date().toLocaleString()}"\n\n`;

  const headers = [
    "Farmer Name",
    "Location / Village",
    "Phone Number",
    "Total Bill (Rs.)",
    "Paid Amount (Rs.)",
    "Outstanding Balance (Rs.)",
    "Payment Status"
  ];
  csv += headers.map(escapeCSV).join(',') + '\n';

  if (appData.farmers.length === 0) {
    csv += `"No farmer ledger entries found.",,,,,\n`;
  } else {
    appData.farmers.forEach(f => {
      const bill = Number(f.totalPurchases || 0);
      const balance = Number(f.balanceDue || 0);
      const paid = Math.max(0, bill - balance);
      const status = balance > 0 ? "Pending Udhaar" : "Clear";

      totalPurchases += bill;
      totalPaid += paid;
      totalBalance += balance;

      const row = [
        f.name || 'Unnamed Farmer',
        f.location || 'Pull 88,000',
        f.phone || '03426400074',
        bill,
        paid,
        balance,
        status
      ];
      csv += row.map(escapeCSV).join(',') + '\n';
    });
  }

  // Summary row
  csv += `\n"TOTALS SUMMARY",,"","${totalPurchases}","${totalPaid}","${totalBalance}",""\n`;

  downloadCSV(filename, csv);
}

// 2. Complete Stock & Inventory Report
function exportInventoryCSV() {
  const dateStr = getReportDateSuffix();
  const filename = `KISSAN_Stock_Inventory_${dateStr}.csv`;

  let totalPacks = 0;
  let totalCostValuation = 0;
  let totalSaleValuation = 0;

  let csv = `"KISSAN SPRAY CENTER - Pull 88,000 | Contact: 03426400074"\n`;
  csv += `"Complete Stock & Inventory Valuation Report"\n`;
  csv += `"Generated Date:","${new Date().toLocaleString()}"\n\n`;

  const headers = [
    "Product Name",
    "Category",
    "Batch No",
    "Expiry Date",
    "Purchase Price (Rs.)",
    "Sale Price (Rs.)",
    "Current Stock (Packs)",
    "Stock Valuation - Cost (Rs.)",
    "Stock Valuation - Retail (Rs.)",
    "Stock Status"
  ];
  csv += headers.map(escapeCSV).join(',') + '\n';

  const today = new Date();
  if (appData.products.length === 0) {
    csv += `"No products found in inventory.",,,,,,,,,\n`;
  } else {
    appData.products.forEach(p => {
      const qty = Number(p.quantity || 0);
      const pPrice = Number(p.purchasePrice || 0);
      const sPrice = Number(p.salePrice || 0);
      const costVal = qty * pPrice;
      const saleVal = qty * sPrice;

      totalPacks += qty;
      totalCostValuation += costVal;
      totalSaleValuation += saleVal;

      let status = "Optimal Stock";
      if (qty <= 0) status = "Out of Stock";
      else if (qty < 5) status = "Low Stock";

      if (p.expiryDate) {
        const exp = new Date(p.expiryDate);
        const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) status += " [EXPIRED]";
        else if (diffDays <= 30) status += ` [Expiring in ${diffDays}d]`;
      }

      const row = [
        p.name,
        p.category || 'General',
        p.batchNo || 'N/A',
        p.expiryDate || 'N/A',
        pPrice,
        sPrice,
        qty,
        costVal,
        saleVal,
        status
      ];
      csv += row.map(escapeCSV).join(',') + '\n';
    });
  }

  // Summary row
  csv += `\n"TOTALS SUMMARY",,"","","","","${totalPacks}","${totalCostValuation}","${totalSaleValuation}",""\n`;

  downloadCSV(filename, csv);
}

// 3. Daily / Monthly Sales Log Report
function exportSalesLogCSV() {
  const dateStr = getReportDateSuffix();
  const filename = `KISSAN_Sales_Log_${dateStr}.csv`;

  let totalSalesAmt = 0;
  let totalCash = 0;
  let totalCredit = 0;

  let csv = `"KISSAN SPRAY CENTER - Pull 88,000 | Contact: 03426400074"\n`;
  csv += `"Daily & Monthly Sales Transactions Log"\n`;
  csv += `"Generated Date:","${new Date().toLocaleString()}"\n\n`;

  const headers = [
    "Date",
    "Invoice No",
    "Customer (Farmer)",
    "Customer Phone",
    "Items Purchased",
    "Batch No",
    "Quantity",
    "Unit Price (Rs.)",
    "Total Amount (Rs.)",
    "Payment Method",
    "Cash Paid (Rs.)",
    "Outstanding Udhaar (Rs.)"
  ];
  csv += headers.map(escapeCSV).join(',') + '\n';

  if (appData.sales.length === 0) {
    csv += `"No sales transactions recorded.",,,,,,,,,,,\n`;
  } else {
    appData.sales.forEach(s => {
      const isCredit = s.paymentType === 'Credit';
      const total = Number(s.totalAmount || 0);
      const cash = s.cashPaid !== undefined ? Number(s.cashPaid) : (s.cashReceived !== undefined ? Number(s.cashReceived) : (isCredit ? 0 : total));
      const udhaar = s.creditRemaining !== undefined ? Number(s.creditRemaining) : (s.creditDue !== undefined ? Number(s.creditDue) : (isCredit ? Math.max(0, total - cash) : 0));
      const custName = s.customerName || s.farmerName || 'Walk-in Farmer';
      const custPhone = s.customerPhone || s.phone || '03426400074';

      totalSalesAmt += total;
      totalCash += cash;
      totalCredit += udhaar;

      const row = [
        s.date || 'Today',
        s.invoiceId || s.id,
        custName,
        custPhone,
        s.productName || 'General Product',
        s.batchNo || 'N/A',
        s.quantity || 1,
        s.salePrice || 0,
        total,
        s.paymentType || 'Cash',
        cash,
        udhaar
      ];
      csv += row.map(escapeCSV).join(',') + '\n';
    });
  }

  // Summary row
  csv += `\n"TOTALS SUMMARY",,"","","","","","","${totalSalesAmt}","","${totalCash}","${totalCredit}"\n`;

  downloadCSV(filename, csv);
}

// 4. Supplier Purchases & Payables Report
function exportSupplierPayablesCSV() {
  const dateStr = getReportDateSuffix();
  const filename = `KISSAN_Supplier_Payables_${dateStr}.csv`;

  let totalProcured = 0;
  let totalPaid = 0;
  let totalPayable = 0;

  let csv = `"KISSAN SPRAY CENTER - Pull 88,000 | Contact: 03426400074"\n`;
  csv += `"Supplier Purchases & Company Payables Report"\n`;
  csv += `"Generated Date:","${new Date().toLocaleString()}"\n\n`;

  const headers = [
    "Supplier / Company Name",
    "Total Procured (Rs.)",
    "Amount Paid (Rs.)",
    "Outstanding Payable (Rs.)",
    "Payment Status"
  ];
  csv += headers.map(escapeCSV).join(',') + '\n';

  if (appData.suppliers.length === 0) {
    csv += `"No supplier ledger entries found.",,,,\n`;
  } else {
    appData.suppliers.forEach(s => {
      const procured = Number(s.totalPurchased || 0);
      const paid = Number(s.amountPaid || 0);
      const payable = Number(s.payableDue || 0);
      const status = payable > 0 ? "Payment Due" : "Paid in Full";

      totalProcured += procured;
      totalPaid += paid;
      totalPayable += payable;

      const row = [
        s.name,
        procured,
        paid,
        payable,
        status
      ];
      csv += row.map(escapeCSV).join(',') + '\n';
    });
  }

  // Summary row
  csv += `\n"TOTALS SUMMARY","${totalProcured}","${totalPaid}","${totalPayable}",""\n`;

  downloadCSV(filename, csv);
}

// 5. Expense Register Report
function exportExpenseRegisterCSV() {
  const dateStr = getReportDateSuffix();
  const filename = `KISSAN_Expense_Register_${dateStr}.csv`;

  let totalExp = 0;

  let csv = `"KISSAN SPRAY CENTER - Pull 88,000 | Contact: 03426400074"\n`;
  csv += `"Shop Overhead & Expense Register Report"\n`;
  csv += `"Generated Date:","${new Date().toLocaleString()}"\n\n`;

  const headers = [
    "Date",
    "Expense Category",
    "Description / Bill Memo",
    "Amount (Rs.)"
  ];
  csv += headers.map(escapeCSV).join(',') + '\n';

  if (appData.expenses.length === 0) {
    csv += `"No expenses recorded.",,,\n`;
  } else {
    appData.expenses.forEach(e => {
      const amt = Number(e.amount || 0);
      totalExp += amt;

      const row = [
        e.date || 'N/A',
        e.category || 'Shop Expense',
        e.note || '',
        amt
      ];
      csv += row.map(escapeCSV).join(',') + '\n';
    });
  }

  // Summary row
  csv += `\n"TOTAL EXPENSES",,"","${totalExp}"\n`;

  downloadCSV(filename, csv);
}

// Update counters on Export Modal
function updateExcelExportCounters() {
  const setTxt = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.innerText = txt;
  };
  setTxt('exportCountFarmers', `${appData.farmers.length} Farmers`);
  setTxt('exportCountProducts', `${appData.products.length} Products`);
  setTxt('exportCountSales', `${appData.sales.length} Invoices`);
  setTxt('exportCountSuppliers', `${appData.suppliers.length} Suppliers`);
  setTxt('exportCountExpenses', `${appData.expenses.length} Expenses`);
}

function openExcelExportModal() {
  updateExcelExportCounters();
  openModal('excelExportModal');
}

// Comprehensive Master Database Backup
function exportAllCSV() {
  const collections = [
    { name: 'Products_Inventory', data: appData.products },
    { name: 'Sales_Transactions', data: appData.sales },
    { name: 'Farmer_Ledgers', data: appData.farmers },
    { name: 'Supplier_Payables', data: appData.suppliers },
    { name: 'Shop_Expenses', data: appData.expenses }
  ];

  let combinedCSV = `KISSAN SPRAY CENTER - MASTER DATABASE BACKUP\nPull 88,000 | Contact: 03426400074\nDate: ${new Date().toLocaleString()}\n\n`;

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

  const filename = `KISSAN_Master_Backup_${getReportDateSuffix()}.csv`;
  downloadCSV(filename, combinedCSV);
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
  appData.employees = [];
  appData.banks = [];
  appData.bankTransactions = [];
  appData.cashTransactions = [];
  appData.returns = [];

  saveLocalData();
  updateDashboard();
  if (typeof renderActiveView === 'function') {
    renderActiveView();
  }
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
window.exportFarmerLedgerCSV = exportFarmerLedgerCSV;
window.exportInventoryCSV = exportInventoryCSV;
window.exportSalesLogCSV = exportSalesLogCSV;
window.exportSupplierPayablesCSV = exportSupplierPayablesCSV;
window.exportExpenseRegisterCSV = exportExpenseRegisterCSV;
window.openExcelExportModal = openExcelExportModal;
window.updateExcelExportCounters = updateExcelExportCounters;
window.renderSalesHistoryTable = renderSalesHistoryTable;
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
