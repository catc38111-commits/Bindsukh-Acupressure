import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { PatientAppointment } from '../types';
import { CLINIC_INFO } from '../data/clinicData';

/**
 * Generates an official, high-quality styled PDF receipt for the appointment token.
 * It uses html2canvas to capture the styled receipt card or directly creates a crisp vector PDF with jsPDF.
 */
export async function generateAndDownloadReceiptPdf(
  appointment: PatientAppointment,
  elementId: string = 'printable-slip-wrapper',
  logoUrl?: string
): Promise<boolean> {
  try {
    const targetElement = document.getElementById(elementId);

    if (targetElement) {
      // 1. Capture the DOM element with html2canvas for pixel-perfect styled layout
      const canvas = await html2canvas(targetElement, {
        scale: 2, // High resolution (Retina quality)
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Fit card nicely in center of A4 with margins
      const imgWidth = Math.min(180, pageWidth - 20);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const xPos = (pageWidth - imgWidth) / 2;
      const yPos = 15;

      pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, Math.min(imgHeight, pageHeight - 30));

      // Add footer stamp
      pdf.setFontSize(8);
      pdf.setTextColor(120, 140, 130);
      pdf.text(
        `Official e-Slip generated on ${new Date().toLocaleDateString('en-IN')} | Bindsukh Acupressure Center Prayagraj`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      pdf.save(`bindsukh_receipt_${appointment.tokenNumber}.pdf`);
      return true;
    }

    // 2. Direct jsPDF Vector Fallback if target DOM element is not rendered
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();

    // Top Header Banner
    pdf.setFillColor(6, 78, 59); // emerald-900
    pdf.rect(0, 0, pageWidth, 42, 'F');

    // Header Titles
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.text(CLINIC_INFO.name, pageWidth / 2, 14, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(253, 230, 138); // amber-200
    pdf.text('Healing Through Touch & Magnet - Prayagraj', pageWidth / 2, 22, { align: 'center' });

    pdf.setFontSize(8);
    pdf.setTextColor(209, 250, 229);
    pdf.text(CLINIC_INFO.address, pageWidth / 2, 29, { align: 'center' });
    pdf.text(`Helpline: ${CLINIC_INFO.phones.join(' / ')}`, pageWidth / 2, 35, { align: 'center' });

    // Token Highlight Box
    pdf.setFillColor(236, 253, 245); // emerald-50
    pdf.setDrawColor(16, 185, 129); // emerald-500
    pdf.setLineWidth(0.6);
    pdf.roundedRect(20, 48, pageWidth - 40, 26, 3, 3, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(6, 78, 59);
    pdf.text('OFFICIAL CLINICAL QUEUE TOKEN', pageWidth / 2, 54, { align: 'center' });

    pdf.setFontSize(18);
    pdf.setTextColor(4, 120, 87);
    pdf.text(appointment.tokenNumber, pageWidth / 2, 64, { align: 'center' });

    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(75, 85, 99);
    pdf.text('Please present this official token slip at the clinic reception desk upon arrival', pageWidth / 2, 70, { align: 'center' });

    // Details Table Box
    pdf.setDrawColor(229, 231, 235);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(20, 78, pageWidth - 40, 96, 2, 2, 'FD');

    let currentY = 87;
    const leftCol = 25;
    const rightCol = pageWidth - 25;

    const addRow = (label: string, value: string, isHighlight: boolean = false) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      pdf.text(label, leftCol, currentY);

      pdf.setFont('helvetica', isHighlight ? 'bold' : 'normal');
      pdf.setTextColor(isHighlight ? 6 : 17, isHighlight ? 78 : 24, isHighlight ? 59 : 39);
      pdf.text(value, rightCol, currentY, { align: 'right' });

      pdf.setDrawColor(243, 244, 246);
      pdf.line(20, currentY + 3, pageWidth - 20, currentY + 3);
      currentY += 10;
    };

    addRow('Patient Name:', appointment.patientName, true);
    addRow('Contact Phone:', `+91 ${appointment.patientPhone}`);
    addRow('Appointment Date:', appointment.appointmentDate, true);
    addRow('Allocated Time Slot:', appointment.timeSlot, true);
    addRow('Therapy Selected:', appointment.therapy);
    addRow('Health Concern / Area:', appointment.condition || 'General Assessment');
    addRow('Patient Visit Type:', appointment.visitType === 'returning_patient' ? 'Returning Patient' : 'First Visit Registration');
    addRow(
      'Consultation & Therapy Fee:',
      `Rs. ${appointment.fee} (${appointment.paymentStatus === 'paid_online' ? 'PAID ONLINE UPI' : 'PAY AT CLINIC'})`,
      true
    );
    if (appointment.upiReferenceNumber) {
      addRow('UPI Reference ID:', appointment.upiReferenceNumber);
    }

    // QR Code generation for instant token verification
    try {
      const qrDataUrl = await QRCode.toDataURL(`BINDSUKH-APPOINTMENT:${appointment.tokenNumber}:${appointment.patientPhone}`, {
        margin: 1,
        width: 100,
      });
      pdf.addImage(qrDataUrl, 'PNG', pageWidth - 48, 180, 28, 28);
    } catch {
      // ignore qr fail
    }

    // Instructions Box
    pdf.setFillColor(254, 243, 199); // amber-100
    pdf.setDrawColor(245, 158, 11); // amber-500
    pdf.roundedRect(20, 180, pageWidth - 72, 28, 2, 2, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(146, 64, 14);
    pdf.text('IMPORTANT PATIENT INSTRUCTIONS:', 24, 186);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(120, 53, 15);
    pdf.text('1. Please arrive 10 minutes prior to your allocated 1-hour slot.', 24, 191);
    pdf.text('2. Wear comfortable loose cotton clothing for acupressure therapy.', 24, 196);
    pdf.text('3. Bring previous MRI, X-Ray, and clinical diagnosis reports if available.', 24, 201);

    // Practitioner Signature / Stamp Area
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(6, 78, 59);
    pdf.text(`Lead Practitioner: ${CLINIC_INFO.leadPractitioner}`, 20, 222);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(75, 85, 99);
    pdf.text(CLINIC_INFO.qualifications, 20, 227);
    pdf.text('Bindsukh Acupressure & Acupuncture Center, Puramufti Prayagraj', 20, 232);

    pdf.save(`bindsukh_receipt_${appointment.tokenNumber}.pdf`);
    return true;
  } catch (err) {
    console.error('Failed to generate PDF:', err);
    return false;
  }
}

/**
 * Prints the styled appointment receipt directly using standard print dialog
 */
export function printReceiptSlip(elementId: string = 'printable-slip-wrapper'): void {
  try {
    window.print();
  } catch (e) {
    console.warn('Window print failed:', e);
  }
}
