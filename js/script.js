/**
 * MHARA Real Estate - Vanilla JavaScript
 * Handles Project Filtering, Form Submissions connected to MongoDB API,
 * Password Show/Hide, and Authentication State
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initPasswordToggles();
  initProjectFilters();
  initLoginForm();
  initSignupForm();
  initContactForm();
  initVisitModal();
  initAuthStatus();
  loadProjectsIntoForms();
  initProjectCatalog();
  initHomeFeaturedProject();
  initProjectDetailPage();
  initFeedbackForm();
});

/* ==========================================================================
   1. Mobile Navigation Menu Toggle
   ========================================================================== */
function initMobileMenu() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  if (!menuBtn) return;

  menuBtn.addEventListener('click', () => {
    const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.setAttribute('aria-expanded', !isExpanded);

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
        <a href="feedback.html" class="nav-link">Feedback</a>
        <a href="login.html" class="nav-link auth-login-link" style="font-weight:700;">Login</a>
        <a href="signup.html" class="nav-link text-bronze auth-signup-link" style="font-weight:700;">Sign Up</a>
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

      if (isPassword) {
        button.innerHTML = `
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        `;
        button.setAttribute('aria-label', 'Hide password');
      } else {
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
  const searchInput = document.getElementById('projectSearchInput');
  const noResultsMsg = document.getElementById('noProjectsFound');

  if (filterPills.length === 0 && !searchInput) return;

  let currentCategory = 'all';
  let searchQuery = '';

  function applyFilters() {
    const projectCards = document.querySelectorAll('.project-card');
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

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.getAttribute('data-filter') || 'all';
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      applyFilters();
    });
  }
}

/* ==========================================================================
   4. Login Form Connected to MongoDB
   ========================================================================== */
function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const alertBox = document.getElementById('loginAlert');

  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    showAlert(alertBox, '', '');

    if (!email) {
      showAlert(alertBox, 'Please enter your email address.', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showAlert(alertBox, 'Please enter a valid email address.', 'error');
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

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying credentials...';
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember: document.getElementById('rememberMe')?.checked === true })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showAlert(alertBox, data.error || 'Authentication failed. Please check your credentials.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'ACCESS PRIVATE ARCHIVES â†’';
        }
        return;
      }

      localStorage.setItem('mhara_user', JSON.stringify(data.user));
      showAlert(alertBox, data.message || 'Login successful! Redirecting...', 'success');

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1200);
    } catch (err) {
      console.error('Login network error:', err);
      showAlert(alertBox, 'Unable to connect to the server. Please try again.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'ACCESS PRIVATE ARCHIVES â†’';
      }
    }
  });
}

/* ==========================================================================
   5. Sign Up Form Connected to MongoDB
   ========================================================================== */
function initSignupForm() {
  const signupForm = document.getElementById('signupForm');
  const alertBox = document.getElementById('signupAlert');

  if (!signupForm) return;

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('signupFullName')?.value.trim();
    const email = document.getElementById('signupEmail')?.value.trim();
    const phone = document.getElementById('signupPhone')?.value.trim();
    const password = document.getElementById('signupPassword')?.value;
    const confirmPassword = document.getElementById('signupConfirmPassword')?.value;
    const termsChecked = document.getElementById('signupTerms')?.checked;
    const submitBtn = signupForm.querySelector('button[type="submit"]');

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

    if (!password || password.length < 8) {
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

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showAlert(alertBox, data.error || 'Registration failed. Please try again.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'COMPLETE REGISTRATION â†’';
        }
        return;
      }

      showAlert(alertBox, 'Account successfully created on MongoDB! Redirecting to login...', 'success');

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    } catch (err) {
      console.error('Signup error:', err);
      showAlert(alertBox, 'Unable to connect to the server. Please try again.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'COMPLETE REGISTRATION â†’';
      }
    }
  });
}

