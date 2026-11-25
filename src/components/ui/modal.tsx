'use client';

import React, { useEffect } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: string | React.ReactNode;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  size = 'md',
  children,
  footer,
  className = '',
}: ModalProps) {
  // Manejo de tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${sizeClasses[size]} rounded-2xl border-2 border-zinc-700 bg-zinc-950 p-5 sm:p-6 shadow-[6px_6px_0px_0px_#f97316] space-y-4 animate-in fade-in zoom-in-95 duration-150 ${className}`}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between pb-3.5 border-b-2 border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 border-2 border-orange-500/40 text-orange-400 text-base font-bold shadow-[2px_2px_0px_0px_#f97316]">
                {icon}
              </div>
            )}
            <h3 className="font-display text-base sm:text-lg font-black uppercase tracking-tight text-white truncate">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-800 active:translate-x-[1px] active:translate-y-[1px] transition-all"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="space-y-4">{children}</div>

        {/* Footer Opcional */}
        {footer && (
          <div className="pt-3.5 border-t-2 border-zinc-800 flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
