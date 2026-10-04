import { useEffect } from 'react';

/**
 * Custom hook to lock body scroll when a modal opens,
 * and restore overflow to 'unset' when closed or unmounted.
 */
export function useLockBodyScroll(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
}
