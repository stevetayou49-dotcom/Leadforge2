function pad(n) { return String(n).padStart(2, '0'); }

function toIcsDate(date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function escapeIcsText(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

// Erstellt ein wöchentlich wiederkehrendes Erinnerungs-Event, das nach
// `weeks` Terminen automatisch endet - regelmäßig, aber begrenzt.
export function buildProjectReminderIcs({ customerName, paket, notes, startInDays = 3, weeks = 6 }) {
  const start = new Date();
  start.setDate(start.getDate() + startInDays);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  const summary = escapeIcsText(`Projekt-Check: ${customerName}`);
  const description = escapeIcsText(
    [`Paket: ${paket || '—'}`, notes ? `Notiz: ${notes}` : '', 'Kurzer Status-Check: Wo steht das Projekt gerade?']
      .filter(Boolean)
      .join('\n'),
  );
  const uid = `leadforge-${Date.now()}@kiezseite`;
  const now = toIcsDate(new Date());

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LeadForge//Anfragen//DE',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `RRULE:FREQ=WEEKLY;COUNT=${weeks}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Projekt-Erinnerung',
    'TRIGGER:-PT30M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(icsContent, filename) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
