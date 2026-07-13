// STATECH Admin Dashboard

let content = {};
let messages = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        const authRes = await api('/api/auth/me');
        currentUser = authRes.user;
        document.getElementById('userGreeting').textContent = currentUser.name;
        if (currentUser.role === 'admin') {
            document.getElementById('navUsers').style.display = 'block';
        }
    } catch {
        window.location.href = '/login';
        return;
    }

    setupNavigation();
    setupSidebar();
    setupLogout();
    await loadAll();

    document.getElementById('homeContentForm').addEventListener('submit', saveHomeContent);
    document.getElementById('aboutContentForm').addEventListener('submit', saveAboutContent);
    document.getElementById('settingsForm').addEventListener('submit', saveSettings);
    document.getElementById('passwordForm').addEventListener('submit', changePassword);
    document.getElementById('addUserForm').addEventListener('submit', addUser);
    document.getElementById('addTestimonialBtn').addEventListener('click', addTestimonial);
    document.getElementById('addServiceBtn').addEventListener('click', addService);
    document.getElementById('addLeaderBtn').addEventListener('click', addLeader);
    document.getElementById('addMemberBtn').addEventListener('click', addMember);
    document.getElementById('deleteAllMessages').addEventListener('click', deleteAllMessages);
}

async function api(url, options = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

async function loadAll() {
    content = await api('/api/content');
    messages = await api('/api/messages');
    renderDashboard();
    renderContentForms();
    renderServicesEditor();
    renderTeamEditor();
    renderMessages();
    if (currentUser.role === 'admin') renderUsers();
}

function setupNavigation() {
    const links = document.querySelectorAll('.sidebar-nav .nav-link, [data-goto]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page') || link.getAttribute('data-goto');
            if (!page) return;
            showPage(page);
            if (window.innerWidth < 992) {
                document.getElementById('adminSidebar').classList.remove('show');
            }
        });
    });
}

function showPage(page) {
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    document.getElementById(page + '-page')?.classList.add('active');
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(l => {
        l.classList.toggle('active', l.getAttribute('data-page') === page);
    });
    const titles = { dashboard: 'Dashboard', content: 'Site Content', services: 'Services', team: 'Team', messages: 'Messages', users: 'Team Access', settings: 'Settings' };
    document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';
}

function setupSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('adminSidebar');
    toggle?.addEventListener('click', () => sidebar.classList.toggle('show'));
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 992 && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
                sidebar.classList.remove('show');
        }
    });
}

function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await api('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    });
}

function showAlert(message, type = 'success') {
    const container = document.getElementById('alertContainer');
    container.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    setTimeout(() => { container.innerHTML = ''; }, 4000);
}

async function saveContent() {
    await api('/api/content', { method: 'PUT', body: JSON.stringify(content) });
    showAlert('Changes saved successfully!');
}

// --- Dashboard ---

function renderDashboard() {
    const unread = messages.filter(m => !m.read).length;
    document.getElementById('dashMessages').textContent = messages.length;
    document.getElementById('dashServices').textContent = content.services?.length || 0;
    document.getElementById('dashTeam').textContent = (content.team?.leadership?.length || 0) + (content.team?.members?.length || 0);
    document.getElementById('dashTestimonials').textContent = content.testimonials?.length || 0;

    const badge = document.getElementById('msgBadge');
    if (unread > 0) { badge.textContent = unread; badge.style.display = 'inline'; }
    else { badge.style.display = 'none'; }

    const tbody = document.getElementById('dashRecentMessages');
    const recent = messages.slice(0, 5);
    if (!recent.length) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-muted text-center py-4">No messages yet</td></tr>';
        return;
    }
    tbody.innerHTML = recent.map(m => `<tr><td>${esc(m.firstName)} ${esc(m.lastName)}</td><td>${esc(m.subject)}</td><td>${formatDate(m.createdAt)}</td></tr>`).join('');
}

// --- Content Forms ---

function renderContentForms() {
    document.getElementById('heroTitle').value = content.home?.heroTitle || '';
    document.getElementById('heroSubtitle').value = content.home?.heroSubtitle || '';
    document.getElementById('aboutStory').value = content.about?.story || '';
    document.getElementById('aboutStory2').value = content.about?.story2 || '';
    document.getElementById('aboutMission').value = content.about?.mission || '';
    document.getElementById('aboutVision').value = content.about?.vision || '';

    document.getElementById('siteName').value = content.settings?.siteName || '';
    document.getElementById('siteDescription').value = content.settings?.siteDescription || '';
    document.getElementById('contactEmail').value = content.settings?.contactEmail || '';
    document.getElementById('phone').value = content.settings?.phone || '';
    document.getElementById('address').value = content.settings?.address || '';
    document.getElementById('businessHours').value = content.settings?.businessHours || '';

    renderStatsEditor();
    renderTestimonialsEditor();
}

