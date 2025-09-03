import { useEffect, useState } from 'react';
import { Download, Calendar, FileText, BarChart3 } from 'lucide-react';
import { AdminService } from './api/adminService';

export default function ReportsSection() {
  const [range, setRange] = useState<'Today'|'This Week'|'This Month'>('Today');
  const [format, setFormat] = useState<'PDF'|'CSV'|'Excel'>('PDF');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);

  const load = async () => {
    try {
      const data = await AdminService.listReports(20, 0);
      setReports(data);
    } catch (e) {
      // noop
    }
  };

  useEffect(() => {
    load();
  }, []);

  const generate = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const now = new Date();
      let start = new Date(now);
      if (range === 'Today') start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (range === 'This Week') start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      if (range === 'This Month') start = new Date(now.getFullYear(), now.getMonth(), 1);
      const payload = {
        dateRangeStart: start.toISOString().slice(0,10),
        dateRangeEnd: now.toISOString().slice(0,10),
        reportType: range === 'Today' ? 'Daily' : range === 'This Week' ? 'Weekly' : 'Monthly' as const
      };
      await AdminService.createReport(payload as any);
      setMessage('Report generated successfully');
      load();
    } catch (e: any) {
      setMessage(e?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        <p className="text-gray-600">Generate and export attendance reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">94.2%</p>
              <p className="text-sm text-green-600">↗ +2.1% from last week</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">93.8%</p>
              <p className="text-sm text-green-600">↗ +1.5% from last month</p>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Late Time</p>
              <p className="text-2xl font-bold text-gray-900">12 min</p>
              <p className="text-sm text-red-600">↗ +3 min from last week</p>
            </div>
            <FileText className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Generate Custom Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select value={range} onChange={(e) => setRange(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>PDF</option>
              <option>CSV</option>
              <option>Excel</option>
            </select>
          </div>
        </div>
        <button disabled={loading} onClick={generate} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors">
          <Download className="h-5 w-5" />
          <span>{loading ? 'Generating...' : 'Generate Report'}</span>
        </button>
        {message && <div className="mt-3 text-sm text-gray-700">{message}</div>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">StudentID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ScheduleID</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((r) => (
                <tr key={r.ReportID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(r.GeneratedDate).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.ReportType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.StudentID ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.ScheduleID ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 