/* ==========================================================================
   6. Contact Enquiry Form Connected to MongoDB
   ========================================================================== */
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  const alertBox = document.getElementById('contactAlert');

  if (!contactForm) return;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('enquiryName')?.value.trim();
    const phone = document.getElementById('enquiryPhone')?.value.trim();
    const email = document.getElementById('enquiryEmail')?.value.trim();
    const project = document.getElementById('enquiryProject')?.value;
    const message = document.getElementById('enquiryMessage')?.value.trim();
    const submitBtn = contactForm.querySelector('button[type="submit"]');

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

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Submitting Enquiry...';
      }

      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, project, projectId: contactForm.querySelector('#enquiryProject')?.selectedOptions[0]?.dataset.projectId, message })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showAlert(alertBox, data.error || 'Failed to submit enquiry. Please try again.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>SUBMIT ENQUIRY</span><span>&rarr;</span>';
        }
        return;
      }

      showAlert(alertBox, data.message || 'Thank you! Your enquiry has been saved to MongoDB.', 'success');
      contactForm.reset();

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>SUBMIT ENQUIRY</span><span>&rarr;</span>';
      }
    } catch (err) {
      console.error('Contact error:', err);
      showAlert(alertBox, 'Unable to connect to the server. Please try again.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>SUBMIT ENQUIRY</span><span>&rarr;</span>';
      }
    }
  });
}

/* ==========================================================================
   7. Schedule a Visit Modal Connected to MongoDB
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
    visitForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('visitName')?.value.trim();
      const phone = document.getElementById('visitPhone')?.value.trim();
      const projectSelect = document.getElementById('visitProject');
      const selectedOption = projectSelect?.selectedOptions[0];
      const project = selectedOption?.dataset.projectName || '';
      const projectId = projectSelect?.value || '';
      const visitDate = document.getElementById('visitDate')?.value;
      const submitBtn = visitForm.querySelector('button[type="submit"]');

      showAlert(visitAlert, '', '');

      if (!name || !phone || !project || !visitDate) {
        showAlert(visitAlert, 'Please complete all fields.', 'error');
        return;
      }

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Scheduling Visit...';
        }

        const response = await fetch('/api/visits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, project, projectId, visitDate })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          showAlert(visitAlert, data.error || 'Failed to schedule visit.', 'error');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirm Visit Schedule â†’';
          }
          return;
        }

        showAlert(visitAlert, data.message || 'Site visit successfully scheduled in MongoDB!', 'success');
        setTimeout(() => {
          modal.classList.remove('open');
          visitForm.reset();
          showAlert(visitAlert, '', '');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirm Visit Schedule â†’';
          }
        }, 1800);
      } catch (err) {
        console.error('Visit error:', err);
        showAlert(visitAlert, 'Unable to connect to the server. Please try again.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirm Visit Schedule â†’';
        }
      }
    });
  }
}

/* ==========================================================================
   8. User Authentication State in Navigation
   ========================================================================== */
function initAuthStatus() {
  try {
    const storedUser = localStorage.getItem('mhara_user');
    if (!storedUser) return;

    const user = JSON.parse(storedUser);
    if (!user || !user.fullName) return;

    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
      const loginBtn = navActions.querySelector('.btn-nav-login');
      if (loginBtn) {
        const firstName = user.fullName.split(' ')[0];
        loginBtn.textContent = `Hi, ${firstName}`;
        loginBtn.href = 'javascript:void(0)';
        loginBtn.title = 'Click to Logout';
        loginBtn.style.cursor = 'pointer';

        loginBtn.addEventListener('click', () => {
          if (confirm(`Logged in as ${user.fullName} (${user.email}). Do you want to logout?`)) {
            fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
            localStorage.removeItem('mhara_user');
            window.location.reload();
          }
        });
      }
    }
  } catch (e) {
    // Graceful fallback
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

/* Live project catalogue, project detail hydration, and feedback submission. */
async function getProjects() {
  const response = await fetch('/api/projects');
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Could not load projects.');
  return result.data;
}

function createProjectCard(project) {
  const card = document.createElement('article');
  card.className = 'project-card';
  card.dataset.category = (Array.isArray(project.category) ? project.category : [project.category]).join(' ').toLowerCase();
  const thumb = document.createElement('div'); thumb.className = 'card-thumb';
  const image = document.createElement('img'); image.src = project.image; image.alt = `${project.title} development`; image.loading = 'lazy'; thumb.append(image);
  const body = document.createElement('div'); body.className = 'card-body';
  const title = document.createElement('h3'); title.className = 'card-title'; title.textContent = project.title;
  const location = document.createElement('div'); location.className = 'card-location'; location.textContent = project.location;
  const price = document.createElement('p'); price.className = 'card-price'; price.textContent = project.price || '';
  const link = document.createElement('a'); link.className = 'card-btn'; link.href = `project-detailss.html?id=${encodeURIComponent(project._id)}`; link.textContent = 'View Details →';
  body.append(title, location, price, link); card.append(thumb, body); return card;
}

function initProjectCatalog() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  const empty = document.getElementById('noProjectsFound');
  getProjects().then(projects => {
    grid.replaceChildren(...projects.map(createProjectCard));
    if (empty) { empty.style.display = projects.length ? 'none' : 'block'; grid.append(empty); }
    const input = document.getElementById('projectSearchInput');
    if (input) input.dispatchEvent(new Event('input'));
  }).catch(error => {
    grid.replaceChildren();
    const message = document.createElement('p'); message.className = 'alert-box show error'; message.textContent = error.message;
    grid.append(message);
  });
}

