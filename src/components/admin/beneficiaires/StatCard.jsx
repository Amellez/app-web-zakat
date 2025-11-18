import React from 'react';

const colorClasses = {
  gray: {
    bg: 'from-gray-500 to-gray-600',
    icon: 'bg-gray-100 text-gray-600'
  },
  yellow: {
    bg: 'from-yellow-500 to-amber-600',
    icon: 'bg-yellow-100 text-yellow-600'
  },
  green: {
    bg: 'from-green-500 to-emerald-600',
    icon: 'bg-green-100 text-green-600'
  },
  blue: {
    bg: 'from-blue-500 to-indigo-600',
    icon: 'bg-blue-100 text-blue-600'
  },
  orange: {
    bg: 'from-orange-500 to-red-600',
    icon: 'bg-orange-100 text-orange-600'
  }
};

export default function StatCard({ title, value, icon: Icon, color = 'gray', subtitle }) {
  const colors = colorClasses[color] || colorClasses.gray;

  return (
    <div className={`bg-gradient-to-r ${colors.bg} rounded-xl shadow-lg p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold opacity-90 mb-2">{title}</p>
          <p className="text-4xl font-black">{value}</p>
          {subtitle && (
            <p className="text-xs opacity-80 mt-2">{subtitle}</p>
          )}
        </div>
        <div className={`${colors.icon} p-4 rounded-lg`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
}