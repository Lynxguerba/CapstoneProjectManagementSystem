import { Download, FolderDown, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

type RequirementDocumentDetail = {
    id: number;
    requirementType: string;
    status: 'Missing' | 'Submitted' | 'Approved' | 'Revision Required';
    fileName?: string | null;
    submittedAt?: string | null;
    downloadUrl?: string | null;
};

type DownloadDocumentsModalProps = {
    open: boolean;
    groupName: string;
    documents: RequirementDocumentDetail[];
    onClose: () => void;
};

const statusStyles: Record<RequirementDocumentDetail['status'], string> = {
    Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Submitted: 'border-amber-200 bg-amber-50 text-amber-700',
    'Revision Required': 'border-rose-200 bg-rose-50 text-rose-700',
    Missing: 'border-slate-200 bg-slate-100 text-slate-600',
};

const DownloadDocumentsModal = ({ open, groupName, documents, onClose }: DownloadDocumentsModalProps) => {
    const [isAppearing, setIsAppearing] = React.useState(false);

    React.useEffect(() => {
        if (!open) {
            setIsAppearing(false);
            return;
        }

        setIsAppearing(true);
    }, [open]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [onClose, open]);

    const availableDownloads = React.useMemo(() => {
        return documents.filter((doc) => Boolean(doc.downloadUrl));
    }, [documents]);

    const handleDownload = (url?: string | null) => {
        if (!url) {
            return;
        }

        window.location.assign(url);
    };

    const handleDownloadAll = () => {
        availableDownloads.forEach((doc, index) => {
            if (!doc.downloadUrl) {
                return;
            }

            setTimeout(() => {
                window.open(doc.downloadUrl ?? '', '_blank');
            }, index * 120);
        });
    };

    const shouldRender = open || isAppearing;

    if (!shouldRender) {
        return null;
    }

    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
                isAppearing ? 'opacity-100' : 'opacity-0'
            }`}
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className={`max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                    isAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                }`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <FolderDown className="h-5 w-5 text-emerald-800" />
                        <div>
                            <h2 className="text-lg font-bold text-emerald-900">Download Documents</h2>
                            <p className="text-xs text-emerald-700">{groupName}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                        <span>{documents.length} requirement(s) listed</span>
                        <button
                            type="button"
                            onClick={handleDownloadAll}
                            disabled={availableDownloads.length === 0}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Download All
                        </button>
                    </div>

                    <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3">Requirement</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">File</th>
                                    <th className="px-4 py-3">Submitted</th>
                                    <th className="px-4 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {documents.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-500">
                                            No requirement documents found.
                                        </td>
                                    </tr>
                                ) : (
                                    documents.map((doc) => (
                                        <tr key={doc.id} className="text-slate-600">
                                            <td className="px-4 py-3 font-semibold text-slate-800">{doc.requirementType}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                        statusStyles[doc.status]
                                                    }`}
                                                >
                                                    {doc.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[11px] text-slate-500">{doc.fileName ?? '—'}</td>
                                            <td className="px-4 py-3 text-[11px] text-slate-500">{doc.submittedAt ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownload(doc.downloadUrl)}
                                                    disabled={!doc.downloadUrl}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                    Download
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default DownloadDocumentsModal;
