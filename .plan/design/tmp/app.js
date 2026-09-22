// ==============================================================================
// ZEIRA SANCTUARY GUILD — INTERACTIVE PRESENTATION SCRIPT
// Handles: 15-Minute Seat Lock Modal, Countdown, Date Picker, Filter Chips, FAQ
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initModal();
  initFaq();
  initDateTabs();
  initFilterChips();
  initPassbookTabs();
});

// Modal & 15-Minute Countdown Simulation
let countdownInterval = null;

function initModal() {
  const modalOverlay = document.getElementById('checkout-modal');
  const closeBtn = document.getElementById('modal-close');
  const triggerBtns = document.querySelectorAll('.btn-reservasi, .btn-book-sm, .btn-sesi-lock, .btn-brass, [data-trigger="modal"]');

  if (!modalOverlay) return;

  triggerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const title = btn.getAttribute('data-class-title') || 'Dynamic Core Reformer';
      const price = btn.getAttribute('data-class-price') || 'Rp 250.000';
      const trainer = btn.getAttribute('data-trainer') || 'Kenji Sato (Polestar Master)';
      
      const modalTitleEl = document.getElementById('modal-class-title');
      const modalPriceEl = document.getElementById('modal-price');
      const modalTrainerEl = document.getElementById('modal-trainer');
      
      if (modalTitleEl) modalTitleEl.textContent = title;
      if (modalPriceEl) modalPriceEl.textContent = price;
      if (modalTrainerEl) modalTrainerEl.textContent = trainer;

      modalOverlay.classList.add('active');
      startCountdown(15 * 60); // 15 menit
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modalOverlay.classList.remove('active');
      clearInterval(countdownInterval);
    });
  }

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('active');
      clearInterval(countdownInterval);
    }
  });
}

function startCountdown(duration) {
  let timer = duration;
  const timerEl = document.getElementById('countdown-timer');
  if (!timerEl) return;

  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;

    timerEl.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    if (--timer < 0) {
      clearInterval(countdownInterval);
      timerEl.textContent = "00:00 (Kedaluwarsa)";
      alert("Waktu penahanan kursi 15 menit telah habis. Kursi telah dilepaskan otomatis ke sistem.");
    }
  }, 1000);
}

// FAQ Accordion
function initFaq() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (!questionBtn) return;
    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });
}

// Date Selector Tabs (Jadwal Page)
function initDateTabs() {
  const dateCards = document.querySelectorAll('.date-card');
  dateCards.forEach(card => {
    card.addEventListener('click', () => {
      dateCards.forEach(c => c.classList.remove('date-card--active'));
      card.classList.add('date-card--active');
    });
  });
}

// Category Filter Chips (Jadwal Page)
function initFilterChips() {
  const chips = document.querySelectorAll('.chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');
    });
  });
}

// Passbook Duration Tabs (Home Page)
function initPassbookTabs() {
  const tabBtns = document.querySelectorAll('.passbook-tab-btn');
  const priceVal = document.getElementById('passbook-price-display');
  
  const prices = {
    '1 Bln': 'Rp 1.850.000',
    '3 Bln': 'Rp 1.650.000',
    '6 Bln': 'Rp 1.450.000',
    '12 Bln': 'Rp 1.250.000'
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('passbook-tab-btn--active'));
      btn.classList.add('passbook-tab-btn--active');
      const term = btn.textContent.trim();
      if (priceVal && prices[term]) {
        priceVal.textContent = prices[term] + ' /bln';
      }
    });
  });
}
