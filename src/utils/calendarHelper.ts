import { PatientAppointment } from '../types';
import { CLINIC_INFO } from '../data/clinicData';

/**
 * Parses time string like "09:30 AM" into hours (24h) and minutes.
 */
function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return { hours: 10, minutes: 0 }; // fallback default
  }
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridian = match[3].toUpperCase();

  if (meridian === 'PM' && hours < 12) {
    hours += 12;
  } else if (meridian === 'AM' && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

/**
 * Extracts start and end Date objects in Indian Standard Time (UTC+05:30)
 * from appointmentDate ("YYYY-MM-DD") and timeSlot ("09:30 AM - 10:30 AM").
 */
export function getAppointmentDateTimeRange(appointment: PatientAppointment): {
  startDateUtc: Date;
  endDateUtc: Date;
  startIsoIst: string; // YYYYMMDDTHHMMSS
  endIsoIst: string;   // YYYYMMDDTHHMMSS
} {
  const dateParts = (appointment.appointmentDate || '').split('-');
  const year = dateParts[0] ? parseInt(dateParts[0], 10) : new Date().getFullYear();
  const month = dateParts[1] ? parseInt(dateParts[1], 10) - 1 : new Date().getMonth();
  const day = dateParts[2] ? parseInt(dateParts[2], 10) : new Date().getDate();

  // Extract times from slot e.g. "09:30 AM - 10:30 AM"
  const times = (appointment.timeSlot || '').split('-').map((s) => s.trim());
  const startParsed = parseTimeString(times[0] || '09:30 AM');
  
  let endParsed: { hours: number; minutes: number };
  if (times[1]) {
    endParsed = parseTimeString(times[1]);
  } else {
    // Default 1 hour duration
    endParsed = {
      hours: (startParsed.hours + 1) % 24,
      minutes: startParsed.minutes
    };
  }

  // Format local IST string: YYYYMMDDTHHMMSS
  const pad = (n: number) => String(n).padStart(2, '0');
  const startIsoIst = `${year}${pad(month + 1)}${pad(day)}T${pad(startParsed.hours)}${pad(startParsed.minutes)}00`;
  const endIsoIst = `${year}${pad(month + 1)}${pad(day)}T${pad(endParsed.hours)}${pad(endParsed.minutes)}00`;

  // IST offset is +05:30 (+330 minutes)
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  
  const startUtcMs = Date.UTC(year, month, day, startParsed.hours, startParsed.minutes, 0) - istOffsetMs;
  const endUtcMs = Date.UTC(year, month, day, endParsed.hours, endParsed.minutes, 0) - istOffsetMs;

  return {
    startDateUtc: new Date(startUtcMs),
    endDateUtc: new Date(endUtcMs),
    startIsoIst,
    endIsoIst
  };
}

/**
 * Formats a Date object to RFC 5545 UTC timestamp: YYYYMMDDTHHMMSSZ
 */
function formatUtcToIcs(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Escapes characters per RFC 5545 specification.
 */
function escapeIcsText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Generates an RFC 5545 compliant iCalendar (.ics) file string for a patient appointment.
 */
export function generateIcsContent(appointment: PatientAppointment): string {
  const { startDateUtc, endDateUtc, startIsoIst, endIsoIst } = getAppointmentDateTimeRange(appointment);
  const now = new Date();
  const dtStamp = formatUtcToIcs(now);
  const dtStartUtc = formatUtcToIcs(startDateUtc);
  const dtEndUtc = formatUtcToIcs(endDateUtc);

  const uid = `bindsukh-${appointment.tokenNumber || appointment.id || Date.now()}@bindsukh-clinic.com`;
  const summary = escapeIcsText(
    `Bindsukh Clinic: ${appointment.therapy} (Token: ${appointment.tokenNumber})`
  );

  const paymentText =
    appointment.paymentStatus === 'paid_online'
      ? 'PAID ONLINE (UPI)'
      : appointment.paymentStatus === 'collected_at_clinic'
      ? 'PAID AT CLINIC'
      : 'PAY AT CLINIC DESK';

  const rawDescription = [
    `🏥 BINDSUKH ACUPRESSURE & ACUPUNCTURE CENTER`,
    `Doctor: ${CLINIC_INFO.leadPractitioner} (${CLINIC_INFO.qualifications})`,
    `----------------------------------------`,
    `Patient Name: ${appointment.patientName}`,
    `Queue Token: ${appointment.tokenNumber}`,
    `Date: ${appointment.appointmentDate}`,
    `Time Slot: ${appointment.timeSlot}`,
    `Therapy: ${appointment.therapy}`,
    appointment.condition ? `Concern: ${appointment.condition}` : '',
    `Fee: ₹${appointment.fee} (${paymentText})`,
    appointment.upiReferenceNumber ? `UPI Ref: ${appointment.upiReferenceNumber}` : '',
    `----------------------------------------`,
    `Address: ${CLINIC_INFO.address}, Prayagraj, UP - 212201`,
    `Helpline: ${CLINIC_INFO.phones.join(' / ')}`,
    `WhatsApp: ${CLINIC_INFO.whatsapp}`,
    `----------------------------------------`,
    `INSTRUCTIONS:`,
    `1. Please arrive 10 minutes prior to your time slot.`,
    `2. Wear comfortable loose cotton clothing.`,
    `3. Bring prior MRI / X-ray / clinical reports if available.`,
  ]
    .filter(Boolean)
    .join('\n');

  const description = escapeIcsText(rawDescription);
  const location = escapeIcsText(
    `${CLINIC_INFO.address}, Prayagraj, Uttar Pradesh 212201`
  );

  // Use CRLF as required by RFC 5545
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bindsukh Acupressure Center//Patient Appointment System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Kolkata',
    'TZURL:http://tzurl.org/zoneinfo-outlook/Asia/Kolkata',
    'X-LIC-LOCATION:Asia/Kolkata',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0530',
    'TZOFFSETTO:+0530',
    'TZNAME:IST',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=Asia/Kolkata:${startIsoIst}`,
    `DTEND;TZID=Asia/Kolkata:${endIsoIst}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'SEQUENCE:0',
    `ORGANIZER;CN=Bindsukh Acupressure Center:mailto:${CLINIC_INFO.email}`,
    // 2-hour prior display alarm
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Your therapy session at Bindsukh Acupressure Center is in 2 hours',
    'END:VALARM',
    // 24-hour prior display alarm
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Tomorrow is your appointment at Bindsukh Acupressure Center',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  return icsLines.join('\r\n');
}

/**
 * Generates and triggers download of the .ics calendar invitation file.
 */
export function downloadCalendarIcsFile(appointment: PatientAppointment): boolean {
  try {
    const icsContent = generateIcsContent(appointment);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bindsukh_appointment_${appointment.tokenNumber || appointment.id}.ics`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 30000);

    return true;
  } catch (error) {
    console.error('Failed to generate or download calendar (.ics) invitation:', error);
    return false;
  }
}

/**
 * Generates a one-click Google Calendar web event URL for convenience.
 */
export function getGoogleCalendarUrl(appointment: PatientAppointment): string {
  const { startDateUtc, endDateUtc } = getAppointmentDateTimeRange(appointment);
  const startUtc = formatUtcToIcs(startDateUtc);
  const endUtc = formatUtcToIcs(endDateUtc);

  const title = `Bindsukh Clinic: ${appointment.therapy} (Token: ${appointment.tokenNumber})`;
  const details = [
    `Queue Token: ${appointment.tokenNumber}`,
    `Patient: ${appointment.patientName}`,
    `Therapy: ${appointment.therapy}`,
    appointment.condition ? `Condition: ${appointment.condition}` : '',
    `Fee: ₹${appointment.fee}`,
    `Doctor: ${CLINIC_INFO.leadPractitioner}`,
    `Helpline: ${CLINIC_INFO.phones.join(' / ')}`,
    `Address: ${CLINIC_INFO.address}`
  ]
    .filter(Boolean)
    .join('\n');

  const location = `${CLINIC_INFO.address}, Prayagraj, UP - 212201`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startUtc}/${endUtc}`,
    details,
    location
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
