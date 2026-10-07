'use strict';
const adminApi = '/api/admin';
const tbody = document.getElementById('admin-events');
const statusMessage = document.getElementById('admin-status');
let events = [];
let eventsReady = false;
const text = (tag, value, className) => { const node = document.createElement(tag); node.textContent = value; if (className) node.className = className; return node; };
const formatEventTime = (value) => new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Brisbane', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
function renderEvents() {
  if (!eventsReady) { tbody.replaceChildren(); return; }
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
    const remove = text('button', 'Delete', 'admin-button danger'); remove.type = 'button'; remove.addEventListener('click', () => removeEvent(event, remove));
    group.append(edit, remove); actions.append(group);
    row.append(title, text('td', formatEventTime(event.event_datetime)), status, text('td', String(event.registration_count)), actions);
    tbody.append(row);
  }
  statusMessage.dataset.error = 'false';
  statusMessage.textContent = shown.length ? shown.length + ' of ' + events.length + ' events' : 'No events match. Change the filters or create a new event.';
}
async function loadEvents() {
  const refresh = document.getElementById('refresh-events'); refresh.disabled = true;
  eventsReady = false; events = []; tbody.replaceChildren();
  statusMessage.dataset.error = 'false';
  statusMessage.textContent = 'Loading events…';
  try {
    const response = await fetch(adminApi + '/events'); const body = await response.json();
    if (!response.ok) throw new Error(body.message || 'Unable to load events.');
    events = body; eventsReady = true; renderEvents();
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

async function removeEvent(event, button) {
  if (!window.confirm('Delete "' + event.name + '"? This cannot be undone. Events with registrations cannot be deleted.')) return;
  button.disabled = true;
  try {
    const response = await fetch(adminApi + '/events/' + event.event_id, {method:'DELETE'});
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || 'Unable to delete this event.');
    const notice = document.getElementById('save-notice'); notice.textContent = 'Event deleted: ' + event.name; notice.hidden = false;
    await loadEvents();
  } catch(error) {
    statusMessage.dataset.error = 'true';
    statusMessage.textContent = error.message + ' If the connection was interrupted, refresh to check the latest event status.';
  } finally { button.disabled = false; }
}
