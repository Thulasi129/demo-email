// Global State Variables
let currentCourses = [];
let selectedCourse = null;
let currentMailbox = [];

// DOM Elements
const navTabs = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.tab-content');
const toastContainer = document.getElementById('toast-container');

// Course Catalog Elements
const coursesContainer = document.getElementById('courses-container');

// Student Registry Elements
const registryTabBtn = document.getElementById('registry-tab-btn');
const enrollmentForm = document.getElementById('enrollment-form');
const enrollCourseIdInput = document.getElementById('enroll-course-id');
const formCourseTitle = document.getElementById('form-course-title');
const formCourseMeta = document.getElementById('form-course-meta');
const enrollNameInput = document.getElementById('enroll-name');
const enrollEmailInput = document.getElementById('enroll-email');
const enrollPhoneInput = document.getElementById('enroll-phone');
const submitEnrollBtn = document.getElementById('submit-enroll-btn');
const enrollSpinner = document.getElementById('enroll-spinner');

// Success Panel Elements
const enrollmentFlowCard = document.getElementById('enrollment-flow-card');
const enrollmentSuccessCard = document.getElementById('enrollment-success-card');
const successBannerMsg = document.getElementById('success-banner-msg');
const receiptStudentName = document.getElementById('receipt-student-name');
const receiptCourseTitle = document.getElementById('receipt-course-title');
const receiptEnrollmentId = document.getElementById('receipt-enrollment-id');
const receiptDate = document.getElementById('receipt-date');
const receiptPaymentStatus = document.getElementById('receipt-payment-status');
const receiptLetterStatus = document.getElementById('receipt-letter-status');
const receiptDownloadPdf = document.getElementById('receipt-download-pdf');
const viewSandboxEmailBtn = document.getElementById('view-sandbox-email');
const resetEnrollmentFlowBtn = document.getElementById('reset-enrollment-flow');

// Admin Panel Elements
const refreshAdminBtn = document.getElementById('refresh-admin-btn');
const adminRecordsBody = document.getElementById('admin-records-body');

// Mail Sandbox Elements
const mailboxTabBtn = document.getElementById('mailbox-tab-btn');
const mailUnreadCount = document.getElementById('mail-unread-count');
const refreshMailboxBtn = document.getElementById('refresh-mailbox-btn');
const inboxCountBadge = document.getElementById('inbox-count-badge');
const inboxListContainer = document.getElementById('inbox-list-container');
const mailDetailsEmptyState = document.getElementById('mail-details-empty-state');
const mailDetailsActiveContainer = document.getElementById('mail-details-active-container');
const activeMailSubject = document.getElementById('active-mail-subject');
const activeMailFrom = document.getElementById('active-mail-from');
const activeMailTo = document.getElementById('active-mail-to');
const activeMailTime = document.getElementById('active-mail-time');
const activeMailBody = document.getElementById('active-mail-body');
const activeMailAttachmentName = document.getElementById('active-mail-attachment-name');
const activeMailAttachmentDownload = document.getElementById('active-mail-attachment-download');

// SMTP Config Elements
const smtpConfigCard = document.getElementById('smtp-config-card');
const smtpConfigHeader = document.getElementById('smtp-config-header');
const smtpConfigForm = document.getElementById('smtp-config-form');
const smtpHostInput = document.getElementById('smtp-host');
const smtpPortInput = document.getElementById('smtp-port');
const smtpUserInput = document.getElementById('smtp-user');
const smtpPassInput = document.getElementById('smtp-pass');
const senderNameInput = document.getElementById('sender-name');
const senderEmailInput = document.getElementById('sender-email');
const smtpSecureInput = document.getElementById('smtp-secure');
const smtpEnabledInput = document.getElementById('smtp-enabled');
const testTargetEmailInput = document.getElementById('test-target-email');
const testSmtpBtn = document.getElementById('test-smtp-btn');
const testSpinner = document.getElementById('test-spinner');
const saveSpinner = document.getElementById('save-spinner');

