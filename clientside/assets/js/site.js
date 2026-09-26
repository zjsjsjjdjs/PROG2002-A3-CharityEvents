const currentPage = window.location.pathname.split('/').pop() || 'index.html';
const navLinks = document.querySelectorAll('.nav-links a');
const navToggle = document.querySelector('.nav-toggle');
const navContainer = document.querySelector('.nav-links');
const API_BASE_URL = window.location.protocol === 'file:' ? 'http://localhost:3000/api' : '/api';

navLinks.forEach((link) => {
  const linkPage = link.getAttribute('href');

  if (linkPage === currentPage) {
    link.classList.add('active');
    link.setAttribute('aria-current', 'page');
  }
});

if (navToggle && navContainer) {
  navToggle.addEventListener('click', () => {
    const isOpen = navContainer.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane',
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
  }).format(Number(value));
}

function brisbaneDateKey(value) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date(value));
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function getTimingLabel(value) {
  return brisbaneDateKey(value) < brisbaneDateKey(new Date()) ? 'past' : 'upcoming';
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function createEventCard(event) {
  const card = document.createElement('article');
  card.className = 'event-card';

  const timingLabel = getTimingLabel(event.event_datetime);
  const tagRow = document.createElement('div');
  tagRow.className = 'tag-row';
  tagRow.append(
    createTextElement('span', 'tag', event.category_name),
    createTextElement('span', `tag timing-tag ${timingLabel}`, timingLabel)
  );

  const title = createTextElement('h3', 'event-title', event.name);
  const date = createTextElement('p', 'event-meta', formatDateTime(event.event_datetime));
  const location = createTextElement('p', 'event-meta', event.location);
  const purpose = createTextElement('p', 'event-purpose', event.purpose);
  const ticketPrice = Number(event.ticket_price);
  const ticket = createTextElement('p', 'event-ticket', ticketPrice === 0 ? 'Free entry' : `${formatCurrency(ticketPrice)} per ticket`);

  const goal = Number(event.fundraising_goal);
  const progress = Number(event.current_progress);
  const progressPercent = goal > 0 ? Math.min(Math.round((progress / goal) * 100), 100) : 0;

  const progressBlock = document.createElement('div');
  progressBlock.className = 'progress-block';

  const progressLabel = createTextElement(
    'p',
    'progress-label',
    `${formatCurrency(progress)} raised of ${formatCurrency(goal)} goal`
  );

  const progressTrack = document.createElement('div');
  progressTrack.className = 'progress-track';
  progressTrack.setAttribute('aria-label', `${progressPercent}% of fundraising goal reached`);

  const progressFill = document.createElement('span');
  progressFill.className = 'progress-fill';
  progressFill.style.width = `${progressPercent}%`;
  progressTrack.append(progressFill);
  progressBlock.append(progressLabel, progressTrack);

  card.append(tagRow, title, date, location, purpose, ticket, progressBlock);

  return card;
}

async function loadHomepageEvents() {
  const eventList = document.querySelector('#event-list');
  const statusMessage = document.querySelector('#events-status');

  if (!eventList || !statusMessage) {
    return;
  }

  eventList.textContent = '';
  statusMessage.hidden = false;
  statusMessage.textContent = 'Loading upcoming events...';

  try {
    const response = await fetch(`${API_BASE_URL}/events/upcoming`);

    if (!response.ok) {
      throw new Error('Unable to load upcoming events.');
    }

    const events = await response.json();
    eventList.textContent = '';

    if (events.length === 0) {
      statusMessage.textContent = 'There are no upcoming events open for registration.';
      return;
    }

    statusMessage.hidden = true;
    events.forEach((event) => {
      eventList.append(createEventCard(event));
    });
  } catch (error) {
    statusMessage.hidden = false;
    statusMessage.textContent = 'Events could not be loaded. Check that the API server and MySQL are running.';
  }
}

loadHomepageEvents();
