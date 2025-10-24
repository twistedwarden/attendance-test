import React, { useState, useEffect } from 'react';
import { SchoolYear } from '../../types';
import { AdminService } from './api/adminService';
import { SchoolYearBadge } from '../shared/SchoolYearBadge';

interface SchoolYearFormData {
  yearLabel: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const SchoolYearSection: React.FC = () => {
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingYear, setEditingYear] = useState<SchoolYear | null>(null);
  const [formData, setFormData] = useState<SchoolYearFormData>({
    yearLabel: '',
    startDate: '',
    endDate: '',
    isActive: false
  });

  useEffect(() => {
    loadSchoolYears();
  }, []);

  const loadSchoolYears = async () => {
    try {
      setLoading(true);
      const years = await AdminService.getSchoolYears();
      setSchoolYears(years);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load school years');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingYear(null);
    setFormData({
      yearLabel: '',
      startDate: '',
      endDate: '',
      isActive: false
    });
    setShowForm(true);
  };

  const handleEdit = (year: SchoolYear) => {
    setEditingYear(year);
    setFormData({
      yearLabel: year.yearLabel,
      startDate: year.startDate,
      endDate: year.endDate,
      isActive: year.isActive
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      if (editingYear) {
        await AdminService.updateSchoolYear(editingYear.schoolYearId, formData);
      } else {
        await AdminService.createSchoolYear(formData);
      }
      
      setShowForm(false);
      setEditingYear(null);
      await loadSchoolYears();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save school year');
    }
  };

  const handleActivate = async (id: number) => {
    try {
      setError(null);
      await AdminService.activateSchoolYear(id);
      await loadSchoolYears();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate school year');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this school year? This action cannot be undone.')) {
      return;
    }
    
    try {
      setError(null);
      await AdminService.deleteSchoolYear(id);
      await loadSchoolYears();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete school year');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">School Years</h2>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create New School Year
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingYear ? 'Edit School Year' : 'Create New School Year'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year Label (e.g., 2024-2025)
              </label>
              <input
                type="text"
                value={formData.yearLabel}
                onChange={(e) => setFormData({ ...formData, yearLabel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2024-2025"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Set as active school year
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingYear ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year Label
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schoolYears.map((year) => (
                <tr key={year.schoolYearId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {year.yearLabel}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SchoolYearBadge 
                      yearLabel={year.yearLabel} 
                      isActive={year.isActive} 
                      size="sm"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(year.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {!year.isActive && (
                        <button
                          onClick={() => handleActivate(year.schoolYearId)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(year)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      {!year.isActive && (
                        <button
                          onClick={() => handleDelete(year.schoolYearId)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SchoolYearSection;