function loadProjectsIntoForms() {
  const selectors = [document.getElementById('enquiryProject'), document.getElementById('visitProject'), document.getElementById('feedbackProject')].filter(Boolean);
  if (!selectors.length) return;
  selectors.forEach(select => {
    const placeholder = select.id === 'feedbackProject' ? 'General feedback (no project)' : select.id === 'visitProject' ? 'Loading developments…' : 'Loading projects…';
    select.replaceChildren(new Option(placeholder, ''));
    select.disabled = true;
    if (select.id === 'visitProject') select.setAttribute('aria-busy', 'true');
  });
  getProjects().then(projects => selectors.forEach(select => {
    const prior = select.value;
    const isVisit = select.id === 'visitProject';
    const placeholder = select.id === 'feedbackProject' ? 'General feedback (no project)' : isVisit ? (projects.length ? 'Select a development' : 'No developments available') : (projects.length ? 'Select a project' : 'No projects available');
    select.replaceChildren(new Option(placeholder, ''));
    projects.forEach(project => {
      const option = new Option(`${project.title} — ${project.location}`, project._id);
      option.dataset.projectId = project._id;
      option.dataset.projectName = project.title;
      select.add(option);
    });
    const requestedId = new URLSearchParams(location.search).get('id');
    if (requestedId && projects.some(project => project._id === requestedId)) select.value = requestedId;
    else if (prior && projects.some(project => project._id === prior)) select.value = prior;
    select.disabled = projects.length === 0;
    if (isVisit) select.removeAttribute('aria-busy');
    const alert = isVisit ? document.getElementById('visitAlert') : null;
    if (isVisit && !projects.length) showAlert(alert, 'No developments are currently available to schedule a visit.', 'error');
  })).catch(error => {
    selectors.forEach(select => {
      const isVisit = select.id === 'visitProject';
      select.replaceChildren(new Option(isVisit ? 'Developments could not be loaded' : 'Projects could not be loaded', ''));
      select.disabled = true;
      if (isVisit) {
        select.removeAttribute('aria-busy');
        showAlert(document.getElementById('visitAlert'), `Unable to load developments. ${error.message}`, 'error');
      }
    });
    console.error('Project options could not be loaded:', error);
  });
  const dateInput = document.getElementById('visitDate');
  if (dateInput) dateInput.min = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
}

function initHomeFeaturedProject() {
  const card = document.querySelector('.featured-card');
  if (!card) return;
  getProjects().then(projects => {
    const project = projects.find(item => item.featured) || projects[0];
    if (!project) return;
    card.querySelector('.featured-name').textContent = project.title;
    card.querySelector('.featured-sub').textContent = `${(project.category || []).join(' · ')} · ${project.location}`;
    card.querySelector('.featured-desc').textContent = project.description || '';
    card.querySelector('.featured-media img').src = project.image;
    card.querySelector('.featured-media img').alt = `${project.title} development`;
    const link = card.querySelector('.featured-info .btn-black');
    if (link) link.href = `project-detailss.html?id=${encodeURIComponent(project._id)}`;
  }).catch(error => console.error('Featured project could not be loaded:', error));
}

