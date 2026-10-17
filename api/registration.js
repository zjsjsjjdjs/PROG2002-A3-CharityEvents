const express = require('express');
const { createRegistration } = require('./event_db');
const router = express.Router({ mergeParams: true });

/**
 * Validate the ASCII email format accepted by registration without testing mailbox existence.
 * @param {string} email - Trimmed, lowercase input from the route.
 * @returns {boolean} Whether the address satisfies length and syntax constraints.
 */
function validEmail(email) {
  if (email.length > 254 || !/^[\x21-\x7e]+$/.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return false;
  }
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)) return false;
  const labels = domain.split('.');
  return labels.length >= 2 && labels.every((label) =>
    label.length > 0 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label));
}

router.post('/', async (req, res, next) => {
  const fail = (status, code, message) => res.status(status).json({ code, message });
  const id = req.params.id;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
    return fail(400, 'INVALID_EVENT_ID', 'Event ID must be a positive safe integer.');
  }
  if (!req.is('application/json')) {
    return fail(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send registration data as application/json.');
  }
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return fail(400, 'INVALID_BODY', 'Registration must be a JSON object.');
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const tickets = body.tickets;
  if (!name || [...name].length > 120 || /[\u0000-\u001f\u007f]/.test(name)) {
    return fail(400, 'INVALID_NAME', 'Name is required and must contain 1 to 120 characters without control characters.');
  }
  if (!validEmail(email)) {
    return fail(400, 'INVALID_EMAIL', 'Enter a valid email address (maximum 254 characters).');
  }
  if (!Number.isInteger(tickets) || tickets < 1 || tickets > 2147483647) {
    return fail(400, 'INVALID_TICKETS', 'Tickets must be a whole number between 1 and 2147483647.');
  }
  try {
    const registration = await createRegistration(Number(id), { name, email, tickets });
    return res.status(201).json({ message: 'Registration successful.', registration });
  } catch (error) {
    if (error.code === 'EVENT_NOT_FOUND') {
      return fail(404, 'EVENT_NOT_FOUND', 'Event not found or unavailable for registration.');
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return fail(409, 'DUPLICATE_REGISTRATION', 'This email is already registered for this event.');
    }
    next(error);
  }
});

module.exports = router;

