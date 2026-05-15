const API_BASE_URL = '/api';
const STORAGE_KEYS = { token: 'ufa_token', user: 'ufa_user', theme: 'ufa_theme' };
const PROGRAMS = [
    { icon: 'fa-chalkboard-teacher', title: 'Civic Education', desc: 'Public awareness aligned with Article 7.' },
    { icon: 'fa-balance-scale', title: 'Policy Advocacy', desc: 'Influencing sustainable development policies.' },
    { icon: 'fa-female', title: 'Women Empowerment', desc: 'Special initiatives for women leadership.' },
    { icon: 'fa-child', title: 'Youth Initiatives', desc: 'Youth leadership and mentorship programs.' },
    { icon: 'fa-universal-access', title: 'PLWD Inclusion', desc: 'Ensuring inclusion in all programs.' },
    { icon: 'fa-hand-holding-heart', title: 'Partnerships', desc: 'Building strategic partnerships.' }
];
const EVENT_FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Civic Education', value: 'civic_education' },
    { label: 'Youth', value: 'youth' },
    { label: 'Women', value: 'women' },
    { label: 'Advocacy', value: 'advocacy' }
];
const SAMPLE_EVENTS = [
    { title: 'County Civic Education Forum', date: '2024-06-15', location: 'Nairobi', time: '10:00 AM', event_type: 'civic_education' },
    { title: 'Youth Leadership Summit', date: '2024-06-20', location: 'Mombasa', time: '9:00 AM', event_type: 'youth' },
    { title: 'Women Empowerment Workshop', date: '2024-07-05', location: 'Kisumu', time: '2:00 PM', event_type: 'women' }
];

let authToken = localStorage.getItem(STORAGE_KEYS.token);
let currentUser = getStoredUser();
let allEvents = [];

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.user));
    } catch {
        return null;
    }
}

const getById = (id) => document.getElementById(id);
const closeMenu = () => getById('navMenu')?.classList.remove('active');
const toggleMenu = () => getById('navMenu')?.classList.toggle('active');
const handleNavScroll = () => getById('navbar')?.classList.toggle('scrolled', window.scrollY > 50);

const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : type === 'info' ? 'toast-info' : 'toast-success'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3600);
};

const isValidEmail = (email) => typeof email === 'string' && /\S+@\S+\.\S+/.test(email);

const getAuthHeaders = () => (authToken ? { Authorization: `Bearer ${authToken}` } : {});

const fetchJson = async (path, options = {}) => {
    const requestOptions = {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders(), ...(options.headers || {}) },
        ...options,
    };

    if (options.body !== undefined) {
        requestOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, requestOptions);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(payload.message || response.statusText || 'Request failed');
    }

    return payload;
};

const setStoredUser = (token, user) => {
    authToken = token;
    currentUser = user;
    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    updateAuthUI();
};

const clearStoredUser = () => {
    authToken = null;
    currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    updateAuthUI();
};

const updateAuthUI = () => {
    const userStatus = getById('userStatus');
    const loginButton = getById('loginButton');
    const logoutButton = getById('logoutButton');

    if (currentUser && userStatus && logoutButton && loginButton) {
        userStatus.textContent = `Welcome, ${currentUser.name || currentUser.full_name || 'Member'}`;
        userStatus.classList.remove('hidden');
        logoutButton.classList.remove('hidden');
        loginButton.classList.add('hidden');
        return;
    }

    if (userStatus) userStatus.classList.add('hidden');
    if (logoutButton) logoutButton.classList.add('hidden');
    if (loginButton) loginButton.classList.remove('hidden');
};

const setModalAccessibility = (modalId, visible) => {
    const modal = getById(modalId);
    if (!modal) return;
    modal.setAttribute('aria-hidden', String(!visible));
};

const openLoginModal = () => {
    closeMenu();
    getById('loginModal')?.classList.add('show');
    getById('registerModal')?.classList.remove('show');
    setModalAccessibility('loginModal', true);
    setModalAccessibility('registerModal', false);
    const loginButton = getById('loginButton');
    if (loginButton) loginButton.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    getById('loginEmail')?.focus();
};

const closeLoginModal = () => {
    getById('loginModal')?.classList.remove('show');
    setModalAccessibility('loginModal', false);
    const loginButton = getById('loginButton');
    if (loginButton) loginButton.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
};

const openRegisterModal = (event) => {
    if (event) event.preventDefault();
    closeMenu();
    getById('loginModal')?.classList.remove('show');
    getById('registerModal')?.classList.add('show');
    setModalAccessibility('registerModal', true);
    setModalAccessibility('loginModal', false);
    const loginButton = getById('loginButton');
    if (loginButton) loginButton.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = 'hidden';
    getById('regFullName')?.focus();
};

const closeRegisterModal = () => {
    getById('registerModal')?.classList.remove('show');
    setModalAccessibility('registerModal', false);
    const loginButton = getById('loginButton');
    if (loginButton) loginButton.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
};

