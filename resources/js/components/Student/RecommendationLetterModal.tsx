import { ExternalLink, FileText, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type RecommendationLetter = {
    id: number;
    fileName: string;
    fileUrl: string | null;
    signedAt?: string | null;
    adviserName?: string | null;
};

type RecommendationLetterModalProps = {
    open: boolean;
    onClose: () => void;
    recommendationLetter: RecommendationLetter;
};

const RecommendationLetterModal = ({ open, onClose, recommendationLetter }: RecommendationLetterModalProps) => {
    const [isAppearing, setIsAppearing] = useState(false);

    useEffect(() => {
        if (!open) {
            setIsAppearing(false);
            return;
        }

        setIsAppearing(false);
        const animationFrame = window.requestAnimationFrame(() => {
            setIsAppearing(true);
        });

        return () => {
            window.cancelAnimationFrame(animationFrame);
        };
    }, [open]);

    useEffect(() => {
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
    }, [open, onClose]);

    if (!open || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className={`fixed inset-0 z-[10010] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
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
                className={`max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                    isAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                }`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-800" />
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Recommendation Letter</h2>
                            <p className="text-xs text-slate-600">Signed adviser recommendation for title defense</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-600 transition-all duration-200 hover:rotate-90 hover:bg-gray-200"
                        aria-label="Close recommendation letter modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
                    <div className="border-b border-slate-200 p-4 lg:border-r lg:border-b-0">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">File Name</p>
                            <p className="mt-1 text-sm font-semibold break-all text-slate-900">{recommendationLetter.fileName}</p>
                        </div>

                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Signed By</p>
                            <p className="mt-1 text-sm text-slate-800">{recommendationLetter.adviserName ?? 'Adviser'}</p>
                        </div>

                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Signed At</p>
                            <p className="mt-1 text-sm text-slate-800">{recommendationLetter.signedAt ?? 'Not available'}</p>
                        </div>

                        {recommendationLetter.fileUrl ? (
                            <a
                                href={recommendationLetter.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Open in new tab
                            </a>
                        ) : null}
                    </div>

                    <div className="bg-slate-100 p-4">
                        {recommendationLetter.fileUrl ? (
                            <iframe
                                key={recommendationLetter.fileUrl}
                                src={`${recommendationLetter.fileUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                                title={recommendationLetter.fileName}
                                className="h-[62vh] w-full rounded-xl border border-slate-200 bg-white"
                            />
                        ) : (
                            <div className="flex h-[62vh] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                                Recommendation PDF preview is unavailable.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end border-t border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border-2 border-slate-300 px-5 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:shadow-md"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default RecommendationLetterModal;
