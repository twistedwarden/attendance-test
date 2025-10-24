import React from 'react';

interface SchoolYearBadgeProps {
  yearLabel: string;
  isActive: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SchoolYearBadge: React.FC<SchoolYearBadgeProps> = ({
  yearLabel,
  isActive,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const baseClasses = 'inline-flex items-center rounded-full font-medium';
  const activeClasses = 'bg-green-100 text-green-800 border border-green-200';
  const inactiveClasses = 'bg-gray-100 text-gray-600 border border-gray-200';

  return (
    <span
      className={`${baseClasses} ${sizeClasses[size]} ${
        isActive ? activeClasses : inactiveClasses
      } ${className}`}
    >
      {isActive && (
        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
      )}
      {yearLabel}
      {isActive && (
        <span className="ml-1 text-xs font-semibold">(Active)</span>
      )}
    </span>
  );
};

export default SchoolYearBadge;
