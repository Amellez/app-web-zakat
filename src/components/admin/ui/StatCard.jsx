import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'gray' }) {
  const colorClasses = {
    gray: 'border-gray-200',
    yellow: 'border-yellow-200',
    green: 'border-green-200',
    blue: 'border-blue-200'
  };

  const iconColors = {
    gray: 'text-gray-400',
    yellow: 'text-yellow-400',
    green: 'text-green-400',
    blue: 'text-blue-400'
  };

  const valueColors = {
    gray: 'text-gray-800',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    blue: 'text-blue-600'
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-3xl font-bold ${valueColors[color]}`}>{value}</p>
        </div>
        <Icon className={`w-10 h-10 ${iconColors[color]}`} />
      </div>
    </div>
  );
}