const switchToLogin = (event) => {
    if (event) event.preventDefault();
    openLoginModal();
};

const setTheme = (theme) => {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-theme', isDark);
    const themeToggle = getById('themeToggle');
    if (themeToggle) themeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem(STORAGE_KEYS.theme, theme);
};

const restoreTheme = () => {
    const storedTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'light';
    setTheme(storedTheme);
};

const toggleTheme = () => {
    const nextTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(`Switched to ${nextTheme} mode`, 'info');
};

const selectMembershipType = (event) => {
    const selectedCard = event.currentTarget;
    const type = selectedCard.dataset.membershipType;
    if (!type) return;

    document.querySelectorAll('.type-card').forEach((card) => card.classList.toggle('active', card === selectedCard));
    getById('membershipType').value = type;
};

const renderEventCards = (events) => {
    const container = getById('eventsContainer');
    if (!container) return;

    container.innerHTML = events
        .map((event) => {
            const date = new Date(event.event_date || event.date || event.date_string);
            const formattedDate = Number.isNaN(date.getTime())
                ? event.date || 'TBA'
                : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

            return `
                <div class="event-card">
                    <div class="event-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</div>
                    <div class="event-details">
                        <h3>${event.title}</h3>
                        <p>${event.description || 'Join us for this event.'}</p>
                        <div class="event-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${event.location || 'Nairobi'}</span>
                            <span><i class="far fa-clock"></i> ${event.time || '10:00 AM'}</span>
                        </div>
                    </div>
                </div>`;
        })
        .join('');
};

const renderProgramCards = () => {
    const container = getById('programsContainer');
    if (!container) return;

    container.innerHTML = PROGRAMS.map((program) => `
        <div class="program-card">
            <div class="program-header">
                <i class="fas ${program.icon}"></i>
                <h3>${program.title}</h3>
            </div>
            <div class="program-body">
                <p>${program.desc}</p>
            </div>
        </div>
    `).join('');
};

const renderEventFilters = () => {
    const toolbar = getById('eventsToolbar');
    if (!toolbar) return;

    toolbar.innerHTML = `
        <div class="event-filter-group" role="group" aria-label="Event categories">
            ${EVENT_FILTERS.map((filter) => `
                <button type="button" class="filter-btn ${filter.value === 'all' ? 'active' : ''}" data-filter="${filter.value}">
                    ${filter.label}
                </button>
            `).join('')}
        </div>`;

    toolbar.querySelectorAll('.filter-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            document.querySelectorAll('.filter-btn').forEach((btn) => btn.classList.toggle('active', btn === button));
            filterEvents(filter);
        });
    });
};

const filterEvents = (filter) => {
    const filteredEvents = filter === 'all'
        ? allEvents
        : allEvents.filter((event) => event.event_type === filter);

    if (!filteredEvents.length && filter !== 'all') {
        showToast('No events matched that category. Showing all events.', 'info');
        renderEventCards(allEvents);
        return;
    }

    renderEventCards(filteredEvents);
};

const loadEvents = async () => {
    try {
        const data = await fetchJson('/events');
        allEvents = Array.isArray(data.events) && data.events.length ? data.events : SAMPLE_EVENTS;
    } catch (error) {
        console.error('Error loading events:', error);
        allEvents = SAMPLE_EVENTS;
    }

    renderEventCards(allEvents);
};

const loadPrograms = () => renderProgramCards();

const restoreAuth = async () => {
    if (!authToken) {
        updateAuthUI();
        return;
    }

    try {
        const data = await fetchJson('/auth/profile');
        setStoredUser(authToken, data.user);
    } catch (error) {
        clearStoredUser();
    }
};

const handleDocumentClick = (event) => {
    if (!event.target.closest('.nav-menu') && !event.target.closest('.hamburger')) {
        closeMenu();
    }

    if (event.target === getById('loginModal')) {
        closeLoginModal();
    }

    if (event.target === getById('registerModal')) {
        closeRegisterModal();
    }
};

const handleLoginSubmit = async (event) => {
    event.preventDefault();

    const email = getById('loginEmail')?.value.trim();
    const password = getById('loginPassword')?.value.trim();

    if (!email || !password) {
        showToast('Please fill all fields', 'error');
        return;
    }

    try {
        const data = await fetchJson('/auth/login', {
            method: 'POST',
            body: { email, password },
        });

        setStoredUser(data.token, data.user);
        showToast('Login successful!', 'success');
        closeLoginModal();
    } catch (error) {
        showToast(error.message || 'Login failed', 'error');
    }
};

