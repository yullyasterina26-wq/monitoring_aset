import { useCallback, useEffect, useState } from 'react';

export default function usePersistentDraft(key, isOpen, draft, restore) {
  const [resumedOpen, setResumedOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(key);
      const ownerKey = `${key}:resume-owner`;
      if (saved && !sessionStorage.getItem(ownerKey)) {
        sessionStorage.setItem(ownerKey, 'claimed');
        restore(JSON.parse(saved));
        setResumedOpen(true);
      }
    } catch (error) {
      console.warn(`Draf ${key} tidak dapat dipulihkan:`, error);
      sessionStorage.removeItem(key);
    } finally {
      setReady(true);
    }
  }, [key, restore]);

  useEffect(() => {
    if (ready && (isOpen || resumedOpen)) {
      sessionStorage.setItem(key, JSON.stringify(draft));
    }
  }, [key, ready, isOpen, resumedOpen, draft]);

  const clearDraft = useCallback(() => {
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(`${key}:resume-owner`);
    setResumedOpen(false);
  }, [key]);

  return { visible: isOpen || resumedOpen, clearDraft };
}
