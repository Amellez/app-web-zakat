import React from 'react';

export default function EmptyState({ icon: Icon, title, description, buttonText, onButtonClick }) {
  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-8 text-center">
      <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      {buttonText && onButtonClick && (
        <button
          onClick={onButtonClick}
          className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}