function initProjectDetailPage() {
  if (!document.querySelector('.details-page-wrap')) return;
  const id = new URLSearchParams(location.search).get('id');
  const url = id ? `/api/projects/${encodeURIComponent(id)}` : '/api/projects';
  fetch(url).then(async response => {
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Could not load this project.');
    const project = id ? result.data : (result.data.find(item => item.featured) || result.data[0]);
    if (!project) throw new Error('No projects are available.');
    document.title = `${project.title} | Project Details | MHARA Real Estate`;
    const breadcrumb = document.querySelector('.breadcrumb-current'); if (breadcrumb) breadcrumb.textContent = project.title;
    const heroImage = document.querySelector('.detail-main-image img'); if (heroImage) { heroImage.src = project.image; heroImage.alt = project.title; }
    const locationValue = document.querySelector('.detail-specs-card .spec-row .spec-val'); if (locationValue) locationValue.textContent = project.location;
    const typeValue = document.querySelectorAll('.detail-specs-card .spec-row .spec-val')[1]; if (typeValue) typeValue.textContent = (project.category || []).join(', ');
    const priceValue = document.querySelectorAll('.detail-specs-card .spec-row .spec-val')[6]; if (priceValue) priceValue.textContent = project.price || 'Contact us';
    const heading = document.querySelector('.overview-grid .detail-section-title'); if (heading) heading.textContent = `${project.title} Overview`;
    const overview = document.querySelector('.overview-text'); if (overview && project.description) overview.textContent = project.description;
    const cta = document.querySelector('.detail-cta-title'); if (cta) cta.textContent = `Ready to explore ${project.title}?`;
    const visitProject = document.getElementById('visitProject');
    if (visitProject && Array.from(visitProject.options).some(option => option.value === project._id)) visitProject.value = project._id;
  }).catch(error => {
    const main = document.querySelector('.details-page-wrap .container');
    if (main) { const note = document.createElement('p'); note.className = 'alert-box show error'; note.setAttribute('role', 'alert'); note.textContent = error.message; main.prepend(note); }
  });
}

function initFeedbackForm() {
  const form = document.getElementById('feedbackForm');
  if (!form) return;
  const alertBox = document.getElementById('feedbackAlert');
  const ratingInput = document.getElementById('feedbackRating');
  const ratingValue = document.getElementById('ratingValue');
  ratingInput?.addEventListener('input', () => { if (ratingValue) ratingValue.textContent = `${ratingInput.value} / 5`; });
  form.addEventListener('submit', async event => {
    event.preventDefault(); showAlert(alertBox, '', '');
    const name = document.getElementById('feedbackName').value.trim();
    const email = document.getElementById('feedbackEmail').value.trim();
    const rating = Number(ratingInput.value);
    const project = document.getElementById('feedbackProject').value.trim();
    const message = document.getElementById('feedbackMessage').value.trim();
    if (name.length < 2) return showAlert(alertBox, 'Enter your name (at least 2 characters).', 'error');
    if (!isValidEmail(email)) return showAlert(alertBox, 'Enter a valid email address.', 'error');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return showAlert(alertBox, 'Choose a rating from 1 to 5.', 'error');
    if (message.length < 10 || message.length > 2000) return showAlert(alertBox, 'Feedback must be between 10 and 2000 characters.', 'error');
    const button = form.querySelector('[type="submit"]'); button.disabled = true; button.textContent = 'Sending feedback…';
    try {
      const response = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, rating, project, projectId: form.querySelector('#feedbackProject')?.selectedOptions[0]?.dataset.projectId, message }) });
      const result = await response.json();
      if (!response.ok || !result.success) { showAlert(alertBox, result.error || Object.values(result.fields || {}).join(' '), 'error'); return; }
      showAlert(alertBox, result.message, 'success'); form.reset(); if (ratingValue) ratingValue.textContent = '5 / 5';
    } catch (error) { showAlert(alertBox, 'Unable to reach the server. Please try again.', 'error'); }
    finally { button.disabled = false; button.textContent = 'Submit feedback'; }
  });
}
