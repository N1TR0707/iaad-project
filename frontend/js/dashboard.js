// User Dashboard Functions

// Load user activations
async function loadActivations() {
  const loadingSection = document.getElementById('loadingSection');
  const emptyState = document.getElementById('emptyState');
  const activationsList = document.getElementById('activationsList');

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/activation/my-activations', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to load activations');
    }

    const data = await response.json();

    // Hide loading
    if (loadingSection) loadingSection.classList.add('hidden');

    if (data.activations.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      if (activationsList) activationsList.classList.add('hidden');
      updateStats(0, 0, 0);
    } else {
      if (emptyState) emptyState.classList.add('hidden');
      if (activationsList) activationsList.classList.remove('hidden');
      displayActivations(data.activations);
      updateStats(data.activations);
    }
  } catch (error) {
    console.error('Error loading activations:', error);
    if (loadingSection) {
      loadingSection.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--danger);">
          <p>❌ Gagal memuat data. Silakan refresh halaman.</p>
        </div>
      `;
    }
  }
}

// Display activations in table
function displayActivations(activations) {
  const tbody = document.getElementById('activationsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  activations.forEach(activation => {
    const row = document.createElement('tr');
    
    const statusBadge = activation.is_expired
      ? '<span class="badge badge-danger">EXPIRED</span>'
      : activation.days_remaining <= 7
      ? '<span class="badge badge-danger">Segera Berakhir</span>'
      : activation.days_remaining <= 30
      ? '<span class="badge badge-warning">⚠️ Perhatian</span>'
      : '<span class="badge badge-success">✅ AKTIF</span>';

    row.innerHTML = `
      <td>
        <strong>${activation.product_nama}</strong><br>
        <small style="color: var(--gray);">${activation.kategori || ''}</small>
      </td>
      <td style="font-family: 'Courier New', monospace; font-weight: bold;">
        ${activation.serial_code}
      </td>
      <td>${formatDateShort(activation.activated_at)}</td>
      <td>
        ${formatDateShort(activation.warranty_expired_at)}
        ${!activation.is_expired ? `<br><small style="color: var(--gray);">${activation.days_remaining} hari lagi</small>` : ''}
      </td>
      <td>${statusBadge}</td>
    `;
    tbody.appendChild(row);
  });
}

// Update statistics
function updateStats(activations) {
  if (Array.isArray(activations)) {
    const active = activations.filter(a => !a.is_expired).length;
    const expired = activations.filter(a => a.is_expired).length;
    const total = activations.length;

    const activeCountEl = document.getElementById('activeCount');
    const expiredCountEl = document.getElementById('expiredCount');
    const totalCountEl = document.getElementById('totalCount');

    if (activeCountEl) activeCountEl.textContent = active;
    if (expiredCountEl) expiredCountEl.textContent = expired;
    if (totalCountEl) totalCountEl.textContent = total;
  } else {
    // If passed as individual values
    const activeCountEl = document.getElementById('activeCount');
    const expiredCountEl = document.getElementById('expiredCount');
    const totalCountEl = document.getElementById('totalCount');

    if (activeCountEl) activeCountEl.textContent = arguments[0] || 0;
    if (expiredCountEl) expiredCountEl.textContent = arguments[1] || 0;
    if (totalCountEl) totalCountEl.textContent = arguments[2] || 0;
  }
}

// Get user profile
async function getUserProfile() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error getting profile:', error);
    return null;
  }
}

// Refresh activation data
function refreshActivations() {
  loadActivations();
}

// Filter activations by status
function filterActivations(status) {
  const rows = document.querySelectorAll('#activationsTableBody tr');
  
  rows.forEach(row => {
    const statusCell = row.querySelector('td:last-child');
    if (!statusCell) return;

    if (status === 'all') {
      row.style.display = '';
    } else if (status === 'active') {
      row.style.display = statusCell.textContent.includes('AKTIF') ? '' : 'none';
    } else if (status === 'expired') {
      row.style.display = statusCell.textContent.includes('EXPIRED') ? '' : 'none';
    }
  });
}

// Search activations
function searchActivations(searchTerm) {
  const rows = document.querySelectorAll('#activationsTableBody tr');
  const term = searchTerm.toLowerCase();

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
}
