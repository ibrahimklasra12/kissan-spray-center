// =========================================================================
// KISSAN AGRO TRADERS - VIEW ROUTER & ERP FULL-PAGE SECTIONS ENGINE
// =========================================================================

const VIEW_TITLES = {
  dashboard: 'Dashboard Overview',
  suppliers: 'Suppliers & Manufacturer Ledgers',
  purchase: 'Purchase Orders & Inbound Stock',
  inventory: 'Stock & Batch Inventory',
  customers: 'Farmer Customer Accounts',
  pos: 'Point of Sale (POS)',
  sales: 'Sales History & Receipts',
  employees: 'Employee & Staff Register',
  expenses: 'Shop Expenses & Overheads',
  ledgers: 'Receivable & Payable Accounts',
  recpay: 'Receivable & Payable Accounts',
  returns: 'Product & Sales Returns',
  cashflow: 'Cash Flow & Daily Register',
  banks: 'Bank Accounts & Ledger',
  reports: 'Financial & Business Analytics'
};

let currentActiveView = 'dashboard';
let posCart = [];
let posCategoryFilter = 'all';

// --- NAVIGATION & SKELETON LOADER ---
function navigateView(view) {
  if (view === 'recpay') view = 'ledgers';
  currentActiveView = view;

  // Mobile sidebar close on nav
  const sb = document.getElementById('sidebar');
  if (sb && window.innerWidth < 768) {
    sb.classList.add('-translate-x-full');
  }

  // Update top bar dynamic section title
  const titleEl = document.getElementById('currentSectionTitle');
  if (titleEl) {
    titleEl.innerText = VIEW_TITLES[view] || 'Agro ERP System';
  }

  // Update sidebar active styling
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('nav-item-active');
    btn.classList.add('nav-item-inactive');
  });

  const activeBtn = document.getElementById(`nav-${view}`);
  if (activeBtn) {
    activeBtn.classList.remove('nav-item-inactive');
    activeBtn.classList.add('nav-item-active');
  }

  // Show skeleton loader for transition
  const skeleton = document.getElementById('viewSkeleton');
  const allViews = document.querySelectorAll('.view-section');
  allViews.forEach(el => el.classList.add('hidden'));

  if (skeleton) skeleton.classList.remove('hidden');

  setTimeout(() => {
    if (skeleton) skeleton.classList.add('hidden');
    const targetEl = document.getElementById(`view-${view}`);
    if (targetEl) targetEl.classList.remove('hidden');

    // Call data rendering for the target view
    renderTargetView(view);
  }, 160);
}

function renderTargetView(view) {
  switch (view) {
    case 'dashboard':
      if (typeof updateDashboard === 'function') updateDashboard();
      break;
    case 'suppliers':
      renderSuppliersViewTable();
      break;
    case 'purchase':
      renderPurchaseHistoryViewTable();
      break;
    case 'inventory':
      renderInventoryViewTable();
      break;
    case 'customers':
      renderCustomersViewTable();
      break;
    case 'pos':
      initPOSView();
      break;
    case 'sales':
      renderSalesViewTable();
      break;
    case 'employees':
      renderEmployeesViewTable();
      break;
    case 'expenses':
      renderExpensesViewTable();
      break;
    case 'ledgers':
      renderLedgersView();
      break;
    case 'returns':
      renderReturnsViewTable();
      break;
    case 'cashflow':
      renderCashFlowView();
      break;
    case 'banks':
      renderBanksView();
      break;
    case 'reports':
      renderReportsView();
      break;
  }
}