function renderStatsEditor() {
    const container = document.getElementById('statsEditor');
    container.innerHTML = (content.home?.stats || []).map((s, i) => `
        <div class="row g-2 mb-2 stat-row" data-index="${i}">
            <div class="col-3"><input type="number" class="form-control form-control-sm stat-value" value="${s.value}" placeholder="Value"></div>
            <div class="col-2"><input type="text" class="form-control form-control-sm stat-suffix" value="${s.suffix || '+'}" placeholder="Suffix"></div>
            <div class="col-4"><input type="text" class="form-control form-control-sm stat-label" value="${esc(s.label)}" placeholder="Label"></div>
            <div class="col-3"><input type="text" class="form-control form-control-sm stat-icon" value="${s.icon}" placeholder="Icon class"></div>
        </div>
    `).join('');
}

async function saveHomeContent(e) {
    e.preventDefault();
    content.home.heroTitle = document.getElementById('heroTitle').value;
    content.home.heroSubtitle = document.getElementById('heroSubtitle').value;
    content.home.stats = [...document.querySelectorAll('.stat-row')].map(row => ({
        value: parseInt(row.querySelector('.stat-value').value) || 0,
        suffix: row.querySelector('.stat-suffix').value || '+',
        label: row.querySelector('.stat-label').value,
        icon: row.querySelector('.stat-icon').value
    }));
    await saveContent();
    renderDashboard();
}

async function saveAboutContent(e) {
    e.preventDefault();
    content.about.story = document.getElementById('aboutStory').value;
    content.about.story2 = document.getElementById('aboutStory2').value;
    content.about.mission = document.getElementById('aboutMission').value;
    content.about.vision = document.getElementById('aboutVision').value;
    await saveContent();
}

async function saveSettings(e) {
            e.preventDefault();
    content.settings.siteName = document.getElementById('siteName').value;
    content.settings.siteDescription = document.getElementById('siteDescription').value;
    content.settings.contactEmail = document.getElementById('contactEmail').value;
    content.settings.phone = document.getElementById('phone').value;
    content.settings.address = document.getElementById('address').value;
    content.settings.businessHours = document.getElementById('businessHours').value;
    await saveContent();
}

// --- Testimonials ---

function renderTestimonialsEditor() {
    const container = document.getElementById('testimonialsEditor');
    container.innerHTML = (content.testimonials || []).map((t, i) => testimonialRow(t, i)).join('');
    container.querySelectorAll('.save-testimonial').forEach(btn => btn.addEventListener('click', saveTestimonial));
    container.querySelectorAll('.delete-testimonial').forEach(btn => btn.addEventListener('click', deleteTestimonial));
}

function testimonialRow(t, i) {
    return `<div class="border rounded p-3 mb-3" data-index="${i}">
        <div class="row g-2">
            <div class="col-12"><textarea class="form-control t-quote" rows="2" placeholder="Quote">${esc(t.quote)}</textarea></div>
            <div class="col-md-4"><input type="text" class="form-control t-name" value="${esc(t.name)}" placeholder="Name"></div>
            <div class="col-md-4"><input type="text" class="form-control t-role" value="${esc(t.role)}" placeholder="Role"></div>
            <div class="col-md-4 d-flex gap-2">
                <button type="button" class="btn btn-sm btn-primary save-testimonial flex-grow-1">Save</button>
                <button type="button" class="btn btn-sm btn-outline-danger delete-testimonial"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    </div>`;
}

async function saveTestimonial(e) {
    const row = e.target.closest('[data-index]');
    const i = parseInt(row.dataset.index);
    content.testimonials[i] = {
        ...content.testimonials[i],
        quote: row.querySelector('.t-quote').value,
        name: row.querySelector('.t-name').value,
        role: row.querySelector('.t-role').value
    };
    await saveContent();
    renderDashboard();
}

async function deleteTestimonial(e) {
    if (!confirm('Delete this testimonial?')) return;
    const i = parseInt(e.target.closest('[data-index]').dataset.index);
    content.testimonials.splice(i, 1);
    await saveContent();
    renderTestimonialsEditor();
    renderDashboard();
}

function addTestimonial() {
    content.testimonials.push({ id: 't' + Date.now(), quote: '', name: '', role: '' });
    renderTestimonialsEditor();
}

// --- Services ---

