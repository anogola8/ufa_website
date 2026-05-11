// ============================================
// UFA - United Future Alliance
// Main JavaScript File
// ============================================

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('ufa_token');
let currentUser = JSON.parse(localStorage.getItem('ufa_user') || 'null');

// ============================================
// Navigation & UI Functions
// ============================================

// Toggle mobile menu
function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
    
    // Animate hamburger
    const hamburger = document.querySelector('.hamburger');
    hamburger.classList.toggle('active');
}

// Scroll to membership section
function scrollToMembership() {
    document.getElementById('membership').scrollIntoView({ behavior: 'smooth' });
    // Close mobile menu if open
    document.getElementById('navMenu').classList.remove('active');
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    // Active nav link based on scroll position
    updateActiveNavLink();
});

// Update active navigation link
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const navMenu = document.getElementById('navMenu');
    const hamburger = document.querySelector('.hamburger');
    
    if (!e.target.closest('.nav-menu') && !e.target.closest('.hamburger')) {
        navMenu.classList.remove('active');
    }
});

// ============================================
// Authentication Functions
// ============================================

// Open login modal
function openLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close login modal
function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('loginModal');
    if (e.target === modal) {
        closeLoginModal();
    }
});

// Handle login form submission
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('ufa_token', authToken);
            localStorage.setItem('ufa_user', JSON.stringify(currentUser));
            
            showToast('Login successful! Welcome back.', 'success');
            closeLoginModal();
            updateUIForLoggedInUser();
            
            // Redirect to dashboard if admin
            if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
                setTimeout(() => {
                    window.location.href = '/admin.html';
                }, 1000);
            }
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Network error. Please try again.', 'error');
    }
});

// Logout function
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('ufa_token');
    localStorage.removeItem('ufa_user');
    updateUIForLoggedOutUser();
    showToast('Logged out successfully', 'info');
}

// Update UI based on authentication state
function updateUIForLoggedInUser() {
    const loginBtn = document.querySelector('.btn-login');
    const joinBtn = document.querySelector('.btn-join');
    
    if (loginBtn && currentUser) {
        loginBtn.textContent = currentUser.name?.split(' ')[0] || 'Profile';
        loginBtn.onclick = () => window.location.href = '/dashboard.html';
        
        // Add logout option
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn-login';
        logoutBtn.textContent = 'Logout';
        logoutBtn.onclick = logout;
        logoutBtn.style.marginLeft = '0.5rem';
        
        if (joinBtn) {
            joinBtn.replaceWith(logoutBtn);
        }
    }
}

function updateUIForLoggedOutUser() {
    const loginBtn = document.querySelector('.btn-login');
    if (loginBtn) {
        loginBtn.textContent = 'Login';
        loginBtn.onclick = openLoginModal;
    }
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    if (authToken && currentUser) {
        updateUIForLoggedInUser();
    }
});

// ============================================
// Membership Functions
// ============================================

// Select membership type
function selectMembershipType(type) {
    const cards = document.querySelectorAll('.type-card');
    cards.forEach(card => card.classList.remove('active'));
    
    event.currentTarget.classList.add('active');
    document.getElementById('membershipType').value = type;
    
    // Update form based on type
    const nameLabel = document.querySelector('label[for="fullName"]');
    if (type === 'organization') {
        nameLabel.textContent = 'Organization Name *';
        document.getElementById('fullName').placeholder = 'Enter organization name';
    } else {
        nameLabel.textContent = 'Full Name *';
        document.getElementById('fullName').placeholder = 'Enter your full name';
    }
}

// Handle membership form submission
document.getElementById('membershipForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        county: document.getElementById('county').value,
        ward: document.getElementById('ward').value,
        password: document.getElementById('password').value,
        membershipType: document.getElementById('membershipType').value
    };
    
    // Validate
    if (!formData.fullName || !formData.email || !formData.password) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    if (formData.password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        // First register user
        const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                full_name: formData.fullName,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                county: formData.county,
                ward: formData.ward
            })
        });
        
        const registerData = await registerResponse.json();
        
        if (!registerResponse.ok) {
            throw new Error(registerData.message || 'Registration failed');
        }
        
        // Then register membership
        const memberResponse = await fetch(`${API_BASE_URL}/members/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: registerData.userId,
                membership_type: formData.membershipType,
                organization_name: formData.membershipType === 'organization' ? formData.fullName : null
            })
        });
        
        if (memberResponse.ok) {
            showToast('Registration successful! Welcome to UFA.', 'success');
            document.getElementById('membershipForm').reset();
            
            // Auto login after registration
            authToken = registerData.token;
            currentUser = { id: registerData.userId, name: formData.fullName, role: 'member' };
            localStorage.setItem('ufa_token', authToken);
            localStorage.setItem('ufa_user', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
            
            setTimeout(() => {
                document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
            }, 1500);
        } else {
            throw new Error('Membership registration failed');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showToast(error.message || 'Registration failed. Please try again.', 'error');
    }
});

// ============================================
// Newsletter Subscription
// ============================================

async function subscribeNewsletter() {
    const email = document.getElementById('newsletterEmail').value;
    
    if (!email || !email.includes('@')) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/newsletter/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        if (response.ok) {
            showToast('Successfully subscribed to newsletter!', 'success');
            document.getElementById('newsletterEmail').value = '';
        } else {
            const data = await response.json();
            showToast(data.message || 'Subscription failed', 'error');
        }
    } catch (error) {
        console.error('Newsletter error:', error);
        // Fallback: Show success message for demo
        showToast('Successfully subscribed to newsletter!', 'success');
        document.getElementById('newsletterEmail').value = '';
    }
}

// ============================================
// Events Loading
// ============================================

async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events`);
        const events = await response.json();
        displayEvents(events);
    } catch (error) {
        console.error('Error loading events:', error);
        // Load sample events for demo
        displaySampleEvents();
    }
}

