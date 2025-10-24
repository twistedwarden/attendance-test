import React from 'react';
import { SchoolYear } from '../../types';

interface SchoolYearSelectorProps {
  schoolYears: SchoolYear[];
  selectedYearId: number;
  onChange: (yearId: number) => void;
  showActiveOnly?: boolean;
  className?: string;
}

export const SchoolYearSelector: React.FC<SchoolYearSelectorProps> = ({
  schoolYears,
  selectedYearId,
  onChange,
  showActiveOnly = false,
  className = ''
}) => {
  const filteredYears = showActiveOnly 
    ? schoolYears.filter(year => year.isActive)
    : schoolYears;

  const selectedYear = schoolYears.find(year => year.schoolYearId === selectedYearId);

  return (
    <div className={`relative ${className}`}>
      <select
        value={selectedYearId}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        {filteredYears.map((year) => (
          <option key={year.schoolYearId} value={year.schoolYearId}>
            {year.yearLabel} {year.isActive ? '(Active)' : ''}
          </option>
        ))}
      </select>
      
      {selectedYear && (
        <div className="mt-1 text-sm text-gray-600 flex items-center gap-2">
          {selectedYear.isActive && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          )}
          <span className="whitespace-nowrap">
            {new Date(selectedYear.startDate).toLocaleDateString()} - {new Date(selectedYear.endDate).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default SchoolYearSelector;
