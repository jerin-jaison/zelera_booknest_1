// ================================================
// ZELERA - Main JavaScript
// Core functionality and scroll animations
// ================================================

document.addEventListener('DOMContentLoaded', function () {

  // ===== NAVBAR SCROLL EFFECT =====
  const navbar = document.querySelector('.navbar');

  window.addEventListener('scroll', function () {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // ===== MOBILE MENU TOGGLE =====
  const navbarToggler = document.querySelector('.navbar-toggler');
  const navbarNav = document.querySelector('.navbar-nav');
  const navCloseBtn = document.querySelector('.nav-close-btn');

  if (navbarToggler) {
    navbarToggler.addEventListener('click', function () {
      navbarNav.classList.toggle('active');

      // Animate hamburger icon
      this.classList.toggle('active');
    });

    // Close button functionality
    if (navCloseBtn) {
      navCloseBtn.addEventListener('click', function () {
        navbarNav.classList.remove('active');
        navbarToggler.classList.remove('active');
      });
    }

    // Close mobile menu when clicking a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', function () {
        navbarNav.classList.remove('active');
        navbarToggler.classList.remove('active');
      });
    });
  }

  // ===== SMOOTH SCROLLING =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);

      if (target) {
        const offsetTop = target.offsetTop - 80; // Account for fixed navbar
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });

  // ===== SCROLL ANIMATIONS =====
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        // Optionally unobserve after animation
        // observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all elements with animate-on-scroll class
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  animatedElements.forEach(el => observer.observe(el));

  // ===== ACTIVE NAV LINK HIGHLIGHTING =====
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', function () {
    let current = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.clientHeight;

      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // ===== FORM VALIDATION =====
  const forms = document.querySelectorAll('form[data-validate]');

  forms.forEach(form => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      let isValid = true;
      const requiredFields = form.querySelectorAll('[required]');

      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.style.borderColor = 'red';
        } else {
          field.style.borderColor = '';
        }
      });

      if (isValid) {
        // Show success message or submit
        showNotification('Form submitted successfully!', 'success');
        form.reset();
      } else {
        showNotification('Please fill in all required fields', 'error');
      }
    });
  });

  // ===== NOTIFICATION SYSTEM =====
  function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
      color: white;
      padding: 1rem 2rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: fadeInRight 0.3s ease;
      font-weight: 600;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Make showNotification globally available
  window.showNotification = showNotification;

  // ===== LAZY LOADING IMAGES =====
  const images = document.querySelectorAll('img[data-src]');

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));

  // ===== RIPPLE EFFECT FOR BUTTONS =====
  function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const rect = button.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add('ripple');

    circle.style.cssText += `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;

    const ripple = button.querySelector('.ripple');
    if (ripple) ripple.remove();

    button.appendChild(circle);
  }

  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.addEventListener('click', createRipple);
  });

  // Add ripple animation keyframes dynamically
  if (!document.querySelector('#ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ===== COUNTER ANIMATION =====
  function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        element.textContent = target;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(start);
      }
    }, 16);
  }

  // Observe counters
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length > 0) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
          const target = parseInt(entry.target.dataset.counter);
          animateCounter(entry.target, target);
          entry.target.classList.add('counted');
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));
  }

  // ===== PARALLAX EFFECT =====
  const parallaxElements = document.querySelectorAll('[data-parallax]');

  if (parallaxElements.length > 0) {
    window.addEventListener('scroll', function () {
      parallaxElements.forEach(element => {
        const speed = element.dataset.parallax || 0.5;
        const yPos = -(window.scrollY * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });
    });
  }

  // ===== TYPEWRITER EFFECT =====
  function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';

    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    }

    type();
  }

  // Check for typewriter elements
  const typewriterElements = document.querySelectorAll('[data-typewriter]');
  typewriterElements.forEach(element => {
    const text = element.textContent;
    const speed = parseInt(element.dataset.speed) || 50;

    const typewriterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('typed')) {
          typeWriter(entry.target, text, speed);
          entry.target.classList.add('typed');
        }
      });
    }, { threshold: 0.5 });

    typewriterObserver.observe(element);
  });

  // ===== MODAL FUNCTIONALITY =====
  const modals = document.querySelectorAll('.modal');
  const modalTriggers = document.querySelectorAll('[data-modal]');
  const modalCloses = document.querySelectorAll('.modal-close');

  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      const modalId = this.dataset.modal;
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  modalCloses.forEach(close => {
    close.addEventListener('click', function () {
      const modal = this.closest('.modal');
      modal.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  // Close modal on backdrop click
  modals.forEach(modal => {
    modal.addEventListener('click', function (e) {
      if (e.target === this) {
        this.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // Close modal on ESC key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal.active');
      if (activeModal) {
        activeModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  });

  // ===== CONSOLE BRANDING =====
  console.log('%c🚀 ZELERA - Premium BookNest Platform', 'font-size: 20px; font-weight: bold; background: linear-gradient(135deg, #FFD700, #00D9FF); -webkit-background-clip: text; -webkit-text-fill-color: transparent;');
  console.log('%cBuilt for serious businesses | Enterprise-grade solution', 'font-size: 14px; color: #666;');

});

// ===== UTILITY FUNCTIONS =====

// Debounce function for performance
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

// Throttle function for scroll events
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Get URL parameters
function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Format currency
function formatCurrency(amount, currency = 'INR') {
  const symbols = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };

  return `${symbols[currency]}${amount.toLocaleString()}`;
}

// Export utility functions globally
window.zelera = {
  debounce,
  throttle,
  getUrlParameter,
  formatCurrency
};