// =========================================================================
// 1. SUPPLIERS VIEW
// =========================================================================
function renderSuppliersViewTable() {
  const tbody = document.getElementById('viewSuppliersTableBody');
  if (!tbody) return;

  const search = (document.getElementById('viewSupSearch')?.value || '').toLowerCase().trim();
  const list = appData.suppliers.filter(s => {
    return !search || (s.name || '').toLowerCase().includes(search) ||
      (s.phone || '').toLowerCase().includes(search) ||
      (s.contactPerson || '').toLowerCase().includes(search) ||
      (s.city || '').toLowerCase().includes(search);
  });

  // Calculate stats
  let totalPurchased = 0;
  let totalPaid = 0;
  let totalPayable = 0;
  appData.suppliers.forEach(s => {
    totalPurchased += Number(s.totalPurchased || 0);
    totalPaid += Number(s.paidAmount || (s.totalPurchased - (s.payableDue || 0)) || 0);
    totalPayable += Number(s.payableDue || 0);
  });

  if (document.getElementById('viewSupTotalCount')) document.getElementById('viewSupTotalCount').innerText = appData.suppliers.length;
  if (document.getElementById('viewSupTotalProcured')) document.getElementById('viewSupTotalProcured').innerText = formatPKR(totalPurchased);
  if (document.getElementById('viewSupTotalPaid')) document.getElementById('viewSupTotalPaid').innerText = formatPKR(totalPaid);
  if (document.getElementById('viewSupTotalPayable')) document.getElementById('viewSupTotalPayable').innerText = formatPKR(totalPayable);

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-400 font-medium">No suppliers match your search.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(s => {
    const due = Number(s.payableDue || 0);
    const purchased = Number(s.totalPurchased || 0);
    const paid = Number(s.paidAmount || (purchased - due) || 0);
    const isDue = due > 0;
    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-3 font-bold text-slate-900">${s.name || 'Unnamed Supplier'}</td>
        <td class="p-3 text-slate-600">${s.contactPerson ? s.contactPerson + ' &bull; ' : ''}${s.phone || 'N/A'}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">${s.city || 'Agro Chemical'}</span></td>
        <td class="p-3 font-mono font-semibold text-teal-800">${formatPKR(purchased)}</td>
        <td class="p-3 font-mono font-semibold text-emerald-700">${formatPKR(paid)}</td>
        <td class="p-3 font-mono font-bold ${isDue ? 'text-red-600' : 'text-slate-500'}">${formatPKR(due)}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${isDue ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}">${isDue ? 'Payable Due' : 'Cleared'}</span></td>
        <td class="p-3 text-right whitespace-nowrap space-x-1">
          <button onclick="quickPaySupplier('${s.id}')" class="btn-press px-2.5 py-1 bg-[#0a472e] hover:bg-[#072b1c] text-white rounded text-[11px] font-bold">Pay Due</button>
          <button onclick="deleteSupplier('${s.id}')" title="Delete Supplier Profile" class="btn-press p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded">
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function submitNewSupplier(e) {
  if (e && e.preventDefault) e.preventDefault();
  const name = document.getElementById('newSupName')?.value.trim();
  if (!name) return;

  const newSup = {
    id: 'sup-' + Date.now(),
    name,
    contactPerson: document.getElementById('newSupPerson')?.value.trim() || '',
    phone: document.getElementById('newSupPhone')?.value.trim() || '',
    city: document.getElementById('newSupCity')?.value.trim() || '',
    payableDue: Number(document.getElementById('newSupOpening')?.value || 0),
    totalPurchased: Number(document.getElementById('newSupOpening')?.value || 0),
    paidAmount: 0
  };

  appData.suppliers.push(newSup);
  saveLocalData('suppliers');
  closeModal('addSupplierModal');
  document.getElementById('addSupplierForm')?.reset();
  if (typeof playAudioFeedback === 'function') playAudioFeedback('add');
  showToast('Supplier Registered!', `${name} added to suppliers list.`);
  renderSuppliersViewTable();
}

function quickPaySupplier(supId) {
  const sup = appData.suppliers.find(s => String(s.id) === String(supId));
  if (!sup) return;
  const payAmount = prompt(`Enter payment amount (Rs.) to ${sup.name}:`, sup.payableDue || 0);
  const amt = Number(payAmount);
  if (!amt || amt <= 0) return;

  sup.payableDue = Math.max(0, Number(sup.payableDue || 0) - amt);
  sup.paidAmount = Number(sup.paidAmount || 0) + amt;

  // Record into cash out transactions
  appData.cashTransactions.push({
    id: 'ctx-' + Date.now(),
    date: new Date().toISOString().split('T')[0],
    flow: 'Cash Out',
    category: 'Supplier Payment',
    amount: amt,
    memo: `Payment paid to supplier: ${sup.name}`
  });

  saveLocalData();
  showToast(`Paid Rs. ${amt.toLocaleString()} to ${sup.name}`);
  renderSuppliersViewTable();
  if (typeof updateDashboard === 'function') updateDashboard();
}

// =========================================================================
// 2. PURCHASE VIEW (INBOUND STOCK PROCUREMENT)
// =========================================================================
function calcProcurementViewTotals() {
  const qty = Number(document.getElementById('procQty')?.value || 0);
  const cost = Number(document.getElementById('procCostPrice')?.value || 0);
  const total = qty * cost;
  const disp = document.getElementById('procTotalDisplay');
  if (disp) disp.innerText = formatPKR(total);
}

function submitProcurementView(e) {
  if (e && e.preventDefault) e.preventDefault();
  const supName = document.getElementById('procSupplier')?.value.trim();
  const cat = document.getElementById('procCategory')?.value;
  const prodName = document.getElementById('procProduct')?.value.trim();
  const batch = document.getElementById('procBatch')?.value.trim();
  const expiry = document.getElementById('procExpiry')?.value;
  const qty = Number(document.getElementById('procQty')?.value || 0);
  const cost = Number(document.getElementById('procCostPrice')?.value || 0);
  const salePrice = Number(document.getElementById('procSalePrice')?.value || 0);
  const payMode = document.getElementById('procPayMode')?.value || 'Credit';

  if (!prodName || qty <= 0) {
    alert('Please enter product details and valid quantity.');
    return;
  }

  const totalCost = qty * cost;

  // 1. Add or Update Product in Inventory
  let prod = appData.products.find(p => p.name.toLowerCase() === prodName.toLowerCase() && p.batch === batch);
  if (prod) {
    prod.stock = Number(prod.stock || 0) + qty;
    prod.costPrice = cost;
    prod.salePrice = salePrice || prod.salePrice;
    prod.expiry = expiry || prod.expiry;
  } else {
    prod = {
      id: 'prod-' + Date.now(),
      name: prodName,
      category: cat,
      batch: batch || 'BAT-2026',
      expiry: expiry || '2027-12-31',
      costPrice: cost,
      salePrice: salePrice,
      stock: qty
    };
    appData.products.push(prod);
  }

  // 2. Update Supplier Ledger
  let sup = appData.suppliers.find(s => s.name.toLowerCase() === supName.toLowerCase());
  if (!sup && supName) {
    sup = {
      id: 'sup-' + Date.now(),
      name: supName,
      phone: '',
      contactPerson: '',
      city: 'Distributor',
      totalPurchased: 0,
      paidAmount: 0,
      payableDue: 0
    };
    appData.suppliers.push(sup);
  }
  if (sup) {
    sup.totalPurchased = Number(sup.totalPurchased || 0) + totalCost;
    if (payMode === 'Credit') {
      sup.payableDue = Number(sup.payableDue || 0) + totalCost;
    } else {
      sup.paidAmount = Number(sup.paidAmount || 0) + totalCost;
      appData.cashTransactions.push({
        id: 'ctx-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        flow: 'Cash Out',
        category: 'Supplier Payment',
        amount: totalCost,
        memo: `Immediate ${payMode} purchase for ${prodName}`
      });
    }
  }

  // Save changes
  saveLocalData();
  if (typeof playAudioFeedback === 'function') playAudioFeedback('add');
  showToast('Inbound Stock Received!', `Added ${qty} packs of ${prodName} to inventory.`);
  renderPurchaseHistoryViewTable();
  if (typeof updateDashboard === 'function') updateDashboard();
}

function renderPurchaseHistoryViewTable() {
  const tbody = document.getElementById('viewPurchaseTableBody');
  if (!tbody) return;

  if (appData.products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-400 font-medium">No inbound purchases recorded yet.</td></tr>`;
    return;
  }

  // Render recent products received
  tbody.innerHTML = appData.products.slice(-10).reverse().map(p => {
    const totalVal = (Number(p.stock || 0) * Number(p.costPrice || 0));
    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-2.5 text-slate-500 font-mono">${p.expiry || '2026-12-31'}</td>
        <td class="p-2.5 font-bold text-slate-900">${p.category || 'General'}</td>
        <td class="p-2.5 font-semibold text-slate-800">${p.name} <span class="text-xs text-slate-400 font-mono">(${p.batch || 'BAT-01'})</span></td>
        <td class="p-2.5 font-mono font-bold text-slate-700">${p.stock}</td>
        <td class="p-2.5 font-mono text-slate-600">${formatPKR(p.costPrice || 0)}</td>
        <td class="p-2.5 font-mono font-bold text-teal-800">${formatPKR(totalVal)}</td>
        <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Received</span></td>
        <td class="p-2.5 text-right">
          <button onclick="deleteProduct('${p.id}')" title="Delete Inbound Batch" class="btn-press p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded">
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// =========================================================================
// 3. INVENTORY VIEW
// =========================================================================
function renderInventoryViewTable() {
  const tbody = document.getElementById('viewInventoryTableBody');
  if (!tbody) return;

  const search = (document.getElementById('viewInvSearch')?.value || '').toLowerCase().trim();
  const catFilter = document.getElementById('viewInvCategoryFilter')?.value || 'all';
  const statusFilter = document.getElementById('viewInvStatusFilter')?.value || 'all';

  const today = new Date();
  const list = appData.products.filter(p => {
    const matchesSearch = !search || (p.name || '').toLowerCase().includes(search) || (p.batch || '').toLowerCase().includes(search);
    const matchesCat = catFilter === 'all' || p.category === catFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'low') matchesStatus = Number(p.stock) > 0 && Number(p.stock) < 5;
    else if (statusFilter === 'out') matchesStatus = Number(p.stock) <= 0;
    else if (statusFilter === 'expiry') {
      if (p.expiry) {
        const diff = (new Date(p.expiry) - today) / (1000 * 60 * 60 * 24);
        matchesStatus = diff <= 60;
      }
    }
    return matchesSearch && matchesCat && matchesStatus;
  });

  // Calculate summary metrics
  let totalPacks = 0;
  let costVal = 0;
  let retailVal = 0;
  appData.products.forEach(p => {
    const qty = Number(p.stock || 0);
    totalPacks += qty;
    costVal += qty * Number(p.costPrice || 0);
    retailVal += qty * Number(p.salePrice || 0);
  });

  if (document.getElementById('viewInvCount')) document.getElementById('viewInvCount').innerText = appData.products.length;
  if (document.getElementById('viewInvTotalPacks')) document.getElementById('viewInvTotalPacks').innerText = totalPacks.toLocaleString();
  if (document.getElementById('viewInvCostVal')) document.getElementById('viewInvCostVal').innerText = formatPKR(costVal);
  if (document.getElementById('viewInvRetailVal')) document.getElementById('viewInvRetailVal').innerText = formatPKR(retailVal);

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400 font-medium">No agrochemical stock matches criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => {
    const qty = Number(p.stock || 0);
    const isOut = qty <= 0;
    const isLow = qty > 0 && qty < 5;
    const itemTotal = qty * Number(p.salePrice || 0);

    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-3">
          <div class="font-bold text-slate-900">${p.name}</div>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">${p.category || 'Agrochemical'}</span>
        </td>
        <td class="p-3 text-slate-600 font-mono text-[11px]">
          <div>${p.batch || 'N/A'}</div>
          <div class="text-[10px] text-slate-400">Exp: ${p.expiry || '2027'}</div>
        </td>
        <td class="p-3 font-mono text-slate-600">${formatPKR(p.costPrice || 0)}</td>
        <td class="p-3 font-mono font-bold text-emerald-700">${formatPKR(p.salePrice || 0)}</td>
        <td class="p-3">
          <span class="px-2.5 py-1 rounded-full text-xs font-black font-mono ${isOut ? 'bg-red-100 text-red-700' : isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
            ${qty} packs
          </span>
        </td>
        <td class="p-3 font-mono font-bold text-teal-900">${formatPKR(itemTotal)}</td>
        <td class="p-3 text-right">
          <div class="inline-flex items-center gap-1">
            <button onclick="quickAdjustStock('${p.id}', 10)" title="Add 10 packs" class="btn-press px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-bold">+10</button>
            <button onclick="quickAdjustStock('${p.id}', -1)" title="Remove 1 pack" class="btn-press px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-xs font-bold">-1</button>
            <button onclick="deleteProduct('${p.id}')" title="Delete Product" class="btn-press px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-bold"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function quickAdjustStock(prodId, delta) {
  const prod = appData.products.find(p => String(p.id) === String(prodId));
  if (!prod) return;
  prod.stock = Math.max(0, Number(prod.stock || 0) + delta);
  saveLocalData('products');
  renderInventoryViewTable();
  if (typeof updateDashboard === 'function') updateDashboard();
}

// =========================================================================
// 4. CUSTOMERS (FARMERS) VIEW
// =========================================================================
function renderCustomersViewTable() {
  const tbody = document.getElementById('viewCustomersTableBody');
  if (!tbody) return;

  const search = (document.getElementById('viewCustSearch')?.value || '').toLowerCase().trim();
  const list = appData.farmers.filter(f => {
    return !search || (f.name || '').toLowerCase().includes(search) ||
      (f.location || '').toLowerCase().includes(search) ||
      (f.phone || '').toLowerCase().includes(search);
  });

  // Calculate stats
  let totalBilled = 0;
  let totalPaid = 0;
  let totalUdhaar = 0;
  appData.farmers.forEach(f => {
    totalBilled += Number(f.totalBill || 0);
    totalPaid += Number(f.paidAmount || 0);
    totalUdhaar += Number(f.balanceDue || 0);
  });

  if (document.getElementById('viewCustTotal')) document.getElementById('viewCustTotal').innerText = appData.farmers.length;
  if (document.getElementById('viewCustTotalSales')) document.getElementById('viewCustTotalSales').innerText = formatPKR(totalBilled);
  if (document.getElementById('viewCustTotalPaid')) document.getElementById('viewCustTotalPaid').innerText = formatPKR(totalPaid);
  if (document.getElementById('viewCustTotalUdhaar')) document.getElementById('viewCustTotalUdhaar').innerText = formatPKR(totalUdhaar);

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-400 font-medium">No farmer customer records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(f => {
    const bal = Number(f.balanceDue || 0);
    const isUdhaar = bal > 0;
    const phoneClean = (f.phone || '').replace(/[^0-9]/g, '');

    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-3 font-bold text-slate-900">${f.name}</td>
        <td class="p-3 text-slate-600">${f.location || 'Pull 88,000'}</td>
        <td class="p-3">
          <a href="https://wa.me/${phoneClean.startsWith('0') ? '92' + phoneClean.slice(1) : phoneClean}" target="_blank" class="text-emerald-700 hover:text-emerald-900 font-mono font-bold flex items-center gap-1">
            <i class="fa-brands fa-whatsapp text-emerald-500"></i> ${f.phone || 'N/A'}
          </a>
        </td>
        <td class="p-3 font-mono font-semibold text-slate-700">${formatPKR(f.totalBill || 0)}</td>
        <td class="p-3 font-mono font-semibold text-emerald-700">${formatPKR(f.paidAmount || 0)}</td>
        <td class="p-3 font-mono font-black ${isUdhaar ? 'text-amber-800' : 'text-slate-500'}">${formatPKR(bal)}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${isUdhaar ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}">${isUdhaar ? 'Udhaar Active' : 'Clear'}</span></td>
        <td class="p-3 text-right whitespace-nowrap space-x-1">
          <button onclick="quickFarmerRecovery('${f.id}')" class="btn-press px-2.5 py-1 bg-[#14532d] hover:bg-[#0f4022] text-white rounded text-[11px] font-bold">Receive Cash</button>
          <button onclick="deleteFarmer('${f.id}')" title="Delete Customer Profile" class="btn-press p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded">
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function submitNewFarmer(e) {
  if (e && e.preventDefault) e.preventDefault();
  const name = document.getElementById('newFarmerName')?.value.trim();
  const loc = document.getElementById('newFarmerLoc')?.value.trim();
  const phone = document.getElementById('newFarmerPhone')?.value.trim();
  const opening = Number(document.getElementById('newFarmerOpening')?.value || 0);

  if (!name) return;

  const newFarmer = {
    id: 'farmer-' + Date.now(),
    name,
    location: loc || 'Pull 88,000',
    phone: phone || '',
    acreage: Number(document.getElementById('newFarmerAcres')?.value || 0),
    totalBill: opening,
    paidAmount: 0,
    balanceDue: opening
  };

  appData.farmers.push(newFarmer);
  saveLocalData('farmers');
  closeModal('addFarmerModal');
  document.getElementById('addFarmerForm')?.reset();
  if (typeof playAudioFeedback === 'function') playAudioFeedback('add');
  showToast('Farmer Profile Registered!', `${name} added to farmer records.`);
  renderCustomersViewTable();
}

function quickFarmerRecovery(farmerId) {
  const f = appData.farmers.find(x => String(x.id) === String(farmerId));
  if (!f) return;
  const payAmount = prompt(`Enter recovered cash amount (Rs.) from ${f.name}:`, f.balanceDue || 0);
  const amt = Number(payAmount);
  if (!amt || amt <= 0) return;

  f.balanceDue = Math.max(0, Number(f.balanceDue || 0) - amt);
  f.paidAmount = Number(f.paidAmount || 0) + amt;

  appData.cashTransactions.push({
    id: 'ctx-' + Date.now(),
    date: new Date().toISOString().split('T')[0],
    flow: 'Cash In',
    category: 'Farmer Recovery',
    amount: amt,
    memo: `Udhaar recovery from farmer: ${f.name}`
  });

  saveLocalData();
  if (typeof playAudioFeedback === 'function') playAudioFeedback('add');
  showToast('Cash Recovery Received!', `Rs. ${amt.toLocaleString()} received from ${f.name}.`);
  renderCustomersViewTable();
  if (typeof updateDashboard === 'function') updateDashboard();
}

// =========================================================================
// 5. POINT OF SALE (POS) ENGINE
// =========================================================================
function initPOSView() {
  populatePosCustomerSelect();
  renderPosProductCatalog();
  renderPosCart();
}

function populatePosCustomerSelect() {
  const select = document.getElementById('posCustomerSelect');
  if (!select) return;
  const currentVal = select.value;
  select.innerHTML = `<option value="">-- Choose Existing Farmer --</option>` +
    appData.farmers.map(f => `<option value="${f.id}">${f.name} (${f.location || 'Pull 88,000'})</option>`).join('');
  if (currentVal) select.value = currentVal;
}

function onPosCustomerChange() {
  const select = document.getElementById('posCustomerSelect');
  if (!select) return;
  const farmer = appData.farmers.find(f => String(f.id) === String(select.value));
  const locInput = document.getElementById('posFarmerLocation');
  const phoneInput = document.getElementById('posFarmerPhone');

  if (farmer) {
    if (locInput) locInput.value = farmer.location || 'Pull 88,000';
    if (phoneInput) phoneInput.value = farmer.phone || '';
  }
}

function setPosCategoryFilter(cat) {
  posCategoryFilter = cat;
  document.querySelectorAll('.pos-cat-pill').forEach(pill => {
    pill.classList.remove('bg-[#0a472e]', 'text-white');
    pill.classList.add('bg-slate-100', 'text-slate-700');
  });
  event?.target?.classList?.remove('bg-slate-100', 'text-slate-700');
  event?.target?.classList?.add('bg-[#0a472e]', 'text-white');
  renderPosProductCatalog();
}

function renderPosProductCatalog() {
  const grid = document.getElementById('posProductCatalogGrid');
  if (!grid) return;

  const search = (document.getElementById('posProductSearch')?.value || '').toLowerCase().trim();
  const list = appData.products.filter(p => {
    const matchSearch = !search || (p.name || '').toLowerCase().includes(search) || (p.category || '').toLowerCase().includes(search);
    const matchCat = posCategoryFilter === 'all' || p.category === posCategoryFilter;
    return matchSearch && matchCat;
  });

  if (list.length === 0) {
    grid.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400 font-medium">No agrochemicals found.</div>`;
    return;
  }

  grid.innerHTML = list.map(p => {
    const stock = Number(p.stock || 0);
    const isOut = stock <= 0;
    return `
      <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-500 transition">
        <div>
          <div class="flex justify-between items-start gap-1">
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold uppercase">${p.category || 'Item'}</span>
            <span class="text-[11px] font-bold font-mono ${isOut ? 'text-red-600' : 'text-emerald-700'}">${stock} in stock</span>
          </div>
          <h4 class="font-bold text-xs text-slate-900 mt-1 leading-tight line-clamp-2">${p.name}</h4>
          <span class="text-[10px] text-slate-400 font-mono">Batch: ${p.batch || 'BAT-01'}</span>
        </div>
        <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
          <span class="font-black text-xs text-slate-900 font-mono">${formatPKR(p.salePrice || 0)}</span>
          <button onclick="addToPosCart('${p.id}')" ${isOut ? 'disabled' : ''} class="btn-press px-2.5 py-1 ${isOut ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#0a472e] hover:bg-[#072b1c] text-white'} rounded text-[11px] font-bold">
            + Add
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function addToPosCart(prodId) {
  const prod = appData.products.find(p => String(p.id) === String(prodId));
  if (!prod) return;
  if (Number(prod.stock || 0) <= 0) {
    alert('This product is out of stock!');
    return;
  }

  const existing = posCart.find(item => String(item.id) === String(prodId));
  if (existing) {
    if (existing.qty >= prod.stock) {
      alert(`Only ${prod.stock} packs available in stock.`);
      return;
    }
    existing.qty += 1;
    existing.total = existing.qty * existing.price;
  } else {
    posCart.push({
      id: prod.id,
      name: prod.name,
      price: Number(prod.salePrice || 0),
      qty: 1,
      total: Number(prod.salePrice || 0)
    });
  }
  renderPosCart();
}

function updatePosCartQty(prodId, delta) {
  const item = posCart.find(x => String(x.id) === String(prodId));
  if (!item) return;
  const prod = appData.products.find(p => String(p.id) === String(prodId));

  item.qty += delta;
  if (prod && item.qty > prod.stock) {
    item.qty = prod.stock;
    alert(`Maximum available stock is ${prod.stock}`);
  }

  if (item.qty <= 0) {
    removeFromPosCart(prodId);
  } else {
    item.total = item.qty * item.price;
    renderPosCart();
  }
}

function removeFromPosCart(prodId) {
  posCart = posCart.filter(x => String(x.id) !== String(prodId));
  renderPosCart();
}

function clearPosCart() {
  posCart = [];
  renderPosCart();
}

function renderPosCart() {
  const tbody = document.getElementById('posCartTableBody');
  const grandDisplay = document.getElementById('posGrandTotalDisplay');
  if (!tbody) return;

  let grandTotal = 0;
  if (posCart.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400 font-medium">Cart is empty. Click + Add on products.</td></tr>`;
  } else {
    tbody.innerHTML = posCart.map(item => {
      grandTotal += item.total;
      return `
        <tr class="border-b border-slate-100">
          <td class="py-2 pr-1 font-bold text-slate-800">${item.name}</td>
          <td class="py-2 text-center whitespace-nowrap">
            <div class="inline-flex items-center gap-1">
              <button onclick="updatePosCartQty('${item.id}', -1)" class="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold">-</button>
              <span class="font-mono font-bold w-4 text-center">${item.qty}</span>
              <button onclick="updatePosCartQty('${item.id}', 1)" class="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold">+</button>
            </div>
          </td>
          <td class="py-2 text-right font-mono text-slate-600">${item.price}</td>
          <td class="py-2 text-right font-mono font-bold text-emerald-800">${item.total}</td>
          <td class="py-2 text-right pl-1">
            <button onclick="removeFromPosCart('${item.id}')" class="text-red-500 hover:text-red-700"><i class="fa-solid fa-xmark text-xs"></i></button>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (grandDisplay) grandDisplay.innerText = formatPKR(grandTotal);
  calcPosTotals();
}

function calcPosTotals() {
  const grandText = document.getElementById('posGrandTotalDisplay')?.innerText || '0';
  let grandTotal = 0;
  posCart.forEach(i => grandTotal += i.total);

  const pType = document.getElementById('posPaymentType')?.value || 'Cash';
  const cashInput = document.getElementById('posCashReceived');

  if (pType === 'Cash' && cashInput && Number(cashInput.value) === 0) {
    cashInput.value = grandTotal;
  }

  const cash = Number(cashInput?.value || 0);
  const due = Math.max(0, grandTotal - cash);

  const dueDisp = document.getElementById('posCreditDue');
  if (dueDisp) dueDisp.innerText = formatPKR(due);
}

function submitPosSale() {
  if (posCart.length === 0) {
    alert('Please add items to cart before completing sale.');
    return;
  }

  const customerSelect = document.getElementById('posCustomerSelect');
  let farmerName = 'Walk-in Farmer';
  let farmerPhone = document.getElementById('posFarmerPhone')?.value.trim() || '03426400074';
  let farmerLoc = document.getElementById('posFarmerLocation')?.value.trim() || 'Pull 88,000';
  let farmerId = customerSelect?.value;

  if (farmerId) {
    const f = appData.farmers.find(x => String(x.id) === String(farmerId));
    if (f) {
      farmerName = f.name;
      farmerPhone = f.phone || farmerPhone;
      farmerLoc = f.location || farmerLoc;
    }
  }

  let totalAmount = 0;
  posCart.forEach(i => totalAmount += i.total);

  const payType = document.getElementById('posPaymentType')?.value || 'Cash';
  const cashReceived = Number(document.getElementById('posCashReceived')?.value || (payType === 'Cash' ? totalAmount : 0));
  const creditDue = Math.max(0, totalAmount - cashReceived);

  const invoiceNo = 'INV-' + (appData.sales.length + 1001);
  const dateStr = new Date().toISOString().split('T')[0];

  const newSale = {
    id: 'sale-' + Date.now(),
    invoiceNo,
    date: dateStr,
    farmerName,
    farmerPhone,
    farmerLocation: farmerLoc,
    items: posCart.map(i => `${i.name} (x${i.qty})`).join(', '),
    totalAmount,
    cashPaid: cashReceived,
    creditDue,
    paymentType: payType
  };

  // 1. Save Sale
  appData.sales.push(newSale);

  // 2. Deduct Inventory Stock
  posCart.forEach(ci => {
    const prod = appData.products.find(p => String(p.id) === String(ci.id));
    if (prod) prod.stock = Math.max(0, Number(prod.stock || 0) - ci.qty);
  });

  // 3. Update Farmer Ledger
  if (farmerId) {
    const f = appData.farmers.find(x => String(x.id) === String(farmerId));
    if (f) {
      f.totalBill = Number(f.totalBill || 0) + totalAmount;
      f.paidAmount = Number(f.paidAmount || 0) + cashReceived;
      f.balanceDue = Number(f.balanceDue || 0) + creditDue;
    }
  }

  // 4. Record Cash In if cash received
  if (cashReceived > 0) {
    appData.cashTransactions.push({
      id: 'ctx-' + Date.now(),
      date: dateStr,
      flow: 'Cash In',
      category: 'Direct Counter Sale',
      amount: cashReceived,
      memo: `Sale ${invoiceNo} to ${farmerName}`
    });
  }

  saveLocalData();
  if (typeof playAudioFeedback === 'function') playAudioFeedback('add');
  showToast('Sale Invoice Generated!', `Invoice ${invoiceNo} recorded successfully.`);

  // Prompt WhatsApp Receipt
  if (confirm(`Invoice ${invoiceNo} generated (Rs. ${totalAmount.toLocaleString()}). Send WhatsApp Receipt to ${farmerName}?`)) {
    sendWhatsAppReceipt(invoiceNo);
  }

  clearPosCart();
  if (typeof updateDashboard === 'function') updateDashboard();
}

// =========================================================================
// 6. SALES VIEW (HISTORY & RECEIPTS)
// =========================================================================
function renderSalesViewTable() {
  const tbody = document.getElementById('viewSalesTableBody');
  if (!tbody) return;

  const search = (document.getElementById('salesViewSearchInput')?.value || '').toLowerCase().trim();
  const dateFilter = document.getElementById('salesDateFilter')?.value || 'all';
  const typeFilter = document.getElementById('salesTypeFilter')?.value || 'all';

  const todayStr = new Date().toISOString().split('T')[0];
  const list = appData.sales.filter(s => {
    const matchSearch = !search || (s.farmerName || '').toLowerCase().includes(search) || (s.invoiceNo || '').toLowerCase().includes(search) || (s.items || '').toLowerCase().includes(search);
    let matchDate = true;
    if (dateFilter === 'today') matchDate = s.date === todayStr;
    const matchType = typeFilter === 'all' || s.paymentType === typeFilter;
    return matchSearch && matchDate && matchType;
  });

  let cashTotal = 0;
  let creditTotal = 0;
  appData.sales.forEach(s => {
    cashTotal += Number(s.cashPaid || 0);
    creditTotal += Number(s.creditDue || 0);
  });

  if (document.getElementById('salesStatCount')) document.getElementById('salesStatCount').innerText = appData.sales.length;
  if (document.getElementById('salesStatCashTotal')) document.getElementById('salesStatCashTotal').innerText = formatPKR(cashTotal);
  if (document.getElementById('salesStatCreditTotal')) document.getElementById('salesStatCreditTotal').innerText = formatPKR(creditTotal);

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-400 font-medium">No sales records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.slice().reverse().map(s => {
    const isCredit = Number(s.creditDue || 0) > 0;
    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-3 font-mono font-bold text-slate-900">${s.invoiceNo || 'INV-01'}</td>
        <td class="p-3 font-mono text-slate-500 text-[11px]">${s.date}</td>
        <td class="p-3 font-bold text-slate-800">${s.farmerName || 'Counter Sale'}</td>
        <td class="p-3 text-slate-600 max-w-[200px] truncate" title="${s.items}">${s.items || 'Agrochemicals'}</td>
        <td class="p-3 font-mono font-bold text-slate-900">${formatPKR(s.totalAmount || 0)}</td>
        <td class="p-3 font-mono text-emerald-700">${formatPKR(s.cashPaid || 0)}</td>
        <td class="p-3 font-mono font-bold ${isCredit ? 'text-amber-800' : 'text-slate-400'}">${formatPKR(s.creditDue || 0)}</td>
        <td class="p-3 text-right whitespace-nowrap space-x-1">
          <button onclick="sendWhatsAppReceipt('${s.invoiceNo}')" class="btn-press px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold inline-flex items-center gap-1">
            <i class="fa-brands fa-whatsapp"></i> Receipt
          </button>
          <button onclick="deleteSale('${s.id || s.invoiceNo || s.invoiceId}')" title="Delete Sale Invoice" class="btn-press p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded">
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// =========================================================================
// 7. EMPLOYEES VIEW
// =========================================================================
function renderEmployeesViewTable() {
  const tbody = document.getElementById('viewEmployeesTableBody');
  if (!tbody) return;

  const search = (document.getElementById('viewEmpSearch')?.value || '').toLowerCase().trim();
  const list = appData.employees.filter(e => {
    return !search || (e.name || '').toLowerCase().includes(search) || (e.role || '').toLowerCase().includes(search);
  });

  let payroll = 0;
  let advances = 0;
  appData.employees.forEach(e => {
    payroll += Number(e.salary || 0);
    advances += Number(e.advanceTaken || 0);
  });

  if (document.getElementById('viewEmpCount')) document.getElementById('viewEmpCount').innerText = appData.employees.length;
  if (document.getElementById('viewEmpActive')) document.getElementById('viewEmpActive').innerText = appData.employees.length;
  if (document.getElementById('viewEmpPayroll')) document.getElementById('viewEmpPayroll').innerText = formatPKR(payroll);
  if (document.getElementById('viewEmpAdvances')) document.getElementById('viewEmpAdvances').innerText = formatPKR(advances);

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400 font-medium">No staff registered. Click "+ Add Staff Member".</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(emp => {
    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-3 font-bold text-slate-900">${emp.name}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">${emp.role || 'Staff'}</span></td>
        <td class="p-3 font-mono text-slate-600">${emp.phone || 'N/A'}</td>
        <td class="p-3 font-mono font-bold text-emerald-800">${formatPKR(emp.salary || 0)}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Active Duty</span></td>
        <td class="p-3 font-mono text-amber-700">${formatPKR(emp.advanceTaken || 0)}</td>
        <td class="p-3 text-right whitespace-nowrap space-x-1">
          <button onclick="quickPayAdvance('${emp.id}')" class="btn-press px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold">Pay Advance</button>
          <button onclick="deleteEmployee('${emp.id}')" title="Delete Staff Profile" class="btn-press p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded">
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function submitNewEmployee(e) {
  if (e && e.preventDefault) e.preventDefault();
  const name = document.getElementById('newEmpName')?.value.trim();
  if (!name) return;

  const newEmp = {
    id: 'emp-' + Date.now(),
    name,
    role: document.getElementById('newEmpRole')?.value || 'Shop Staff',
    phone: document.getElementById('newEmpPhone')?.value.trim() || '',
    salary: Number(document.getElementById('newEmpSalary')?.value || 30000),
    advanceTaken: 0,
    joinDate: document.getElementById('newEmpJoinDate')?.value || new Date().toISOString().split('T')[0]
  };

  appData.employees.push(newEmp);
  saveLocalData('employees');
  closeModal('addEmployeeModal');
  document.getElementById('addEmployeeForm')?.reset();
  if (typeof playAudioFeedback === 'function') playAudioFeedback('add');
  showToast('Staff Member Added!', `${name} registered to shop staff.`);
  renderEmployeesViewTable();
}

function quickPayAdvance(empId) {
  const emp = appData.employees.find(e => String(e.id) === String(empId));
  if (!emp) return;
  const advance = prompt(`Enter advance salary (Rs.) to give to ${emp.name}:`, 5000);
  const amt = Number(advance);
  if (!amt || amt <= 0) return;

  emp.advanceTaken = Number(emp.advanceTaken || 0) + amt;

  appData.cashTransactions.push({
    id: 'ctx-' + Date.now(),
    date: new Date().toISOString().split('T')[0],
    flow: 'Cash Out',
    category: 'Staff Salary',
    amount: amt,
    memo: `Salary advance paid to ${emp.name}`
  });

  saveLocalData();
  showToast(`Paid Rs. ${amt.toLocaleString()} advance to ${emp.name}`);
  renderEmployeesViewTable();
}

// =========================================================================
// 8. EXPENSES VIEW
// =========================================================================
function renderExpensesViewTable() {
  const tbody = document.getElementById('viewExpensesTableBody');
  if (!tbody) return;

  const search = (document.getElementById('viewExpSearch')?.value || '').toLowerCase().trim();
  const catFilter = document.getElementById('viewExpCategoryFilter')?.value || 'all';

  const list = appData.expenses.filter(x => {
    const matchSearch = !search || (x.description || '').toLowerCase().includes(search) || (x.category || '').toLowerCase().includes(search);
    const matchCat = catFilter === 'all' || x.category === catFilter;
    return matchSearch && matchCat;
  });

  let totalExp = 0;
  let todayExp = 0;
  const todayStr = new Date().toISOString().split('T')[0];

  appData.expenses.forEach(x => {
    const amt = Number(x.amount || 0);
    totalExp += amt;
    if (x.date === todayStr) todayExp += amt;
  });

  if (document.getElementById('viewExpTotal')) document.getElementById('viewExpTotal').innerText = formatPKR(totalExp);
  if (document.getElementById('viewExpMonth')) document.getElementById('viewExpMonth').innerText = formatPKR(totalExp);
  if (document.getElementById('viewExpToday')) document.getElementById('viewExpToday').innerText = formatPKR(todayExp);

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400 font-medium">No shop overheads logged.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.slice().reverse().map(x => {
    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-3 font-mono text-slate-500 text-[11px]">${x.date}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700">${x.category}</span></td>
        <td class="p-3 font-medium text-slate-800">${x.description || 'Shop expense'}</td>
        <td class="p-3 font-mono font-bold text-red-700">${formatPKR(x.amount || 0)}</td>
        <td class="p-3 text-right">
          <button onclick="deleteExpense('${x.id}')" class="text-red-500 hover:text-red-700"><i class="fa-solid fa-trash-can"></i></button>
        </td>
      </tr>
    `;
  }).join('');
}

function deleteExpense(id) {
  const e = appData.expenses.find(x => String(x.id) === String(id));
  triggerProtectedDelete('expense', id, e ? `${e.category} (${formatPKR(e.amount || 0)})` : 'Expense');
}

// =========================================================================
// 9. RECEIVABLE & PAYABLE (LEDGERS VIEW)
// =========================================================================
function switchLedgerSubTab(tab) {
  const btnRec = document.getElementById('btnTabReceivable');
  const btnPay = document.getElementById('btnTabPayable');
  const contRec = document.getElementById('tabContentReceivable');
  const contPay = document.getElementById('tabContentPayable');

  if (tab === 'receivable') {
    btnRec?.classList.add('border-[#ea580c]', 'text-[#ea580c]');
    btnRec?.classList.remove('border-transparent', 'text-slate-500');
    btnPay?.classList.remove('border-[#ea580c]', 'text-[#ea580c]');
    btnPay?.classList.add('border-transparent', 'text-slate-500');
    contRec?.classList.remove('hidden');
    contPay?.classList.add('hidden');
    renderLedgerCustTable();
  } else {
    btnPay?.classList.add('border-[#ea580c]', 'text-[#ea580c]');
    btnPay?.classList.remove('border-transparent', 'text-slate-500');
    btnRec?.classList.remove('border-[#ea580c]', 'text-[#ea580c]');
    btnRec?.classList.add('border-transparent', 'text-slate-500');
    contPay?.classList.remove('hidden');
    contRec?.classList.add('hidden');
    renderLedgerSupTable();
  }
}

function renderLedgersView() {
  renderLedgerCustTable();
  renderLedgerSupTable();
}

function renderLedgerCustTable() {
  const tbody = document.getElementById('ledgerCustTableBody');
  if (!tbody) return;

  const search = (document.getElementById('ledgerCustSearch')?.value || '').toLowerCase().trim();
  const list = appData.farmers.filter(f => {
    return Number(f.balanceDue || 0) > 0 && (!search || (f.name || '').toLowerCase().includes(search) || (f.location || '').toLowerCase().includes(search));
  });

  let totalUdhaar = 0;
  appData.farmers.forEach(f => totalUdhaar += Number(f.balanceDue || 0));
  if (document.getElementById('ledgerCustTotalBadge')) document.getElementById('ledgerCustTotalBadge').innerText = formatPKR(totalUdhaar);

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400 font-medium">All farmer balances are cleared! No pending udhaar.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(f => {
    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-3 font-bold text-slate-900">${f.name}</td>
        <td class="p-3 text-slate-600">${f.location || 'Pull 88,000'}</td>
        <td class="p-3 font-mono text-slate-600">${f.phone || 'N/A'}</td>
        <td class="p-3 font-mono text-slate-700">${formatPKR(f.totalBill || 0)}</td>
        <td class="p-3 font-mono text-emerald-700">${formatPKR(f.paidAmount || 0)}</td>
        <td class="p-3 font-mono font-black text-amber-800">${formatPKR(f.balanceDue || 0)}</td>
        <td class="p-3 text-right whitespace-nowrap space-x-1">
          <button onclick="quickFarmerRecovery('${f.id}')" class="btn-press px-2.5 py-1 bg-[#14532d] hover:bg-[#0f4022] text-white rounded text-[11px] font-bold">Collect</button>
          <button onclick="deleteFarmer('${f.id}')" title="Delete Farmer Profile" class="btn-press p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded">
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderLedgerSupTable() {
  const tbody = document.getElementById('ledgerSupTableBody');
  if (!tbody) return;

  const search = (document.getElementById('ledgerSupSearch')?.value || '').toLowerCase().trim();
  const list = appData.suppliers.filter(s => {
    return Number(s.payableDue || 0) > 0 && (!search || (s.name || '').toLowerCase().includes(search));
  });

  let totalDues = 0;
  appData.suppliers.forEach(s => totalDues += Number(s.payableDue || 0));
  if (document.getElementById('ledgerSupTotalBadge')) document.getElementById('ledgerSupTotalBadge').innerText = formatPKR(totalDues);

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400 font-medium">All company supplier accounts cleared! No payable dues.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(s => {
    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-3 font-bold text-slate-900">${s.name}</td>
        <td class="p-3 text-slate-600">${s.contactPerson || 'N/A'} (${s.phone || ''})</td>
        <td class="p-3 font-mono text-teal-800">${formatPKR(s.totalPurchased || 0)}</td>
        <td class="p-3 font-mono text-emerald-700">${formatPKR(s.paidAmount || 0)}</td>
        <td class="p-3 font-mono font-black text-red-600">${formatPKR(s.payableDue || 0)}</td>
        <td class="p-3 text-right whitespace-nowrap space-x-1">
          <button onclick="quickPaySupplier('${s.id}')" class="btn-press px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-[11px] font-bold">Pay Due</button>
          <button onclick="deleteSupplier('${s.id}')" title="Delete Supplier Profile" class="btn-press p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded">
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// =========================================================================
// 10. RETURNS VIEW
// =========================================================================
function renderReturnsViewTable() {
  const tbody = document.getElementById('viewReturnsTableBody');
  if (!tbody) return;

  const search = (document.getElementById('viewReturnsSearch')?.value || '').toLowerCase().trim();
  const list = appData.returns.filter(r => {
    return !search || (r.partyName || '').toLowerCase().includes(search) || (r.product || '').toLowerCase().includes(search);
  });

  let custVal = 0;
  let supVal = 0;
  appData.returns.forEach(r => {
    const amt = Number(r.amount || 0);
    if (r.type === 'Customer Return') custVal += amt;
    else supVal += amt;
  });

  if (document.getElementById('retStatCount')) document.getElementById('retStatCount').innerText = appData.returns.length;
  if (document.getElementById('retStatSalesVal')) document.getElementById('retStatSalesVal').innerText = formatPKR(custVal);
  if (document.getElementById('retStatPurchVal')) document.getElementById('retStatPurchVal').innerText = formatPKR(supVal);

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-400 font-medium">No return incidents recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.slice().reverse().map(r => {
    const isCust = r.type === 'Customer Return';
    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-3 font-mono text-slate-500 text-[11px]">${r.date}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${isCust ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}">${r.type}</span></td>
        <td class="p-3 font-bold text-slate-800">${r.partyName}</td>
        <td class="p-3 font-semibold text-slate-700">${r.product}</td>
        <td class="p-3 font-mono font-bold">${r.qty} packs</td>
        <td class="p-3 font-mono font-bold text-slate-900">${formatPKR(r.amount || 0)}</td>
        <td class="p-3 text-slate-500 text-xs">${r.reason || 'Swapped'}</td>
        <td class="p-3 text-right">
          <button onclick="deleteReturn('${r.id}')" title="Delete Return Record" class="btn-press p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded">
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function submitReturn(e) {
  if (e && e.preventDefault) e.preventDefault();
  const type = document.getElementById('retType')?.value;
  const party = document.getElementById('retPartyName')?.value.trim();
  const prod = document.getElementById('retProduct')?.value.trim();
  const qty = Number(document.getElementById('retQty')?.value || 1);
  const amt = Number(document.getElementById('retAmount')?.value || 0);

  if (!party || !prod) return;

  const newRet = {
    id: 'ret-' + Date.now(),
    type,
    partyName: party,
    product: prod,
    qty,
    amount: amt,
    date: document.getElementById('retDate')?.value || new Date().toISOString().split('T')[0],
    reason: document.getElementById('retReason')?.value.trim() || 'Good condition'
  };

  appData.returns.push(newRet);
  saveLocalData('returns');
  closeModal('returnsModal');
  document.getElementById('returnsForm')?.reset();
  if (typeof playAudioFeedback === 'function') playAudioFeedback('add');
  showToast('Return Transaction Saved!', `${type} of ${qty} packs recorded.`);
  renderReturnsViewTable();
}

// =========================================================================
// 11. CASH FLOW VIEW
// =========================================================================
function renderCashFlowView() {
  const inTbody = document.getElementById('cashInTableBody');
  const outTbody = document.getElementById('cashOutTableBody');
  const filter = document.getElementById('cfDateFilter')?.value || 'all';
  const todayStr = new Date().toISOString().split('T')[0];

  let inList = [];
  let outList = [];

  // Cash In: Counter Sales cash, Farmer recoveries, and manual Cash In entries
  appData.sales.forEach(s => {
    if (Number(s.cashPaid || 0) > 0) {
      inList.push({
        date: s.date,
        source: s.farmerName || 'Counter Sale',
        ref: s.invoiceNo,
        amount: Number(s.cashPaid)
      });
    }
  });

  appData.cashTransactions.forEach(ctx => {
    if (ctx.flow === 'Cash In') {
      inList.push({
        date: ctx.date,
        source: ctx.category,
        ref: ctx.memo || 'Entry',
        amount: Number(ctx.amount)
      });
    } else {
      outList.push({
        date: ctx.date,
        dest: ctx.category,
        desc: ctx.memo || 'Expense',
        amount: Number(ctx.amount)
      });
    }
  });

  // Cash Out: Expenses
  appData.expenses.forEach(x => {
    outList.push({
      date: x.date,
      dest: x.category,
      desc: x.description,
      amount: Number(x.amount)
    });
  });

  // Filter if needed
  if (filter === 'today') {
    inList = inList.filter(x => x.date === todayStr);
    outList = outList.filter(x => x.date === todayStr);
  }

  let totalIn = 0;
  let totalOut = 0;
  inList.forEach(x => totalIn += x.amount);
  outList.forEach(x => totalOut += x.amount);
  const net = totalIn - totalOut;

  if (document.getElementById('cfCardHand')) document.getElementById('cfCardHand').innerText = formatPKR(net);
  if (document.getElementById('cfCardIn')) document.getElementById('cfCardIn').innerText = formatPKR(totalIn);
  if (document.getElementById('cfCardOut')) document.getElementById('cfCardOut').innerText = formatPKR(totalOut);
  if (document.getElementById('cfCardNet')) document.getElementById('cfCardNet').innerText = formatPKR(net);
  if (document.getElementById('cashInTotalDisplay')) document.getElementById('cashInTotalDisplay').innerText = formatPKR(totalIn);
  if (document.getElementById('cashOutTotalDisplay')) document.getElementById('cashOutTotalDisplay').innerText = formatPKR(totalOut);

  // Render Cash In table
  if (inTbody) {
    if (inList.length === 0) {
      inTbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">No cash collection records.</td></tr>`;
    } else {
      inTbody.innerHTML = inList.slice().reverse().map(x => `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100 text-xs">
          <td class="p-2 font-mono text-[11px] text-slate-500">${x.date}</td>
          <td class="p-2 font-bold text-slate-800">${x.source}</td>
          <td class="p-2 text-slate-500 text-[11px]">${x.ref}</td>
          <td class="p-2 text-right font-mono font-bold text-emerald-700">+ ${formatPKR(x.amount)}</td>
        </tr>
      `).join('');
    }
  }

  // Render Cash Out table
  if (outTbody) {
    if (outList.length === 0) {
      outTbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">No cash disbursement records.</td></tr>`;
    } else {
      outTbody.innerHTML = outList.slice().reverse().map(x => `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100 text-xs">
          <td class="p-2 font-mono text-[11px] text-slate-500">${x.date}</td>
          <td class="p-2 font-bold text-slate-800">${x.dest}</td>
          <td class="p-2 text-slate-500 text-[11px]">${x.desc}</td>
          <td class="p-2 text-right font-mono font-bold text-red-700">- ${formatPKR(x.amount)}</td>
        </tr>
      `).join('');
    }
  }
}

function submitCashTx(e) {
  if (e && e.preventDefault) e.preventDefault();
  const flow = document.getElementById('cashTxFlow')?.value || 'Cash In';
  const amt = Number(document.getElementById('cashTxAmount')?.value || 0);
  const cat = document.getElementById('cashTxCategory')?.value || 'General';
  const memo = document.getElementById('cashTxMemo')?.value.trim() || '';

  if (!amt || amt <= 0) return;

  const newTx = {
    id: 'ctx-' + Date.now(),
    date: document.getElementById('cashTxDate')?.value || new Date().toISOString().split('T')[0],
    flow,
    category: cat,
    amount: amt,
    memo
  };

  appData.cashTransactions.push(newTx);
  saveLocalData('cashTransactions');
  closeModal('cashTxModal');
  document.getElementById('cashTxForm')?.reset();
  showToast('Cash transaction recorded!');
  renderCashFlowView();
}

function exportCashFlowCSV() {
  const rows = [
    ['Date', 'Flow Type', 'Category / Source', 'Particulars', 'Amount (PKR)']
  ];
  appData.cashTransactions.forEach(c => {
    rows.push([c.date, c.flow, c.category, c.memo || '', c.amount]);
  });
  exportCSVFile(rows, 'Cash_Flow_Register');
}

// =========================================================================
// 12. BANK ACCOUNTS VIEW
// =========================================================================
function renderBanksView() {
  const container = document.getElementById('bankCardsContainer');
  const tbody = document.getElementById('bankTxTableBody');
  const select = document.getElementById('bankTxAccountSelect');

  let totalBal = 0;
  appData.banks.forEach(b => totalBal += Number(b.balance || 0));

  let totalDep = 0;
  let totalWith = 0;
  appData.bankTransactions.forEach(t => {
    if (t.type === 'Deposit') totalDep += Number(t.amount || 0);
    else totalWith += Number(t.amount || 0);
  });

  if (document.getElementById('bankStatTotalBalance')) document.getElementById('bankStatTotalBalance').innerText = formatPKR(totalBal);
  if (document.getElementById('bankStatActiveCount')) document.getElementById('bankStatActiveCount').innerText = appData.banks.length;
  if (document.getElementById('bankStatDeposits')) document.getElementById('bankStatDeposits').innerText = formatPKR(totalDep);
  if (document.getElementById('bankStatWithdrawals')) document.getElementById('bankStatWithdrawals').innerText = formatPKR(totalWith);

  // Render Bank Cards
  if (container) {
    if (appData.banks.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <i class="fa-solid fa-building-columns text-slate-300 text-2xl mb-2"></i>
          <p class="text-xs font-semibold text-slate-600">No bank accounts linked yet.</p>
          <p class="text-[11px] text-slate-400 mt-0.5">Click "+ Add Bank Account" above to register your shop account.</p>
        </div>
      `;
    } else {
      container.innerHTML = appData.banks.map(b => `
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase text-teal-800 px-1.5 py-0.5 bg-teal-50 rounded">Commercial Bank</span>
              <i class="fa-solid fa-building-columns text-slate-400 text-sm"></i>
            </div>
            <h4 class="font-bold text-sm text-slate-900 mt-2">${b.name}</h4>
            <p class="text-[10px] text-slate-500 font-mono mt-0.5">${b.accNo}</p>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span class="text-xs text-slate-500 font-medium">Balance:</span>
            <span class="font-black text-sm text-emerald-800 font-mono">${formatPKR(b.balance || 0)}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // Populate Select Dropdown
  if (select) {
    if (appData.banks.length === 0) {
      select.innerHTML = `<option value="">-- No Bank Accounts Added --</option>`;
    } else {
      select.innerHTML = appData.banks.map(b => `<option value="${b.id}">${b.name} (${b.accNo})</option>`).join('');
    }
  }

  // Render Bank Transactions Table
  if (tbody) {
    if (appData.bankTransactions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400 font-medium">No bank transactions logged yet.</td></tr>`;
    } else {
      tbody.innerHTML = appData.bankTransactions.slice().reverse().map(t => {
        const isDep = t.type === 'Deposit';
        return `
          <tr class="hover:bg-slate-50 transition border-b border-slate-100">
            <td class="p-3 font-mono text-slate-500 text-[11px]">${t.date}</td>
            <td class="p-3 font-bold text-slate-900">${t.bankName || 'Shop Bank'}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${isDep ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">${t.type}</span></td>
            <td class="p-3 font-mono text-slate-600">${t.ref || 'N/A'}</td>
            <td class="p-3 text-slate-700">${t.memo || ''}</td>
            <td class="p-3 text-right font-mono font-bold ${isDep ? 'text-emerald-700' : 'text-red-700'}">${isDep ? '+' : '-'} ${formatPKR(t.amount || 0)}</td>
          </tr>
        `;
      }).join('');
    }
  }
}

function submitNewBank(e) {
  if (e && e.preventDefault) e.preventDefault();
  const name = document.getElementById('newBankName')?.value;
  const title = document.getElementById('newBankTitle')?.value.trim();
  const accNo = document.getElementById('newBankAccNo')?.value.trim();
  const bal = Number(document.getElementById('newBankBalance')?.value || 0);

  if (!name || !accNo) return;

  const newBank = {
    id: 'bank-' + Date.now(),
    name,
    title,
    accNo,
    branch: document.getElementById('newBankBranch')?.value.trim() || 'Pull 88,000 Branch',
    balance: bal
  };

  appData.banks.push(newBank);
  saveLocalData('banks');
  closeModal('addBankModal');
  document.getElementById('addBankForm')?.reset();
  showToast('Bank account registered successfully!');
  renderBanksView();
}

function submitBankTx(e) {
  if (e && e.preventDefault) e.preventDefault();
  const bankId = document.getElementById('bankTxAccountSelect')?.value;
  const type = document.getElementById('bankTxType')?.value;
  const amt = Number(document.getElementById('bankTxAmount')?.value || 0);
  const ref = document.getElementById('bankTxRef')?.value.trim();
  const memo = document.getElementById('bankTxMemo')?.value.trim();

  const bank = appData.banks.find(b => String(b.id) === String(bankId));
  if (!bank || amt <= 0) return;

  if (type === 'Deposit') {
    bank.balance = Number(bank.balance || 0) + amt;
  } else {
    bank.balance = Math.max(0, Number(bank.balance || 0) - amt);
  }

  const tx = {
    id: 'btx-' + Date.now(),
    bankId,
    bankName: bank.name,
    type,
    amount: amt,
    ref: ref || 'CHQ',
    memo,
    date: document.getElementById('bankTxDate')?.value || new Date().toISOString().split('T')[0]
  };

  appData.bankTransactions.push(tx);
  saveLocalData();
  closeModal('bankTxModal');
  document.getElementById('bankTxForm')?.reset();
  showToast('Bank transaction recorded!');
  renderBanksView();
}

// =========================================================================
// 13. REPORTS VIEW (P&L & AUDIT STATEMENT)
// =========================================================================
function renderReportsView() {
  let totalSales = 0;
  appData.sales.forEach(s => totalSales += Number(s.totalAmount || 0));

  let totalPurch = 0;
  let totalPayables = 0;
  appData.suppliers.forEach(s => {
    totalPurch += Number(s.totalPurchased || 0);
    totalPayables += Number(s.payableDue || 0);
  });

  let totalExp = 0;
  appData.expenses.forEach(e => totalExp += Number(e.amount || 0));

  let totalUdhaar = 0;
  appData.farmers.forEach(f => totalUdhaar += Number(f.balanceDue || 0));

  let totalBank = 0;
  appData.banks.forEach(b => totalBank += Number(b.balance || 0));

  let cashIn = 0;
  let cashOut = 0;
  appData.sales.forEach(s => cashIn += Number(s.cashPaid || 0));
  appData.cashTransactions.forEach(c => {
    if (c.flow === 'Cash In') cashIn += Number(c.amount || 0);
    else cashOut += Number(c.amount || 0);
  });
  appData.expenses.forEach(e => cashOut += Number(e.amount || 0));

  const cogs = Math.round(totalSales * 0.78); // Estimated COGS for Agrochemical Retail
  const grossProfit = Math.max(0, totalSales - cogs);
  const netProfit = grossProfit - totalExp;

  if (document.getElementById('repSales')) document.getElementById('repSales').innerText = formatPKR(totalSales);
  if (document.getElementById('repPurchases')) document.getElementById('repPurchases').innerText = formatPKR(totalPurch);
  if (document.getElementById('repExpenses')) document.getElementById('repExpenses').innerText = formatPKR(totalExp);
  if (document.getElementById('repGrossProfit')) document.getElementById('repGrossProfit').innerText = formatPKR(grossProfit);
  if (document.getElementById('repNetProfit')) document.getElementById('repNetProfit').innerText = formatPKR(netProfit);
  if (document.getElementById('repCashIn')) document.getElementById('repCashIn').innerText = formatPKR(cashIn);
  if (document.getElementById('repCashOut')) document.getElementById('repCashOut').innerText = formatPKR(cashOut);
  if (document.getElementById('repReceivables')) document.getElementById('repReceivables').innerText = formatPKR(totalUdhaar);
  if (document.getElementById('repPayables')) document.getElementById('repPayables').innerText = formatPKR(totalPayables);
  if (document.getElementById('repBankBalance')) document.getElementById('repBankBalance').innerText = formatPKR(totalBank);

  // P&L
  if (document.getElementById('plRevenue')) document.getElementById('plRevenue').innerText = formatPKR(totalSales);
  if (document.getElementById('plCogs')) document.getElementById('plCogs').innerText = formatPKR(cogs);
  if (document.getElementById('plGross')) document.getElementById('plGross').innerText = formatPKR(grossProfit);
  if (document.getElementById('plOperating')) document.getElementById('plOperating').innerText = '- ' + formatPKR(totalExp);
  if (document.getElementById('plNet')) document.getElementById('plNet').innerText = formatPKR(netProfit);
}

// Window Global Attachments
window.navigateView = navigateView;
window.renderSuppliersViewTable = renderSuppliersViewTable;
window.submitNewSupplier = submitNewSupplier;
window.quickPaySupplier = quickPaySupplier;
window.calcProcurementViewTotals = calcProcurementViewTotals;
window.submitProcurementView = submitProcurementView;
window.renderPurchaseHistoryViewTable = renderPurchaseHistoryViewTable;
window.renderInventoryViewTable = renderInventoryViewTable;
window.quickAdjustStock = quickAdjustStock;
window.renderCustomersViewTable = renderCustomersViewTable;
window.submitNewFarmer = submitNewFarmer;
window.quickFarmerRecovery = quickFarmerRecovery;
window.initPOSView = initPOSView;
window.setPosCategoryFilter = setPosCategoryFilter;
window.renderPosProductCatalog = renderPosProductCatalog;
window.addToPosCart = addToPosCart;
window.updatePosCartQty = updatePosCartQty;
window.removeFromPosCart = removeFromPosCart;
window.clearPosCart = clearPosCart;
window.onPosCustomerChange = onPosCustomerChange;
window.calcPosTotals = calcPosTotals;
window.submitPosSale = submitPosSale;
window.renderSalesViewTable = renderSalesViewTable;
window.renderEmployeesViewTable = renderEmployeesViewTable;
window.submitNewEmployee = submitNewEmployee;
window.quickPayAdvance = quickPayAdvance;
window.renderExpensesViewTable = renderExpensesViewTable;
window.deleteExpense = deleteExpense;
window.switchLedgerSubTab = switchLedgerSubTab;
window.renderLedgersView = renderLedgersView;
window.renderLedgerCustTable = renderLedgerCustTable;
window.renderLedgerSupTable = renderLedgerSupTable;
window.renderReturnsViewTable = renderReturnsViewTable;
window.submitReturn = submitReturn;
window.renderCashFlowView = renderCashFlowView;
window.submitCashTx = submitCashTx;
window.exportCashFlowCSV = exportCashFlowCSV;
window.renderBanksView = renderBanksView;
window.submitNewBank = submitNewBank;
window.submitBankTx = submitBankTx;
window.renderReportsView = renderReportsView;
