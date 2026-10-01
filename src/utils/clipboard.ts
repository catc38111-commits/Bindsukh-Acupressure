/**
 * Safe clipboard copy utility with iOS Safari fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // Try modern Clipboard API if supported and in secure context
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Modern clipboard copy failed, trying legacy fallback:', err);
    }
  }

  // Fallback for iOS Safari and webviews
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    // iOS Safari selection range
    if (typeof textArea.setSelectionRange === 'function') {
      textArea.setSelectionRange(0, text.length);
    }

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return false;
  }
}
