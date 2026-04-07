import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, Clock, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import SubScreenHeader from '../shared/SubScreenHeader';
import api, { API_BASE_URL } from '../../services/api';

const formatDate = (value) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const statusLabel = (status) => {
  if (!status) return 'Processing';
  if (status === 'complete') return 'Complete';
  if (status === 'failed') return 'Failed';
  return 'Processing';
};

export default function DocumentsHome() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const pollingRef = useRef({});

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadDocuments();
    return () => {
      Object.values(pollingRef.current).forEach(clearInterval);
    };
  }, []);

  useEffect(() => {
    docs.filter((d) => d.status === 'processing').forEach((d) => startPolling(d.id));
  }, [docs]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/documents');
      setDocs(res?.data || []);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (docId) => {
    if (!docId || pollingRef.current[docId]) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/documents/${docId}`);
        const doc = res?.data;
        if (!doc) return;

        setDocs((prev) => prev.map((d) => (d.id === docId ? doc : d)));

        if (doc.status === 'complete' || doc.status === 'failed') {
          clearInterval(interval);
          delete pollingRef.current[docId];
          if (doc.status === 'complete') toast.success('Document ready');
          if (doc.status === 'failed') toast.error('Document processing failed');
        }
      } catch (_) {
        // ignore polling errors
      }
    }, 3000);

    pollingRef.current[docId] = interval;
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files supported');
      e.target.value = '';
      return;
    }
    handleUpload(file);
    e.target.value = '';
  };

  const uploadWithProgress = (formData) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/api/documents/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('beacon_token')}`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const pct = Math.round((event.loaded * 100) / event.total);
      setUploadProgress(pct);
    };

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(json);
        } else {
          reject(json);
        }
      } catch (err) {
        reject(err);
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(formData);
  });

  const handleUpload = async (file) => {
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadWithProgress(formData);
      const doc = res?.data;
      if (doc) {
        setDocs((prev) => [doc, ...prev]);
        toast.success('Document uploaded. Processing...');
        startPolling(doc.id);
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleReprocess = async (docId) => {
    try {
      const res = await api.post(`/api/documents/${docId}/reprocess`, {});
      const updated = res?.data;
      if (updated) {
        setDocs((prev) => prev.map((d) => (d.id === docId ? updated : d)));
      }
      toast.success('Reprocessing started');
      startPolling(docId);
    } catch (_) {
      toast.error('Failed to reprocess document');
    }
  };

  const handleDelete = async (docId) => {
    try {
      await api.delete(`/api/documents/${docId}`);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      toast.success('Document deleted');
    } catch (_) {
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex flex-col">
      <SubScreenHeader
        title="Documents"
        rightAction={
          <button
            onClick={handleUploadClick}
            className="flex items-center gap-1.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 px-3 py-1.5 rounded-lg text-xs font-[var(--font-syne)] font-bold active:scale-95 transition-all"
            disabled={uploading}
          >
            <Upload size={14} />
            Upload
          </button>
        }
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
      />

      <div className="flex-1 px-5 pt-6 pb-24 overflow-y-auto">
        {uploading && (
          <div className="bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/40 rounded-2xl p-6 mb-6 shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-sky-100 dark:border-sky-900 border-t-sky-500 animate-spin mb-4"></div>
            <h3 className="font-[var(--font-syne)] font-bold text-lg text-[#0369A1] dark:text-[#0EA5E9] text-center mb-2">
              Uploading document...
            </h3>
            <div className="w-full h-2 bg-sky-50 dark:bg-sky-900/20 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-sky-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-sky-400 font-['Plus_Jakarta_Sans'] text-center">{uploadProgress}%</p>
          </div>
        )}

        {loading ? (
          <div className="text-center text-sm text-sky-500">Loading documents...</div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="w-20 h-20 bg-sky-50 dark:bg-sky-900/20 rounded-full flex items-center justify-center text-sky-300 dark:text-sky-700 mb-4">
              <FileText size={32} />
            </div>
            <h3 className="font-[var(--font-syne)] font-bold text-xl text-[#0369A1] dark:text-[#0EA5E9] mb-2">No documents yet</h3>
            <p className="text-sm text-sky-600/70 dark:text-sky-400/70 mb-6">Upload a PDF to get summaries, flashcards and quizzes</p>
            <button
              onClick={handleUploadClick}
              className="bg-[#0369A1] dark:bg-[#0EA5E9] text-white px-6 py-3 rounded-xl font-[var(--font-syne)] font-bold shadow-md hover:bg-[#0284C7] dark:hover:bg-[#38BDF8] active:scale-95 transition-all"
            >
              Upload Your First Document
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => {
              const label = statusLabel(doc.status);
              const isComplete = doc.status === 'complete';
              const isFailed = doc.status === 'failed';
              return (
                <div
                  key={doc.id}
                  className="w-full bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-2xl p-4 text-left shadow-sm transition-all"
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => (isComplete ? navigate(`/practice/documents/${doc.id}`, { state: { doc } }) : null)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isComplete ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' : isFailed ? 'bg-red-100 dark:bg-red-900/20 text-red-500' : 'bg-amber-100 dark:bg-amber-900/20 text-amber-500'}`}>
                          {isComplete ? <FileText size={22} /> : isFailed ? <AlertTriangle size={20} /> : <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-[var(--font-syne)] font-bold text-sm text-[#0C4A6E] dark:text-[#F0F9FF] truncate mb-1">
                            {doc.filename}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] font-[var(--font-jakarta)] font-semibold text-sky-600 dark:text-sky-400">
                            <span className="bg-sky-50 dark:bg-sky-900/40 px-2 py-0.5 rounded uppercase tracking-wider">{doc.subject || 'General'}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-[#0369A1]/60 dark:text-[#7DD3FC]/60">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(doc.created_at)}</span>
                            <span className="flex items-center gap-1">
                              {isComplete ? <CheckCircle2 size={12} className="text-green-500" /> : isFailed ? <AlertTriangle size={12} className="text-red-500" /> : <Clock size={12} className="text-amber-500" />}
                              {label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                    <div className="flex flex-col gap-2">
                      {isFailed && (
                        <button
                          onClick={() => handleReprocess(doc.id)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                        >
                          Retry
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="w-9 h-9 rounded-xl border border-sky-100 dark:border-sky-900/30 text-sky-500 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 flex items-center justify-center"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
