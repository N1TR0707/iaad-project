// Admin Panel Functions

// Load dashboard statistics
async function loadDashboardStats() {
  const loadingSection = document.getElementById('loadingSection');
  const statsSection = document.getElementById('statsSection');

  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to load stats');
    }

    const data = await response.json();

    // Hide loading, show stats
    if (loadingSection) loadingSection.classList.add('hidden');
    if (statsSection) statsSection.classList.remove('hidden');

    // Update stats
    updateAdminStats(data);

    // Load recent activations
    loadRecentActivations();
  } catch (error) {
    console.error('Error loading stats:', error);
    if (loadingSection) {
      loadingSection.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--danger);">
          <p>❌ Gagal memuat statistik. Silakan refresh halaman.</p>
        </div>
      `;
    }
  }
}

// Update admin statistics display
function updateAdminStats(data) {
  // Activation stats
  const totalActivationsEl = document.getElementById('totalActivations');
  const activeWarrantiesEl = document.getElementById('activeWarranties');
  const expiredWarrantiesEl = document.getElementById('expiredWarranties');
  
  if (totalActivationsEl) totalActivationsEl.textContent = data.activations.total;
  if (activeWarrantiesEl) activeWarrantiesEl.textContent = data.activations.active;
  if (expiredWarrantiesEl) expiredWarrantiesEl.textContent = data.activations.expired;

  // Serial stats
  const totalSerialsEl = document.getElementById('totalSerials');
  const availableSerialsEl = document.getElementById('availableSerials');
  const usedSerialsEl = document.getElementById('usedSerials');
  
  if (totalSerialsEl) totalSerialsEl.textContent = data.serials.total;
  if (availableSerialsEl) availableSerialsEl.textContent = data.serials.available;
  if (usedSerialsEl) usedSerialsEl.textContent = data.serials.used;

  // Other stats
  const totalUsersEl = document.getElementById('totalUsers');
  const totalProductsEl = document.getElementById('totalProducts');
  
  if (totalUsersEl) totalUsersEl.textContent = data.users;
  if (totalProductsEl) totalProductsEl.textContent = data.products;

  // Monthly stats
  if (data.monthly_activations) {
    displayMonthlyStats(data.monthly_activations);
  }
}

// Display monthly statistics
function displayMonthlyStats(monthlyData) {
  const tbody = document.getElementById('monthlyStatsBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (monthlyData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: var(--gray);">Belum ada data</td></tr>';
    return;
  }

  monthlyData.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatMonth(item.month)}</td>
      <td><strong>${item.count}</strong></td>
    `;
    tbody.appendChild(row);
  });
}

// Format month string (YYYY-MM to readable format)
function formatMonth(monthString) {
  const [year, month] = monthString.split('-');
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

// Load recent activations
async function loadRecentActivations() {
  const container = document.getElementById('recentActivations');
  if (!container) return;

  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/activations?limit=10', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to load activations');
    }

    const data = await response.json();

    if (data.activations.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 2rem;">Belum ada aktivasi</p>';
      return;
    }

    let html = '<div class="table-container"><table><thead><tr><th>User</th><th>Produk</th><th>Serial</th><th>Tanggal</th><th>Status</th></tr></thead><tbody>';

    data.activations.forEach(a => {
      const statusBadge = a.is_expired
        ? '<span class="badge badge-danger">Expired</span>'
        : '<span class="badge badge-success">Aktif</span>';

      html += `
        <tr>
          <td>${a.user_nama}<br><small style="color: var(--gray);">${a.email}</small></td>
          <td>${a.product_nama}</td>
          <td style="font-family: 'Courier New', monospace;">${a.serial_code}</td>
          <td>${formatDateShort(a.activated_at)}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading recent activations:', error);
    container.innerHTML = '<p style="text-align: center; color: var(--danger); padding: 2rem;">Gagal memuat data</p>';
  }
}

// Load products for dropdown
async function loadProducts() {
  const select = document.getElementById('productId');
  if (!select) return;

  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to load products');
    }

    const data = await response.json();

    select.innerHTML = '<option value="">-- Pilih Produk --</option>';
    
    data.products.forEach(product => {
      const option = document.createElement('option');
      option.value = product.id;
      option.textContent = `${product.nama} (${product.kategori}) - Garansi ${product.durasi_garansi_bulan} bulan`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading products:', error);
    select.innerHTML = '<option value="">Gagal memuat produk</option>';
  }
}

// Load all activations for admin
async function loadAllActivations() {
  const loadingSection = document.getElementById('loadingSection');
  const tableSection = document.getElementById('tableSection');
  const emptyState = document.getElementById('emptyState');

  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/activations?limit=100', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to load activations');
    }

    const data = await response.json();

    if (loadingSection) loadingSection.classList.add('hidden');

    if (data.activations.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      if (tableSection) tableSection.classList.add('hidden');
    } else {
      if (emptyState) emptyState.classList.add('hidden');
      if (tableSection) tableSection.classList.remove('hidden');
      displayAdminActivations(data.activations);
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

// Display admin activations table
function displayAdminActivations(activations) {
  const tbody = document.getElementById('activationsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  activations.forEach(activation => {
    const row = document.createElement('tr');
    
    const statusBadge = activation.is_expired
      ? '<span class="badge badge-danger">EXPIRED</span>'
      : '<span class="badge badge-success">AKTIF</span>';

    row.innerHTML = `
      <td>${activation.id}</td>
      <td>${activation.user_nama}</td>
      <td>${activation.email}</td>
      <td>${activation.product_nama}</td>
      <td style="font-family: 'Courier New', monospace;">${activation.serial_code}</td>
      <td>${formatDateShort(activation.activated_at)}</td>
      <td>${formatDateShort(activation.warranty_expired_at)}</td>
      <td>${statusBadge}</td>
    `;
    tbody.appendChild(row);
  });
}

// Export activations to CSV
function exportActivationsCSV() {
  const token = localStorage.getItem('adminToken');
  // Create download link
  const link = document.createElement('a');
  link.href = `/api/admin/activations/export`;
  link.download = `activations-${Date.now()}.csv`;
  
  // Add auth header via fetch and download
  fetch(link.href, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(response => response.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activations-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  })
  .catch(error => {
    console.error('Export error:', error);
    alert('Gagal export data');
  });
}

// Get admin info
function getAdminInfo() {
  const admin = localStorage.getItem('admin');
  return admin ? JSON.parse(admin) : null;
}
