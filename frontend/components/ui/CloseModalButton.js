import { X } from 'lucide-react';

export default function CloseModalButton({ onClick, absolute = false, className = "" }) {
  const baseClass = "p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer flex items-center justify-center";
  const absoluteClass = absolute ? "absolute top-6 right-6 z-50" : "";
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClass} ${absoluteClass} ${className}`}
      aria-label="Cerrar"
    >
      <X className="w-5 h-5" />
    </button>
  );
}
