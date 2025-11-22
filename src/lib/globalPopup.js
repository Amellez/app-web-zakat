// src/lib/globalPopup.js
import { createRoot } from 'react-dom/client';
import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react';

let popupContainer = null;
let popupRoot = null;
let popups = [];

function initPopupContainer() {
  if (!popupContainer) {
    popupContainer = document.createElement('div');
    popupContainer.id = 'global-popup-container';
    document.body.appendChild(popupContainer);
    popupRoot = createRoot(popupContainer);
  }
}

function renderPopups() {
  if (!popupRoot) return;
  
  popupRoot.render(
    <>
      {popups.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-[9998] animate-fade-in" 
             onClick={() => {
               // Fermer si on clique sur le backdrop (sauf pour les confirmations)
               const topPopup = popups[popups.length - 1];
               if (!topPopup.actions) {
                 removePopup(topPopup.id);
               }
             }}
        />
      )}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-4">
        {popups.map((popup, index) => (
          <PopupItem 
            key={popup.id} 
            popup={popup} 
            isTop={index === popups.length - 1}
          />
        ))}
      </div>
    </>
  );
}

function PopupItem({ popup, isTop }) {
  const icons = {
    success: { 
      Icon: CheckCircle, 
      colors: 'bg-white border-green-500',
      iconColor: 'text-green-600',
      titleColor: 'text-green-800'
    },
    error: { 
      Icon: AlertCircle, 
      colors: 'bg-white border-red-500',
      iconColor: 'text-red-600',
      titleColor: 'text-red-800'
    },
    warning: { 
      Icon: AlertTriangle, 
      colors: 'bg-white border-orange-500',
      iconColor: 'text-orange-600',
      titleColor: 'text-orange-800'
    },
    info: { 
      Icon: AlertCircle, 
      colors: 'bg-white border-blue-500',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-800'
    }
  };

  const { Icon, colors, iconColor, titleColor } = icons[popup.type] || icons.info;

  return (
    <div 
      className={`${colors} ${isTop ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} 
                  border-l-4 rounded-xl shadow-2xl pointer-events-auto
                  max-w-md w-full transition-all duration-300 animate-scale-in`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 ${iconColor}`}>
            <Icon className="w-8 h-8" />
          </div>
          
          <div className="flex-1 min-w-0">
            {popup.title && (
              <h3 className={`font-bold text-lg mb-2 ${titleColor}`}>
                {popup.title}
              </h3>
            )}
            <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
              {popup.message}
            </p>
            
            {popup.actions && popup.actions.length > 0 && (
              <div className="flex gap-3 mt-6">
                {popup.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => action.onClick()}
                    className={`flex-1 px-6 py-3 rounded-lg text-base font-semibold transition-all
                               transform hover:scale-105 active:scale-95 ${
                      action.variant === 'primary'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!popup.actions && (
            <button
              onClick={() => removePopup(popup.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function addPopup(popup) {
  initPopupContainer();
  popups = [...popups, popup];
  renderPopups();
}

function removePopup(id) {
  popups = popups.filter(p => p.id !== id);
  renderPopups();
}

// ✅ REMPLACER window.alert()
export function customAlert(message) {
  const id = Date.now() + Math.random();
  
  addPopup({
    id,
    type: 'info',
    title: null,
    message: String(message),
    actions: [
      {
        label: 'OK',
        variant: 'primary',
        onClick: () => removePopup(id)
      }
    ]
  });
}

// ✅ REMPLACER window.confirm()
export function customConfirm(message) {
  return new Promise((resolve) => {
    const id = Date.now() + Math.random();
    
    addPopup({
      id,
      type: 'warning',
      title: 'Confirmation',
      message: String(message),
      actions: [
        {
          label: 'Annuler',
          variant: 'secondary',
          onClick: () => {
            removePopup(id);
            resolve(false);
          }
        },
        {
          label: 'Confirmer',
          variant: 'primary',
          onClick: () => {
            removePopup(id);
            resolve(true);
          }
        }
      ]
    });
  });
}

// ✅ Fonctions helpers supplémentaires
export function showSuccess(message, duration = 5000) {
  const id = Date.now() + Math.random();
  
  addPopup({
    id,
    type: 'success',
    title: '✓ Succès',
    message: String(message)
  });

  if (duration > 0) {
    setTimeout(() => removePopup(id), duration);
  }
}

export function showError(message, duration = 8000) {
  const id = Date.now() + Math.random();
  
  addPopup({
    id,
    type: 'error',
    title: '✗ Erreur',
    message: String(message)
  });

  if (duration > 0) {
    setTimeout(() => removePopup(id), duration);
  }
}

export function showWarning(message, duration = 6000) {
  const id = Date.now() + Math.random();
  
  addPopup({
    id,
    type: 'warning',
    title: '⚠ Attention',
    message: String(message)
  });

  if (duration > 0) {
    setTimeout(() => removePopup(id), duration);
  }
}

// 🔥 OVERRIDE AUTOMATIQUE des fonctions natives
export function initGlobalPopup() {
  if (typeof window === 'undefined') return;

  // Ajouter les styles
  if (!document.getElementById('global-popup-styles')) {
    const style = document.createElement('style');
    style.id = 'global-popup-styles';
    style.textContent = `
      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes scale-in {
        from {
          transform: scale(0.9);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      .animate-fade-in {
        animation: fade-in 0.2s ease-out;
      }

      .animate-scale-in {
        animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
    `;
    document.head.appendChild(style);
  }

  // Sauvegarder les fonctions natives
  window._nativeAlert = window.alert;
  window._nativeConfirm = window.confirm;

  // Remplacer par nos versions personnalisées
  window.alert = customAlert;
  window.confirm = customConfirm;
  
  console.log('✅ Popups globaux initialisés (alert & confirm remplacés)');
}