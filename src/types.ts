export type AppointmentStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
export type PaymentMethod = 'pay_at_clinic' | 'upi_qr';
export type PaymentStatus = 'pending' | 'paid_online' | 'collected_at_clinic';
export type ReminderChannel = 'whatsapp' | 'sms' | 'both';
export type ReminderStatus = 'scheduled' | 'sent' | 'delivered' | 'failed';
export type AttendanceStatus = 'unconfirmed' | 'confirmed' | 'rescheduled' | 'cancelled';

export interface PatientAppointment {
  id: string;
  tokenNumber: string;
  patientName: string;
  patientPhone: string;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "09:30 AM - 10:30 AM"
  therapy: string;
  condition?: string;
  visitType: 'first_visit' | 'returning_patient';
  fee: number; // 500 or 200
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  upiReferenceNumber?: string;
  notes?: string;
  status: AppointmentStatus;
  createdAt: string;

  // Automated 24h Reminder & Attendance fields
  reminderChannel?: ReminderChannel;
  reminderScheduledFor?: string; // ISO string (scheduled 24 hours prior)
  reminderStatus?: ReminderStatus;
  reminderSentAt?: string;
  reminderMessage?: string;
  attendanceStatus?: AttendanceStatus;
  attendanceConfirmedAt?: string;
  attendanceReplyNotes?: string;
}

export interface SlotAvailability {
  slot: string;
  maxCapacity: number;
  bookedCount: number;
  availableCount: number;
  isFull: boolean;
  patientsInSlot?: {
    id: string;
    tokenNumber: string;
    patientName: string;
    status: AppointmentStatus;
  }[];
}

export interface PatientHistoryCheck {
  phone: string;
  isReturning: boolean;
  previousAppointmentsCount: number;
  lastVisitDate?: string;
  suggestedFee: number;
  patientName?: string;
}

export interface PatientFeedback {
  id: string;
  patientName: string;
  rating: number; // 1 to 5
  comment: string;
  category?: string;
  therapy?: string;
  createdAt: string;
  verifiedPatient?: boolean;
}

