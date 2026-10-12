/* The browser and API share the same field rules. Database constraints remain authoritative. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AdminValidation = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const fields = ['organisation_id', 'category_id', 'name', 'event_datetime', 'location', 'purpose',
    'short_description', 'full_description', 'ticket_price', 'fundraising_goal', 'current_progress', 'status', 'latitude', 'longitude'];
  function validate(input) {
    const errors = {}, value = {};
    if (!input || typeof input !== 'object' || Array.isArray(input)) return { value, errors: { form: 'Provide an event object.' } };
    for (const [key, limit] of Object.entries({ name:150, location:180, purpose:255, short_description:300, full_description:16000 })) {
      if (typeof input[key] !== 'string' || !input[key].trim() || Array.from(input[key].trim()).length > limit) errors[key] = key.replaceAll('_', ' ') + ' is required (maximum ' + limit + ' characters).';
      else value[key] = input[key].trim();
    }
    for (const key of ['organisation_id', 'category_id']) {
      const raw = input[key];
      if (!['string','number'].includes(typeof raw) || !/^\d+$/.test(String(raw)) || !Number.isInteger(Number(raw)) || Number(raw) < 1 || Number(raw) > 2147483647) errors[key] = 'Choose a valid ' + key.replace('_id', '') + '.';
      else value[key] = Number(raw);
    }
    const date = input.event_datetime;
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(date)) errors.event_datetime = 'Enter a Brisbane date and time.';
    else {
      const [y,m,d,h,min,s=0] = date.split(/\D/).map(Number);
      const parsed = new Date(Date.UTC(y,m-1,d,h,min,s));
      if (y < 1000 || y > 9999 || parsed.getUTCFullYear() !== y || parsed.getUTCMonth() !== m-1 ||
          parsed.getUTCDate() !== d || h > 23 || min > 59 || s > 59) errors.event_datetime = 'Enter a valid calendar date and time (years 1000–9999).';
      else value.event_datetime = date.replace('T', ' ') + (date.length === 16 ? ':00' : '');
    }
    for (const key of ['ticket_price','fundraising_goal','current_progress']) {
      const raw = input[key], maximum = key === 'ticket_price' ? 999999.99 : 99999999.99;
      if (!['string','number'].includes(typeof raw) || !/^\d+(\.\d{1,2})?$/.test(String(raw)) || Number(raw) > maximum) errors[key] = key.replaceAll('_',' ') + ' must be between 0 and ' + maximum + ', with at most two decimal places.';
      else value[key] = Number(raw).toFixed(2);
    }
    if (!['active','suspended'].includes(input.status)) errors.status = 'Choose Active or Suspended.';
    else value.status = input.status;
    for (const [key, maximum] of [['latitude',90],['longitude',180]]) {
      const raw = input[key];
      if (raw === '' || raw === null || raw === undefined) value[key] = null;
      else if (!['string','number'].includes(typeof raw) || !/^-?\d+(\.\d{1,6})?$/.test(String(raw)) || Math.abs(Number(raw)) > maximum) errors[key] = key + ' must be between -' + maximum + ' and ' + maximum + ', with at most six decimal places.';
      else value[key] = Number(raw);
    }
    if ((value.latitude === null) !== (value.longitude === null)) errors.latitude = 'Provide both coordinates or leave both blank.';
    return { value, errors };
  }
  return { fields, validate };
});
