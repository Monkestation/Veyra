// Global variables
let currentUser = null;
let currentPage = 'dashboard';
let currentSearch = '';
let charts = {};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in. //! this is likely an issue but eh it uses JWT tokens so you can't do shit
    const token = localStorage.getItem('authToken');
    if (token) {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        showDashboard();
        loadDashboardData();
    }

    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (page) switchPage(page);
        });
    });

    // Password change form
    document.getElementById('change-password-form').addEventListener('submit', handlePasswordChange);

    // Search functionality
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchVerifications();
        }
    });

    // Modal close on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const credentials = Object.fromEntries(formData);

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            currentUser = data.user;
            showDashboard();
            loadDashboardData();
        } else {
            showAlert('login-alert', data.error, 'error');
        }
    } catch (error) {
        showAlert('login-alert', 'Connection error', 'error');
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    currentUser = null;
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('dashboard-container').classList.add('hidden');

    // Clear forms
    document.getElementById('login-form').reset();
    clearAllAlerts();
}

async function handlePasswordChange(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        showAlert('settings-alert', 'New passwords do not match', 'error');
        return;
    }

    try {
        const response = await apiCall('/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('settings-alert', 'Password changed successfully!', 'success');
            document.getElementById('change-password-form').reset();
        } else {
            showAlert('settings-alert', data.error, 'error');
        }
    } catch (error) {
        showAlert('settings-alert', 'Connection error', 'error');
    }
}

// API helper function
async function apiCall(url, options = {}) {
    const token = localStorage.getItem('authToken');
    return fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
}

// UI functions
function showDashboard() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('dashboard-container').classList.remove('hidden');

    // Update user info
    document.getElementById('user-display-name').textContent = currentUser.username;
    document.getElementById('user-role').textContent = currentUser.role === 'admin' ? 'Administrator' : 'User';
    document.getElementById('user-avatar').textContent = currentUser.username.charAt(0).toUpperCase();

    // Show/hide admin sections
    if (currentUser.role !== 'admin') {
        document.getElementById('users-nav').style.display = 'none';
        document.getElementById('activity-nav').style.display = 'none';
    }
}

function switchPage(page) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });

    // Update page views
    document.querySelectorAll('.page-view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`${page}-page`).classList.add('active');

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        verifications: 'Verifications',
        users: 'User Management',
        activity: 'Activity Log',
        settings: 'Settings'
    };
    document.getElementById('page-title').textContent = titles[page];

    currentPage = page;

    // Load page data
    switch (page) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'verifications':
            loadVerifications();
            break;
        case 'users':
            if (currentUser.role === 'admin') loadUsers();
            break;
        case 'activity':
            if (currentUser.role === 'admin') loadActivity();
            break;
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');

    sidebar.classList.toggle('closed');
    mainContent.classList.toggle('sidebar-closed');
}

function toggleUserMenu() {
    // Simple user menu toggle - could expand this
    logout();
}

// Alert functions
function showAlert(containerId, message, type) {
    const container = document.getElementById(containerId);
    const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
    container.innerHTML = `
        <div class="alert ${type}">
            <i class="${icon}"></i>
            ${message}
        </div>
    `;
    setTimeout(() => container.innerHTML = '', 5000);
}

function clearAllAlerts() {
    document.querySelectorAll('[id$="-alert"]').forEach(el => {
        el.innerHTML = '';
    });
}

// Dashboard data loading
async function loadDashboardData() {
    try {
        const response = await apiCall('/api/analytics');
        const data = await response.json();

        if (response.ok) {
            // Update stats
            document.getElementById('total-verifications').textContent = data.total_verifications;
            document.getElementById('recent-verifications').textContent = data.recent_verifications;
            document.getElementById('weekly-verifications').textContent = data.weekly_verifications;
            document.getElementById('total-users').textContent = data.total_users;

            // Update charts
            updateMethodsChart(data.verification_methods);
            updateDailyChart(data.daily_verifications);
        }
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

// Chart functions
function updateMethodsChart(methods) {
    const ctx = document.getElementById('methods-chart').getContext('2d');

    if (charts.methods) {
        charts.methods.destroy();
    }

    const labels = methods.map(m => m.verification_method);
    const data = methods.map(m => m.count);
    const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

    charts.methods = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e5e7eb',
                        usePointStyle: true,
                        padding: 20
                    }
                }
            }
        }
    });
}

