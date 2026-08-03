'use client';

import { useEffect, useState } from 'react';

export function WireframeFeedback() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    let timeoutId;
    const handleAction = (event) => {
      const label = event.detail?.label || 'Accion';
      window.clearTimeout(timeoutId);
      setMessage(`${label}: accion simulada en wireframe`);
      timeoutId = window.setTimeout(() => setMessage(''), 2600);
    };

    window.addEventListener('vtkall:wireframe-action', handleAction);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('vtkall:wireframe-action', handleAction);
    };
  }, []);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm rounded-lg border border-border-inverse bg-surface-header-dark px-4 py-3 text-sm font-semibold text-text-inverse shadow-lg">
      {message}
    </div>
  );
}
