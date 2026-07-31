import { useEffect } from 'react';

function isMessagingComposer(element) {
  if (!(element instanceof HTMLTextAreaElement)) return false;
  return Boolean(element.closest('[role="dialog"][aria-label="Messagerie Nzela Jobs"]'));
}

export default function MessagingKeyboardShortcut() {
  useEffect(() => {
    const prepareComposer = (event) => {
      const textarea = event.target;
      if (!isMessagingComposer(textarea)) return;
      textarea.setAttribute('enterkeyhint', 'send');
      textarea.setAttribute('aria-keyshortcuts', 'Enter');
      textarea.setAttribute('title', 'Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne');
    };

    const handleKeyDown = (event) => {
      const textarea = event.target;
      if (!isMessagingComposer(textarea)) return;
      if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.isComposing || event.keyCode === 229) return;

      event.preventDefault();
      if (!textarea.value.trim()) return;

      const form = textarea.closest('form');
      const submitButton = form?.querySelector('button[type="submit"]');
      if (!form || submitButton?.disabled) return;
      form.requestSubmit();
    };

    document.addEventListener('focusin', prepareComposer, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('focusin', prepareComposer, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  return null;
}
