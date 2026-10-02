import React, { useState, useEffect, useMemo } from 'react';
import { PatientAppointment } from '../types';
import { CLINIC_INFO, getSlotsForDate, normalizeTimeSlot } from '../data/clinicData';
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  IndianRupee,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  User,
  UserCheck,
  Users,
  X,
  AlertCircle,
  FileText,
  Bell,
  Send,
  MessageSquare,
  Rocket,
  ExternalLink,
  Copy,
  ShieldCheck,
  CheckSquare,
  RotateCcw,
  Trash2,
  Image as ImageIcon,
  Download,
  FileSpreadsheet,
  Share2,
  Eye,
  QrCode,
  Database,
  Cloud,
  Mic,
  MicOff
} from 'lucide-react';
import { OwnershipDeployModal } from './OwnershipDeployModal';
import { UploadLogoModal } from './UploadLogoModal';
import { PublicShareModal } from './PublicShareModal';
import { useClinicLogo } from '../utils/logoHelper';
import { subscribeToAppointments, saveAppointmentToFirestore, testFirestoreConnection } from '../utils/firebase';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

interface AdminPanelProps {
  onSelectReceipt: (apt: PatientAppointment) => void;
  onLogout?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onSelectReceipt, onLogout }) => {
  const clinicLogo = useClinicLogo();
  const todayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled'>('all');
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Ownership / Deployment modal
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);

  // Logo upload modal
  const [showUploadLogoModal, setShowUploadLogoModal] = useState(false);

  // Public QR / Scanner link modal
  const [showPublicQrModal, setShowPublicQrModal] = useState(false);

  // Export CSV state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [allAppointmentsCount, setAllAppointmentsCount] = useState<number | null>(null);
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [previewCsvModal, setPreviewCsvModal] = useState(false);
  const [previewCsvContent, setPreviewCsvContent] = useState<string>('');

  // Automated 24h Reminder Operations state
  const [processingReminders, setProcessingReminders] = useState(false);
  const [reminderNotice, setReminderNotice] = useState<string | null>(null);
  const [showSimulateReplyModal, setShowSimulateReplyModal] = useState(false);
  const [simulateMessage, setSimulateMessage] = useState('CONFIRM BK-105');
  const [simulatePhone, setSimulatePhone] = useState('');
  const [simulateResult, setSimulateResult] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Walk-in modal state
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInSlot, setWalkInSlot] = useState('');
  const [walkInTherapy, setWalkInTherapy] = useState('Acupressure Therapy');
  const [walkInError, setWalkInError] = useState('');

  // Reset to clean fresh roster modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [firestoreConnected, setFirestoreConnected] = useState(true);

  // Voice Search recognition for therapist
  const {
    isListening: isVoiceSearching,
    startListening: startVoiceSearch,
    stopListening: stopVoiceSearch
  } = useVoiceRecognition({
    onResult: (text) => {
      setSearchQuery(text);
    }
  });

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/appointments?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (err) {
      console.error('Error fetching admin appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Firestore real-time live sync subscription
  useEffect(() => {
    testFirestoreConnection().then(setFirestoreConnected);
    const unsubscribe = subscribeToAppointments((liveApts) => {
      if (liveApts && liveApts.length > 0) {
        setFirestoreConnected(true);
        setAppointments((prev) => {
          const map = new Map<string, PatientAppointment>();
          prev.forEach((a) => map.set(a.id, a));
          liveApts.forEach((a) => {
            if (a.appointmentDate === selectedDate) {
              map.set(a.id, a);
            }
          });
          return Array.from(map.values());
        });
      }
    });
    return () => unsubscribe();
  }, [selectedDate]);

  const handleResetToFresh = async () => {
    try {
      setResetting(true);
      const res = await fetch('/api/appointments/reset-fresh', { method: 'POST' });
      if (res.ok) {
        setAppointments([]);
        setShowResetModal(false);
        setReminderNotice('Roster has been reset! All demo/test appointments removed. Roster is 100% fresh.');
        setTimeout(() => setReminderNotice(null), 5000);
      }
    } catch (err) {
      console.error('Error resetting appointments:', err);
    } finally {
      setResetting(false);
    }
  };

  // Safe helper to build formatted CSV with headers and UTF-8 BOM
  const generateCsvString = (list: PatientAppointment[], scope: 'all' | 'date') => {
    const headers = [
      'Token Number',
      'Patient Name',
      'Phone Number',
      'Appointment Date',
      'Time Slot',
      'Therapy',
      'Condition / Symptoms',
      'Visit Type',
      'Fee (INR)',
      'Payment Method',
      'Payment Status',
      'UPI Reference No',
      'Appointment Status',
      'Attendance Status',
      'Reminder Status',
      'Clinician Notes',
      'Booking Created At'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const rows = list.map((a) => [
      escapeCsv(a.tokenNumber),
      escapeCsv(a.patientName),
      escapeCsv(a.patientPhone),
      escapeCsv(a.appointmentDate),
      escapeCsv(a.timeSlot),
      escapeCsv(a.therapy),
      escapeCsv(a.condition || 'General Assessment'),
      escapeCsv(a.visitType === 'returning_patient' ? 'Returning Patient (₹200)' : 'First Visit (₹500)'),
      escapeCsv(a.fee),
      escapeCsv(a.paymentMethod === 'upi_qr' ? 'UPI QR Online' : 'Pay at Clinic'),
      escapeCsv(a.paymentStatus === 'paid_online' ? 'Paid Online' : a.paymentStatus === 'collected_at_clinic' ? 'Collected at Clinic' : 'Pending'),
      escapeCsv(a.upiReferenceNumber || 'N/A'),
      escapeCsv(a.status),
      escapeCsv(a.attendanceStatus || 'unconfirmed'),
      escapeCsv(a.reminderStatus || 'scheduled'),
      escapeCsv(a.notes || ''),
      escapeCsv(a.createdAt)
    ].join(','));

    // Even if list is empty, include a clear placeholder row so the CSV is valid and downloads successfully
    if (rows.length === 0) {
      const emptyRow = [
        '"NO-RECORDS"',
        scope !== 'all' ? `"No appointments booked for ${selectedDate}"` : '"No appointments in system yet"',
        '""',
        scope !== 'all' ? `"${selectedDate}"` : `"${todayStr()}"`,
        '""',
        '""',
        '""',
        '""',
        '""',
        '""',
        '""',
        '""',
        '"empty"',
        '""',
        '""',
        '"Bindsukh Acu Center - Offline Clinic Backup"',
        `"${new Date().toISOString()}"`
      ].join(',');
      rows.push(emptyRow);
    }

    return '\uFEFF' + [headers.map((h) => `"${h}"`).join(','), ...rows].join('\r\n');
  };

  // Safe download trigger that works reliably in iframes, Chrome Android, Safari iOS & Desktop
  const triggerBrowserFileDownload = (blobOrServerUrl: string, filename: string, isBlob = true) => {
    try {
      const link = document.createElement('a');
      link.href = blobOrServerUrl;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        if (isBlob) {
          // Never revoke immediately! Wait 60s so download manager finishes reading.
          try {
            URL.revokeObjectURL(blobOrServerUrl);
          } catch (_) {}
        }
      }, 60000);
      return true;
    } catch (e) {
      console.warn('DOM link click failed, trying window.location:', e);
      try {
        window.location.assign(blobOrServerUrl);
        return true;
      } catch (e2) {
        console.error('All download methods failed:', e2);
        return false;
      }
    }
  };

  // Manual export of appointment data as CSV file for offline clinic records
  const handleExportCSV = async (scope: 'all' | 'date') => {
    try {
      setExportingCsv(true);
      const filename = scope === 'all'
        ? `bindsukh_all_patient_records_${todayStr()}.csv`
        : `bindsukh_appointments_${selectedDate}.csv`;

      // 1. Direct backend endpoint (bypasses iframe & mobile blob limits)
      const serverUrl = scope === 'all'
        ? '/api/appointments/export-csv?scope=all'
        : `/api/appointments/export-csv?scope=date&date=${encodeURIComponent(selectedDate)}`;

      // 2. Also prepare client-side fallback with real data
      let data: PatientAppointment[] = [];
      try {
        const fetchUrl = scope === 'all' ? '/api/appointments' : `/api/appointments?date=${selectedDate}`;
        const res = await fetch(fetchUrl);
        if (res.ok) {
          data = await res.json();
        }
      } catch (_) {
        data = scope === 'date' ? appointments : [];
      }

      const csvContent = generateCsvString(data, scope);

      // Attempt client blob download with safe 60s revocation
      let downloaded = false;
      try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const blobUrl = URL.createObjectURL(blob);
        downloaded = triggerBrowserFileDownload(blobUrl, filename, true);
      } catch (blobErr) {
        console.warn('Blob download error, falling back to direct server URL:', blobErr);
      }

      // If blob failed or to ensure iframe support, trigger server URL
      if (!downloaded) {
        triggerBrowserFileDownload(serverUrl, filename, false);
      }

      setShowExportModal(false);
      setReminderNotice(`✅ ${data.length > 0 ? `${data.length} मरीजों का` : 'क्लिनिक'} अपॉइंटमेंट डेटा CSV फ़ाइल में डाउनलोड हो गया है! (Offline Backup Saved)`);
      setTimeout(() => setReminderNotice(null), 6000);
    } catch (err: any) {
      console.error('Error downloading CSV:', err);
      // Fallback: direct navigation to server endpoint
      const fallbackUrl = scope === 'all'
        ? '/api/appointments/export-csv?scope=all'
        : `/api/appointments/export-csv?scope=date&date=${encodeURIComponent(selectedDate)}`;
      triggerBrowserFileDownload(fallbackUrl, `bindsukh_backup_${todayStr()}.csv`, false);
      setReminderNotice('📥 CSV डाउनलोड सर्वर से शुरू किया गया है...');
      setTimeout(() => setReminderNotice(null), 5000);
      setShowExportModal(false);
    } finally {
      setExportingCsv(false);
    }
  };

  // Copy CSV Data directly to Clipboard (Guaranteed offline copy even if phone blocks file downloads)
  const handleCopyCsvData = async (scope: 'all' | 'date') => {
    try {
      let data: PatientAppointment[] = [];
      const fetchUrl = scope === 'all' ? '/api/appointments' : `/api/appointments?date=${selectedDate}`;
      const res = await fetch(fetchUrl);
      if (res.ok) {
        data = await res.json();
      } else {
        data = scope === 'date' ? appointments : [];
      }

      const csvContent = generateCsvString(data, scope);

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(csvContent);
      } else {
        // Fallback for older WebViews / mobile browsers
        const textArea = document.createElement('textarea');
        textArea.value = csvContent;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopiedCsv(true);
      setTimeout(() => setCopiedCsv(false), 3000);
      setReminderNotice(`📋 ${data.length} मरीजों का संपूर्ण CSV डेटा क्लिपबोर्ड में कॉपी हो गया है! आप इसे एक्सेल या गूगल शीट्स में सीधे पेस्ट कर सकते हैं।`);
      setTimeout(() => setReminderNotice(null), 5000);
    } catch (err: any) {
      console.error('Copy CSV failed:', err);
      setReminderNotice('❌ कॉपी विफल: ' + (err.message || 'त्रुटि'));
      setTimeout(() => setReminderNotice(null), 4000);
    }
  };

  // Mobile Web Share API for sharing CSV file or summary
  const handleShareCsv = async (scope: 'all' | 'date') => {
    try {
      let data: PatientAppointment[] = [];
      const fetchUrl = scope === 'all' ? '/api/appointments' : `/api/appointments?date=${selectedDate}`;
      const res = await fetch(fetchUrl);
      if (res.ok) {
        data = await res.json();
      } else {
        data = scope === 'date' ? appointments : [];
      }

      const csvContent = generateCsvString(data, scope);
      const filename = scope === 'all'
        ? `bindsukh_all_patient_records_${todayStr()}.csv`
        : `bindsukh_appointments_${selectedDate}.csv`;

      // Check if navigator.share supports files
      let fileShared = false;
      if (navigator.canShare && navigator.share) {
        try {
          const file = new File([csvContent], filename, { type: 'text/csv' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Bindsukh Acu Center Patient Records Backup',
              text: `Offline patient records backup from Bindsukh Acu Center (${data.length} records)`,
              files: [file]
            });
            fileShared = true;
          }
        } catch (shareErr) {
          console.warn('File share not supported, falling back to text share:', shareErr);
        }
      }

      if (!fileShared) {
        // Fallback: share summary via WhatsApp
        const summary = `*Bindsukh Acu Center - Patient Records (${data.length} appointments)*\nDate: ${scope === 'all' ? 'All Records' : selectedDate}\nTotal Records: ${data.length}\nClinic: ${CLINIC_INFO.name}\n\nDownload full CSV file from admin portal: ${window.location.origin}/api/appointments/export-csv?scope=${scope}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(summary)}`, '_blank');
      }
    } catch (e) {
      console.error('Share CSV error:', e);
    }
  };

  // Preview CSV Content on Screen
  const handlePreviewCsv = async (scope: 'all' | 'date') => {
    try {
      let data: PatientAppointment[] = [];
      const fetchUrl = scope === 'all' ? '/api/appointments' : `/api/appointments?date=${selectedDate}`;
      const res = await fetch(fetchUrl);
      if (res.ok) {
        data = await res.json();
      } else {
        data = scope === 'date' ? appointments : [];
      }

      const csvContent = generateCsvString(data, scope);
      setPreviewCsvContent(csvContent);
      setPreviewCsvModal(true);
    } catch (e) {
      console.error('Preview CSV error:', e);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  // Mark appointment as done / completed
  const handleMarkAsDone = async (id: string) => {
    try {
      setActionInProgressId(id);
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          paymentStatus: 'collected_at_clinic',
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      }
    } catch (err) {
      console.error('Error marking as done:', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Change status to in-progress or other
  const handleStatusChange = async (id: string, newStatus: any) => {
    try {
      setActionInProgressId(id);
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  // 24-Hour Reminder Engine Trigger
  const handleTriggerDueReminders = async () => {
    try {
      setProcessingReminders(true);
      const res = await fetch('/api/reminders/process-due', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setReminderNotice(`Automated pass complete: Dispatched ${data.processedCount} reminder(s). 24h queue is synced!`);
        fetchAppointments();
        setTimeout(() => setReminderNotice(null), 5000);
      }
    } catch (err) {
      console.error('Error running reminders:', err);
    } finally {
      setProcessingReminders(false);
    }
  };

  // Confirm Patient Attendance
  const handleConfirmAttendance = async (id: string) => {
    try {
      setActionInProgressId(id);
      const res = await fetch(`/api/appointments/${id}/confirm-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Confirmed in Therapist Console' }),
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments((prev) => prev.map((a) => (a.id === id ? data.appointment : a)));
        setReminderNotice(`Attendance confirmed for ${data.appointment.patientName}!`);
        setTimeout(() => setReminderNotice(null), 4000);
      }
    } catch (err) {
      console.error('Error confirming attendance:', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Send or Resend Reminder immediately
  const handleSendReminderNow = async (id: string, channel: 'whatsapp' | 'sms' = 'whatsapp') => {
    try {
      setActionInProgressId(id);
      const res = await fetch(`/api/appointments/${id}/send-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments((prev) => prev.map((a) => (a.id === id ? data.appointment : a)));
        setReminderNotice(`Reminder sent to ${data.appointment.patientName} via ${channel.toUpperCase()}!`);
        setTimeout(() => setReminderNotice(null), 4000);
      }
    } catch (err) {
      console.error('Error sending reminder:', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Simulate Incoming Patient Reply (SMS or WhatsApp webhook test)
  const handleSimulateReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/incoming-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: simulateMessage,
          phone: simulatePhone,
        }),
      });
      const data = await res.json();
      setSimulateResult(data);
      if (res.ok) {
        fetchAppointments();
      }
    } catch (err: any) {
      setSimulateResult({ error: err.message || 'Failed to simulate incoming message' });
    }
  };

  const copyConfirmationLink = (token: string) => {
    const url = `${window.location.origin}/confirm/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter appointments by search query and status
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesSearch =
        !searchQuery.trim() ||
        apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.patientPhone.includes(searchQuery.replace(/\D/g, '')) ||
        apt.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (apt.condition && apt.condition.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchQuery, statusFilter]);

  // Group appointments by 1-Hour Time Slot (CRITICAL REQUIREMENT)
  // Each slot can have up to 5 patients!
  const slotsForDay = getSlotsForDate(selectedDate);

  const groupedSlots = useMemo(() => {
    return slotsForDay.map((slot) => {
      const patientsInSlot = filteredAppointments.filter((apt) => normalizeTimeSlot(apt.timeSlot) === slot);
      const allActiveInSlot = appointments.filter((apt) => apt.status !== 'cancelled' && normalizeTimeSlot(apt.timeSlot) === slot);
      const capacityUsed = allActiveInSlot.length;

      return {
        slot,
        patients: patientsInSlot,
        capacityUsed,
        maxCapacity: CLINIC_INFO.maxSlotCapacity,
        isFull: capacityUsed >= CLINIC_INFO.maxSlotCapacity,
      };
    });
  }, [slotsForDay, filteredAppointments, appointments]);

  // Overview metrics
  const totalBookedToday = appointments.filter((a) => a.status !== 'cancelled').length;
  const completedToday = appointments.filter((a) => a.status === 'completed').length;
  const scheduledToday = appointments.filter((a) => a.status === 'scheduled').length;
  const totalRevenue = appointments
    .filter((a) => a.status === 'completed' || a.paymentStatus === 'paid_online')
    .reduce((sum, a) => sum + a.fee, 0);

  // Quick Walk-In Submission
  const handleAddWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInError('');

    if (!walkInName.trim() || !walkInPhone.trim() || !walkInSlot) {
      setWalkInError('Please fill all required fields.');
      return;
    }

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: walkInName.trim(),
          patientPhone: walkInPhone.replace(/\D/g, '').slice(-10),
          appointmentDate: selectedDate,
          timeSlot: walkInSlot,
          therapy: walkInTherapy,
          condition: 'Clinic Walk-in Consultation',
          paymentMethod: 'pay_at_clinic',
          notes: 'Added via Admin Walk-in Desk',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add walk-in');
      }

      setShowWalkInModal(false);
      setWalkInName('');
      setWalkInPhone('');
      setWalkInSlot('');
      fetchAppointments();
    } catch (err: any) {
      setWalkInError(err.message || 'Error adding walk-in.');
    }
  };

  return (
    <div id="admin-panel-wrapper" className="space-y-6">
      {/* Admin Top Dashboard Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 text-white rounded-3xl p-6 shadow-xl border border-emerald-900/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <img
                src={clinicLogo}
                alt="Clinic Official Logo"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-emerald-500 shadow-lg"
              />
              <button
                type="button"
                onClick={() => setShowUploadLogoModal(true)}
                className="absolute -bottom-1 -right-1 bg-amber-400 hover:bg-amber-300 text-emerald-950 p-1.5 rounded-full shadow border-2 border-emerald-950 cursor-pointer transition-transform hover:scale-110"
                title="Upload & Change Clinic Logo (असली लोगो फोटो लगाएं)"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 bg-amber-400/20 text-amber-300 rounded-full text-[11px] font-semibold mb-1 border border-amber-400/30">
                <Sparkles className="w-3 h-3" />
                Therapist Roster &amp; Slot Manager • केवल अधिकृत डॉक्टर
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif leading-tight">
                THERAPIST: SAURABH PRAJAPATI’s Clinical Console
              </h2>
              <p className="text-xs text-emerald-200 mt-0.5">
                Puramufti Purani Bazar, Prayagraj • Real-time 5-patient per slot capacity manager
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-800/80 text-emerald-200 text-[10px] font-bold border border-emerald-600/60">
                  <span className={`w-2 h-2 rounded-full ${firestoreConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{firestoreConnected ? 'Firebase Firestore: Live Cloud Sync Active' : 'Connecting to Firestore...'}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-semibold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                  <Database className="w-3 h-3 text-amber-400" />
                  <span>Permanent Storage</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                title="Logout from Doctor Panel (लॉगआउट)"
              >
                Logout / लॉगआउट
              </button>
            )}
            <button
              id="refresh-admin-btn"
              type="button"
              onClick={fetchAppointments}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors border border-emerald-700/60 shadow-sm active:scale-95"
              title="Refresh live appointments from server (ताज़ा करें)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh / रिफ्रेश
            </button>
            <button
              id="reset-fresh-btn"
              type="button"
              onClick={() => setShowResetModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-950/70 hover:bg-rose-900 text-rose-200 hover:text-white rounded-xl text-xs font-semibold transition-colors border border-rose-800/50 shadow-sm active:scale-95"
              title="Clear all dummy/test appointments to start with a 100% fresh slate (0 patients)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
              Reset to Fresh / नया फ्रेश करें
            </button>
            <button
              id="add-walkin-btn"
              type="button"
              onClick={() => setShowWalkInModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              + Walk-In Patient
            </button>
            <button
              id="upload-logo-admin-btn"
              type="button"
              onClick={() => setShowUploadLogoModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 border border-amber-600/40"
              title="Upload authentic clinic logo photo (असली लोगो फोटो लगाएं)"
            >
              <ImageIcon className="w-4 h-4 text-emerald-950" />
              Upload Logo / असली लोगो लगाएं
            </button>
            {/* 1-Click Native Direct Download Link (Immune to iframe / JS gesture expiration) */}
            <a
              id="download-csv-btn"
              href="/api/appointments/export-csv?scope=all"
              download={`bindsukh_all_patient_records_${todayStr()}.csv`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setReminderNotice('📥 संपूर्ण अपॉइंटमेंट डेटा (CSV) डाउनलोड शुरू हो गया है! (Direct Native Download)');
                setTimeout(() => setReminderNotice(null), 5000);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 border border-emerald-400/40 cursor-pointer"
              title="Download all patient appointment records as a CSV file (1-Click Instant Offline Backup)"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Download CSV / बैकअप डाउनलोड</span>
            </a>

            {/* Advanced Export Options Modal Trigger */}
            <button
              id="export-options-btn"
              type="button"
              onClick={() => {
                fetch('/api/appointments')
                  .then((res) => res.json())
                  .then((data) => {
                    if (Array.isArray(data)) setAllAppointmentsCount(data.length);
                  })
                  .catch(() => {});
                setShowExportModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-750 text-emerald-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-emerald-600/40 shadow-xs active:scale-95 cursor-pointer"
              title="Advanced CSV Export Options (Filter by Date, Copy to Clipboard, Share, Preview)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
              <span>Export Options / विकल्प</span>
            </button>
            <button
              id="public-qr-admin-btn"
              type="button"
              onClick={() => setShowPublicQrModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all border border-emerald-400/50 shadow-md active:scale-95 cursor-pointer"
              title="View, edit and download Public Patient QR code & Live Link"
            >
              <QrCode className="w-4 h-4 text-amber-300" />
              <span>Public QR / स्कैनर लिंक</span>
            </button>
            <button
              id="ownership-guide-btn"
              type="button"
              onClick={() => setShowOwnershipModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-750 text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-400/40 shadow-sm"
              title="Step-by-step instructions on app ownership, hosting & production publishing"
            >
              <Rocket className="w-4 h-4 text-amber-400" />
              Publish Guide
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-emerald-800/60">
          <div className="bg-emerald-900/40 p-3 rounded-2xl border border-emerald-700/30">
            <div className="text-[11px] text-emerald-300 font-medium">Total Scheduled</div>
            <div className="text-2xl font-extrabold text-white mt-0.5">{totalBookedToday}</div>
            <div className="text-[10px] text-emerald-400">Patients on roster</div>
          </div>
          <div className="bg-emerald-900/40 p-3 rounded-2xl border border-emerald-700/30">
            <div className="text-[11px] text-emerald-300 font-medium">Completed / Done</div>
            <div className="text-2xl font-extrabold text-emerald-300 mt-0.5">{completedToday}</div>
            <div className="text-[10px] text-emerald-400">Therapies concluded</div>
          </div>
          <div className="bg-emerald-900/40 p-3 rounded-2xl border border-emerald-700/30">
            <div className="text-[11px] text-emerald-300 font-medium">Awaiting Treatment</div>
            <div className="text-2xl font-extrabold text-amber-300 mt-0.5">{scheduledToday}</div>
            <div className="text-[10px] text-emerald-400">In waiting lounge</div>
          </div>
          <div className="bg-emerald-900/40 p-3 rounded-2xl border border-emerald-700/30">
            <div className="text-[11px] text-emerald-300 font-medium">Collected / Realized</div>
            <div className="text-2xl font-extrabold text-amber-300 mt-0.5">₹{totalRevenue}</div>
            <div className="text-[10px] text-emerald-400">Fee revenue</div>
          </div>
        </div>

        {/* Fresh Roster Status Banner when 0 patients booked */}
        {totalBookedToday === 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-900/70 via-emerald-850/60 to-emerald-900/70 border border-emerald-700/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-850 border border-emerald-600/50 flex items-center justify-center text-amber-300 shrink-0">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                  <span>Fresh Clean Roster (रोस्टर बिल्कुल नया और खाली है)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    0 Patients • All Slots Open
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  Clean fresh slate for {selectedDate}. All 1-hour slots (capacity 5 per slot) are open for incoming patients and walk-ins.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowWalkInModal(true)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              + Add Walk-In Patient
            </button>
          </div>
        )}

        {/* 24-Hour Automated Reminder Engine Operations Bar */}
        <div className="mt-4 pt-4 border-t border-emerald-800/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-emerald-950/40 p-4 rounded-2xl border border-emerald-700/40">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                24-Hour Automated Reminder Engine
              </span>
              <span className="text-[10px] bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded-full font-mono">
                Active Scheduler (Checking Every 30s)
              </span>
            </div>
            <p className="text-[11px] text-emerald-200">
              Schedules automated WhatsApp/SMS 24h prior to appointment slots. Patients confirm attendance by replying "CONFIRM" or tapping their link.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-emerald-900/80 px-3 py-1.5 rounded-xl text-xs border border-emerald-700/50">
              <span className="text-emerald-300 text-[10px] block">Attendance Confirmed</span>
              <span className="font-bold text-white text-sm">
                {appointments.filter((a) => a.attendanceStatus === 'confirmed').length} / {appointments.filter((a) => a.status !== 'cancelled').length}
              </span>
            </div>

            <button
              type="button"
              disabled={processingReminders}
              onClick={handleTriggerDueReminders}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-colors border border-emerald-600"
              title="Manually trigger any reminders due right now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${processingReminders ? 'animate-spin' : ''}`} />
              Run 24h Batch
            </button>

            <button
              type="button"
              onClick={() => {
                setSimulateResult(null);
                setShowSimulateReplyModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-xl text-xs font-semibold transition-colors border border-amber-400/40"
              title="Test/Simulate patient WhatsApp or SMS reply"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              Simulate Reply
            </button>
          </div>
        </div>

        {reminderNotice && (
          <div className="mt-3 bg-emerald-900/90 border border-emerald-400/40 text-emerald-100 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{reminderNotice}</span>
            </div>
            <button onClick={() => setReminderNotice(null)} className="text-emerald-300 hover:text-white p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Date Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Calendar className="w-4 h-4 text-emerald-800 shrink-0" />
          <input
            id="admin-date-picker"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="admin-patient-search"
            type="text"
            placeholder="Search patient name, phone, or token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          {(['all', 'scheduled', 'in-progress', 'completed', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'in-progress' ? 'In Session' : st}
            </button>
          ))}
        </div>
      </div>

      {/* GROUPED 1-HOUR TIME SLOTS VIEW (Core User Requirement) */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-800" />
            Grouped 1-Hour Discrete Slots for {selectedDate}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredAppointments.length} matching appointments
          </span>
        </div>

        {groupedSlots.map(({ slot, patients, capacityUsed, maxCapacity, isFull }) => {
          return (
            <div
              key={slot}
              id={`slot-group-${slot.replace(/\s+/g, '-')}`}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-emerald-300"
            >
              {/* Slot Header Bar */}
              <div className="bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-900 text-amber-300 flex items-center justify-center font-mono text-xs font-black">
                    {patients.length}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-mono tracking-wide">{slot}</h4>
                    <p className="text-[11px] text-slate-500">1-Hour Treatment Duration</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Capacity Counter */}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700">
                      {capacityUsed}/{maxCapacity} Patients
                    </span>
                    {isFull ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        FULL
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {maxCapacity - capacityUsed} Open
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Patients List within this 1-Hour Slot */}
              <div className="divide-y divide-slate-100">
                {patients.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 italic">
                    No matching patients booked for this 1-hour window.
                  </div>
                ) : (
                  patients.map((patient) => {
                    const isCompleted = patient.status === 'completed';
                    const isInProgress = patient.status === 'in-progress';
                    const isCancelled = patient.status === 'cancelled';
                    const isWorking = actionInProgressId === patient.id;

                    return (
                      <div
                        key={patient.id}
                        id={`patient-row-${patient.id}`}
                        className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                          isCompleted
                            ? 'bg-emerald-50/30'
                            : isInProgress
                            ? 'bg-amber-50/30'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* Patient Core Info */}
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-mono text-xs font-bold ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : isInProgress
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {patient.tokenNumber.split('-').pop() || 'PT'}
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">
                                {patient.patientName}
                              </span>
                              <span className="font-mono text-[11px] text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md font-semibold">
                                {patient.tokenNumber}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                  isCompleted
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isInProgress
                                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                                    : isCancelled
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {patient.status === 'in-progress' ? 'In Session' : patient.status}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                              <span className="flex items-center gap-1 font-mono">
                                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                                <a
                                  href={`tel:${patient.patientPhone}`}
                                  className="hover:underline text-emerald-800 font-medium"
                                >
                                  +91 {patient.patientPhone}
                                </a>
                              </span>
                              <span className="font-medium text-slate-800">
                                <strong>Therapy:</strong> {patient.therapy}
                              </span>
                              {patient.condition && (
                                <span className="text-slate-600">
                                  <strong>Ailment:</strong> {patient.condition}
                                </span>
                              )}
                            </div>

                            {/* Payment Status Pill */}
                            <div className="flex items-center gap-2 pt-0.5 text-[11px]">
                              <span className="font-bold text-slate-800">
                                Fee: ₹{patient.fee} ({patient.visitType === 'returning_patient' ? 'Return' : '1st Visit'})
                              </span>
                              <span className="text-slate-300">•</span>
                              <span
                                className={`font-semibold ${
                                  patient.paymentStatus === 'paid_online' ||
                                  patient.paymentStatus === 'collected_at_clinic'
                                    ? 'text-emerald-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {patient.paymentStatus === 'paid_online'
                                  ? `✓ Paid Online (UPI Ref: ${patient.upiReferenceNumber || 'Verified'})`
                                  : patient.paymentStatus === 'collected_at_clinic'
                                  ? '✓ Collected at Clinic'
                                  : '⏳ Payment Due at Counter'}
                              </span>
                            </div>

                            {/* 24-Hour Reminder & Attendance Status */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {patient.attendanceStatus === 'confirmed' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-md">
                                  <CheckSquare className="w-3 h-3 text-emerald-700" />
                                  Attendance Confirmed {patient.attendanceConfirmedAt ? `(${new Date(patient.attendanceConfirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  Attendance Awaiting Reply
                                </span>
                              )}

                              {patient.reminderStatus === 'sent' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md" title={patient.reminderMessage || ''}>
                                  <Send className="w-3 h-3 text-blue-500" />
                                  Reminder Dispatched ({patient.reminderChannel?.toUpperCase() || 'AUTO'})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                  <Bell className="w-3 h-3 text-slate-500" />
                                  24h Reminder Scheduled
                                </span>
                              )}

                              {patient.attendanceReplyNotes && (
                                <span className="text-[10px] text-slate-500 italic">
                                  "{patient.attendanceReplyNotes}"
                                </span>
                              )}
                            </div>

                            {patient.notes && (
                              <p className="text-[11px] text-slate-500 italic bg-white/70 p-1.5 rounded border border-slate-100 mt-1">
                                Note: {patient.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Individual Patient Action Buttons (CRITICAL REQUIREMENT) */}
                        <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
                          {/* Individual Attendance Confirm */}
                          {patient.attendanceStatus !== 'confirmed' && !isCancelled && !isCompleted && (
                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() => handleConfirmAttendance(patient.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-300 transition-colors"
                              title="Mark patient attendance confirmed"
                            >
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                              Confirm
                            </button>
                          )}

                          {/* Manual WhatsApp/SMS Reminder Dispatch */}
                          {!isCancelled && !isCompleted && (
                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() => handleSendReminderNow(patient.id, 'whatsapp')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-xl border border-blue-200 transition-colors"
                              title="Dispatch 24h reminder notification now"
                            >
                              <Send className="w-3 h-3 text-blue-600" />
                              Send Reminder
                            </button>
                          )}

                          {/* Open WhatsApp Web Pre-filled */}
                          <a
                            href={`https://wa.me/91${patient.patientPhone}?text=${encodeURIComponent(
                              patient.reminderMessage ||
                                `Namaste ${patient.patientName}, your session at Bindsukh Acupressure Center is on ${patient.appointmentDate} at ${patient.timeSlot}. Token: ${patient.tokenNumber}. Address: Puramufti Purani Bazar, Prayagraj. Please reply CONFIRM to confirm attendance or click: ${window.location.origin}/confirm/${patient.id}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Chat with Patient on WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>

                          {/* Copy 1-Click Confirmation Link */}
                          <button
                            type="button"
                            onClick={() => copyConfirmationLink(patient.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Copy Patient 1-Click Confirmation Link"
                          >
                            {copiedId === patient.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* INDIVIDUAL "MARK AS DONE" BUTTON */}
                          {!isCompleted && !isCancelled && (
                            <button
                              id={`mark-done-btn-${patient.id}`}
                              type="button"
                              disabled={isWorking}
                              onClick={() => handleMarkAsDone(patient.id)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Mark as Done
                            </button>
                          )}

                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              Session Completed
                            </span>
                          )}

                          {/* Quick Status Selector */}
                          <select
                            value={patient.status}
                            disabled={isWorking}
                            onChange={(e) => handleStatusChange(patient.id, e.target.value)}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="in-progress">In Session</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>

                          {/* View Receipt / Slip */}
                          <button
                            type="button"
                            onClick={() => onSelectReceipt(patient)}
                            className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Clinical Slip / Token"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Walk-in Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 font-serif text-lg">Add Walk-In Patient</h3>
              <button onClick={() => setShowWalkInModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {walkInError && (
              <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                {walkInError}
              </div>
            )}

            <form onSubmit={handleAddWalkIn} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Patient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Patient Name"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">10-Digit Mobile *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit phone"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign 1-Hour Slot *</label>
                <select
                  required
                  value={walkInSlot}
                  onChange={(e) => setWalkInSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-mono"
                >
                  <option value="">-- Choose Slot --</option>
                  {slotsForDay.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Therapy *</label>
                <select
                  value={walkInTherapy}
                  onChange={(e) => setWalkInTherapy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                >
                  <option value="Acupressure Therapy">Acupressure Therapy</option>
                  <option value="Acupuncture Therapy">Acupuncture Therapy</option>
                  <option value="Chiropractic Adjustment">Chiropractic Adjustment</option>
                  <option value="Cupping Therapy">Cupping Therapy</option>
                  <option value="Kinesiology Tape">Kinesiology Tape</option>
                  <option value="Acupressure Massage Therapy">Acupressure Massage Therapy</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-3.5 py-2 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 text-white rounded-xl font-bold hover:bg-emerald-900"
                >
                  Add Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulate Patient Reply Modal (SMS / WhatsApp Webhook Tester) */}
      {showSimulateReplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-900/10 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 font-serif text-base">Test Patient Reply Webhook</h3>
                  <p className="text-[11px] text-slate-500">
                    Simulate how the system automatically confirms attendance when a patient replies via WhatsApp or SMS.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowSimulateReplyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateReplySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Incoming Message Content *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CONFIRM BK-105 or YES or Aauga"
                  value={simulateMessage}
                  onChange={(e) => setSimulateMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Supported confirmation triggers: "CONFIRM", "YES", "OK", "AAUNGA", "HAAN", or mentioning their Token Number (e.g. BK-101).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Patient Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9xxxxxxxxx (Optional if token is in message)"
                  value={simulatePhone}
                  onChange={(e) => setSimulatePhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-mono"
                />
              </div>

              {simulateResult && (
                <div
                  className={`p-3 rounded-xl text-xs space-y-1 ${
                    simulateResult.status === 'confirmed'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {simulateResult.status === 'confirmed' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Attendance Confirmed Automatically!
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        Reply Received
                      </>
                    )}
                  </div>
                  <p className="text-[11px]">{simulateResult.responseMessage || simulateResult.message}</p>
                  {simulateResult.appointment && (
                    <div className="text-[10px] opacity-80 pt-1 font-mono">
                      Matched: {simulateResult.appointment.patientName} ({simulateResult.appointment.tokenNumber}) for {simulateResult.appointment.appointmentDate} @ {simulateResult.appointment.timeSlot}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowSimulateReplyModal(false)}
                  className="px-3.5 py-2 text-slate-600 hover:text-slate-800 font-medium text-xs"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 text-white rounded-xl font-bold text-xs hover:bg-emerald-900 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Simulate Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset to Fresh Slate Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 font-serif">
              Start Fresh Clinical Roster? (नया फ्रेश करें)
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              This will clear all demo and test appointments from THERAPIST: SAURABH PRAJAPATI’s clinic schedule, resetting today’s roster to <strong className="text-slate-900 font-bold">0 patients</strong>.
            </p>

            <div className="p-3 my-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-[11px] text-rose-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                Clean Slate for Real Clinic Operations
              </div>
              <p>
                Use this to wipe sample demo patients (e.g. Imran, Shanti Devi) so only real, live clinic bookings and walk-ins appear.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={resetting}
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors"
              >
                Cancel / रद्द करें
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleResetToFresh}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Trash2 className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                {resetting ? 'Resetting...' : 'Yes, Start Fresh Roster'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Patient Records CSV Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-white/80 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white p-5 sm:p-6 relative">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="absolute top-4 right-4 text-emerald-300 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-bold mb-2 border border-amber-400/30">
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
                <span>Offline Clinic Backup • ऑफ़लाइन बैकअप</span>
              </div>
              <h3 className="text-xl font-black font-serif tracking-tight text-white flex items-center gap-2">
                Download Patient Records (CSV)
              </h3>
              <p className="text-xs text-emerald-200/90 mt-1 leading-relaxed">
                क्लिनिक के सभी मरीज अपॉइंटमेंट्स, फीस, डॉक्टर नोट्स और उपस्थिति का कम्पलीट ऑफ़लाइन बैकअप एक्सेल / स्प्रेडशीट फ़ाइल में प्राप्त करें।
              </p>
            </div>

            {/* Content Options */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Option 1: Full Database Download (Direct Native Link + JS Fallback) */}
              <div className="p-4 bg-emerald-50/80 border-2 border-emerald-500/60 rounded-2xl relative transition-all hover:bg-emerald-50 shadow-xs">
                <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-emerald-700 text-amber-300 text-[10px] font-black uppercase rounded-full shadow-xs tracking-wider">
                  Recommended for Complete Backup
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Download className="w-5 h-5 text-amber-300" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>All Patient Appointments (संपूर्ण डेटा)</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Download all records across all past, present & upcoming dates into one Excel/Sheets CSV file.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-md">
                        {allAppointmentsCount !== null ? `${allAppointmentsCount} Total Records in System` : 'All Available Records'}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Direct Native Anchor Download Link (Never blocked by iframe sandbox or user gesture timeout) */}
                        <a
                          href="/api/appointments/export-csv?scope=all"
                          download={`bindsukh_all_patient_records_${todayStr()}.csv`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            setReminderNotice('📥 संपूर्ण अपॉइंटमेंट डेटा CSV फ़ाइल में डाउनलोड हो रहा है...');
                            setTimeout(() => setReminderNotice(null), 5000);
                            setShowExportModal(false);
                          }}
                          className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-750 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-300" />
                          <span>Direct Download / डाउनलोड करें</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: Selected Date Download */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl transition-all hover:bg-slate-100/70">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-emerald-800" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-900">
                      Selected Date Roster ({selectedDate})
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Download patient list specifically for <strong className="text-slate-800 font-semibold">{selectedDate}</strong> (e.g. today's roster for reception print/offline tracking).
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md">
                        {appointments.length} Patients on this date
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Direct Native Anchor Download Link */}
                        <a
                          href={`/api/appointments/export-csv?scope=date&date=${encodeURIComponent(selectedDate)}`}
                          download={`bindsukh_appointments_${selectedDate}.csv`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            setReminderNotice(`📥 ${selectedDate} का डेटा डाउनलोड हो रहा है...`);
                            setTimeout(() => setReminderNotice(null), 5000);
                            setShowExportModal(false);
                          }}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-300" />
                          <span>Download ({selectedDate})</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar: Copy to Clipboard, Share & Preview (Fail-Safe Alternatives) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Alternative Options / अन्य विकल्प (Mobile & Offline Friendly)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {/* Copy CSV Text */}
                  <button
                    type="button"
                    onClick={() => handleCopyCsvData('all')}
                    className="p-2.5 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                    title="Copy full CSV text to clipboard so you can paste it directly into Excel or Google Sheets"
                  >
                    {copiedCsv ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied! / कॉपी हुआ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Copy CSV / कॉपी करें</span>
                      </>
                    )}
                  </button>

                  {/* Share via WhatsApp / Files */}
                  <button
                    type="button"
                    onClick={() => handleShareCsv('all')}
                    className="p-2.5 bg-white hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-200 hover:border-teal-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                    title="Share CSV file or summary via WhatsApp, Email or Phone Drive"
                  >
                    <Share2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Share / शेयर करें</span>
                  </button>

                  {/* Preview CSV on Screen */}
                  <button
                    type="button"
                    onClick={() => handlePreviewCsv('all')}
                    className="p-2.5 bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-900 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                    title="View raw CSV table data on screen before downloading"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Preview / देखें</span>
                  </button>
                </div>
              </div>

              {/* Compatibility & Included Columns Info */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-[11px] text-amber-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Microsoft Excel, Google Sheets, LibreOffice & Phone Compatible</span>
                </div>
                <p className="text-slate-600 text-[10.5px] leading-relaxed">
                  Exported CSV file includes: Token Number, Patient Name, Phone Number, Appointment Date, Time Slot, Therapy, Condition, Visit Type, Fee, Payment Method, Payment Status, UPI Reference No, Appointment Status, Attendance Status, Reminder Status, Clinician Notes, and Booking Created At. Formatted with UTF-8 BOM encoding for seamless display of Hindi & English text without character errors.
                </p>
              </div>

              {/* Close Button */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Close / बंद करें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Preview CSV Modal */}
      {previewCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-white/80 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>CSV Data Screen Preview / डेटा पूर्वावलोकन</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Raw CSV format preview with UTF-8 Devanagari character support
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCsvModal(false)}
                className="text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-900 rounded-xl p-3 border border-slate-700 max-h-72 overflow-x-auto overflow-y-auto font-mono text-[11px] text-emerald-400 whitespace-pre">
                {previewCsvContent || 'Loading CSV preview...'}
              </div>
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopyCsvData('all')}
                  className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy CSV Text / कॉपी करें</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewCsvModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors"
                >
                  Close / बंद करें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ownership & Production Deployment Guide Modal */}
      <OwnershipDeployModal
        isOpen={showOwnershipModal}
        onClose={() => setShowOwnershipModal(false)}
      />

      {/* Upload Authentic Clinic Logo Modal */}
      <UploadLogoModal
        isOpen={showUploadLogoModal}
        onClose={() => setShowUploadLogoModal(false)}
      />

      {/* Public Patient App QR Code & Link Modal */}
      <PublicShareModal
        isOpen={showPublicQrModal}
        onClose={() => setShowPublicQrModal(false)}
      />
    </div>
  );
};