/* ==========================================================================
   Initialize Application
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  fetchCourses();
  fetchEnrollments();
  fetchEmails();
  fetchSmtpConfig();
  
  // Collapsed by default
  if (smtpConfigCard) smtpConfigCard.classList.add('collapsed');
  
  // Event listeners
  enrollmentForm.addEventListener('submit', handleEnrollmentSubmit);
  resetEnrollmentFlowBtn.addEventListener('click', resetEnrollmentFlow);
  refreshAdminBtn.addEventListener('click', fetchEnrollments);
  refreshMailboxBtn.addEventListener('click', fetchEmails);
  
  // SMTP settings event listeners
  if (smtpConfigHeader) {
    smtpConfigHeader.addEventListener('click', () => {
      smtpConfigCard.classList.toggle('collapsed');
    });
  }
  if (smtpConfigForm) {
    smtpConfigForm.addEventListener('submit', handleSmtpConfigSave);
  }
  if (testSmtpBtn) {
    testSmtpBtn.addEventListener('click', handleSmtpTest);
  }
});

/* ==========================================================================
   Navigation Router
   ========================================================================== */
function setupNavigation() {
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      
      // Update active nav button
      navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active content layout
      tabContents.forEach(content => {
        if (content.id === targetTab) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });

      // Special Tab-Specific Actions on Entry
      if (targetTab === 'admin-tab') {
        fetchEnrollments();
      } else if (targetTab === 'mailbox-tab') {
        fetchEmails();
        // Clear unread badge
        mailUnreadCount.textContent = '0';
        mailUnreadCount.classList.add('hidden');
      }
    });
  });
}

function switchTab(tabId) {
  const tabButton = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
  if (tabButton) {
    tabButton.click();
  }
}

/* ==========================================================================
   Toast Notification Generator
   ========================================================================== */
