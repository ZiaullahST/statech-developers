// Content loader — applies CMS data with full multilingual support

let siteContent = null;

document.addEventListener('languageChanged', () => loadAndRender());

async function loadAndRender() {
    try {
        const res = await fetch('/api/content');
        if (!res.ok) return;
        siteContent = await res.json();
        renderAll(siteContent);
    } catch (err) {
        console.warn('Could not load CMS content:', err.message);
    }
}

function renderAll(content) {
    const lang = window.StatechI18n?.getLang() || 'en';
    const i18n = window.StatechI18n;

    applyStaticContent(content, lang, i18n);
    renderHomeStats(content.home?.stats, i18n);
    renderTestimonials(content.testimonials, i18n);
    renderServicesPreview(content.services, i18n);
    renderServicesPage(content.services, i18n);
    renderBloggerPortfolio(content.bloggerPortfolio, i18n);
    renderTeamPage(content.team);
    renderContactInfo(content.settings, lang, i18n);

    if (window.StatechI18n) {
        document.querySelectorAll('#stats-container [data-i18n], #services-preview-container [data-i18n], #services-container [data-i18n]').forEach(() => {});
        const event = new Event('reapplyI18n');
        document.dispatchEvent(event);
    }
}

function applyStaticContent(content, lang, i18n) {
    document.querySelectorAll('[data-content]').forEach(el => {
        const path = el.getAttribute('data-content');
        const i18nKey = el.getAttribute('data-i18n');
        let value = getNestedValue(content, path);

        if (lang !== 'en' && i18nKey && i18n) {
            const translated = i18n.t(i18nKey);
            if (translated) value = translated;
        }

        if (value === null || value === undefined) return;

        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = value;
        } else if (el.tagName === 'IMG') {
            el.src = value;
        } else {
            el.textContent = value;
        }
    });

    document.querySelectorAll('[data-content-year]').forEach(el => {
        el.textContent = new Date().getFullYear();
    });
}

function renderHomeStats(stats, i18n) {
    const container = document.getElementById('stats-container');
    if (!container || !stats) return;

    const statKeys = ['engineers', 'projects', 'countries', 'years'];

    container.innerHTML = stats.map((stat, i) => {
        const labelKey = stat.labelKey || statKeys[i] || stat.label?.toLowerCase();
        const label = i18n ? i18n.statLabel(i, stat.label) : stat.label;
        return `
        <div class="col-md-3 col-6">
            <div class="stat-item text-center">
                <i class="${stat.icon} stat-icon"></i>
                <h3 class="stat-number" data-target="${stat.value}">${stat.value}${stat.suffix || '+'}</h3>
                <p class="stat-label" data-i18n="home.stats.${labelKey}">${label}</p>
            </div>
        </div>`;
    }).join('');

    initStatCounters();
    reapplyI18nTo(container);
}