function updateDailyChart(dailyData) {
    const ctx = document.getElementById('daily-chart').getContext('2d');

    if (charts.daily) {
        charts.daily.destroy();
    }

    const labels = dailyData.map(d => new Date(d.date).toLocaleDateString());
    const data = dailyData.map(d => d.count);

    charts.daily = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Verifications',
                data: data,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#e5e7eb'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#9ca3af'
                    },
                    grid: {
                        color: '#374151'
                    }
                },
                y: {
                    ticks: {
                        color: '#9ca3af'
                    },
                    grid: {
                        color: '#374151'
                    }
                }
            }
        }
    });
}

// Verification functions
async function loadVerifications() {
    try {
        const response = await apiCall(`/api/v1/verify?page=1&limit=50&search=${currentSearch}`);
        const data = await response.json();

        if (response.ok) {
            renderVerifications(data.verifications);
        } else {
            showAlert('verifications-alert', data.error, 'error');
        }
    } catch (error) {
        showAlert('verifications-alert', 'Failed to load verifications', 'error');
    }
}

function renderVerifications(verifications) {
    const tbody = document.getElementById('verifications-table');

    if (verifications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <i class="fas fa-inbox"></i><br>No verifications found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = verifications.map(v => `
        <tr>
            <td>${v.discord_id}</td>
            <td>${v.ckey}</td>
            <td><code style="font-size: 0.8rem;">${JSON.stringify(v.verified_flags)}</code></td>
            <td><span class="badge primary">${v.verification_method}</span></td>
            <td>${v.verified_by || 'N/A'}</td>
            <td>${new Date(v.created_at).toLocaleString()}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editVerification('${v.discord_id}')">
                    <i class="fas fa-edit"></i>
                </button>
                ${currentUser.role === 'admin' ? `
                    <button class="btn btn-sm btn-danger" onclick="deleteVerification('${v.discord_id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function searchVerifications() {
    currentSearch = document.getElementById('search-input').value;
    loadVerifications();
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    currentSearch = '';
    loadVerifications();
}

async function deleteVerification(discordId) {
    if (!confirm(`Are you sure you want to delete verification for Discord ID: ${discordId}?`)) {
        return;
    }

    try {
        const response = await apiCall(`/api/v1/verify/${discordId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showAlert('verifications-alert', 'Verification deleted successfully!', 'success');
            loadVerifications();
            if (currentPage === 'dashboard') loadDashboardData();
        } else {
            const data = await response.json();
            showAlert('verifications-alert', data.error, 'error');
        }
    } catch (error) {
        showAlert('verifications-alert', 'Failed to delete verification', 'error');
    }
}

function editVerification(discordId) {
    // Find the verification data from the table
    const rows = document.querySelectorAll('#verifications-table tr');
    for (let row of rows) {
        if (row.cells[0]?.textContent === discordId) {
            document.getElementById('add-discord-id').value = row.cells[0].textContent;
            document.getElementById('add-ckey').value = row.cells[1].textContent;
            document.getElementById('add-flags').value = row.cells[2].textContent.replace('<code style="font-size: 0.8rem;">', '').replace('</code>', '');

            const methodBadge = row.cells[3].querySelector('.badge');
            if (methodBadge) {
                document.getElementById('add-method').value = methodBadge.textContent;
            }

            openModal('add-verification-modal');
            showAlert('add-verification-alert', `Editing verification for ${discordId}. Update and submit to save changes.`, 'success');
            break;
        }
    }
}

// User management functions
async function loadUsers() {
    try {
        const response = await apiCall('/api/users');
        const data = await response.json();

        if (response.ok) {
            renderUsers(data.users);
        } else {
            showAlert('users-alert', data.error, 'error');
        }
    } catch (error) {
        showAlert('users-alert', 'Failed to load users', 'error');
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('users-table');

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div class="user-avatar" style="width: 24px; height: 24px; font-size: 0.75rem;">
                        ${user.username.charAt(0).toUpperCase()}
                    </div>
                    ${user.username}
                </div>
            </td>
            <td>
                <span class="badge ${user.role === 'admin' ? 'warning' : 'primary'}">${user.role}</span>
            </td>
            <td>${new Date(user.created_at).toLocaleString()}</td>
            <td>
                ${user.id !== currentUser.id ? `
                    <select onchange="updateUserRole(${user.id}, this.value)" style="padding: 0.25rem; font-size: 0.75rem;">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id}, '${user.username}')" style="margin-left: 0.5rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : '<span class="badge success">Current User</span>'}
            </td>
        </tr>
    `).join('');
}

async function updateUserRole(userId, newRole) {
    try {
        const response = await apiCall(`/api/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({ role: newRole })
        });

        if (response.ok) {
            showAlert('users-alert', 'User role updated successfully!', 'success');
            loadUsers();
        } else {
            const data = await response.json();
            showAlert('users-alert', data.error, 'error');
            loadUsers(); // Reload to reset the select
        }
    } catch (error) {
        showAlert('users-alert', 'Failed to update user role', 'error');
        loadUsers();
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`Are you sure you want to delete user: ${username}?`)) {
        return;
    }

    try {
        const response = await apiCall(`/api/users/${userId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showAlert('users-alert', 'User deleted successfully!', 'success');
            loadUsers();
            if (currentPage === 'dashboard') loadDashboardData();
        } else {
            const data = await response.json();
            showAlert('users-alert', data.error, 'error');
        }
    } catch (error) {
        showAlert('users-alert', 'Failed to delete user', 'error');
    }
}

// Activity log functions
async function loadActivity() {
    try {
        const response = await apiCall('/api/activity?page=1&limit=50');
        const data = await response.json();

        if (response.ok) {
            renderActivity(data.activities);
        } else {
            showAlert('activity-alert', data.error, 'error');
        }
    } catch (error) {
        showAlert('activity-alert', 'Failed to load activity log', 'error');
    }
}

function renderActivity(activities) {
    const tbody = document.getElementById('activity-table');

    if (activities.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <i class="fas fa-inbox"></i><br>No activity found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = activities.map(activity => `
        <tr>
            <td>${activity.username || 'System'}</td>
            <td><span class="badge primary">${activity.action.replace('_', ' ')}</span></td>
            <td>${activity.details || '-'}</td>
            <td>${new Date(activity.created_at).toLocaleString()}</td>
        </tr>
    `).join('');
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    // Clear form if needed
    const form = document.querySelector(`#${modalId} form`);
    if (form) form.reset();
    // Clear alerts
    const alert = document.querySelector(`#${modalId} [id$="-alert"]`);
    if (alert) alert.innerHTML = '';
}

function openAddVerificationModal() {
    openModal('add-verification-modal');
}

function openAddUserModal() {
    openModal('add-user-modal');
}

async function submitVerificationForm() {
    const discordId = document.getElementById('add-discord-id').value;
    const ckey = document.getElementById('add-ckey').value;
    const method = document.getElementById('add-method').value;
    let flags = {};

    const flagsInput = document.getElementById('add-flags').value.trim();
    if (flagsInput) {
        try {
            flags = JSON.parse(flagsInput);
        } catch (error) {
            showAlert('add-verification-alert', 'Invalid JSON in flags field', 'error');
            return;
        }
    }

    try {
        const response = await apiCall('/api/v1/verify', {
            method: 'POST',
            body: JSON.stringify({
                discord_id: discordId,
                ckey: ckey,
                verified_flags: flags,
                verification_method: method
            })
        });

        if (response.ok) {
            showAlert('add-verification-alert', 'Verification added successfully!', 'success');
            setTimeout(() => {
                closeModal('add-verification-modal');
                if (currentPage === 'verifications') loadVerifications();
                if (currentPage === 'dashboard') loadDashboardData();
            }, 1500);
        } else {
            const data = await response.json();
            showAlert('add-verification-alert', data.error, 'error');
        }
    } catch (error) {
        showAlert('add-verification-alert', 'Connection error', 'error');
    }
}

async function submitUserForm() {
    const username = document.getElementById('add-user-username').value;
    const password = document.getElementById('add-user-password').value;
    const role = document.getElementById('add-user-role').value;

    try {
        const response = await apiCall('/api/users', {
            method: 'POST',
            body: JSON.stringify({
                username,
                password,
                role
            })
        });

        if (response.ok) {
            showAlert('add-user-alert', 'User created successfully!', 'success');
            setTimeout(() => {
                closeModal('add-user-modal');
                if (currentPage === 'users') loadUsers();
                if (currentPage === 'dashboard') loadDashboardData();
            }, 1500);
        } else {
            const data = await response.json();
            showAlert('add-user-alert', data.error, 'error');
        }
    } catch (error) {
        showAlert('add-user-alert', 'Connection error', 'error');
    }
}
