(() => {
  const form = document.querySelector('#registration-form');
  if (!form) return;
  const fields = document.querySelector('#registration-fields');
  const status = document.querySelector('#registration-status');
  const summary = document.querySelector('#selected-event');
  const backLink = document.querySelector('#back-to-event');
  const submit = document.querySelector('#submit-registration');
  const nameInput = document.querySelector('#attendee-name');
  const emailInput = document.querySelector('#attendee-email');
  const ticketsInput = document.querySelector('#attendee-tickets');
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');
  let selectedEvent = null;
  let submitting = false;

  function showError(message, field) {
    status.hidden = false;
    status.className = 'status-message error-message';
    status.textContent = message;
    window.alert(message);
    if (field) field.focus();
  }

  async function loadSelectedEvent() {
    if (params.getAll('id').length !== 1 || !/^\d+$/.test(eventId || '') ||
        !Number.isSafeInteger(Number(eventId)) || Number(eventId) <= 0) {
      status.textContent = 'No valid event was selected. Return to search and choose an event.';
      status.className = 'status-message error-message';
      summary.textContent = 'Select an event before registering.';
      return;
    }
    backLink.href = 'detail.html?id=' + eventId;
    backLink.hidden = false;
    try {
      const response = await fetch(API_BASE_URL + '/events/' + eventId);
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'This event is unavailable.');
      selectedEvent = body;
      summary.textContent = '';
      summary.append(
        createTextElement('h2', 'register-event-name', body.name),
        createTextElement('p', 'register-date', formatDateTime(body.event_datetime)),
        createTextElement('p', 'event-meta', body.location),
        createTextElement('p', 'register-ticket', Number(body.ticket_price) === 0 ?
          'Free entry' : formatCurrency(body.ticket_price) + ' per ticket')
      );
      fields.disabled = false;
      status.hidden = true;
    } catch (error) {
      summary.textContent = 'Event information could not be loaded.';
      status.className = 'status-message error-message';
      status.textContent = error.message === 'Failed to fetch' ?
        'Unable to load the event. Check your connection and reload this page.' : error.message;
      status.hidden = false;
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!selectedEvent || submitting) return;
    const name = nameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const ticketText = ticketsInput.value.trim();
    const tickets = Number(ticketText);
    if (!name || [...name].length > 120 || /[\u0000-\u001f\u007f]/.test(name)) {
      showError('Enter your full name (1 to 120 characters).', nameInput);
      return;
    }
    emailInput.value = email;
    if (!email || email.length > 254 || emailInput.validity.typeMismatch) {
      showError('Enter a valid email address (maximum 254 characters).', emailInput);
      return;
    }
    if (!/^\d+$/.test(ticketText) || !Number.isInteger(tickets) || tickets < 1 || tickets > 2147483647) {
      showError('Tickets must be a whole number between 1 and 2147483647.', ticketsInput);
      return;
    }
    submitting = true;
    fields.disabled = true;
    submit.textContent = 'Submitting...';
    status.hidden = false;
    status.className = 'status-message';
    status.textContent = 'Saving your registration...';
    let saved = false;
    try {
      const response = await fetch(API_BASE_URL + '/events/' + selectedEvent.event_id + '/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, tickets })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Registration could not be completed.');
      saved = true;
      status.textContent = 'Registration successful. Returning to the event details.';
      window.alert('Registration successful for ' + selectedEvent.name + '. Your registration is now confirmed.');
      window.location.assign('detail.html?id=' + selectedEvent.event_id);
    } catch (error) {
      const message = error instanceof TypeError || error instanceof SyntaxError ?
        'Registration could not be confirmed. Check the event details for your name before trying again.' :
        error.message;
      showError(message);
    } finally {
      if (!saved) {
        submitting = false;
        fields.disabled = false;
        submit.textContent = 'Submit registration';
      }
    }
  });

  loadSelectedEvent();
})();