function renderTestimonials(testimonials, i18n) {
    const container = document.getElementById('testimonials-container');
    if (!container || !testimonials) return;

    container.innerHTML = testimonials.map((t, i) => {
        const quote = i18n ? i18n.testimonialQuote(i, t.quote) : t.quote;
        return `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="testimonial-card">
                <div class="testimonial-rating">
                    <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                    <i class="fas fa-star"></i><i class="fas fa-star"></i>
                </div>
                <p class="testimonial-text">"${escapeHtml(quote)}"</p>
                <div class="testimonial-author">
                    <div class="testimonial-avatar">${escapeHtml(t.initials || t.name.charAt(0))}</div>
                    <div>
                        <h5>${escapeHtml(t.name)}</h5>
                        <p class="mb-0">${escapeHtml(t.role)}</p>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

function renderServicesPreview(services, i18n) {
    const container = document.getElementById('services-preview-container');
    if (!container || !services) return;

    const preview = services.filter(s => s.featuredOnHome !== false).slice(0, 6);
    container.innerHTML = preview.map((s, i) => {
        const serviceIndex = services.indexOf(s);
        const title = i18n ? i18n.serviceTitle(serviceIndex, s.title) : s.title;
        const desc = i18n ? i18n.serviceDesc(serviceIndex, s.description) : s.description;
        return `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="service-card">
                <div class="service-icon"><i class="${s.icon}"></i></div>
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(desc)}</p>
                <a href="services.html" class="btn-link" data-i18n="home.learn_more">Learn More <i class="fas fa-arrow-right"></i></a>
            </div>
        </div>`;
    }).join('');

    reapplyI18nTo(container);
}

function renderServicesPage(services, i18n) {
    const container = document.getElementById('services-container');
    if (!container || !services) return;

    container.innerHTML = services.map((s, i) => {
        const title = i18n ? i18n.serviceTitle(i, s.title) : s.title;
        const desc = i18n ? i18n.serviceDesc(i, s.description) : s.description;
        return `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="service-card">
                <div class="service-icon"><i class="${s.icon}"></i></div>
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(desc)}</p>
                ${s.features ? `<ul class="service-features">${s.features.map(f => `<li><i class="fas fa-check"></i> ${escapeHtml(f)}</li>`).join('')}</ul>` : ''}
            </div>
        </div>`;
    }).join('');
}

function renderBloggerPortfolio(items, i18n) {
    const container = document.getElementById('blogger-portfolio-container');
    if (!container || !items) return;

    const toolsLabel = i18n ? i18n.t('services.tools_used', 'Tools & Technologies') : 'Tools & Technologies';

    container.innerHTML = items.map(item => {
        const title = i18n ? (i18n.t(`services.blogger_items.${item.id}.title`) || item.title) : item.title;
        const desc = i18n ? (i18n.t(`services.blogger_items.${item.id}.description`) || item.description) : item.description;
        const techTags = (item.technologies || []).map(tech =>
            `<span class="tech-tag">${escapeHtml(tech)}</span>`
        ).join('');

        return `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="portfolio-card">
                <div class="portfolio-image">
                    <img src="${item.image}" alt="${escapeHtml(title)}" loading="lazy">
                </div>
                <div class="portfolio-body">
                    <h3>${escapeHtml(title)}</h3>
                    <p>${escapeHtml(desc)}</p>
                    <div class="portfolio-tech">
                        <span class="portfolio-tech-label"><i class="fas fa-tools me-1"></i>${escapeHtml(toolsLabel)}</span>
                        <div class="tech-tags">${techTags}</div>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

function renderTeamPage(team) {
    if (!team) return;

    const leadership = document.getElementById('leadership-container');
    if (leadership && team.leadership) {
        leadership.innerHTML = team.leadership.map(m => `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="team-card">
                    <div class="team-image">
                        <div class="team-avatar-large">${escapeHtml(m.initials || m.name.split(' ').map(n => n[0]).join(''))}</div>
                    </div>
                    <div class="team-info">
                        <h3>${escapeHtml(m.name)}</h3>
                        <p class="team-role">${escapeHtml(m.role)}</p>
                        <p class="team-bio">${escapeHtml(m.bio || '')}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    const members = document.getElementById('members-container');
    if (members && team.members) {
        members.innerHTML = team.members.map(m => `
            <div class="col-lg-3 col-md-4 col-6 mb-4">
                <div class="team-card-small">
                    <div class="team-image-small">
                        <div class="team-avatar-small">${escapeHtml(m.initials || m.name.split(' ').map(n => n[0]).join(''))}</div>
                    </div>
                    <div class="team-info-small">
                        <h4>${escapeHtml(m.name)}</h4>
                        <p class="team-role-small">${escapeHtml(m.role)}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function renderContactInfo(settings, lang, i18n) {
    if (!settings) return;

    const fields = {
        'settings.address': { cms: settings.address, i18n: 'contact.address_value' },
        'settings.phone': { cms: settings.phone, i18n: 'contact.phone_value' },
        'settings.contactEmail': { cms: settings.contactEmail, i18n: 'contact.email_value' },
        'settings.businessHours': { cms: settings.businessHours, i18n: 'contact.business_hours_value' }
    };

    Object.entries(fields).forEach(([path, { cms, i18n: key }]) => {
        document.querySelectorAll(`[data-content="${path}"]`).forEach(el => {
            let value = cms;
            if (lang !== 'en' && i18n) {
                const translated = i18n.t(key);
                if (translated) value = translated;
            }
            if (value) el.textContent = value;
        });
    });
}

function reapplyI18nTo(container) {
    if (!window.StatechI18n) return;
    container.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const value = window.StatechI18n.t(key);
        if (!value) return;
        if (el.tagName === 'A') {
            const icon = el.querySelector('i');
            if (icon) {
                el.innerHTML = '';
                el.appendChild(icon.cloneNode(true));
                el.appendChild(document.createTextNode(' ' + value));
            } else {
                el.textContent = value;
            }
        } else {
            el.textContent = value;
        }
    });
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function initStatCounters() {
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    if (!statNumbers.length) return;

    const animateCounter = (element, target) => {
        let current = 0;
        const increment = target / 50;
        const suffix = (element.textContent.match(/[^0-9]+$/) || ['+'])[0];
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target + suffix;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current) + suffix;
            }
        }, 30);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                if (!entry.target.dataset.animated) {
                    entry.target.dataset.animated = '1';
                    animateCounter(entry.target, target);
                }
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(stat => observer.observe(stat));
}
