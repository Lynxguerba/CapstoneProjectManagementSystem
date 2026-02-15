import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, MessageSquareText, Minus, Plus, Save } from 'lucide-react';
import PanelLayout from '../_layout';

type CommentType = 'Suggestion' | 'Issue/Error' | 'Approval/Good Practice' | 'Question/Clarification';

type Severity = 'Minor' | 'Major' | 'Critical';

type DocComment = {
  id: string;
  pageRef: string;
  type: CommentType;
  severity: Severity;
  text: string;
  createdAt: string;
};

const PanelistDocumentViewer = () => {
  const [zoom, setZoom] = useState(110);
  const [page, setPage] = useState(5);

  const [pageRef, setPageRef] = useState('Page 5, Chapter 2');
  const [commentType, setCommentType] = useState<CommentType>('Suggestion');
  const [severity, setSeverity] = useState<Severity>('Minor');
  const [commentText, setCommentText] = useState('');

  const document = {
    group: 'Group Alpha',
    fileName: 'Proposal_Manuscript_v1.pdf',
    category: 'Proposal Manuscript',
    uploadedAt: '2026-03-12',
    status: 'In Progress',
  } as const;

  const comments: DocComment[] = useMemo(
    () => [
      {
        id: 'c1',
        pageRef: 'Page 3, Introduction',
        type: 'Issue/Error',
        severity: 'Major',
        text: 'Clarify the problem statement; it feels too broad.',
        createdAt: '2026-03-13 09:12',
      },
      {
        id: 'c2',
        pageRef: 'Page 5, Chapter 2',
        type: 'Suggestion',
        severity: 'Minor',
        text: 'Consider adding a small figure to summarize the workflow.',
        createdAt: '2026-03-13 09:25',
      },
    ],
    []
  );

  const typePill = (t: CommentType): string => {
    if (t === 'Issue/Error') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    if (t === 'Approval/Good Practice') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (t === 'Question/Clarification') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  const severityPill = (s: Severity): string => {
    if (s === 'Critical') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    if (s === 'Major') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <PanelLayout title="Document Viewer" subtitle="Preview + commenting (UI only)">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{document.group}</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{document.fileName}</div>
              <div className="mt-2 text-sm text-slate-600">{document.category} • Uploaded {document.uploadedAt}</div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => alert('UI only: download')}
                className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white px-4 py-2.5 text-sm font-semibold hover:shadow inline-flex items-center gap-2"
              >
                <Download size={16} />
                Download
              </button>
              <button
                type="button"
                onClick={() => alert('UI only: mark reviewed')}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Mark reviewed
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Prev
                </button>
                <div className="text-sm font-semibold text-slate-800">Page {page}</div>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(80, z - 10))}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 inline-flex items-center gap-2"
                >
                  <Minus size={16} />
                  Zoom
                </button>
                <div className="text-sm font-semibold text-slate-800 tabular-nums">{zoom}%</div>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(160, z + 10))}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Zoom
                </button>
              </div>
            </div>

            <div
              className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 min-h-[420px] flex items-center justify-center"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
            >
              <div className="text-center">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <FileText size={22} />
                </div>
                <div className="mt-4 text-lg font-semibold text-slate-900">Document preview placeholder</div>
                <div className="mt-2 text-sm text-slate-600">Embed PDF/DOCX viewer later. This is UI-only.</div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2">
            <MessageSquareText size={18} className="text-slate-700" />
            <div>
              <div className="text-lg font-semibold text-slate-900">Comment Panel</div>
              <div className="text-sm text-slate-500">Add and manage comments (UI only).</div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Page/Section reference</label>
              <input
                value={pageRef}
                onChange={(e) => setPageRef(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Comment type</label>
                <select
                  value={commentType}
                  onChange={(e) => setCommentType(e.target.value as any)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Suggestion">Suggestion</option>
                  <option value="Issue/Error">Issue/Error</option>
                  <option value="Approval/Good Practice">Approval/Good Practice</option>
                  <option value="Question/Clarification">Question/Clarification</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Minor">Minor</option>
                  <option value="Major">Major</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Comment</label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                placeholder="Write feedback..."
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => alert('UI only: add comment')}
                className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white px-4 py-2.5 text-sm font-semibold hover:shadow inline-flex items-center gap-2"
              >
                <Save size={16} />
                Save draft
              </button>
              <button
                type="button"
                onClick={() => alert('UI only: mark needs revision')}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Mark needs revision
              </button>
            </div>
          </div>

          <div className="mt-8">
            <div className="text-sm font-semibold text-slate-900">Existing comments</div>
            <div className="mt-3 space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{c.pageRef}</div>
                      <div className="mt-2 text-sm text-slate-700">{c.text}</div>
                      <div className="mt-3 text-xs text-slate-500">{c.createdAt}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${typePill(c.type)}`}>{c.type}</span>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${severityPill(c.severity)}`}>{c.severity}</span>
                    <button
                      type="button"
                      onClick={() => alert('UI only: edit')}
                      className="ml-auto rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('UI only: delete')}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </PanelLayout>
  );
};

export default PanelistDocumentViewer;