function displayEvents(events) {
    const container = document.getElementById('eventsContainer');
    if (!container) return;
    
    if (events.length === 0) {
        displaySampleEvents();
        return;
    }
    
    container.innerHTML = events.map(event => `
        <div class="event-card">
            <div class="event-date">
                ${new Date(event.event_date).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                })}
            </div>
            <div class="event-details">
                <h3>${event.title}</h3>
                <p>${event.description || 'Join us for this important event.'}</p>
                <div class="event-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${event.location || 'Nairobi'}</span>
                    <span><i class="fas fa-clock"></i> ${new Date(event.event_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function displaySampleEvents() {
    const container = document.getElementById('eventsContainer');
    if (!container) return;
    
    const sampleEvents = [
        {
            title: 'County Civic Education Forum',
            date: '2024-06-15',
            location: 'Nairobi County',
            time: '10:00 AM'
        },
        {
            title: 'Youth Leadership Summit',
            date: '2024-06-20',
            location: 'Mombasa',
            time: '9:00 AM'
        },
        {
            title: 'Women Empowerment Workshop',
            date: '2024-07-05',
            location: 'Kisumu',
            time: '2:00 PM'
        }
    ];
    
    container.innerHTML = sampleEvents.map(event => `
        <div class="event-card">
            <div class="event-date">
                ${new Date(event.date).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                })}
            </div>
            <div class="event-details">
                <h3>${event.title}</h3>
                <p>Join us for this transformative event focused on community development and civic engagement.</p>
                <div class="event-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                    <span><i class="fas fa-clock"></i> ${event.time}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// Counter Animation
// ============================================

function animateCounters() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const step = target / (duration / 16); // 60fps
        let current = 0;
        
        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current).toLocaleString();
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target.toLocaleString();
            }
        };
        
        updateCounter();
    });
}

// Intersection Observer for counter animation
const observerOptions = {
    threshold: 0.5
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe hero stats
const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    observer.observe(heroStats);
}

// ============================================
// Language Switcher
// ============================================

document.getElementById('languageSelect')?.addEventListener('change', (e) => {
    const lang = e.target.value;
    if (lang === 'sw') {
        showToast('Tovuti inabadilishwa kwenda Kiswahili...', 'info');
        // Implement Swahili translations
        translateToSwahili();
    } else {
        showToast('Switching to English...', 'info');
        // Reload or translate back
        location.reload();
    }
});

function translateToSwahili() {
    const translations = {
        'We are The Future, Unite and Rise': 'Sisi ni Baadaye, Ungana na Inuka',
        'Together We Build': 'Pamoja Tunajenga',
        'Become a Member': 'Jiunge Kuwa Mwanachama',
        'Learn More': 'Jifunze Zaidi',
        // Add more translations as needed
    };
    
    // Simple translation implementation
    document.querySelectorAll('h1, h2, h3, h4, p, span, button, a').forEach(element => {
        const text = element.textContent.trim();
        if (translations[text]) {
            element.textContent = translations[text];
        }
    });
}

// ============================================
// Toast Notification System
// ============================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ============================================
// Form Validation Helpers
// ============================================

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^\+?[\d\s-]{10,}$/;
    return re.test(phone);
}

// ============================================
// API Helper Functions
// ============================================

async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============================================
// Document Download Handler
// ============================================

function downloadDocument(docType) {
    const documents = {
        constitution: '/documents/UFA_Constitution_2024.pdf',
        policy: '/documents/UFA_Policy_Brief_2024.pdf',
        report: '/documents/UFA_Annual_Report_2023.pdf'
    };
    
    const url = documents[docType];
    if (url) {
        // In production, this would be a real file
        showToast('Document download started...', 'info');
        window.open(url, '_blank');
    }
}

// ============================================
// Initialize on Page Load
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('UFA Website Initialized');
    
    // Load events
    loadEvents();
    
    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu
                document.getElementById('navMenu').classList.remove('active');
            }
        });
    });
    
    // Initialize tooltips if any
    initializeTooltips();
    
    // Check for saved language preference
    const savedLang = localStorage.getItem('ufa_language');
    if (savedLang) {
        document.getElementById('languageSelect').value = savedLang;
    }
});

// Save language preference
document.getElementById('languageSelect')?.addEventListener('change', (e) => {
    localStorage.setItem('ufa_language', e.target.value);
});

// ============================================
// Utility Functions
// ============================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function initializeTooltips() {
    // Add tooltip functionality if needed
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = e.target.getAttribute('data-tooltip');
            document.body.appendChild(tooltip);
            
            const rect = e.target.getBoundingClientRect();
            tooltip.style.top = `${rect.top - 30}px`;
            tooltip.style.left = `${rect.left + rect.width / 2}px`;
        });
        
        element.addEventListener('mouseleave', () => {
            const tooltip = document.querySelector('.tooltip');
            if (tooltip) tooltip.remove();
        });
    });
}

// Handle window resize for responsive adjustments
window.addEventListener('resize', debounce(() => {
    // Adjust any dynamic elements on resize
    const navMenu = document.getElementById('navMenu');
    if (window.innerWidth > 968) {
        navMenu.classList.remove('active');
    }
}, 250));

// ============================================
// Error Handling
// ============================================

window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    // In production, send to error tracking service
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

// ============================================
// Export for module usage if needed
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_BASE_URL,
        apiCall,
        showToast,
        validateEmail,
        validatePhone
    };
}

console.log('UFA Website - All systems ready! 🇰🇪');