/**
 * MHARA Real Estate - Vanilla JavaScript
 * Handles Project Filtering, Form Validation, Password Show/Hide, and Navigation
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initPasswordToggles();
  initProjectFilters();
  initLoginForm();
  initSignupForm();
  initContactForm();
  initVisitModal();
});

/* ==========================================================================
   1. Mobile Navigation Menu Toggle
   ========================================================================== */
function initMobileMenu() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const navMenu = document.querySelector('.nav-menu');
  const navActions = document.querySelector('.nav-actions');

  if (!menuBtn) return;

  menuBtn.addEventListener('click', () => {
    const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.setAttribute('aria-expanded', !isExpanded);

    // Toggle mobile menu visibility
    let mobileDrawer = document.getElementById('mobileNavDrawer');
    if (!mobileDrawer) {
      mobileDrawer = document.createElement('div');
      mobileDrawer.id = 'mobileNavDrawer';
      mobileDrawer.className = 'mobile-nav-drawer';
      mobileDrawer.innerHTML = `
        <a href="index.html" class="nav-link">Home</a>
        <a href="projects.html" class="nav-link">Projects</a>
        <a href="about.html" class="nav-link">About Us</a>
        <a href="contact.html" class="nav-link">Contact Us</a>
        <a href="login.html" class="nav-link" style="font-weight:700;">Login</a>
        <a href="signup.html" class="nav-link text-bronze" style="font-weight:700;">Sign Up</a>
        <button class="btn-primary open-visit-modal" style="width:100%;margin-top:0.5rem;">Schedule a Visit</button>
      `;
      document.querySelector('.site-header').appendChild(mobileDrawer);
    } else {
      mobileDrawer.style.display = mobileDrawer.style.display === 'none' ? 'flex' : 'none';
    }
  });
}

/* ==========================================================================
   2. Password Show / Hide Toggle
   ========================================================================== */
function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.toggle-password-btn');

  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const input = document.getElementById(targetId);

      if (!input) return;

      const isPassword = input.getAttribute('type') === 'password';
      input.setAttribute('type', isPassword ? 'text' : 'password');

      // Update icon SVG
      if (isPassword) {
        // Eye Off (visible)
        button.innerHTML = `
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        `;
        button.setAttribute('aria-label', 'Hide password');
      } else {
        // Eye Normal (hidden)
        button.innerHTML = `
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        `;
        button.setAttribute('aria-label', 'Show password');
      }
    });
  });
}

/* ==========================================================================
   3. Projects Page Filter & Search
   ========================================================================== */
function initProjectFilters() {
  const filterPills = document.querySelectorAll('.filter-pill');
  const projectCards = document.querySelectorAll('.project-card');
  const searchInput = document.getElementById('projectSearchInput');
  const noResultsMsg = document.getElementById('noProjectsFound');

  if (filterPills.length === 0 && !searchInput) return;

  let currentCategory = 'all';
  let searchQuery = '';

  function applyFilters() {
    let visibleCount = 0;

    projectCards.forEach(card => {
      const categories = card.getAttribute('data-category')?.toLowerCase().split(' ') || [];
      const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
      const location = card.querySelector('.card-location')?.textContent.toLowerCase() || '';

      const matchesCategory = (currentCategory === 'all') || categories.includes(currentCategory.toLowerCase());
      const matchesSearch = !searchQuery || title.includes(searchQuery) || location.includes(searchQuery);

      if (matchesCategory && matchesSearch) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (noResultsMsg) {
      noResultsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  // Category Pill Clicks
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.getAttribute('data-filter') || 'all';
      applyFilters();
    });
  });

  // Search Input Keyup
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      applyFilters();
    });
  }
}

/* ==========================================================================
   4. Login Form Validation
   ========================================================================== */
function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const alertBox = document.getElementById('loginAlert');

  if (!loginForm) return;

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;

    showAlert(alertBox, '', '');

    // Validation checks
    if (!email) {
      showAlert(alertBox, 'Please enter your email address.', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showAlert(alertBox, 'Please enter a valid email address (e.g. name@domain.com).', 'error');
      return;
    }

    if (!password) {
      showAlert(alertBox, 'Please enter your password.', 'error');
      return;
    }

    if (password.length < 6) {
      showAlert(alertBox, 'Password must be at least 6 characters.', 'error');
      return;
    }

    // Success response (Demo feedback for college project)
    showAlert(alertBox, 'Login successful! Welcome back to MHARA.', 'success');

    // Simulate redirection to home page after short delay
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  });
}

