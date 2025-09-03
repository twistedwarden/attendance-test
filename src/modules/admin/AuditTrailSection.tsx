import { useEffect, useMemo, useState } from 'react';
import { Search, Download, Eye, Trash2, AlertTriangle } from 'lucide-react';
import { AdminService } from './api/adminService';

interface AuditRow {
  AuditID: number;
  UserID: number;
  Action: string;
  TableAffected: string | null;
  RecordID: number | null;
  ActionDateTime: string;
}

export default function AuditTrailSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminService.listAuditTrail(100, 0);
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((e) => {
      const s = searchTerm.toLowerCase();
      return (
        (e.Action || '').toLowerCase().includes(s) ||
        (e.TableAffected || '').toLowerCase().includes(s) ||
        String(e.UserID).includes(s)
      );
    });
  }, [items, searchTerm]);

  const getSeverityBadge = (action: string) => {
    const a = (action || '').toLowerCase();
    if (a.includes('purge') || a.includes('delete')) return 'bg-red-100 text-red-800 border-red-200';
    if (a.includes('update') || a.includes('approve') || a.includes('reject')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getSeverityIcon = (action: string) => {
    const a = (action || '').toLowerCase();
    if (a.includes('purge') || a.includes('delete')) return <AlertTriangle className="h-4 w-4" />;
    return null;
  };

  const handleExportAuditLog = () => {
    console.log('Exporting audit log...');
  };

  const handlePurgeOldLogs = () => {
    console.log('Purging old logs...');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Trail Management</h2>
          <p className="text-gray-600">Monitor system activities and security events</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleExportAuditLog}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button 
            onClick={handlePurgeOldLogs}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Purge Old</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by user ID, action, or table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Audit Entries ({filtered.length})</h3>
        </div>
        {error && <div className="p-4 text-red-600">{error}</div>}
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UserID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((entry) => (
                  <tr key={entry.AuditID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(entry.ActionDateTime).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.UserID}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{entry.Action}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.TableAffected || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.RecordID ?? '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getSeverityBadge(entry.Action)}`}>
                        {getSeverityIcon(entry.Action)}
                        <span className="ml-1">{(entry.Action || '').split(' ').slice(0,1).join('')}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
