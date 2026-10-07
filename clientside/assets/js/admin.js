'use strict';
const adminApi = '/api/admin';
const tbody = document.getElementById('admin-events');
const statusMessage = document.getElementById('admin-status');
let events = [];
const text = (tag, value, className) => { const node = document.createElement(tag); node.textContent = value; if (className) node.className = className; return node; };
const formatEventTime = (value) => new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Brisbane', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
function renderEvents() {
  const query = document.getElementById('event-query').value.trim().toLowerCase();
  const filter = document.getElementById('event-filter').value;
  const shown = events.filter((event) => (!filter || event.display_status === filter) && (event.name + ' ' + event.location).toLowerCase().includes(query));
  tbody.replaceChildren();
  for (const event of shown) {
    const row = document.createElement('tr');
    const title = document.createElement('td');
    const link = text('a', event.name, 'event-name'); link.href = 'admin-event.html?id=' + event.event_id;
    title.append(link, text('small', event.category_name + ' · ' + event.location));
    const status = document.createElement('td'); status.append(text('span', event.display_status, 'status-pill ' + event.display_status.toLowerCase()));
    const actions = document.createElement('td'); const group = document.createElement('div'); group.className = 'actions';
    const edit = text('a', 'Edit'); edit.href = link.href; edit.setAttribute('aria-label', 'Edit ' + event.name);
    const remove = text('button', 'Delete', 'admin-button danger'); remove.type = 'button'; remove.disabled = true; remove.title = 'Deletion is added in module M09.';
    group.append(edit, remove); actions.append(group);
    row.append(title, text('td', formatEventTime(event.event_datetime)), status, text('td', String(event.registration_count)), actions);
    tbody.append(row);
  }
  statusMessage.dataset.error = 'false';
  statusMessage.textContent = shown.length ? shown.length + ' of ' + events.length + ' events' : 'No events match. Change the filters or create a new event.';
}
async function loadEvents() {
  const refresh = document.getElementById('refresh-events'); refresh.disabled = true;
  statusMessage.textContent = 'Loading events…';
  try {
    const response = await fetch(adminApi + '/events'); const body = await response.json();
    if (!response.ok) throw new Error(body.message || 'Unable to load events.');
    events = body; renderEvents();
  } catch (error) {
    tbody.replaceChildren(); statusMessage.dataset.error = 'true';
    statusMessage.textContent = error.message + ' Check your connection and select Refresh.';
  } finally { refresh.disabled = false; }
}
document.getElementById('event-query').addEventListener('input', renderEvents);
document.getElementById('event-filter').addEventListener('change', renderEvents);
document.getElementById('refresh-events').addEventListener('click', loadEvents);
loadEvents();

if (/^\d+$/.test(new URLSearchParams(location.search).get('saved') || '')) document.getElementById('save-notice').hidden = false;