function showToast(title, message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  } else {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;

  toastContainer.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

/* ==========================================================================
   Syllabus / Courses Fetch and Render
   ========================================================================== */
async function fetchCourses() {
  try {
    const res = await fetch('/api/courses');
    const courses = await res.json();
    currentCourses = courses;
    renderCoursesList(courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    coursesContainer.innerHTML = `
      <div class="loading-state">
        <p style="color: var(--status-failed)">Failed to synchronize database syllabus records. Please restart server.</p>
      </div>
    `;
  }
}

function renderCoursesList(courses) {
  coursesContainer.innerHTML = '';
  
  courses.forEach(course => {
    const card = document.createElement('div');
    card.className = 'glass-card course-card';
    card.innerHTML = `
      <div class="course-body">
        <div class="course-meta">
          <span class="course-duration">${course.duration}</span>
          <span class="course-price">${course.price}</span>
        </div>
        <h3 class="course-title">${course.title}</h3>
        <p class="course-desc">${course.description}</p>
        <button class="enroll-btn" data-id="${course.id}">
          <svg class="enroll-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
          Enroll in Program
        </button>
      </div>
    `;
    
    // Bind enroll trigger
    card.querySelector('.enroll-btn').addEventListener('click', () => {
      selectCourseForEnrollment(course);
    });
    
    coursesContainer.appendChild(card);
  });
}

function selectCourseForEnrollment(course) {
  selectedCourse = course;
  enrollCourseIdInput.value = course.id;
  formCourseTitle.textContent = course.title;
  formCourseMeta.textContent = `${course.duration} | Course Price: ${course.price}`;
  
  // Clear any previous error indicators
  clearValidationErrors();
  
  // Redirect tab smoothly
  switchTab('registry-tab');
  showToast('Syllabus Selected', `Pre-loaded ${course.title} to registry portal.`, 'info');
}

/* ==========================================================================
   Form Handling & Payment Verification
   ========================================================================== */
function clearValidationErrors() {
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
  document.querySelectorAll('.input-wrapper input').forEach(el => el.classList.remove('invalid'));
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function handleEnrollmentSubmit(e) {
  e.preventDefault();
  clearValidationErrors();

  const name = enrollNameInput.value.trim();
  const email = enrollEmailInput.value.trim();
  const phone = enrollPhoneInput.value.trim();
  const courseId = enrollCourseIdInput.value;
  const paymentStatus = document.querySelector('input[name="paymentStatus"]:checked').value;

  let hasErrors = false;

  // 1. Mandatory Field Checks (Course Selection)
  if (!courseId) {
    showToast('Registry Error', 'Please select a program path from the Courses tab first.', 'error');
    switchTab('courses-tab');
    return;
  }

  // 2. Mandatory Name Checks
  if (name === '') {
    const errorEl = document.getElementById('name-error');
    errorEl.textContent = 'Full name is required to compile certification registries.';
    enrollNameInput.classList.add('invalid');
    hasErrors = true;
  }

  // 3. Email Validation Rules
  if (email === '') {
    const errorEl = document.getElementById('email-error');
    // REQUIREMENT: If email is missing, prevent enrollment completion and show alert "Email address is required to receive your offer letter."
    errorEl.textContent = 'Email address is required to receive your offer letter.';
    enrollEmailInput.classList.add('invalid');
    hasErrors = true;
    showToast('Validation Failed', 'Email address is required to receive your offer letter.', 'error');
  } else if (!validateEmail(email)) {
    const errorEl = document.getElementById('email-error');
    // REQUIREMENT: If email is invalid, display "Please enter a valid email address to continue."
    errorEl.textContent = 'Please enter a valid email address to continue.';
    enrollEmailInput.classList.add('invalid');
    hasErrors = true;
    showToast('Validation Failed', 'Please enter a valid email address to continue.', 'error');
  }

  if (hasErrors) {
    return;
  }

  // Show processing spinners
  submitEnrollBtn.disabled = true;
  enrollSpinner.classList.remove('hidden');

  try {
    const response = await fetch('/api/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, courseId, paymentStatus })
    });

    const result = await response.json();

    if (!response.ok) {
      // Payment Failed or Validation Server Errors
      // REQUIREMENT: "Payment unsuccessful. Please try again."
      const errorMsg = result.error || 'Payment unsuccessful. Please try again.';
      showToast('Gateway Failure', errorMsg, 'error');
      
      // If it's a payment failure, display inline error indicator or form alert
      if (paymentStatus === 'Failed') {
        const emailErrorEl = document.getElementById('email-error');
        emailErrorEl.textContent = 'Payment unsuccessful. Please try again.';
        enrollEmailInput.classList.add('invalid');
      }
      return;
    }

    // Success Enrollment Workflows
    showToast('Onboarding Dispatched', 'Registry database updated successfully.', 'success');
    
    // Refresh admin tables and mailboxes in background
    fetchEnrollments();
    fetchEmails();

    // Render Success Receipt Panel
    renderSuccessState(result.enrollment, result.message);

  } catch (err) {
    console.error('API Server enrollment issue:', err);
    showToast('Network Disconnected', 'Failed to communicate with admissions server.', 'error');
  } finally {
    submitEnrollBtn.disabled = false;
    enrollSpinner.classList.add('hidden');
  }
}

function renderSuccessState(enrollment, successMessage) {
  // Hide Registration Form, display success panel
  enrollmentFlowCard.classList.add('hidden');
  enrollmentSuccessCard.classList.remove('hidden');

  // Populate receipt details
  successBannerMsg.textContent = successMessage || "Congratulations! Your enrollment has been completed successfully. Your offer letter has been generated and sent to your registered email address.";
  receiptStudentName.textContent = enrollment.name;
  receiptCourseTitle.textContent = enrollment.courseName;
  receiptEnrollmentId.textContent = enrollment.id;
  
  receiptDate.textContent = new Date(enrollment.enrollmentDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Render correct payment badge status
  receiptPaymentStatus.textContent = enrollment.paymentStatus.toUpperCase();
  receiptPaymentStatus.className = 'status-tag';
  if (enrollment.paymentStatus === 'Success') {
    receiptPaymentStatus.classList.add('status-tag-success');
    receiptLetterStatus.textContent = 'SENT TO MAILBOX';
    receiptLetterStatus.className = 'status-tag status-tag-success';
    
    // Show download button
    receiptDownloadPdf.classList.remove('hidden');
    receiptDownloadPdf.href = `/api/download-pdf/${enrollment.id}`;
    
    // Enable Sandbox Redirect Button
    viewSandboxEmailBtn.classList.remove('hidden');
    viewSandboxEmailBtn.onclick = () => {
      switchTab('mailbox-tab');
      // Auto select the email that was just sent
      setTimeout(() => {
        const firstEmailRow = document.querySelector('.mail-item-row');
        if (firstEmailRow) firstEmailRow.click();
      }, 300);
    };
  } else {
    // Pending
    receiptPaymentStatus.classList.add('status-tag-neutral');
    receiptLetterStatus.textContent = 'PENDING PAYMENT';
    receiptLetterStatus.className = 'status-tag status-tag-neutral';
    
    // Hide download button & mailbox redirect (no letter generated)
    receiptDownloadPdf.classList.add('hidden');
    viewSandboxEmailBtn.classList.add('hidden');
  }
}

function resetEnrollmentFlow() {
  enrollmentForm.reset();
  
  // Clear previous preview course selections
  selectedCourse = null;
  enrollCourseIdInput.value = '';
  formCourseTitle.textContent = 'Please select a course first';
  formCourseMeta.textContent = '';
  
  clearValidationErrors();
  
  // Swap cards
  enrollmentSuccessCard.classList.add('hidden');
  enrollmentFlowCard.classList.remove('hidden');
  
  // Scroll form container to view top
  enrollmentFlowCard.scrollIntoView({ behavior: 'smooth' });
}

/* ==========================================================================
   Admin Dashboard Records Populate
   ========================================================================== */
async function fetchEnrollments() {
  try {
    const res = await fetch('/api/enrollments');
    const enrollments = await res.json();
    renderAdminTable(enrollments);
  } catch (err) {
    console.error('Error fetching admin enrollments:', err);
  }
}

function renderAdminTable(enrollments) {
  if (enrollments.length === 0) {
    adminRecordsBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table-state">
          <p>No enrollment records found. Start registering students in the Student Portal tab!</p>
        </td>
      </tr>
    `;
    return;
  }

  adminRecordsBody.innerHTML = '';
  
  enrollments.forEach(enrollment => {
    const tr = document.createElement('tr');
    
    // Format payment badge
    let paymentBadge = '';
    if (enrollment.paymentStatus === 'Success') {
      paymentBadge = `<span class="status-badge badge-success">SUCCESS</span>`;
    } else if (enrollment.paymentStatus === 'Pending') {
      paymentBadge = `<span class="status-badge badge-pending">PENDING</span>`;
    } else {
      paymentBadge = `<span class="status-badge badge-failed">FAILED</span>`;
    }

    // Format dispatch badge
    let letterBadge = '';
    if (enrollment.offerLetterStatus === 'Sent') {
      letterBadge = `<span class="status-badge badge-sent">SENT (MAILBOX)</span>`;
    } else if (enrollment.offerLetterStatus === 'Generated') {
      letterBadge = `<span class="status-badge badge-sent">GENERATED</span>`;
    } else if (enrollment.offerLetterStatus === 'Pending Payment') {
      letterBadge = `<span class="status-badge badge-pending">PENDING PMT</span>`;
    } else {
      letterBadge = `<span class="status-badge badge-none">NOT GENERATED</span>`;
    }

    const regDate = new Date(enrollment.enrollmentDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    });

    tr.innerHTML = `
      <td class="id-code" style="font-weight: 600;">${enrollment.id}</td>
      <td>
        <div class="student-info-cell">
          <span class="student-name-text">${enrollment.name}</span>
          <span class="student-email-text">${enrollment.email} | ${enrollment.phone || 'No Phone'}</span>
        </div>
      </td>
      <td><span style="font-weight: 500;">${enrollment.courseName}</span></td>
      <td>${regDate}</td>
      <td>${paymentBadge}</td>
      <td>${letterBadge}</td>
      <td>
        <div class="row-actions-cell">
          ${enrollment.paymentStatus === 'Success' ? `
            <a href="/api/download-pdf/${enrollment.id}" class="row-action-btn" title="Download Offer Letter PDF">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </a>
            <button class="row-action-btn resend-btn" data-id="${enrollment.id}" title="Resend Offer Letter Email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </button>
          ` : `<span style="color: var(--text-muted); font-size: 0.75rem; font-style: italic;">No Actions</span>`}
        </div>
      </td>
    `;
    
    // Bind resend manual action
    const resendBtn = tr.querySelector('.resend-btn');
    if (resendBtn) {
      resendBtn.addEventListener('click', () => handleManualResend(enrollment.id));
    }

    adminRecordsBody.appendChild(tr);
  });
}

async function handleManualResend(enrollmentId) {
  try {
    const res = await fetch('/api/resend-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollmentId })
    });
    const result = await res.json();
    if (res.ok) {
      showToast('Offer Letter Dispatched', 'Manual verification email sent to mailbox logs.', 'success');
      fetchEnrollments();
      fetchEmails();
    } else {
      showToast('Admin Error', result.error || 'Failed to dispatch email.', 'error');
    }
  } catch (err) {
    console.error('Error in manual resend request:', err);
    showToast('Connection Error', 'Admissions server did not respond.', 'error');
  }
}

/* ==========================================================================
   Mail Sandbox Client Populate & Attachment Downloader
   ========================================================================== */
async function fetchEmails() {
  try {
    const res = await fetch('/api/emails');
    const emails = await res.json();
    currentMailbox = emails;
    renderMailboxList(emails);
  } catch (err) {
    console.error('Error fetching simulated emails:', err);
  }
}

function renderMailboxList(emails) {
  // Update unread count badges (for prototype visual realism)
  const count = emails.length;
  inboxCountBadge.textContent = `${count} mail${count === 1 ? '' : 's'}`;
  
  if (count > 0 && mailboxTabBtn.classList.contains('active') === false) {
    // Show count notification on nav bar
    mailUnreadCount.textContent = count;
    mailUnreadCount.classList.remove('hidden');
  }

  if (count === 0) {
    inboxListContainer.innerHTML = `
      <div class="empty-inbox-state">
        <svg class="empty-mail-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-6l-3 3-3-3H2"></path><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
        <p>Simulated inbox empty</p>
        <span>Trigger a payment success enrollment to see letters arrive!</span>
      </div>
    `;
    mailDetailsActiveContainer.classList.add('hidden');
    mailDetailsEmptyState.classList.remove('hidden');
    return;
  }

  inboxListContainer.innerHTML = '';
  
  emails.forEach(email => {
    const item = document.createElement('div');
    item.className = 'mail-item-row';
    
    const timeFormatted = new Date(email.sentAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    item.innerHTML = `
      <div class="mail-item-header">
        <span class="mail-item-sender">Admissions Office</span>
        <span class="mail-item-time">${timeFormatted}</span>
      </div>
      <div class="mail-item-subject">${email.subject}</div>
      <div class="mail-item-snippet">${email.to} - Thank you for enrolling in your new course program...</div>
    `;
    
    item.addEventListener('click', () => {
      // Manage active style highlights
      document.querySelectorAll('.mail-item-row').forEach(row => row.classList.remove('active'));
      item.classList.add('active');
      openEmailDetails(email);
    });

    inboxListContainer.appendChild(item);
  });
}

function openEmailDetails(email) {
  mailDetailsEmptyState.classList.add('hidden');
  mailDetailsActiveContainer.classList.remove('hidden');
  
  const timeFormatted = new Date(email.sentAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric'
  });

  activeMailSubject.textContent = email.subject;
  activeMailFrom.textContent = email.from;
  activeMailTo.textContent = email.to;
  activeMailTime.textContent = timeFormatted;
  activeMailBody.textContent = email.body;

  // Handle Ethereal preview link visibility
  if (email.etherealPreviewUrl) {
    activeMailLivePreview.classList.remove('hidden');
    activeMailLivePreview.href = email.etherealPreviewUrl;
  } else {
    activeMailLivePreview.classList.add('hidden');
    activeMailLivePreview.href = '#';
  }

  // Attachment setups
  if (email.attachment) {
    activeMailAttachmentName.textContent = email.attachment.name;
    
    // Bind click to decode and download the PDF locally in the browser
    activeMailAttachmentDownload.onclick = (e) => {
      e.preventDefault();
      downloadBase64File(
        email.attachment.data, 
        email.attachment.name, 
        email.attachment.mimeType
      );
      showToast('Attachment Downloaded', `Saved ${email.attachment.name} locally.`, 'success');
    };
  }
}

// Client-side base64 binary decoder for local downloads
function downloadBase64File(base64Data, fileName, mimeType) {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(link.href), 100);
}

/* ==========================================================================
   SMTP Config Service API Actions
   ========================================================================== */
async function fetchSmtpConfig() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();
    
    // Populate form fields
    smtpHostInput.value = config.smtpHost || '';
    smtpPortInput.value = config.smtpPort || '587';
    smtpUserInput.value = config.smtpUser || '';
    smtpPassInput.value = config.smtpPass || '';
    senderNameInput.value = config.senderName || 'Aether Academy Registrar';
    senderEmailInput.value = config.senderEmail || '';
    smtpSecureInput.checked = !!config.smtpSecure;
    smtpEnabledInput.checked = !!config.smtpEnabled;
  } catch (err) {
    console.error('Failed to load SMTP configuration:', err);
  }
}

async function handleSmtpConfigSave(e) {
  e.preventDefault();
  
  const config = {
    smtpHost: smtpHostInput.value.trim(),
    smtpPort: Number(smtpPortInput.value.trim()) || 587,
    smtpUser: smtpUserInput.value.trim(),
    smtpPass: smtpPassInput.value,
    senderName: senderNameInput.value.trim(),
    senderEmail: senderEmailInput.value.trim(),
    smtpSecure: smtpSecureInput.checked,
    smtpEnabled: smtpEnabledInput.checked
  };

  // Basic validation check if enabled
  if (config.smtpEnabled) {
    if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
      showToast('Validation Error', 'SMTP Host, Username, and Password are required to enable routing.', 'error');
      return;
    }
  }

  // Show spinner
  const submitBtn = document.getElementById('save-smtp-btn');
  submitBtn.disabled = true;
  saveSpinner.classList.remove('hidden');

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    
    const result = await res.json();
    
    if (res.ok) {
      showToast('Configuration Saved', 'SMTP settings updated successfully.', 'success');
      fetchSmtpConfig();
    } else {
      showToast('Save Failed', result.error || 'Failed to update configurations.', 'error');
    }
  } catch (err) {
    console.error('Error saving config:', err);
    showToast('Network Error', 'Admissions server did not respond.', 'error');
  } finally {
    submitBtn.disabled = false;
    saveSpinner.classList.add('hidden');
  }
}

async function handleSmtpTest() {
  const targetEmail = testTargetEmailInput.value.trim();
  
  if (!targetEmail) {
    showToast('Validation Error', 'Please enter a test recipient email address.', 'error');
    testTargetEmailInput.focus();
    return;
  }

  const config = {
    smtpHost: smtpHostInput.value.trim(),
    smtpPort: Number(smtpPortInput.value.trim()) || 587,
    smtpUser: smtpUserInput.value.trim(),
    smtpPass: smtpPassInput.value,
    senderName: senderNameInput.value.trim(),
    senderEmail: senderEmailInput.value.trim(),
    smtpSecure: smtpSecureInput.checked
  };

  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    showToast('Validation Error', 'Please enter SMTP host, username, and password before testing connection.', 'error');
    return;
  }

  // Show test spinner
  testSmtpBtn.disabled = true;
  testSpinner.classList.remove('hidden');
  showToast('Connecting...', 'Establishing SMTP handshake with mail server...', 'info');

  try {
    const res = await fetch('/api/config/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config, targetEmail })
    });
    
    const result = await res.json();
    
    if (res.ok) {
      let msg = 'Test email dispatched successfully! Verify your inbox.';
      if (result.etherealPreviewUrl) {
        msg += ` <a href="${result.etherealPreviewUrl}" target="_blank" style="color: #60a5fa; text-decoration: underline; font-weight: 600;">Open Ethereal Preview</a>`;
      }
      showToast('Test Delivered', msg, 'success');
    } else {
      showToast('Connection Refused', result.error, 'error');
    }
  } catch (err) {
    console.error('Error sending test SMTP email:', err);
    showToast('Network Timeout', 'Admissions server did not respond.', 'error');
  } finally {
    testSmtpBtn.disabled = false;
    testSpinner.classList.add('hidden');
  }
}

async function handleAutoGenerateSmtp() {
  const submitBtn = document.getElementById('auto-generate-smtp-btn');
  submitBtn.disabled = true;
  autoGenerateSpinner.classList.remove('hidden');
  showToast('Creating Server...', 'Creating free testing mailbox on Ethereal.email...', 'info');

  try {
    const res = await fetch('/api/config/auto-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = await res.json();
    
    if (res.ok) {
      showToast('SMTP Auto-Configured', 'Sandbox Mail server settings configured and activated!', 'success');
      fetchSmtpConfig();
      // Expand config card if collapsed
      if (smtpConfigCard) smtpConfigCard.classList.remove('collapsed');
    } else {
      showToast('Generation Failed', result.error || 'Failed to auto-configure testing server.', 'error');
    }
  } catch (err) {
    console.error('Error auto-generating credentials:', err);
    showToast('Network Error', 'Admissions server did not respond.', 'error');
  } finally {
    submitBtn.disabled = false;
    autoGenerateSpinner.classList.add('hidden');
  }
}
