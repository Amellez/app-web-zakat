'use client';
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ModalConfirmation({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "danger" // "danger" ou "warning"
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'danger':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          title: 'text-red-800',
          message: 'text-red-700',
          button: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: 'text-amber-600',
          title: 'text-amber-800',
          message: 'text-amber-700',
          button: 'bg-amber-600 hover:bg-amber-700'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: 'text-gray-600',
          title: 'text-gray-800',
          message: 'text-gray-700',
          button: 'bg-gray-600 hover:bg-gray-700'
        };
    }
  };

  const classes = getVariantClasses();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className={`${classes.bg} ${classes.border} border-b-2 px-6 py-4 rounded-t-lg`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-6 h-6 ${classes.icon} flex-shrink-0 mt-0.5`} />
              <div className="flex-1">
                <h3 className={`text-lg font-bold ${classes.title}`}>
                  {title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            <p className={`text-sm ${classes.message}`}>
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-semibold"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2 ${classes.button} text-white rounded-lg transition font-semibold`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
