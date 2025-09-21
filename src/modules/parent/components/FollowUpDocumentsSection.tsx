import { useEffect, useMemo, useState } from 'react';
import { Upload, FileText, RefreshCcw } from 'lucide-react';
import { ParentService, Student } from '../api/parentService';

interface Props {
  students: Student[];
}

export function FollowUpDocumentsSection({ students }: Props) {
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';
  const BASE_API = API_BASE_URL || '/api';
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>(students[0]?.studentId || '');
  const [files, setFiles] = useState<File[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ documentId: number; studentId: number; studentName: string; documents: string[]; additionalInfo?: string; createdAt: string }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const selectedStudent = useMemo(() => students.find(s => s.studentId === selectedStudentId), [students, selectedStudentId]);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      setError(null);
      const docs = await ParentService.getEnrollmentDocuments(typeof selectedStudentId === 'number' ? selectedStudentId : undefined);
      setHistory(docs);
    } catch (e: any) {
      setError(e?.message || 'Failed to load documents');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    const next: File[] = [];
    for (let i = 0; i < list.length; i += 1) next.push(list.item(i)!);
    setFiles(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || files.length === 0) {
      setError('Select a student and choose at least one file.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      // 1) Upload files to get server filenames
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      files.forEach((file) => formData.append('documents', file, file.name));

      const uploadRes = await fetch('/api/registrar/upload-documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData?.success) {
        throw new Error(uploadData?.message || 'Failed to upload documents');
      }
      const uploadedFilenames: string[] = Array.isArray(uploadData.files)
        ? uploadData.files.map((f: any) => f.filename).filter(Boolean)
        : [];

      // 2) Submit follow-up record
      const resp = await ParentService.submitEnrollmentDocuments({
        studentId: Number(selectedStudentId),
        documents: uploadedFilenames,
        additionalInfo: additionalInfo || undefined
      });

      setSuccess('Documents submitted successfully');
      setFiles([]);
      setAdditionalInfo('');
      await loadHistory();
    } catch (e: any) {
      setError(e?.message || 'Failed to submit documents');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5 text-purple-600" /> Follow-up Enrollment Documents</h2>
        <p className="text-sm text-gray-600">Upload additional documents requested by the registrar and view past submissions.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : '')}
            >
              {students.map(s => (
                <option key={s.studentId} value={s.studentId}>{`${s.fullName} — ${s.enrollmentStatus || 'pending'}`}</option>
              ))}
            </select>
            {selectedStudent && (
              <p className="mt-1 text-xs text-gray-500">Status: <span className="font-medium text-gray-700">{selectedStudent.enrollmentStatus || 'pending'}</span></p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information (optional)</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Notes for registrar (e.g., which document this is)"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Documents</label>
          <input type="file" multiple onChange={handleFileChange} className="block" />
          {files.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">{files.length} file(s) selected</p>
          )}
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}

        <button
          type="submit"
          disabled={submitting || !selectedStudent}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Documents'}
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-medium">Submission History {selectedStudent ? `— ${selectedStudent.fullName}` : ''}</h3>
          <button onClick={loadHistory} className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"><RefreshCcw className="w-4 h-4" /> Refresh</button>
        </div>
        <div className="divide-y">
          {loadingHistory ? (
            <div className="p-4 text-sm text-gray-600">Loading...</div>
          ) : history.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">No submissions yet.</div>
          ) : (
            history.map(item => (
              <div key={item.documentId} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-900 font-medium">{new Date(item.createdAt).toLocaleString()}</p>
                    {item.additionalInfo && <p className="text-xs text-gray-600">{item.additionalInfo}</p>}
                  </div>
                  <div className="text-xs text-gray-600">{item.documents.length} file(s)</div>
                </div>
                {item.documents.length > 0 && (
                  <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {item.documents.map((doc: any, idx: number) => {
                      const isObject = typeof doc === 'object' && doc !== null;
                      const displayName = isObject ? (doc.name || 'Document') : String(doc);
                      let url: string | undefined = isObject ? doc.url : undefined;
                      const token = localStorage.getItem('auth_token') || '';
                      const lower = displayName.toLowerCase();
                      const canPreviewInline = lower.endsWith('.pdf') || lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif') || lower.endsWith('.txt') || lower.endsWith('.html');
                      if (!url) {
                        const raw = displayName.trim();
                        if (raw.startsWith('http://') || raw.startsWith('https://')) {
                          url = raw;
                        } else if (raw.startsWith('/')) {
                          // Ensure we hit backend API, not SPA router
                          if (API_BASE_URL) {
                            url = `${API_BASE_URL}${raw}`;
                          } else {
                            url = raw.startsWith('/api/') ? raw : `/api${raw}`;
                          }
                        } else {
                          url = `${BASE_API}/registrar/documents/${encodeURIComponent(raw)}`;
                        }
                      }
                      // Append token for backend validation when opening in a new tab
                      let urlWithToken = url;
                      if (urlWithToken) {
                        urlWithToken += urlWithToken.includes('?') ? `&token=${encodeURIComponent(token)}` : `?token=${encodeURIComponent(token)}`;
                      }
                      return (
                        <li key={idx} className="text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="break-all text-gray-800">{displayName}</span>
                            <div className="shrink-0 flex items-center gap-2">
                              {canPreviewInline ? (
                                <a
                                  className="text-purple-700 hover:underline text-xs"
                                  href={urlWithToken}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                >
                                  Preview
                                </a>
                              ) : (
                                <span className="text-gray-400 text-xs cursor-not-allowed" title="Preview not supported for this file type">Preview</span>
                              )}
                              <a
                                className="text-gray-600 hover:underline text-xs"
                                href={urlWithToken}
                                target="_blank"
                                rel="noreferrer noopener"
                                download
                              >
                                Download
                              </a>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


