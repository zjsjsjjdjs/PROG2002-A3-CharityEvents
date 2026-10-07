'use strict';
const form = document.getElementById('event-form');
const message = document.getElementById('form-status');
const fieldset = document.getElementById('event-fields');
const save = document.getElementById('save-event');
const retry = document.getElementById('retry-form');
const id = new URLSearchParams(location.search).get('id');
const apiBase = '/api';
async function request(url, options) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) { const error = new Error(body.message || 'The request failed.'); error.fields = body.fields; throw error; }
  return body;
}
function showError(error) {
  message.dataset.error = 'true'; message.textContent = error.message;
  for (const [key, value] of Object.entries(error.fields || {})) {
    const input = form.elements.namedItem(key);
    if (input) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby','form-status'); }
  }
}
async function loadForm() {
  retry.hidden = true; fieldset.disabled = true; save.disabled = true;
  message.textContent = 'Loading categories and organisations…'; message.dataset.error = 'false';
  try {
    if (id !== null && !/^\d+$/.test(id)) throw new Error('Invalid event ID. Return to All events.');
    const [categories, organisations] = await Promise.all([request(apiBase + '/categories'), request(apiBase + '/admin/organisations')]);
    for (const [key, rows, idKey] of [['category_id',categories,'category_id'],['organisation_id',organisations,'organisation_id']]) {
      const select = form.elements.namedItem(key); while (select.options.length > 1) select.remove(1);
      for (const row of rows) select.add(new Option(row.name, row[idKey]));
      if (key === 'organisation_id' && rows.length === 1) select.value = rows[0][idKey];
    }
    if (id !== null) {
      const event = await request(apiBase + '/admin/events/' + id);
      document.getElementById('form-title').textContent = 'Edit event';
      document.title = 'Edit event | Harbour Hope';
      save.textContent = 'Save changes';
      for (const key of AdminValidation.fields) {
        const input = form.elements.namedItem(key);
        input.value = key === 'event_datetime' ? event[key].slice(0,19) : (event[key] ?? '');
      }
      document.getElementById('registrations').hidden = false;
      document.getElementById('registration-summary').textContent = event.registrations.length
        ? event.registrations.length + ' registrations. Updating this event keeps all existing registrations.'
        : 'No registrations yet.';
      const list = document.getElementById('registration-list'); list.replaceChildren();
      for (const registration of event.registrations) {
        const item = document.createElement('li');
        const time = new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Brisbane',dateStyle:'medium',timeStyle:'short'}).format(new Date(registration.registered_at));
        item.textContent = registration.name + ' · ' + registration.tickets + ' tickets · ' + time;
        list.append(item);
      }
    }
    fieldset.disabled = false; save.disabled = false; message.textContent = 'All fields are required except coordinates.';
  } catch (error) { showError(error); retry.hidden = false; }
}
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  for (const input of form.querySelectorAll('[aria-invalid]')) input.removeAttribute('aria-invalid');
  const payload = Object.fromEntries(new FormData(form));
  const { errors } = AdminValidation.validate(payload);
  if (Object.keys(errors).length) {
    showError({ message: Object.values(errors).join(' '), fields: errors });
    form.elements.namedItem(Object.keys(errors)[0])?.focus(); return;
  }
  save.disabled = true; fieldset.disabled = true; message.textContent = 'Saving event…'; message.dataset.error = 'false';
  try {
    const result = await request(apiBase + '/admin/events' + (id === null ? '' : '/' + id), { method:id === null ? 'POST' : 'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    location.assign('admin.html?saved=' + result.event_id);
  } catch (error) {
    showError({ message: error.message + ' Your entries are kept. If the connection was interrupted, check All events before retrying.', fields: error.fields });
    fieldset.disabled = false; save.disabled = false;
  }
});
retry.addEventListener('click', loadForm);
loadForm();
