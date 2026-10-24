document.addEventListener('DOMContentLoaded', () => {
  // Data State
  let items = [];
  let currentFilter = 'all';

  // DOM Elements
  const grid = document.getElementById('items-grid');
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const sortFilter = document.getElementById('sort-filter');
  const modal = document.getElementById('modal');
  const reportForm = document.getElementById('report-form');
  const dateInput = document.getElementById('form-date');

  // Set default date to today
  if (dateInput) {
    dateInput.valueAsDate = new Date();
  }

  // Update Summary Counters
  function renderStats() {
    const total = items.length;
    const looking = items.filter(i => i.status === 'Open').length;
    const returned = items.filter(i => i.status === 'Returned').length;

    const totalEl = document.getElementById('stat-total');
    const lookingEl = document.getElementById('stat-looking');
    const returnedEl = document.getElementById('stat-returned');

    if (totalEl) totalEl.innerText = total;
    if (lookingEl) lookingEl.innerText = looking;
    if (returnedEl) returnedEl.innerText = returned;
  }

  // Render Item Cards
  function renderItems() {
    if (!grid) return;

    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedCategory = categoryFilter ? categoryFilter.value : 'all';
    const sortOrder = sortFilter ? sortFilter.value : 'newest';

    let filtered = items.filter(item => {
      const matchesFilter = 
        currentFilter === 'all' ? true :
        currentFilter === 'lost' ? item.type === 'LOST ITEM' :
        currentFilter === 'found' ? item.type === 'FOUND ITEM' :
        currentFilter === 'returned' ? item.status === 'Returned' : true;

      const matchesSearch = item.title.toLowerCase().includes(searchQuery) || 
                            item.description.toLowerCase().includes(searchQuery) ||
                            item.location.toLowerCase().includes(searchQuery) ||
                            item.reporterName.toLowerCase().includes(searchQuery) ||
                            item.reporterEmail.toLowerCase().includes(searchQuery);

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      return matchesFilter && matchesSearch && matchesCategory;
    });

    if (sortOrder === 'oldest') {
      filtered = [...filtered].reverse();
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <div class="text-4xl">📋</div>
          <h3 class="font-bold text-slate-800 text-base">No reports found</h3>
          <p class="text-xs text-slate-500 max-w-sm mx-auto">There are currently no items matching your filter or search criteria. Click "+ Report an item" to submit a new report.</p>
          <button id="btn-empty-create" class="mt-2 inline-block bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
            + Create a report
          </button>
        </div>
      `;

      const emptyBtn = document.getElementById('btn-empty-create');
      if (emptyBtn) {
        emptyBtn.addEventListener('click', () => openModal('Lost item'));
      }

      renderStats();
      return;
    }

    grid.innerHTML = filtered.map(item => {
      const isLost = item.type === 'LOST ITEM';
      const cardBgClass = isLost ? 'card-lost-bg' : 'card-found-bg';
      const typeTagColor = isLost ? 'text-purple-900 bg-purple-100/80' : 'text-emerald-900 bg-emerald-100/80';
      const statusBadge = item.status === 'Returned' 
        ? `<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Returned</span>`
        : `<span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">Open</span>`;

      const actionButton = item.status === 'Returned'
        ? `<span class="text-teal-700 font-bold text-xs flex items-center gap-1">✓ Reunited</span>`
        : `<button data-id="${item.id}" class="btn-toggle-returned text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1 leading-tight text-right">Mark returned ↗</button>`;

      const iconElement = isLost 
        ? `<i class="fa-solid fa-box-open text-4xl text-purple-400"></i>` 
        : `<i class="fa-solid fa-hand-holding text-4xl text-emerald-400"></i>`;

      return `
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            <div class="${cardBgClass} relative flex items-center justify-center min-h-[110px]">
              <span class="absolute top-3 left-3 text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded ${typeTagColor}">
                ${item.type}
              </span>
              ${iconElement}
            </div>
            <div class="p-5 space-y-3">
              <div class="flex items-start justify-between gap-2">
                <h3 class="font-bold text-slate-900 text-base">${item.title}</h3>
                ${statusBadge}
              </div>
              <p class="text-xs text-slate-600 leading-relaxed">${item.description}</p>
              <div class="space-y-1 text-xs text-slate-500 font-medium">
                <div class="flex items-center gap-1.5">
                  <span class="text-red-500">📍</span> ${item.location}
                </div>
                <div class="flex items-center gap-1.5">
                  <span>📅</span> ${item.date} · <span class="text-slate-400">${item.category}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <div class="flex flex-col">
              <span class="font-bold text-slate-700 text-[11px]">👤 ${item.reporterName}</span>
              <span class="text-[10px] text-slate-400">✉️ ${item.reporterEmail}</span>
            </div>
            ${actionButton}
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners to Mark Returned buttons
    document.querySelectorAll('.btn-toggle-returned').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        toggleReturned(id);
      });
    });

    renderStats();
  }

  // Set Quick Pill Filter
  function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.pill-btn').forEach(btn => {
      btn.className = 'pill-btn font-semibold px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200';
    });
    const activeBtn = document.getElementById(`pill-${filter}`);
    if (activeBtn) {
      activeBtn.className = 'pill-btn font-semibold px-4 py-1.5 rounded-full bg-slate-900 text-white';
    }
    renderItems();
  }

  // Toggle Item Status
  function toggleReturned(id) {
    const item = items.find(i => i.id === id);
    if (item) {
      item.status = item.status === 'Returned' ? 'Open' : 'Returned';
      renderItems();
    }
  }

  // Modal Handlers
  function openModal(type = 'Lost item') {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const typeSelect = document.getElementById('form-type');
    if (typeSelect) typeSelect.value = type;
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    if (reportForm) reportForm.reset();
    if (dateInput) dateInput.valueAsDate = new Date();
  }

  // Bind Click Events safely
  const navBtn = document.getElementById('btn-report-nav');
  const heroLostBtn = document.getElementById('btn-hero-lost');
  const heroFoundBtn = document.getElementById('btn-hero-found');
  const createReportBtn = document.getElementById('btn-create-report');
  const closeModalBtn = document.getElementById('btn-close-modal');
  const cancelModalBtn = document.getElementById('btn-cancel-modal');
  const filterPills = document.getElementById('filter-pills');

  if (navBtn) navBtn.addEventListener('click', () => openModal('Lost item'));
  if (heroLostBtn) heroLostBtn.addEventListener('click', () => openModal('Lost item'));
  if (heroFoundBtn) heroFoundBtn.addEventListener('click', () => openModal('Found item'));
  if (createReportBtn) createReportBtn.addEventListener('click', () => openModal('Lost item'));
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

  if (filterPills) {
    filterPills.addEventListener('click', (e) => {
      if (e.target.dataset.filter) {
        setFilter(e.target.dataset.filter);
      }
    });
  }

  if (reportForm) {
    reportForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const rawType = document.getElementById('form-type').value;
      const formattedType = rawType.toUpperCase();
      const rawDate = document.getElementById('form-date').value;
      const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today';

      const newItem = {
        id: Date.now(),
        type: formattedType,
        title: document.getElementById('form-title').value,
        status: 'Open',
        description: document.getElementById('form-description').value,
        location: document.getElementById('form-location').value,
        date: formattedDate,
        category: document.getElementById('form-category').value,
        reporterName: document.getElementById('form-name').value,
        reporterEmail: document.getElementById('form-email').value
      };
      
      items.unshift(newItem);
      closeModal();
      renderItems();
    });
  }

  if (searchInput) searchInput.addEventListener('input', renderItems);
  if (categoryFilter) categoryFilter.addEventListener('change', renderItems);
  if (sortFilter) sortFilter.addEventListener('change', renderItems);

  // Initial Render
  renderItems();
});