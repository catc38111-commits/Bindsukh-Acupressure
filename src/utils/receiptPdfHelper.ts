import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { PatientAppointment } from '../types';
import { CLINIC_INFO } from '../data/clinicData';

/**
 * Checks if the current environment is a mobile browser or Android WebView/APK.
 */
function isMobileOrWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const isAndroid = /android/i.test(ua);
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isWv = /wv|WebView|Version\/[\d.]+/i.test(ua) || (isAndroid && !/Chrome\/[\d.]+/i.test(ua));
  return isAndroid || isIos || isWv;
}

/**
 * Safely delivers a PDF document to the user across WebViews, Android APKs, and desktop browsers.
 * Uses a cascade of strategies: Web Share API -> Base64 Data URL Trigger -> Blob Object URL -> Printable Pop-up/Iframe.
 */
async function deliverPdfSafely(
  pdf: jsPDF,
  filename: string,
  appointment: PatientAppointment,
  canvasImgData?: string
): Promise<boolean> {
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const pdfBlob = pdf.output('blob');
  const pdfBase64DataUrl = pdf.output('datauristring');

  // Strategy 1: Native Web Share API with File (Supported on modern Android WebViews, Chrome, Safari)
  // Allows user to directly save to Downloads, WhatsApp, Drive, or Files app without sandbox blocking.
  if (typeof navigator !== 'undefined' && navigator.canShare) {
    try {
      const pdfFile = new File([pdfBlob], cleanFilename, { type: 'application/pdf' });
      if (navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Bindsukh Appointment Slip - ${appointment.tokenNumber}`,
          text: `Official appointment receipt slip for ${appointment.patientName} (Token: ${appointment.tokenNumber}) at Bindsukh Acupressure Center.`,
        });
        return true;
      }
    } catch (shareErr: any) {
      if (shareErr.name !== 'AbortError') {
        console.warn('Web Share API attempt notice:', shareErr);
      } else {
        // User deliberately cancelled the share dialog
        return true;
      }
    }
  }

  // Strategy 2: Base64 Data URL Anchor Download Trigger (Reliable in Android WebViews where blob: URLs are restricted)
  try {
    const dataLink = document.createElement('a');
    dataLink.href = pdfBase64DataUrl;
    dataLink.download = cleanFilename;
    dataLink.target = '_blank';
    dataLink.rel = 'noopener noreferrer';
    dataLink.style.display = 'none';
    document.body.appendChild(dataLink);
    dataLink.click();

    setTimeout(() => {
      if (document.body.contains(dataLink)) {
        document.body.removeChild(dataLink);
      }
    }, 15000);

    // If on desktop, this is usually all that is needed
    if (!isMobileOrWebView()) {
      return true;
    }
  } catch (dataUrlErr) {
    console.warn('Data URI download attempt notice:', dataUrlErr);
  }

  // Strategy 3: Standard Object URL Blob Trigger
  try {
    const blobUrl = URL.createObjectURL(pdfBlob);
    const blobLink = document.createElement('a');
    blobLink.href = blobUrl;
    blobLink.download = cleanFilename;
    blobLink.target = '_blank';
    blobLink.rel = 'noopener noreferrer';
    blobLink.style.display = 'none';
    document.body.appendChild(blobLink);
    blobLink.click();

    setTimeout(() => {
      if (document.body.contains(blobLink)) {
        document.body.removeChild(blobLink);
      }
      URL.revokeObjectURL(blobUrl);
    }, 30000);
  } catch (blobErr) {
    console.warn('Blob URL download attempt notice:', blobErr);
  }

  // Strategy 4: Fallback Printable Pop-up / Hidden Iframe for restricted WebViews
  // If download was intercepted by an in-app WebView without DownloadListener,
  // open a formatted print/view window so Android's native print spooler / PDF viewer can save it.
  try {
    if (isMobileOrWebView()) {
      openPrintableReceiptWindow(appointment, canvasImgData, pdfBase64DataUrl);
    }
  } catch (popErr) {
    console.warn('Printable window fallback notice:', popErr);
  }

  return true;
}

/**
 * Opens a clean, styled printable pop-up window formatted for A4 printing and saving as PDF.
 */
function openPrintableReceiptWindow(
  appointment: PatientAppointment,
  canvasImgData?: string,
  pdfBase64?: string
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Bindsukh Receipt - ${appointment.tokenNumber}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #0f172a;
        }
        .actions-bar {
          width: 100%;
          max-width: 480px;
          margin-bottom: 16px;
          display: flex;
          gap: 8px;
        }
        .btn {
          flex: 1;
          padding: 12px 16px;
          border-radius: 12px;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          border: none;
          text-align: center;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .btn-primary { background-color: #064e3b; color: #ffffff; }
        .btn-secondary { background-color: #f59e0b; color: #022c22; }
        .receipt-card {
          width: 100%;
          max-width: 480px;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .receipt-img {
          width: 100%;
          height: auto;
          display: block;
        }
        @media print {
          body { background: #ffffff; padding: 0; }
          .actions-bar { display: none !important; }
          .receipt-card { box-shadow: none; border: none; max-width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="actions-bar">
        <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save as PDF</button>
        ${
          pdfBase64
            ? `<a class="btn btn-secondary" href="${pdfBase64}" download="bindsukh_receipt_${appointment.tokenNumber}.pdf">📥 Download File</a>`
            : ''
        }
      </div>
      <div class="receipt-card">
        ${
          canvasImgData
            ? `<img src="${canvasImgData}" class="receipt-img" alt="Appointment Receipt Slip" />`
            : `
            <div style="padding: 24px; text-align: center;">
              <h2 style="margin: 0 0 8px 0; color: #064e3b;">${CLINIC_INFO.name}</h2>
              <p style="margin: 0 0 16px 0; color: #d97706; font-size: 13px;">${CLINIC_INFO.taglineHindi}</p>
              <div style="background: #ecfdf5; border: 2px dashed #10b981; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                <div style="font-size: 12px; color: #047857; font-weight: bold;">OFFICIAL QUEUE TOKEN</div>
                <div style="font-size: 28px; font-weight: 900; color: #064e3b; margin: 4px 0;">${appointment.tokenNumber}</div>
              </div>
              <table style="width: 100%; text-align: left; font-size: 13px; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">Patient Name:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${appointment.patientName}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">Phone:</td><td style="padding: 8px 0; font-family: monospace; text-align: right;">+91 ${appointment.patientPhone}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">Date:</td><td style="padding: 8px 0; font-weight: bold; color: #064e3b; text-align: right;">${appointment.appointmentDate}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">Time Slot:</td><td style="padding: 8px 0; font-weight: bold; color: #064e3b; text-align: right;">${appointment.timeSlot}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">Therapy:</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${appointment.therapy}</td></tr>
                <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 0; color: #64748b;">Fee:</td><td style="padding: 8px 0; font-weight: bold; color: #064e3b; text-align: right;">₹${appointment.fee} (${appointment.paymentStatus === 'paid_online' ? 'Paid via UPI' : 'Pay at Clinic'})</td></tr>
              </table>
            </div>
          `
        }
      </div>
      <script>
        // Auto-prompt print dialog when opened in WebView
        window.addEventListener('load', function() {
          setTimeout(function() {
            try { window.print(); } catch(e) {}
          }, 600);
        });
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Generates an official, high-quality styled PDF receipt for the appointment token.
 * It uses html2canvas to capture the styled receipt card DOM node and creates a formatted A4 PDF.
 */
export async function generateAndDownloadReceiptPdf(
  appointment: PatientAppointment,
  elementId: string = 'printable-slip-wrapper',
  logoUrl?: string
): Promise<boolean> {
  try {
    const targetElement = document.getElementById(elementId) || document.getElementById('printable-slip');
    let canvasImgData: string | undefined;

    if (targetElement) {
      // 1. Capture the DOM element with html2canvas for pixel-perfect styled layout
      const canvas = await html2canvas(targetElement, {
        scale: 2, // High resolution (Retina quality)
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      canvasImgData = canvas.toDataURL('image/png');
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

      pdf.addImage(canvasImgData, 'PNG', xPos, yPos, imgWidth, Math.min(imgHeight, pageHeight - 30));

      // Add footer stamp
      pdf.setFontSize(8);
      pdf.setTextColor(120, 140, 130);
      pdf.text(
        `Official e-Slip generated on ${new Date().toLocaleDateString('en-IN')} | Bindsukh Acupressure Center Prayagraj`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      return await deliverPdfSafely(
        pdf,
        `bindsukh_receipt_${appointment.tokenNumber}.pdf`,
        appointment,
        canvasImgData
      );
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

    return await deliverPdfSafely(
      pdf,
      `bindsukh_receipt_${appointment.tokenNumber}.pdf`,
      appointment,
      canvasImgData
    );
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

export const generateAppointmentReceiptPdf = generateAndDownloadReceiptPdf;
