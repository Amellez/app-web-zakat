import React from 'react';

export default function SourceBadge({ source }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
      source === 'online' 
        ? 'bg-purple-100 text-purple-800' 
        : 'bg-indigo-100 text-indigo-800'
    }`}>
      {source === 'online' ? '🌐 En ligne' : '🏢 Sur place'}
    </span>
  );
}