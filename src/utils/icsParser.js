const ical = require('node-ical');

/**
 * Fetches and parses a Moodle ICS calendar URL.
 * Returns an array of { title, dueDate, courseName, icsUid }.
 */
async function parseIcsUrl(url) {
  const data = await ical.async.fromURL(url);
  const events = [];

  for (const [, event] of Object.entries(data)) {
    if (event.type !== 'VEVENT') continue;

    let title = event.summary || '';
    // Strip Moodle's " is due" suffix
    title = title.replace(/ is due$/, '');

    const dueDate = event.start;
    if (!dueDate) continue;

    // Extract course name from CATEGORIES field
    let courseName = 'Unknown Course';
    if (event.categories) {
      const cats = Array.isArray(event.categories)
        ? event.categories
        : [event.categories];
      if (cats.length > 0 && cats[0]) {
        // node-ical may return categories as a string or array
        const raw = Array.isArray(cats[0]) ? cats[0][0] : cats[0];
        if (raw) courseName = raw;
      }
    }

    events.push({
      title,
      dueDate: new Date(dueDate),
      courseName,
      icsUid: event.uid || null,
    });
  }

  return events;
}

module.exports = { parseIcsUrl };