/* ==========================================================================
   5. Sign Up Form Validation
   ========================================================================== */
function initSignupForm() {
  const signupForm = document.getElementById('signupForm');
  const alertBox = document.getElementById('signupAlert');

  if (!signupForm) return;

  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const fullName = document.getElementById('signupFullName')?.value.trim();
    const email = document.getElementById('signupEmail')?.value.trim();
    const phone = document.getElementById('signupPhone')?.value.trim();
    const password = document.getElementById('signupPassword')?.value;
    const confirmPassword = document.getElementById('signupConfirmPassword')?.value;
    const termsChecked = document.getElementById('signupTerms')?.checked;

    showAlert(alertBox, '', '');

    if (!fullName || fullName.length < 2) {
      showAlert(alertBox, 'Please enter your full name.', 'error');
      return;
    }

    if (!email || !isValidEmail(email)) {
      showAlert(alertBox, 'Please enter a valid email address.', 'error');
      return;
    }

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      showAlert(alertBox, 'Please enter a valid 10-digit phone number.', 'error');
      return;
    }

    if (!password || password.length < 6) {
      showAlert(alertBox, 'Password must be at least 6 characters long.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showAlert(alertBox, 'Passwords do not match. Please verify.', 'error');
      return;
    }

    if (!termsChecked) {
      showAlert(alertBox, 'You must agree to the Terms & Conditions and Privacy Policy.', 'error');
      return;
    }

    // Success response (Demo feedback for college project)
    showAlert(alertBox, 'Account created successfully! Redirecting to login...', 'success');

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1800);
  });
}

/* ==========================================================================
   6. Contact Enquiry Form Validation
   ========================================================================== */
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  const alertBox = document.getElementById('contactAlert');

  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('enquiryName')?.value.trim();
    const phone = document.getElementById('enquiryPhone')?.value.trim();
    const email = document.getElementById('enquiryEmail')?.value.trim();
    const project = document.getElementById('enquiryProject')?.value;
    const message = document.getElementById('enquiryMessage')?.value.trim();

    showAlert(alertBox, '', '');

    if (!name || name.length < 2) {
      showAlert(alertBox, 'Please enter your full name.', 'error');
      return;
    }

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      showAlert(alertBox, 'Please enter a valid 10-digit phone number.', 'error');
      return;
    }

    if (!email || !isValidEmail(email)) {
      showAlert(alertBox, 'Please enter a valid email address.', 'error');
      return;
    }

    if (!project) {
      showAlert(alertBox, 'Please select a project of interest.', 'error');
      return;
    }

    // Success response
    showAlert(alertBox, 'Thank you! Your enquiry has been submitted. Our property advisor will reach out to you within 24 hours.', 'success');
    contactForm.reset();
  });
}

/* ==========================================================================
   7. Schedule a Visit Modal
   ========================================================================== */
function initVisitModal() {
  const openButtons = document.querySelectorAll('.open-visit-modal');
  const modal = document.getElementById('visitModal');
  const closeBtn = document.getElementById('closeVisitModal');
  const visitForm = document.getElementById('visitForm');
  const visitAlert = document.getElementById('visitAlert');

  if (!modal) return;

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('open');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
    }
  });

  if (visitForm) {
    visitForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showAlert(visitAlert, 'Thank you! Our site visit coordinator will contact you shortly.', 'success');
      setTimeout(() => {
        modal.classList.remove('open');
        visitForm.reset();
        showAlert(visitAlert, '', '');
      }, 2000);
    });
  }
}

/* ==========================================================================
   Helper Utilities
   ========================================================================== */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function showAlert(element, message, type) {
  if (!element) return;
  if (!message) {
    element.className = 'alert-box';
    element.textContent = '';
    return;
  }
  element.className = `alert-box show ${type}`;
  element.textContent = message;
}

