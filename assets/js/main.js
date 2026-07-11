// Main JavaScript for STATECH Website

document.addEventListener('DOMContentLoaded', function() {
    const languageSwitcher = document.getElementById('languageSwitcher');
    const currentLang = localStorage.getItem('selectedLanguage') || 'en';

    window.StatechI18n.loadLanguage(currentLang);

    if (languageSwitcher) {
        languageSwitcher.addEventListener('change', function() {
            window.StatechI18n.loadLanguage(this.value);
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            navbar.classList.toggle('navbar-scrolled', window.scrollY > 50);
        });
    }

    // Active nav link highlighting
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        const linkPage = link.getAttribute('href');
        link.classList.toggle('active', linkPage === currentPage);
    });

    // Contact form handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };

            const t = (key) => window.StatechI18n.t(`messages.${key}`, key);

            if (!formData.firstName || !formData.lastName || !formData.email || !formData.subject || !formData.message) {
                alert(t('required_fields'));
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                alert(t('invalid_email'));
                return;
            }

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalHtml = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${t('sending')}`;

            fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                alert(t('send_success'));
                contactForm.reset();
            })
            .catch(err => {
                alert(err.message || t('send_failed'));
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHtml;
                window.StatechI18n.loadLanguage(window.StatechI18n.getLang());
            });
        });
    }

    // Animate elements on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('animate-in');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.service-card, .team-card, .value-card, .process-card').forEach(el => {
        observer.observe(el);
    });

    // Mobile menu close on link click
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const navbarCollapse = document.querySelector('.navbar-collapse');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 992 && navbarCollapse) {
                const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                if (bsCollapse) bsCollapse.hide();
            }
        });
    });

    window.addEventListener('load', () => document.body.classList.add('loaded'));
});

const style = document.createElement('style');
style.textContent = `
    .animate-in { animation: fadeInUp 0.6s ease-out; }
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .navbar-scrolled { box-shadow: 0 2px 20px rgba(0, 0, 0, 0.15) !important; }
    body.loaded { opacity: 1; }
    body { opacity: 0; transition: opacity 0.3s ease; }
`;
document.head.appendChild(style);