function renderServicesEditor() {
    const container = document.getElementById('servicesEditor');
    container.innerHTML = (content.services || []).map((s, i) => `
        <div class="border rounded p-3 mb-3" data-index="${i}">
            <div class="row g-2">
                <div class="col-md-6"><input type="text" class="form-control s-title" value="${esc(s.title)}" placeholder="Title"></div>
                <div class="col-md-6"><input type="text" class="form-control s-icon" value="${s.icon}" placeholder="Icon (e.g. fas fa-cloud)"></div>
                <div class="col-12"><textarea class="form-control s-desc" rows="2" placeholder="Description">${esc(s.description)}</textarea></div>
                <div class="col-12"><input type="text" class="form-control s-features" value="${(s.features || []).join(', ')}" placeholder="Features (comma-separated)"></div>
                <div class="col-12 d-flex gap-2">
                    <button type="button" class="btn btn-sm btn-primary save-service">Save</button>
                    <button type="button" class="btn btn-sm btn-outline-danger delete-service"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>
    `).join('');
    container.querySelectorAll('.save-service').forEach(btn => btn.addEventListener('click', saveService));
    container.querySelectorAll('.delete-service').forEach(btn => btn.addEventListener('click', deleteService));
}

async function saveService(e) {
    const row = e.target.closest('[data-index]');
    const i = parseInt(row.dataset.index);
    content.services[i] = {
        ...content.services[i],
        title: row.querySelector('.s-title').value,
        icon: row.querySelector('.s-icon').value,
        description: row.querySelector('.s-desc').value,
        features: row.querySelector('.s-features').value.split(',').map(f => f.trim()).filter(Boolean)
    };
    await saveContent();
    renderDashboard();
}

async function deleteService(e) {
    if (!confirm('Delete this service?')) return;
    const i = parseInt(e.target.closest('[data-index]').dataset.index);
    content.services.splice(i, 1);
    await saveContent();
    renderServicesEditor();
    renderDashboard();
}

function addService() {
    content.services.push({ id: 's' + Date.now(), title: '', description: '', icon: 'fas fa-cog', features: [] });
    renderServicesEditor();
}

// --- Team ---