const handleRegisterSubmit = async (event) => {
    event.preventDefault();

    const full_name = getById('regFullName')?.value.trim();
    const email = getById('regEmail')?.value.trim();
    const password = getById('regPassword')?.value.trim();
    const phone = getById('regPhone')?.value.trim();
    const county = getById('regCounty')?.value.trim();

    if (!full_name || !email || !password) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showToast('Please provide a valid email address', 'error');
        return;
    }

    try {
        const registerData = await fetchJson('/auth/register', {
            method: 'POST',
            body: { full_name, email, password, phone, county, ward: '' },
        });

        setStoredUser(registerData.token, registerData.user || null);
        showToast('Registration successful! Welcome to UFA.', 'success');
        closeRegisterModal();
        getById('registerForm')?.reset();
    } catch (error) {
        showToast(error.message || 'Registration failed', 'error');
    }
};

const handleMembershipSubmit = async (event) => {
    event.preventDefault();

    const fullName = getById('fullName')?.value.trim();
    const email = getById('email')?.value.trim();
    const phone = getById('phone')?.value.trim();
    const county = getById('county')?.value.trim();
    const ward = getById('ward')?.value.trim();
    const password = getById('password')?.value.trim();
    const membershipType = getById('membershipType')?.value;

    if (!fullName || !email || !password) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showToast('Please provide a valid email address', 'error');
        return;
    }

    try {
        const registerData = await fetchJson('/auth/register', {
            method: 'POST',
            body: { full_name: fullName, email, password, phone, county, ward },
        });

        await fetchJson('/members/register', {
            method: 'POST',
            body: {
                userId: registerData.userId,
                membership_type: membershipType,
                organization_name: membershipType === 'organization' ? fullName : null,
            },
        });

        showToast('Registration successful! Welcome to UFA.', 'success');
        getById('membershipForm')?.reset();

        if (registerData.token) {
            setStoredUser(registerData.token, registerData.user || null);
        }
    } catch (error) {
        showToast(error.message || 'Registration failed', 'error');
    }
};

const handleNewsletterSubmit = async (event) => {
    event.preventDefault();

    const email = getById('newsletterEmail')?.value.trim();
    if (!isValidEmail(email)) {
        showToast('Please enter a valid email', 'error');
        return;
    }

    try {
        await fetchJson('/newsletter/subscribe', {
            method: 'POST',
            body: { email },
        });
        showToast('Successfully subscribed!', 'success');
        if (getById('newsletterEmail')) {
            getById('newsletterEmail').value = '';
        }
    } catch (error) {
        showToast(error.message || 'Subscription failed', 'error');
    }
};

const smoothAnchorScroll = (anchor) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth' });
    closeMenu();
};

const scrollToMembership = () => {
    const target = document.getElementById('membership');
    if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        closeMenu();
    }
};

const handleEscapeKey = (event) => {
    if (event.key === 'Escape') {
        closeLoginModal();
        closeRegisterModal();
    }
};

const observeSections = () => {
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const link = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
            if (link) {
                link.classList.toggle('active', entry.isIntersecting);
            }
        });
    }, { threshold: 0.55 });

    sections.forEach((section) => observer.observe(section));
};

const logout = () => {
    clearStoredUser();
    closeLoginModal();
    showToast('You are logged out.', 'info');
};

const initPage = () => {
    restoreTheme();
    updateAuthUI();
    restoreAuth();

    getById('loginButton')?.addEventListener('click', openLoginModal);
    getById('logoutButton')?.addEventListener('click', logout);
    getById('themeToggle')?.addEventListener('click', toggleTheme);
    getById('joinButton')?.addEventListener('click', scrollToMembership);
    getById('heroJoinButton')?.addEventListener('click', scrollToMembership);
    getById('heroLearnButton')?.addEventListener('click', () => {
        getById('about')?.scrollIntoView({ behavior: 'smooth' });
        closeMenu();
    });
    getById('hamburgerButton')?.addEventListener('click', toggleMenu);
    getById('loginModalCloseButton')?.addEventListener('click', closeLoginModal);
    getById('registerModalCloseButton')?.addEventListener('click', closeRegisterModal);
    getById('loginForm')?.addEventListener('submit', handleLoginSubmit);
    getById('registerForm')?.addEventListener('submit', handleRegisterSubmit);
    getById('membershipForm')?.addEventListener('submit', handleMembershipSubmit);
    getById('newsletterForm')?.addEventListener('submit', handleNewsletterSubmit);

    document.querySelectorAll('.type-card[data-membership-type]').forEach((card) => {
        card.addEventListener('click', selectMembershipType);
    });

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            event.preventDefault();
            smoothAnchorScroll(anchor);
        });
    });

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleEscapeKey);
    window.addEventListener('scroll', handleNavScroll);

    renderProgramCards();
    renderEventFilters();
    loadEvents();
    observeSections();

    console.log('UFA Website Initialized');
};

window.openRegisterModal = openRegisterModal;
window.switchToLogin = switchToLogin;

document.addEventListener('DOMContentLoaded', initPage);

console.log('UFA Website - All systems ready!');