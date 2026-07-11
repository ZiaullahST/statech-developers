// Shared i18n utilities — English, Dari (fa), Pashto (ps)

window.StatechI18n = (function () {
    let currentLang = localStorage.getItem('selectedLanguage') || 'en';
    let translations = {};

    const SERVICE_KEYS = ['website_creation', 'database_creation', 'software_dev', 'cloud_solutions', 'cybersecurity', 'data_engineering', 'it_consulting', 'support_maintenance'];
    const TESTIMONIAL_KEYS = ['client1_quote', 'client2_quote', 'client3_quote'];
    const STAT_KEYS = ['engineers', 'projects', 'countries', 'years'];

    function getLang() {
        return currentLang;
    }

    function getNested(obj, path) {
        return path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), obj);
    }

    function t(key, fallback) {
        return getNested(translations, key) || fallback || '';
    }

    function serviceTitle(index, fallback) {
        const key = SERVICE_KEYS[index];
        return key ? t(`services.${key}`, fallback) : fallback;
    }

    function serviceDesc(index, fallback) {
        const key = SERVICE_KEYS[index];
        return key ? t(`services.${key}_desc`, fallback) : fallback;
    }

    function testimonialQuote(index, fallback) {
        const key = TESTIMONIAL_KEYS[index];
        return key ? t(`home.${key}`, fallback) : fallback;
    }

    function statLabel(index, fallback) {
        const key = STAT_KEYS[index];
        return key ? t(`home.stats.${key}`, fallback) : fallback;
    }

    function applyTranslations(data) {
        translations = data || {};

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const value = getNested(translations, key);
            if (!value) return;

            if (el.tagName === 'LABEL' || el.tagName === 'OPTION') {
                el.textContent = value;
            } else if (el.tagName === 'A' || el.tagName === 'BUTTON') {
                const icon = el.querySelector('i');
                if (icon) {
                    el.innerHTML = '';
                    el.appendChild(icon.cloneNode(true));
                    el.appendChild(document.createTextNode(' ' + value));
                } else {
                    el.textContent = value;
                }
            } else if (el.hasAttribute('placeholder')) {
                el.placeholder = value;
            } else {
                el.textContent = value;
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const value = getNested(translations, key);
            if (value) el.placeholder = value;
        });

        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            const value = getNested(translations, key);
            if (value) el.innerHTML = value;
        });

        const navBrand = document.getElementById('nav-brand');
        if (navBrand && translations.nav?.brand) {
            navBrand.innerHTML = `<i class="fas fa-code me-2"></i>${translations.nav.brand}`;
        }

        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            const key = pageTitle.getAttribute('data-i18n');
            if (key) {
                const value = getNested(translations, key);
                if (value) pageTitle.textContent = value;
            }
        }

        document.querySelectorAll('.breadcrumb-item[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const value = getNested(translations, key);
            if (value) el.textContent = value;
        });

        updateDocumentDirection(currentLang);
    }

    function updateDocumentDirection(lang) {
        const html = document.documentElement;
        if (lang === 'fa' || lang === 'ps') {
            html.setAttribute('dir', 'rtl');
            html.setAttribute('lang', lang);
            if (!document.getElementById('rtl-stylesheet')) {
                const link = document.createElement('link');
                link.id = 'rtl-stylesheet';
                link.rel = 'stylesheet';
                link.href = 'assets/css/rtl.css';
                document.head.appendChild(link);
            }
        } else {
            html.setAttribute('dir', 'ltr');
            html.setAttribute('lang', 'en');
            document.getElementById('rtl-stylesheet')?.remove();
        }
    }

    async function loadLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('selectedLanguage', lang);

        const switcher = document.getElementById('languageSwitcher');
        if (switcher) switcher.value = lang;

        try {
            const res = await fetch(`assets/i18n/${lang}.json`);
            const data = await res.json();
            applyTranslations(data);
            document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang, translations: data } }));
            return data;
        } catch (err) {
            console.error('Error loading translations:', err);
            return null;
        }
    }

    function localizedCmsValue(value, i18nKey) {
        if (currentLang === 'en') return typeof value === 'string' ? value : value?.en || '';
        if (i18nKey) return t(i18nKey, typeof value === 'string' ? value : value?.en || '');
        if (value && typeof value === 'object' && value[currentLang]) return value[currentLang];
        return typeof value === 'string' ? value : value?.en || '';
    }

    return {
        getLang,
        t,
        getNested,
        loadLanguage,
        applyTranslations,
        localizedCmsValue,
        serviceTitle,
        serviceDesc,
        testimonialQuote,
        statLabel,
        SERVICE_KEYS
    };
})();
