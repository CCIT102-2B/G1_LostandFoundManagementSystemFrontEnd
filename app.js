document.addEventListener('DOMContentLoaded', () => {
  // ---------------------------------------------------------------
  // PROTOTYPE LOGIN (frontend only, NOT secure). Replace with real
  // authentication from your ASP.NET API before publishing.
  // ---------------------------------------------------------------
  const SESSION_KEY = 'faithFindItStudentEmail';
  const ALLOWED_DOMAIN = '@firstasia.edu.ph';

  const loginScreen = document.getElementById('login-screen');
  const loginForm = document.getElementById('login-form');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const signedInUser = document.getElementById('signed-in-user');
  const logoutButton = document.getElementById('btn-logout');

  const modal = document.getElementById('modal');
  const reportForm = document.getElementById('report-form');
  const dateInput = document.getElementById('form-date');
  const reporterEmailInput = document.getElementById('form-email');
  const chartsEl = document.getElementById('missing-charts');
  const totalEl = document.getElementById('missing-total');

  // ---------------------------------------------------------------
  // DATA (in memory, resets on refresh). Students never see details,
  // so the charts are built only from item name + quantity.
  // ---------------------------------------------------------------
  let items = [

  ];

  const COLORS = ['#2563eb', '#2da179', '#f59e0b', '#a855f7', '#ef4444', '#0ea5e9', '#14b8a6', '#ec4899'];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function currentStudentEmail() {
    return (sessionStorage.getItem(SESSION_KEY) || '').trim().toLowerCase();
  }

  // ---------------------------------------------------------------
  // DONUT CHARTS: group missing (lost + still open) items by name
  // and add up the quantities.
  // ---------------------------------------------------------------
  function getMissingSummary() {
    const groups = new Map();
    items
      .filter(item => item.type === 'LOST ITEM' && item.status === 'Open')
      .forEach(item => {
        const key = String(item.title).trim().toLowerCase();
        if (!key) return;
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        if (groups.has(key)) {
          groups.get(key).quantity += qty;
        } else {
          groups.set(key, { name: String(item.title).trim(), quantity: qty });
        }
      });
    return [...groups.values()].sort((a, b) => b.quantity - a.quantity);
  }

  function renderMissingCharts() {
    if (!chartsEl) return;

    // Charts are only drawn for a signed-in student.
    if (!currentStudentEmail()) {
      chartsEl.innerHTML = '';
      if (totalEl) totalEl.textContent = '0 missing';
      return;
    }

    const summary = getMissingSummary();
    const total = summary.reduce((sum, entry) => sum + entry.quantity, 0);
    if (totalEl) totalEl.textContent = `${total} missing item${total === 1 ? '' : 's'}`;

    if (summary.length === 0) {
      chartsEl.innerHTML = '<div class="chart-empty">No missing items right now. 🎉</div>';
      return;
    }

    chartsEl.innerHTML = summary.map((entry, index) => {
      const color = COLORS[index % COLORS.length];
      const percent = Math.round((entry.quantity / total) * 100);
      return `
        <div class="missing-chart-card">
          <div class="donut" style="background: conic-gradient(${color} 0 ${percent}%, #e8edf3 ${percent}% 100%);"
               role="img" aria-label="${escapeHtml(entry.name)}: ${entry.quantity} missing">
            <div class="donut-center">
              <strong>${entry.quantity}</strong>
              <span>missing</span>
            </div>
          </div>
          <h4>${escapeHtml(entry.name)}</h4>
          <p class="chart-count">${entry.quantity} of ${total} total (${percent}%)</p>
        </div>
      `;
    }).join('');
  }

  // ---------------------------------------------------------------
  // LOGIN / LOGOUT
  // ---------------------------------------------------------------
  function syncReporterEmail() {
    if (!reporterEmailInput) return;
    const email = currentStudentEmail();
    reporterEmailInput.value = email;
    reporterEmailInput.readOnly = !!email;
  }

  function showSignedIn(email) {
    if (loginScreen) loginScreen.classList.add('is-hidden');
    if (signedInUser) signedInUser.textContent = email || '';
    syncReporterEmail();
    renderMissingCharts();
  }

  function showLoggedOut() {
    sessionStorage.removeItem(SESSION_KEY);
    if (loginForm) loginForm.reset();
    if (loginError) loginError.textContent = '';
    if (loginScreen) loginScreen.classList.remove('is-hidden');
    if (signedInUser) signedInUser.textContent = '';
    if (reporterEmailInput) { reporterEmailInput.value = ''; reporterEmailInput.readOnly = false; }
    closeModal();
    renderMissingCharts();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = (loginEmail.value || '').trim().toLowerCase();
      const password = loginPassword.value || '';

      if (!email.endsWith(ALLOWED_DOMAIN)) {
        loginError.textContent = `Please use your FAITH Colleges school email (${ALLOWED_DOMAIN}).`;
        return;
      }
      if (password.length < 4) {
        loginError.textContent = 'Enter a password with at least 4 characters.';
        return;
      }
      loginError.textContent = '';
      sessionStorage.setItem(SESSION_KEY, email);
      showSignedIn(email);
    });
  }

  if (logoutButton) logoutButton.addEventListener('click', showLoggedOut);

  // ---------------------------------------------------------------
  // REPORT MODAL
  // ---------------------------------------------------------------
  if (dateInput) dateInput.valueAsDate = new Date();

  function openModal(type = 'Lost item') {
    if (!modal || !currentStudentEmail()) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const typeSelect = document.getElementById('form-type');
    if (typeSelect) typeSelect.value = type;
    syncReporterEmail();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    if (reportForm) reportForm.reset();
    if (dateInput) dateInput.valueAsDate = new Date();
    syncReporterEmail();
  }

  const bind = (id, type) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => openModal(type));
  };
  bind('btn-report-nav', 'Lost item');
  bind('btn-hero-lost', 'Lost item');
  bind('btn-hero-found', 'Found item');
  bind('btn-create-report', 'Lost item');

  const closeModalBtn = document.getElementById('btn-close-modal');
  const cancelModalBtn = document.getElementById('btn-cancel-modal');
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

  if (reportForm) {
    reportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const rawDate = document.getElementById('form-date').value;
      const formattedDate = rawDate
        ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Today';

      items.unshift({
        id: Date.now(),
        type: document.getElementById('form-type').value.toUpperCase(),
        status: 'Open',
        title: document.getElementById('form-title').value.trim(),
        description: document.getElementById('form-description').value,
        location: document.getElementById('form-location').value,
        date: formattedDate,
        category: document.getElementById('form-category').value,
        reporterName: document.getElementById('form-name').value,
        reporterEmail: currentStudentEmail()
      });

      closeModal();
      renderMissingCharts();
    });
  }

  // ---------------------------------------------------------------
  // START: restore session if the student is already signed in
  // ---------------------------------------------------------------
  const savedEmail = currentStudentEmail();
  if (savedEmail) showSignedIn(savedEmail);
  renderMissingCharts();
});


