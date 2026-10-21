/**
 * EduVista Timezone, Geolocation & Calendar Synchronization Engine
 * Handles cross-border conversions between Nigerian West Africa Time (WAT, UTC+1)
 * and Diaspora Parent Timezones (London BST/GMT, New York EDT/EST, Toronto, etc.)
 */

export function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';
  } catch (e) {
    return 'Africa/Lagos';
  }
}

export function getTimezoneAbbr(tz = getUserTimezone()) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short'
    }).formatToParts(new Date());
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : tz;
  } catch (e) {
    return tz;
  }
}

/**
 * Parse a time string like "10:00 AM", "2:00 PM", or "14:00" into hours and minutes
 */
function parseTimeString(timeStr) {
  if (!timeStr) return { hours: 10, minutes: 0 };
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  const numPart = clean.replace(/[^0-9:]/g, '');
  const [hStr, mStr] = numPart.split(':');
  let hours = parseInt(hStr || '10', 10);
  const minutes = parseInt(mStr || '0', 10);
  
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return { hours, minutes };
}

/**
 * Format hours & minutes into "h:mm A" (e.g. "1:00 PM")
 */
function formatTime12h(hours, minutes) {
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Convert a Nigerian WAT slot (UTC+1) to the visitor's local timezone
 */
export function convertWatTimeToLocal(timeWatStr, dateString = null, targetTz = getUserTimezone()) {
  const { hours: watHours, minutes: watMinutes } = parseTimeString(timeWatStr);
  
  // Create Date object referencing WAT (UTC+1)
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let date = now.getDate();

  if (dateString) {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      date = parseInt(parts[2], 10);
    }
  }

  // WAT is UTC+1 hour
  // UTC milliseconds = Date.UTC(year, month, date, watHours - 1, watMinutes)
  const utcMillis = Date.UTC(year, month, date, watHours - 1, watMinutes);
  const targetDate = new Date(utcMillis);

  try {
    const localTimeFormatted = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(targetDate);

    const tzAbbr = getTimezoneAbbr(targetTz);
    const isWat = targetTz === 'Africa/Lagos' || tzAbbr === 'WAT';

    return {
      localTime: localTimeFormatted,
      tzAbbr,
      isWat,
      watTime: formatTime12h(watHours, watMinutes),
      displayBadge: isWat 
        ? `${localTimeFormatted} (WAT)` 
        : `${localTimeFormatted} ${tzAbbr} · (${formatTime12h(watHours, watMinutes)} Tutor WAT)`
    };
  } catch (err) {
    return {
      localTime: timeWatStr,
      tzAbbr: 'WAT',
      isWat: true,
      watTime: timeWatStr,
      displayBadge: `${timeWatStr} (WAT)`
    };
  }
}

/**
 * Detect Smart Default Currency from User Timezone
 */
export function detectDefaultCurrency(tz = getUserTimezone()) {
  if (tz === 'Europe/London' || tz.startsWith('Europe/Belfast')) return 'GBP';
  if (tz.startsWith('Europe/')) return 'EUR';
  if (tz.startsWith('America/')) return 'USD';
  if (tz === 'Africa/Accra') return 'GHS';
  if (tz === 'Africa/Nairobi') return 'USD';
  if (tz === 'Africa/Johannesburg') return 'USD';
  return 'NGN';
}

/**
 * Generate 1-Click Google Calendar Direct Add URL
 */
export function generateGoogleCalendarUrl({
  title = 'EduVista Live Lesson',
  description = 'Live 1-on-1 tutoring session secured by EduVista Escrow.',
  tutorName = 'Verified Educator',
  subject = 'Academic Tutoring',
  dateString,
  timeWatString,
  durationMinutes = 60,
  roomUrl = 'https://eduvistar.com/#session-engine'
}) {
  const { hours: watHours, minutes: watMinutes } = parseTimeString(timeWatString);
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let date = now.getDate();

  if (dateString) {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      date = parseInt(parts[2], 10);
    }
  }

  // WAT UTC start
  const startUtc = new Date(Date.UTC(year, month, date, watHours - 1, watMinutes));
  const endUtc = new Date(startUtc.getTime() + durationMinutes * 60 * 1000);

  const formatUtcDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dates = `${formatUtcDate(startUtc)}/${formatUtcDate(endUtc)}`;

  const eventTitle = encodeURIComponent(`EduVista Lesson: ${subject} with ${tutorName}`);
  const details = encodeURIComponent(
    `${description}\n\nInstructor: ${tutorName}\nSubject: ${subject}\n\nJoin Live Classroom: ${roomUrl}\n\nProtected by EduVista Escrow.`
  );
  const location = encodeURIComponent(roomUrl);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${dates}&details=${details}&location=${location}`;
}

/**
 * Generate .ics (iCalendar) file and trigger download
 */
export function downloadIcsCalendarInvite({
  title = 'EduVista Live Lesson',
  description = 'Live tutoring session secured by EduVista Escrow.',
  tutorName = 'Verified Educator',
  subject = 'Academic Tutoring',
  dateString,
  timeWatString,
  durationMinutes = 60,
  roomUrl = 'https://eduvistar.com/#session-engine'
}) {
  const { hours: watHours, minutes: watMinutes } = parseTimeString(timeWatString);
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let date = now.getDate();

  if (dateString) {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      date = parseInt(parts[2], 10);
    }
  }

  const startUtc = new Date(Date.UTC(year, month, date, watHours - 1, watMinutes));
  const endUtc = new Date(startUtc.getTime() + durationMinutes * 60 * 1000);

  const formatIcsTime = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const uid = `eduvista-${Date.now()}@eduvistar.com`;
  const cleanSummary = `EduVista Lesson: ${subject} with ${tutorName}`;
  const cleanDetails = `${description} Instructor: ${tutorName}. Subject: ${subject}. Join Room: ${roomUrl}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EduVista Africa//Classroom Engine//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsTime(new Date())}`,
    `DTSTART:${formatIcsTime(startUtc)}`,
    `DTEND:${formatIcsTime(endUtc)}`,
    `SUMMARY:${cleanSummary}`,
    `DESCRIPTION:${cleanDetails}`,
    `LOCATION:${roomUrl}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Lesson Reminder: Starting in 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `eduvista-lesson-${dateString || 'session'}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
