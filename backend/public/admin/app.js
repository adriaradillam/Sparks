/**
 * SPARKS BACKOFFICE PRO - ADMIN CLIENT LOGIC
 * Vanilla JavaScript SPA
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    token: localStorage.getItem('sparks_admin_token') || null,
    currentUser: JSON.parse(localStorage.getItem('sparks_admin_user') || 'null'),
    currentTab: 'overview',
    usersFilter: 'all',
    usersSearch: '',
    moderationFilter: 'pending',
    reports: [],
    users: [],
    plans: [],
    announcements: [],
    activeReportForChat: null,
    activeReportForAction: null,
    activeUserForDetail: null
  };

  // --- DOM ELEMENTS ---
  const el = {
    // Nav
    navItems: document.querySelectorAll('.nav-item'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    currentTabTitle: document.getElementById('currentTabTitle'),
    currentTabSubtitle: document.getElementById('currentTabSubtitle'),
    badgeTotalUsers: document.getElementById('badgeTotalUsers'),
    badgePendingReports: document.getElementById('badgePendingReports'),
    adminAvatarThumb: document.getElementById('adminAvatarThumb'),
    adminNameLabel: document.getElementById('adminNameLabel'),
    btnLogout: document.getElementById('btnLogout'),
    btnRefreshData: document.getElementById('btnRefreshData'),
    btnToggleTheme: document.getElementById('btnToggleTheme'),
    btnToggleSidebarMobile: document.getElementById('btnToggleSidebarMobile'),
    adminSidebar: document.getElementById('adminSidebar'),
    globalSearchInput: document.getElementById('globalSearchInput'),
    btnHeaderAction: document.getElementById('btnHeaderAction'),

    // KPIs
    kpiTotalUsers: document.getElementById('kpiTotalUsers'),
    kpiVerifiedRatio: document.getElementById('kpiVerifiedRatio'),
    kpiVerifiedCount: document.getElementById('kpiVerifiedCount'),
    kpiTotalMatches: document.getElementById('kpiTotalMatches'),
    kpiTotalMessages: document.getElementById('kpiTotalMessages'),
    kpiTotalPlans: document.getElementById('kpiTotalPlans'),
    kpiPendingReports: document.getElementById('kpiPendingReports'),
    kpiPendingBadge: document.getElementById('kpiPendingBadge'),
    kpiResolvedReports: document.getElementById('kpiResolvedReports'),
    kpiBannedUsers: document.getElementById('kpiBannedUsers'),
    intentionsBarContainer: document.getElementById('intentionsBarContainer'),
    liveActivityList: document.getElementById('liveActivityList'),
    btnQuickRefreshFeed: document.getElementById('btnQuickRefreshFeed'),

    // Users Tab
    usersTableBody: document.getElementById('usersTableBody'),
    countAllUsers: document.getElementById('countAllUsers'),
    usersTableSearchInput: document.getElementById('usersTableSearchInput'),
    userFilterPills: document.querySelectorAll('#tabUsers .filter-pill'),

    // Moderation Tab
    reportsListContainer: document.getElementById('reportsListContainer'),
    modFilterPills: document.querySelectorAll('#tabModeration .filter-pill'),

    // Verifications Tab
    verificationsListContainer: document.getElementById('verificationsListContainer'),

    // Plans Tab
    plansListContainer: document.getElementById('plansListContainer'),

    // Announcements Tab
    formCreateAnnouncement: document.getElementById('formCreateAnnouncement'),
    announcementTitleInput: document.getElementById('announcementTitleInput'),
    announcementTypeSelect: document.getElementById('announcementTypeSelect'),
    announcementMessageInput: document.getElementById('announcementMessageInput'),
    announcementsList: document.getElementById('announcementsList'),

    // Modals
    authModal: document.getElementById('authModal'),
    adminLoginForm: document.getElementById('adminLoginForm'),
    adminEmailInput: document.getElementById('adminEmailInput'),
    adminPasswordInput: document.getElementById('adminPasswordInput'),
    btnQuickDemoLogin: document.getElementById('btnQuickDemoLogin'),

    chatInspectorModal: document.getElementById('chatInspectorModal'),
    btnCloseChatInspector: document.getElementById('btnCloseChatInspector'),
    chatInspectorSubtitle: document.getElementById('chatInspectorSubtitle'),
    partyReporterName: document.getElementById('partyReporterName'),
    partyReporterAvatar: document.getElementById('partyReporterAvatar'),
    partyReportedName: document.getElementById('partyReportedName'),
    partyReportedAvatar: document.getElementById('partyReportedAvatar'),
    chatMessagesContainer: document.getElementById('chatMessagesContainer'),
    btnQuickDismissFromChat: document.getElementById('btnQuickDismissFromChat'),
    btnQuickWarnFromChat: document.getElementById('btnQuickWarnFromChat'),
    btnQuickBanFromChat: document.getElementById('btnQuickBanFromChat'),

    actionModal: document.getElementById('actionModal'),
    btnCloseActionModal: document.getElementById('btnCloseActionModal'),
    btnCancelActionModal: document.getElementById('btnCancelActionModal'),
    btnConfirmActionModal: document.getElementById('btnConfirmActionModal'),
    actionModalDesc: document.getElementById('actionModalDesc'),
    actionNotesInput: document.getElementById('actionNotesInput'),

    userDetailModal: document.getElementById('userDetailModal'),
    btnCloseUserDetailModal: document.getElementById('btnCloseUserDetailModal'),
    detailModalAvatar: document.getElementById('detailModalAvatar'),
    detailModalName: document.getElementById('detailModalName'),
    detailModalEmail: document.getElementById('detailModalEmail'),
    detailModalVerifiedBadge: document.getElementById('detailModalVerifiedBadge'),
    detailModalRoleBadge: document.getElementById('detailModalRoleBadge'),
    detailModalPhotosGrid: document.getElementById('detailModalPhotosGrid'),
    detailModalBio: document.getElementById('detailModalBio'),
    detailModalIntention: document.getElementById('detailModalIntention'),
    detailModalAnthem: document.getElementById('detailModalAnthem'),
    detailModalTags: document.getElementById('detailModalTags'),
    detailModalSafetyBox: document.getElementById('detailModalSafetyBox'),
    btnToggleVerifyUser: document.getElementById('btnToggleVerifyUser'),
    btnToggleAdminRole: document.getElementById('btnToggleAdminRole'),
    btnBanUserDirect: document.getElementById('btnBanUserDirect'),
    btnDeleteUserDirect: document.getElementById('btnDeleteUserDirect'),

    toastContainer: document.getElementById('toastContainer')
  };

  // --- HELPERS ---
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let iconSvg = type === 'error'
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
    toast.innerHTML = `<span style="display:flex;align-items:center;">${iconSvg}</span><span>${message}</span>`;
    el.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  async function api(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...options.headers
    };

    try {
      const res = await fetch(endpoint, { ...options, headers });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401 || res.status === 403) {
        showToast(data.error || 'Sesión expirada o permisos denegados', 'error');
        openAuthModal();
        throw new Error(data.error || 'No autorizado');
      }

      if (!res.ok) {
        throw new Error(data.error || `Error HTTP ${res.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on [${endpoint}]:`, err);
      throw err;
    }
  }

  function formatTimeAgo(dateStr) {
    if (!dateStr) return 'Hace un momento';
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'Hace instantes';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} días`;
  }

  // --- AUTHENTICATION FLOW ---
  function checkAuth() {
    if (!state.token) {
      openAuthModal();
    } else {
      closeAuthModal();
      if (state.currentUser) {
        el.adminNameLabel.textContent = `${state.currentUser.name} (${state.currentUser.role === 'admin' ? 'Admin' : 'Staff'})`;
        if (state.currentUser.avatarUrl) {
          el.adminAvatarThumb.src = state.currentUser.avatarUrl;
        }
      }
      loadAll();
    }
  }

  function openAuthModal() {
    el.authModal.classList.remove('hidden');
  }

  function closeAuthModal() {
    el.authModal.classList.add('hidden');
  }

  async function handleQuickDemoLogin() {
    try {
      const data = await api('/api/admin/quick-login', { method: 'POST' });
      state.token = data.token;
      state.currentUser = data.user;
      localStorage.setItem('sparks_admin_token', data.token);
      localStorage.setItem('sparks_admin_user', JSON.stringify(data.user));
      showToast(`¡Bienvenida ${data.user.name}! Acceso concedido al panel.`, 'success');
      closeAuthModal();
      checkAuth();
    } catch (err) {
      showToast('Error en acceso rápido demo: ' + err.message, 'error');
    }
  }

  async function handleStandardLogin(e) {
    e.preventDefault();
    const email = el.adminEmailInput.value.trim();
    const password = el.adminPasswordInput.value;

    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (!data.user.isAdmin && data.user.role !== 'admin') {
        showToast('Esta cuenta no cuenta con credenciales de Administradora de Sparks.', 'error');
        return;
      }

      state.token = data.token;
      state.currentUser = data.user;
      localStorage.setItem('sparks_admin_token', data.token);
      localStorage.setItem('sparks_admin_user', JSON.stringify(data.user));
      showToast(`Autenticada como ${data.user.name}`, 'success');
      closeAuthModal();
      checkAuth();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function handleLogout() {
    state.token = null;
    state.currentUser = null;
    localStorage.removeItem('sparks_admin_token');
    localStorage.removeItem('sparks_admin_user');
    showToast('Sesión cerrada correctamente', 'info');
    openAuthModal();
  }

  // --- TAB NAVIGATION ---
  const TAB_METAS = {
    overview: {
      title: 'Dashboard Ejecutivo',
      subtitle: 'Monitoreo en tiempo real de la red Sparks'
    },
    users: {
      title: 'Directorio de Usuarias',
      subtitle: 'Control y administración de perfiles, verificación y sanciones'
    },
    moderation: {
      title: 'Centro de Seguridad & Moderación',
      subtitle: 'Resolución de denuncias e inspección forense de chats'
    },
    verifications: {
      title: 'Cola de Verificación Facial',
      subtitle: 'Validación de autenticidad biométrica y asignación de insignia'
    },
    plans: {
      title: 'Planes y Eventos Comunitarios',
      subtitle: 'Supervisión de quedadas y actividades sociales sáficas'
    },
    announcements: {
      title: 'Avisos Globales del Sistema',
      subtitle: 'Emisión de comunicados prioritarios para todas las usuarias'
    }
  };

  function switchTab(tabKey) {
    state.currentTab = tabKey;
    el.navItems.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabKey);
    });
    el.tabPanes.forEach((pane) => {
      pane.classList.toggle('active', pane.id === `tab${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}`);
    });

    const meta = TAB_METAS[tabKey] || TAB_METAS.overview;
    el.currentTabTitle.textContent = meta.title;
    el.currentTabSubtitle.textContent = meta.subtitle;

    // Trigger tab-specific fetches
    if (tabKey === 'overview') loadOverview();
    if (tabKey === 'users') loadUsers();
    if (tabKey === 'moderation') loadModeration();
    if (tabKey === 'verifications') loadVerifications();
    if (tabKey === 'plans') loadPlans();
    if (tabKey === 'announcements') loadAnnouncements();

    // Close mobile sidebar if open
    el.adminSidebar.classList.remove('open');
  }

  // --- DATA LOADERS ---
  async function loadAll() {
    try {
      await Promise.all([
        loadOverview(),
        loadModerationBadge()
      ]);
    } catch (err) {
      console.error('Error in loadAll:', err);
    }
  }

  async function loadModerationBadge() {
    try {
      const data = await api('/api/admin/stats');
      if (data?.stats) {
        el.badgePendingReports.textContent = data.stats.pendingReports || '0';
        if (data.stats.pendingReports > 0) {
          el.badgePendingReports.classList.add('alert');
        } else {
          el.badgePendingReports.classList.remove('alert');
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ==================== OVERVIEW DASHBOARD ====================
  async function loadOverview() {
    try {
      const data = await api('/api/admin/overview');
      if (!data?.kpis) return;

      const k = data.kpis;
      el.kpiTotalUsers.textContent = k.totalUsers;
      el.badgeTotalUsers.textContent = k.totalUsers;
      el.kpiVerifiedRatio.textContent = `${k.verifiedPercentage}%`;
      el.kpiVerifiedCount.textContent = `${k.verifiedUsers} perfiles`;
      el.kpiTotalMatches.textContent = k.totalMatches;
      el.kpiTotalMessages.textContent = k.totalMessages;
      el.kpiTotalPlans.textContent = k.totalPlans;
      el.kpiPendingReports.textContent = k.pendingReports;
      el.kpiResolvedReports.textContent = k.resolvedReports;
      el.kpiBannedUsers.textContent = k.bannedUsers;
      el.badgePendingReports.textContent = k.pendingReports;

      // Render Intentions Chart Bars
      const intentions = data.intentions || {};
      const totalIntentions = Object.values(intentions).reduce((a, b) => a + b, 0) || 1;
      const intentLabels = {
        dating: 'Citas & Romance',
        friendship: 'Nuevas Amistades',
        plans: 'Hacer Planes',
        community: 'Red Sáfica'
      };

      el.intentionsBarContainer.innerHTML = Object.entries(intentions).map(([key, count]) => {
        const pct = Math.round((count / totalIntentions) * 100);
        return `
          <div class="intention-bar-item">
            <div class="intention-bar-header">
              <span class="intention-name">${intentLabels[key] || key}</span>
              <span class="intention-count">${count} usuarias (${pct}%)</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill ${key}" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }).join('');

      // Render Live Activity Feed
      const activities = data.recentActivity || [];
      if (activities.length === 0) {
        el.liveActivityList.innerHTML = `<div style="color: var(--text-muted); font-size: 0.8rem; padding: 12px;">Sin actividad reciente registrada.</div>`;
      } else {
        el.liveActivityList.innerHTML = activities.map((item) => {
          let iconSvg = '';
          if (item.type === 'report') {
            iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>`;
          } else {
            iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect></svg>`;
          }

          return `
            <div class="activity-item">
              <div class="activity-icon ${item.type}">${iconSvg}</div>
              <div class="activity-content">
                <div class="activity-title">${item.title}</div>
                <div class="activity-desc">${item.desc}</div>
              </div>
              <div class="activity-time">${formatTimeAgo(item.timestamp)}</div>
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      console.error('Error in loadOverview:', err);
    }
  }

  // ==================== USERS DIRECTORY ====================
  async function loadUsers() {
    try {
      const q = state.usersSearch ? `&q=${encodeURIComponent(state.usersSearch)}` : '';
      const filter = state.usersFilter ? `&filter=${state.usersFilter}` : '';
      const data = await api(`/api/admin/users?${q}${filter}`);
      state.users = data.users || [];
      el.countAllUsers.textContent = state.users.length;
      renderUsersTable();
    } catch (err) {
      console.error('Error in loadUsers:', err);
    }
  }

  function renderUsersTable() {
    if (state.users.length === 0) {
      el.usersTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
            No se encontraron usuarias con los filtros aplicados.
          </td>
        </tr>
      `;
      return;
    }

    el.usersTableBody.innerHTML = state.users.map((u) => {
      const isVerified = u.isVerified;
      const isAdmin = u.isAdmin || u.role === 'admin';
      const isBanned = u.isBanned;

      let roleBadge = '<span class="role-pill user">Usuaria</span>';
      if (isAdmin) roleBadge = '<span class="role-pill admin">Admin</span>';
      if (isBanned) roleBadge = '<span class="role-pill banned">Suspendida</span>';

      const tagsHtml = (u.tags || []).slice(0, 3).map((t) => `<span class="tag-badge">${t}</span>`).join('');

      return `
        <tr data-user-id="${u.id}">
          <td>
            <div class="user-cell">
              <img src="${u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="user-cell-avatar">
              <div>
                <div class="user-cell-name">
                  ${u.name}
                  ${isVerified ? `
                    <span class="verified-icon-inline" title="Identidad Verificada">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </span>` : ''}
                </div>
                <div class="user-cell-email">${u.email}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight: 600;">${u.age} años</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${u.pronouns || 'Ella / She'}</div>
          </td>
          <td>${roleBadge}</td>
          <td>${tagsHtml || '<span style="color: var(--text-muted); font-size: 0.75rem;">Sin tags</span>'}</td>
          <td>
            <div style="font-weight: 700; color: var(--flame-pink);">${u.totalLikesReceived || 0} likes</div>
          </td>
          <td>
            ${u.reportsReceived > 0 
              ? `<span style="font-weight: 700; color: var(--crimson-accent);">${u.reportsReceived} reportes</span>` 
              : `<span style="color: var(--text-muted);">0</span>`}
          </td>
          <td class="text-right">
            <div class="table-actions">
              <button class="btn-action-sm btn-inspect-user" data-id="${u.id}" title="Ficha completa">Ficha</button>
              <button class="btn-action-sm verify btn-verify-user" data-id="${u.id}" data-verified="${isVerified ? 'true' : 'false'}">
                ${isVerified ? 'Desverificar' : 'Verificar'}
              </button>
              <button class="btn-action-sm danger btn-ban-user" data-id="${u.id}" data-banned="${isBanned ? 'true' : 'false'}" data-name="${u.name}">
                ${isBanned ? 'Reactivar' : 'Suspender'}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row events
    el.usersTableBody.querySelectorAll('.btn-inspect-user').forEach((b) => {
      b.addEventListener('click', () => openUserDetail(parseInt(b.dataset.id)));
    });
    el.usersTableBody.querySelectorAll('.btn-verify-user').forEach((b) => {
      b.addEventListener('click', () => toggleUserVerification(parseInt(b.dataset.id), b.dataset.verified === 'true'));
    });
    el.usersTableBody.querySelectorAll('.btn-ban-user').forEach((b) => {
      b.addEventListener('click', () => toggleUserBan(parseInt(b.dataset.id), b.dataset.banned === 'true', b.dataset.name));
    });
  }

  async function openUserDetail(userId) {
    try {
      const data = await api(`/api/admin/users/${userId}`);
      if (!data?.user) return;

      const u = data.user;
      state.activeUserForDetail = u;

      el.detailModalAvatar.src = u.avatarUrl || '';
      el.detailModalName.textContent = `${u.name}, ${u.age}`;
      el.detailModalEmail.textContent = u.email;
      el.detailModalBio.textContent = u.bio || 'Sin biografía añadida.';
      el.detailModalIntention.textContent = u.intention || 'dating';
      el.detailModalAnthem.textContent = u.anthem?.title ? `${u.anthem.title} - ${u.anthem.artist}` : 'Sin himno seleccionado';

      el.detailModalVerifiedBadge.style.display = u.isVerified ? 'inline-block' : 'none';
      el.detailModalRoleBadge.textContent = u.isAdmin ? 'Administradora' : (u.isBanned ? 'Suspendida' : 'Usuaria');

      // Photos
      const photos = u.photos || [];
      el.detailModalPhotosGrid.innerHTML = photos.length > 0 
        ? photos.map((p) => `<img src="${p}" alt="Foto Perfil">`).join('')
        : '<div style="color: var(--text-muted); font-size: 0.8rem;">Sin fotos adicionales en galería.</div>';

      // Tags
      const tags = u.tags || [];
      el.detailModalTags.innerHTML = tags.map((t) => `<span class="tag-badge">${t}</span>`).join('');

      // Safety Summary
      el.detailModalSafetyBox.innerHTML = `
        <div style="font-size: 0.82rem; line-height: 1.6;">
          <div>• <strong>Advertencias formales:</strong> ${u.warningCount || 0}</div>
          <div>• <strong>Reportes recibidos en su contra:</strong> ${data.reportsAgainst?.length || 0}</div>
          <div>• <strong>Planes creados:</strong> ${data.plansCreated?.length || 0}</div>
          <div>• <strong>Modo Fantasma activado:</strong> ${u.ghostMode ? 'Sí' : 'No'}</div>
        </div>
      `;

      el.btnToggleVerifyUser.textContent = u.isVerified ? 'Retirar Verificación' : 'Conceder Check Azul';
      el.btnToggleAdminRole.textContent = u.isAdmin ? 'Quitar Rol Admin' : 'Promover a Admin';
      el.btnBanUserDirect.textContent = u.isBanned ? 'Reactivar Cuenta' : 'Suspender Permanentemente';

      el.userDetailModal.classList.remove('hidden');
    } catch (err) {
      showToast('Error al cargar ficha: ' + err.message, 'error');
    }
  }

  async function toggleUserVerification(userId, currentlyVerified) {
    try {
      const res = await api(`/api/admin/users/${userId}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ isVerified: !currentlyVerified })
      });
      showToast(res.message, 'success');
      loadUsers();
      if (state.activeUserForDetail && state.activeUserForDetail.id === userId) {
        openUserDetail(userId);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function toggleUserBan(userId, currentlyBanned, userName) {
    const confirmMsg = currentlyBanned
      ? `¿Deseas reactivar la cuenta de ${userName}?`
      : `¿Estás segura de suspender permanentemente la cuenta de ${userName}?`;
    
    if (!confirm(confirmMsg)) return;

    try {
      const endpoint = currentlyBanned
        ? `/api/admin/users/${userId}/unban`
        : `/api/admin/users/${userId}/ban`;
      const res = await api(endpoint, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Sanción administrativa aplicada desde el panel de control' })
      });
      showToast(res.message, 'success');
      loadUsers();
      if (state.activeUserForDetail && state.activeUserForDetail.id === userId) {
        openUserDetail(userId);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // ==================== MODERATION & REPORTS ====================
  async function loadModeration() {
    try {
      const statusParam = state.moderationFilter === 'all' ? 'all' : state.moderationFilter;
      const data = await api(`/api/admin/reports?status=${statusParam}`);
      state.reports = data.reports || [];
      renderReportsGrid();
    } catch (err) {
      console.error('Error in loadModeration:', err);
    }
  }

  function renderReportsGrid() {
    if (state.reports.length === 0) {
      el.reportsListContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg);">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; color: var(--emerald-accent);">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Sin reportes en esta sección</div>
          <div style="font-size: 0.85rem;">Todos los casos de esta categoría se encuentran atendidos y resueltos.</div>
        </div>
      `;
      return;
    }

    const REASON_NAMES = {
      harassment: 'Acoso o intimidación',
      fake_profile: 'Perfil falso / Suplantación',
      hate_speech: 'Discurso de odio',
      inappropriate_content: 'Contenido no consentido',
      spam: 'Spam o Publicidad',
      other: 'Otro motivo'
    };

    el.reportsListContainer.innerHTML = state.reports.map((r) => {
      const isPending = r.status === 'pending';
      const reporter = r.reporter || { name: 'Usuaria', avatarUrl: '' };
      const reported = r.reportedUser || { name: 'Denunciada', avatarUrl: '', isBanned: false };

      return `
        <div class="report-card-item ${isPending ? 'urgent' : ''}" data-report-id="${r.id}">
          <div class="report-card-header">
            <span class="reason-tag ${r.reason}">${REASON_NAMES[r.reason] || r.reason}</span>
            <span class="status-badge ${r.status}">
              ${r.status === 'pending' ? 'PENDIENTE' : (r.status === 'resolved' ? 'RESUELTO' : 'DESCARTADO')}
            </span>
          </div>

          <div class="report-duel-row">
            <div class="duel-user-col">
              <img src="${reporter.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}" class="duel-avatar">
              <div>
                <span class="duel-role-label reporter">DENUNCIANTE</span>
                <span class="duel-name">${reporter.name}</span>
              </div>
            </div>
            <div class="duel-vs-symbol">VS</div>
            <div class="duel-user-col">
              <img src="${reported.avatarUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80'}" class="duel-avatar">
              <div>
                <span class="duel-role-label reported">DENUNCIADA</span>
                <span class="duel-name">${reported.name}</span>
              </div>
            </div>
          </div>

          ${r.description ? `<div class="report-desc-box">"${r.description}"</div>` : ''}

          <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; justify-content: space-between;">
            <span>Reporte #${r.id}</span>
            <span>${formatTimeAgo(r.createdAt)}</span>
          </div>

          <div class="report-card-actions">
            <button class="btn-mod-chat btn-inspect-chat" data-report-id="${r.id}">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Inspeccionar Chat</span>
            </button>
            <button class="btn-mod-verdict btn-open-verdict" data-report-id="${r.id}">
              <span>Dictamen</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    el.reportsListContainer.querySelectorAll('.btn-inspect-chat').forEach((b) => {
      b.addEventListener('click', () => openChatInspector(parseInt(b.dataset.reportId)));
    });
    el.reportsListContainer.querySelectorAll('.btn-open-verdict').forEach((b) => {
      b.addEventListener('click', () => openActionModal(parseInt(b.dataset.reportId)));
    });
  }

  // Inspector de Chat Forense
  async function openChatInspector(reportId) {
    try {
      const data = await api(`/api/admin/reports/${reportId}/chat`);
      state.activeReportForChat = data;

      el.chatInspectorSubtitle.textContent = `Evidencia forense del reporte #${reportId} • Motivo: ${data.report.reason}`;
      el.partyReporterName.textContent = data.reporter?.name || 'Denunciante';
      el.partyReporterAvatar.src = data.reporter?.avatarUrl || '';
      el.partyReportedName.textContent = data.reportedUser?.name || 'Denunciada';
      el.partyReportedAvatar.src = data.reportedUser?.avatarUrl || '';

      const messages = data.messages || [];
      if (messages.length === 0) {
        el.chatMessagesContainer.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 30px; font-size: 0.85rem;">
            No se encontraron mensajes de chat almacenados entre ambas usuarias.
          </div>
        `;
      } else {
        el.chatMessagesContainer.innerHTML = messages.map((m) => {
          const isReporter = m.isReporter;
          return `
            <div class="chat-bubble ${isReporter ? 'reporter' : 'reported'}">
              <span class="bubble-sender">${m.senderName}</span>
              <span class="bubble-text">${m.text || (m.type === 'ephemeral_image' ? 'Foto efímera enviada' : '')}</span>
              <span class="bubble-time">${formatTimeAgo(m.createdAt)}</span>
            </div>
          `;
        }).join('');
      }

      el.chatInspectorModal.classList.remove('hidden');
    } catch (err) {
      showToast('Error al inspeccionar chat: ' + err.message, 'error');
    }
  }

  function openActionModal(reportId) {
    const report = state.reports.find((r) => r.id === reportId);
    state.activeReportForAction = report || { id: reportId };
    el.actionModalDesc.textContent = `Dictamen para el reporte #${reportId}. Selecciona la sanción y la justificación requerida:`;
    el.actionNotesInput.value = 'Infracción comprobada de las políticas de convivencia y seguridad de Sparks.';
    el.actionModal.classList.remove('hidden');
  }

  async function applyVerdict(action, notes) {
    if (!state.activeReportForAction) return;
    try {
      const res = await api(`/api/admin/reports/${state.activeReportForAction.id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, notes: notes || 'Dictamen de moderación ejecutado.' })
      });
      showToast(res.message, 'success');
      el.actionModal.classList.add('hidden');
      el.chatInspectorModal.classList.add('hidden');
      loadModeration();
      loadOverview();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // ==================== VERIFICATIONS QUEUE ====================
  async function loadVerifications() {
    try {
      const data = await api('/api/admin/users?filter=all');
      const users = data.users || [];

      el.verificationsListContainer.innerHTML = users.map((u) => {
        const photos = u.photos || [];
        const selfiePlaceholder = photos[1] || u.avatarUrl;

        return `
          <div class="verification-card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 0.95rem;">${u.name}, ${u.age}</strong>
                <div style="font-size: 0.72rem; color: var(--text-muted);">${u.email}</div>
              </div>
              <span class="badge-pill" style="${u.isVerified ? 'background: rgba(0, 242, 254, 0.15); color: var(--cyan-accent);' : ''}">
                ${u.isVerified ? 'Verificada' : 'Pendiente'}
              </span>
            </div>

            <div class="verification-card-photos">
              <div class="verification-photo-box">
                <img src="${u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}" alt="Foto Perfil">
                <span class="verification-photo-label">Foto Perfil</span>
              </div>
              <div class="verification-photo-box">
                <img src="${selfiePlaceholder || u.avatarUrl}" alt="Selfie Gestual">
                <span class="verification-photo-label">Selfie Gestual</span>
              </div>
            </div>

            <div style="display: flex; gap: 8px; margin-top: auto;">
              <button class="btn-primary-gradient full-width btn-verify-action" data-id="${u.id}" data-verify="true">
                ${u.isVerified ? 'Revalidar Check' : 'Aprobar Verificación'}
              </button>
              ${u.isVerified ? `
                <button class="btn-secondary btn-verify-action" data-id="${u.id}" data-verify="false" title="Revocar">
                  Revocar
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      el.verificationsListContainer.querySelectorAll('.btn-verify-action').forEach((b) => {
        b.addEventListener('click', () => {
          toggleUserVerification(parseInt(b.dataset.id), b.dataset.verify === 'false');
        });
      });
    } catch (err) {
      console.error('Error in loadVerifications:', err);
    }
  }

  // ==================== PLANS & EVENTS ====================
  async function loadPlans() {
    try {
      const data = await api('/api/admin/plans');
      state.plans = data.plans || [];
      renderPlansGrid();
    } catch (err) {
      console.error('Error in loadPlans:', err);
    }
  }

  function renderPlansGrid() {
    if (state.plans.length === 0) {
      el.plansListContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg);">
          No hay planes registrados en este momento.
        </div>
      `;
      return;
    }

    el.plansListContainer.innerHTML = state.plans.map((p) => {
      const attendees = p.attendees || [];
      return `
        <div class="plan-card-item">
          <div class="plan-card-header">
            <span class="plan-category-badge">${p.category}</span>
            <button class="btn-icon-soft btn-delete-plan" data-id="${p.id}" title="Eliminar plan">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>

          <h3 class="plan-title">${p.title}</h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary);">${p.description}</p>

          <div class="plan-location-row">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${p.locationName} • ${p.dateTimeText}</span>
          </div>

          <div class="plan-attendees-row">
            <div class="avatar-stack">
              ${attendees.map((a) => `<img src="${a.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}" title="${a.name}">`).join('')}
            </div>
            <span style="font-size: 0.75rem; font-weight: 600; color: var(--flame-pink);">${p.attendeeCount} confirmadas</span>
          </div>
        </div>
      `;
    }).join('');

    el.plansListContainer.querySelectorAll('.btn-delete-plan').forEach((b) => {
      b.addEventListener('click', () => deletePlan(parseInt(b.dataset.id)));
    });
  }

  async function deletePlan(planId) {
    if (!confirm('¿Segura de que deseas eliminar este plan comunitario por moderación?')) return;
    try {
      const res = await api(`/api/admin/plans/${planId}`, { method: 'DELETE' });
      showToast(res.message, 'success');
      loadPlans();
      loadOverview();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // ==================== ANNOUNCEMENTS ====================
  async function loadAnnouncements() {
    try {
      const data = await api('/api/admin/announcements');
      state.announcements = data.announcements || [];
      renderAnnouncementsList();
    } catch (err) {
      console.error('Error in loadAnnouncements:', err);
    }
  }

  function renderAnnouncementsList() {
    if (state.announcements.length === 0) {
      el.announcementsList.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 30px; font-size: 0.85rem;">
          No hay comunicados globales activos.
        </div>
      `;
      return;
    }

    el.announcementsList.innerHTML = state.announcements.map((a) => `
      <div class="announcement-item-card ${a.type}">
        <div class="announcement-header">
          <span class="announcement-title">${a.title}</span>
          <button class="btn-icon-soft btn-delete-announcement" data-id="${a.id}" title="Eliminar aviso">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
        <p class="announcement-body">${a.message}</p>
        <div class="announcement-meta">
          <span>Por: ${a.createdBy || 'Administradora'}</span>
          <span>${formatTimeAgo(a.createdAt)}</span>
        </div>
      </div>
    `).join('');

    el.announcementsList.querySelectorAll('.btn-delete-announcement').forEach((b) => {
      b.addEventListener('click', () => deleteAnnouncement(parseInt(b.dataset.id)));
    });
  }

  async function handleCreateAnnouncement(e) {
    e.preventDefault();
    const title = el.announcementTitleInput.value.trim();
    const type = el.announcementTypeSelect.value;
    const message = el.announcementMessageInput.value.trim();

    try {
      const res = await api('/api/admin/announcements', {
        method: 'POST',
        body: JSON.stringify({ title, type, message })
      });
      showToast(res.message, 'success');
      el.formCreateAnnouncement.reset();
      loadAnnouncements();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function deleteAnnouncement(id) {
    try {
      const res = await api(`/api/admin/announcements/${id}`, { method: 'DELETE' });
      showToast(res.message, 'info');
      loadAnnouncements();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // --- ATTACH EVENT LISTENERS ---
  function initEvents() {
    // Nav Items
    el.navItems.forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Mobile Sidebar
    el.btnToggleSidebarMobile?.addEventListener('click', () => {
      el.adminSidebar.classList.toggle('open');
    });

    // Refresh & Theme
    el.btnRefreshData.addEventListener('click', () => {
      showToast('Actualizando datos en tiempo real...', 'info');
      loadAll();
      switchTab(state.currentTab);
    });

    el.btnToggleTheme.addEventListener('click', () => {
      const isDark = document.body.classList.contains('theme-dark');
      document.body.classList.toggle('theme-dark', !isDark);
      document.body.classList.toggle('theme-light', isDark);
      localStorage.setItem('sparks_admin_theme', isDark ? 'light' : 'dark');
    });

    // Auth
    el.btnQuickDemoLogin.addEventListener('click', handleQuickDemoLogin);
    el.adminLoginForm.addEventListener('submit', handleStandardLogin);
    el.btnLogout.addEventListener('click', handleLogout);

    // Global Search
    el.globalSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (query.length > 1) {
        state.usersSearch = query;
        switchTab('users');
      }
    });

    // Header Quick Action Button
    el.btnHeaderAction.addEventListener('click', () => {
      switchTab('announcements');
    });

    // Users Filter Pills
    el.userFilterPills.forEach((p) => {
      p.addEventListener('click', () => {
        el.userFilterPills.forEach((x) => x.classList.remove('active'));
        p.classList.add('active');
        state.usersFilter = p.dataset.filter;
        loadUsers();
      });
    });

    // Users Search Input
    let debounceTimer;
    el.usersTableSearchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.usersSearch = e.target.value.trim();
        loadUsers();
      }, 300);
    });

    // Moderation Filter Pills
    el.modFilterPills.forEach((p) => {
      p.addEventListener('click', () => {
        el.modFilterPills.forEach((x) => x.classList.remove('active'));
        p.classList.add('active');
        state.moderationFilter = p.dataset.modFilter;
        loadModeration();
      });
    });

    // Chat Inspector Modal Controls
    el.btnCloseChatInspector.addEventListener('click', () => el.chatInspectorModal.classList.add('hidden'));
    el.btnQuickDismissFromChat.addEventListener('click', () => {
      if (state.activeReportForChat?.report) {
        state.activeReportForAction = state.activeReportForChat.report;
        applyVerdict('dismissed', 'Desestimado tras inspección detallada del chat.');
      }
    });
    el.btnQuickWarnFromChat.addEventListener('click', () => {
      if (state.activeReportForChat?.report) {
        state.activeReportForAction = state.activeReportForChat.report;
        applyVerdict('warning', 'Advertencia formal emitida tras inspección del chat.');
      }
    });
    el.btnQuickBanFromChat.addEventListener('click', () => {
      if (state.activeReportForChat?.report) {
        state.activeReportForAction = state.activeReportForChat.report;
        applyVerdict('banned', 'Suspensión permanente aplicada tras evidencia en el chat.');
      }
    });

    // Action Modal Controls
    el.btnCloseActionModal.addEventListener('click', () => el.actionModal.classList.add('hidden'));
    el.btnCancelActionModal.addEventListener('click', () => el.actionModal.classList.add('hidden'));
    el.btnConfirmActionModal.addEventListener('click', () => {
      const selectedRadio = document.querySelector('input[name="adminActionChoice"]:checked');
      const action = selectedRadio ? selectedRadio.value : 'banned';
      const notes = el.actionNotesInput.value.trim();
      applyVerdict(action, notes);
    });

    // User Detail Modal Controls
    el.btnCloseUserDetailModal.addEventListener('click', () => el.userDetailModal.classList.add('hidden'));
    el.btnToggleVerifyUser.addEventListener('click', () => {
      if (state.activeUserForDetail) {
        toggleUserVerification(state.activeUserForDetail.id, state.activeUserForDetail.isVerified);
      }
    });
    el.btnToggleAdminRole.addEventListener('click', async () => {
      if (!state.activeUserForDetail) return;
      const u = state.activeUserForDetail;
      const newRole = u.isAdmin ? 'user' : 'admin';
      try {
        const res = await api(`/api/admin/users/${u.id}/role`, {
          method: 'PUT',
          body: JSON.stringify({ role: newRole, isAdmin: !u.isAdmin })
        });
        showToast(res.message, 'success');
        openUserDetail(u.id);
        loadUsers();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    el.btnBanUserDirect.addEventListener('click', () => {
      if (state.activeUserForDetail) {
        toggleUserBan(state.activeUserForDetail.id, state.activeUserForDetail.isBanned, state.activeUserForDetail.name);
      }
    });
    el.btnDeleteUserDirect.addEventListener('click', async () => {
      if (!state.activeUserForDetail) return;
      const u = state.activeUserForDetail;
      if (!confirm(`¿Estás SEGURA de eliminar definitivamente a ${u.name}? Esta acción no se puede deshacer.`)) return;
      try {
        const res = await api(`/api/admin/users/${u.id}`, { method: 'DELETE' });
        showToast(res.message, 'success');
        el.userDetailModal.classList.add('hidden');
        loadUsers();
        loadOverview();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // Announcements Form
    el.formCreateAnnouncement.addEventListener('submit', handleCreateAnnouncement);
    el.btnQuickRefreshFeed.addEventListener('click', loadOverview);
  }

  // --- INITIALIZATION ---
  function init() {
    const savedTheme = localStorage.getItem('sparks_admin_theme');
    if (savedTheme === 'light') {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
    }
    initEvents();
    checkAuth();
  }

  init();
})();