function renderTeamEditor() {
    const leadContainer = document.getElementById('leadershipEditor');
    leadContainer.innerHTML = (content.team?.leadership || []).map((m, i) => `
        <div class="border rounded p-3 mb-3" data-type="leadership" data-index="${i}">
            <div class="row g-2">
                <div class="col-md-4"><input type="text" class="form-control m-name" value="${esc(m.name)}" placeholder="Name"></div>
                <div class="col-md-4"><input type="text" class="form-control m-role" value="${esc(m.role)}" placeholder="Role"></div>
                <div class="col-md-4"><input type="text" class="form-control m-initials" value="${esc(m.initials || '')}" placeholder="Initials"></div>
                <div class="col-12"><textarea class="form-control m-bio" rows="2" placeholder="Bio">${esc(m.bio || '')}</textarea></div>
                <div class="col-12 d-flex gap-2">
                    <button type="button" class="btn btn-sm btn-primary save-member">Save</button>
                    <button type="button" class="btn btn-sm btn-outline-danger delete-member"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>
    `).join('');

    const memContainer = document.getElementById('membersEditor');
    memContainer.innerHTML = (content.team?.members || []).map((m, i) => `
        <div class="border rounded p-3 mb-3" data-type="members" data-index="${i}">
            <div class="row g-2 align-items-end">
                <div class="col-md-4"><input type="text" class="form-control m-name" value="${esc(m.name)}" placeholder="Name"></div>
                <div class="col-md-4"><input type="text" class="form-control m-role" value="${esc(m.role)}" placeholder="Role"></div>
                <div class="col-md-4"><input type="text" class="form-control m-initials" value="${esc(m.initials || '')}" placeholder="Initials"></div>
                <div class="col-12 d-flex gap-2">
                    <button type="button" class="btn btn-sm btn-primary save-member">Save</button>
                    <button type="button" class="btn btn-sm btn-outline-danger delete-member"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.save-member').forEach(btn => btn.addEventListener('click', saveTeamMember));
    document.querySelectorAll('.delete-member').forEach(btn => btn.addEventListener('click', deleteTeamMember));
}

async function saveTeamMember(e) {
    const row = e.target.closest('[data-type]');
    const type = row.dataset.type;
    const i = parseInt(row.dataset.index);
    const member = {
        ...content.team[type][i],
        name: row.querySelector('.m-name').value,
        role: row.querySelector('.m-role').value,
        initials: row.querySelector('.m-initials').value
    };
    const bio = row.querySelector('.m-bio');
    if (bio) member.bio = bio.value;
    content.team[type][i] = member;
    await saveContent();
    renderDashboard();
}

async function deleteTeamMember(e) {
    if (!confirm('Remove this team member?')) return;
    const row = e.target.closest('[data-type]');
    const type = row.dataset.type;
    const i = parseInt(row.dataset.index);
    content.team[type].splice(i, 1);
    await saveContent();
    renderTeamEditor();
    renderDashboard();
}

function addLeader() {
    content.team.leadership.push({ id: 'l' + Date.now(), name: '', role: '', bio: '', initials: '' });
    renderTeamEditor();
}

function addMember() {
    content.team.members.push({ id: 'm' + Date.now(), name: '', role: '', initials: '' });
    renderTeamEditor();
}

// --- Messages ---

function renderMessages() {
    const tbody = document.getElementById('messagesTable');
    if (!messages.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-muted text-center py-4">No messages</td></tr>';
        return;
    }
    tbody.innerHTML = messages.map(m => `
        <tr class="${m.read ? '' : 'table-warning'}">
            <td>${esc(m.firstName)} ${esc(m.lastName)}</td>
            <td>${esc(m.email)}</td>
            <td>${esc(m.subject)}</td>
            <td>${formatDate(m.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-msg" data-id="${m.id}"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-outline-danger delete-msg" data-id="${m.id}"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('.view-msg').forEach(btn => btn.addEventListener('click', viewMessage));
    tbody.querySelectorAll('.delete-msg').forEach(btn => btn.addEventListener('click', deleteMessage));
}

async function viewMessage(e) {
    const id = e.currentTarget.dataset.id;
    const msg = messages.find(m => m.id === id);
    if (!msg) return;

    if (!msg.read) {
        await api(`/api/messages/${id}`, { method: 'PATCH', body: JSON.stringify({ read: true }) });
        msg.read = true;
        renderMessages();
        renderDashboard();
    }

    document.getElementById('messageModalBody').innerHTML = `
        <p><strong>From:</strong> ${esc(msg.firstName)} ${esc(msg.lastName)} &lt;${esc(msg.email)}&gt;</p>
        ${msg.phone ? `<p><strong>Phone:</strong> ${esc(msg.phone)}</p>` : ''}
        <p><strong>Subject:</strong> ${esc(msg.subject)}</p>
        <p><strong>Date:</strong> ${formatDate(msg.createdAt)}</p>
        <hr>
        <p>${esc(msg.message)}</p>
    `;
    new bootstrap.Modal(document.getElementById('messageModal')).show();
}

async function deleteMessage(e) {
    if (!confirm('Delete this message?')) return;
    const id = e.currentTarget.dataset.id;
    await api(`/api/messages/${id}`, { method: 'DELETE' });
    messages = messages.filter(m => m.id !== id);
    renderMessages();
    renderDashboard();
}

async function deleteAllMessages() {
    if (!confirm('Delete all messages? This cannot be undone.')) return;
    await api('/api/messages', { method: 'DELETE' });
    messages = [];
    renderMessages();
    renderDashboard();
}

// --- Users ---

async function renderUsers() {
    const users = await api('/api/users');
    document.getElementById('usersTable').innerHTML = users.map(u => `
        <tr>
            <td>${esc(u.name)}</td>
            <td>${esc(u.email)}</td>
            <td><span class="badge bg-${u.role === 'admin' ? 'primary' : 'secondary'}">${u.role}</span></td>
            <td>${u.id !== currentUser.id ? `<button class="btn btn-sm btn-outline-danger delete-user" data-id="${u.id}"><i class="fas fa-trash"></i></button>` : '<span class="text-muted small">You</span>'}</td>
        </tr>
    `).join('');
    document.querySelectorAll('.delete-user').forEach(btn => btn.addEventListener('click', deleteUser));
}

async function addUser(e) {
    e.preventDefault();
    try {
        await api('/api/users', {
            method: 'POST',
            body: JSON.stringify({
                name: document.getElementById('newUserName').value,
                email: document.getElementById('newUserEmail').value,
                password: document.getElementById('newUserPassword').value,
                role: document.getElementById('newUserRole').value
            })
        });
        bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
        document.getElementById('addUserForm').reset();
        showAlert('Team member added successfully!');
        renderUsers();
    } catch (err) {
        showAlert(err.message, 'danger');
    }
}

async function deleteUser(e) {
    if (!confirm('Remove this team member\'s access?')) return;
    await api(`/api/users/${e.currentTarget.dataset.id}`, { method: 'DELETE' });
    showAlert('Team member removed.');
    renderUsers();
}

async function changePassword(e) {
    e.preventDefault();
    try {
        await api('/api/users/password', {
            method: 'PUT',
            body: JSON.stringify({
                currentPassword: document.getElementById('currentPassword').value,
                newPassword: document.getElementById('newPassword').value
            })
        });
        document.getElementById('passwordForm').reset();
        showAlert('Password updated successfully!');
    } catch (err) {
        showAlert(err.message, 'danger');
    }
}

// --- Helpers ---

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
