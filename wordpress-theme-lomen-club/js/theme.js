/**
 * Lomen Club Theme JavaScript
 * 
 * @package Lomen_Club
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initTheme();
    
    // Mobile menu functionality
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuClose = document.querySelector('.mobile-menu-close');
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenu.style.left = '0';
        });
    }
    
    if (mobileMenuClose && mobileMenu) {
        mobileMenuClose.addEventListener('click', function() {
            mobileMenu.style.left = '-100%';
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (mobileMenu && mobileMenu.style.left === '0px') {
            if (!mobileMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                mobileMenu.style.left = '-100%';
            }
        }
    });
    
    // Theme toggle functionality
    const themeToggle = document.querySelector('.theme-toggle');
    const themeText = document.querySelector('.theme-text');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            toggleTheme();
            updateThemeUI();
        });
    }
    
    // Update theme UI based on current theme
    function updateThemeUI() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        
        if (themeText) {
            themeText.textContent = currentTheme === 'dark' ? 'Light' : 'Dark';
        }
        
        if (sunIcon && moonIcon) {
            if (currentTheme === 'dark') {
                // Current theme is dark, button says "Light" - show sun icon
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
            } else {
                // Current theme is light, button says "Dark" - show moon icon
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
            }
        }
    }
    
    // Initialize theme UI
    updateThemeUI();
    
    // Section navigation functionality
    const navSectionBtns = document.querySelectorAll('.nav-section-btn, .mobile-nav-btn');
    
    navSectionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            scrollToSection(section);
            
            // Close mobile menu if open
            if (mobileMenu && mobileMenu.classList.contains('mobile-open')) {
                mobileMenu.classList.remove('mobile-open');
            }
        });
    });
    
    // Smooth scrolling to sections
    function scrollToSection(section) {
        const targetElement = document.getElementById(section);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
    
    // Smooth scrolling for anchor links
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    
    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Card hover effects enhancement
    const cards = document.querySelectorAll('.card, .blog-post');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transition = 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)';
        });
    });
    
    // Button ripple effect (optional enhancement)
    const buttons = document.querySelectorAll('.btn, .launch-app-btn, .mobile-launch-app-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                transform: scale(0);
                animation: ripple 600ms linear;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add CSS for ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for scroll animations
    const animateElements = document.querySelectorAll('.card, .blog-post, .section-title');
    animateElements.forEach(el => {
        observer.observe(el);
    });
    
    // Add CSS for scroll animations
    const animationStyle = document.createElement('style');
    animationStyle.textContent = `
        .card, .blog-post, .section-title {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .card.animate-in, .blog-post.animate-in, .section-title.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(animationStyle);
    
    // Add loading class to body for initial load animation
    document.body.classList.add('loaded');
});

// Theme toggle functionality
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Initialize theme from localStorage
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Initialize theme on load
initTheme();
