import React from 'react';
import 'react-pdf-highlighter/dist/style.css';
import { AreaHighlight, Highlight, PdfHighlighter, PdfLoader, Popup } from 'react-pdf-highlighter';
import type { IHighlight, NewHighlight } from 'react-pdf-highlighter';

type PdfHighlighterViewerProps = {
    pdfUrl: string;
    highlights: IHighlight[];
    onAddHighlight: (highlight: NewHighlight) => void;
    activeHighlightId?: string | null;
    onHighlightFocused?: (highlightId: string) => void;
    containerClassName?: string;
};

type HighlightPopupProps = {
    comment: {
        text: string;
        emoji: string;
    };
};

const PDF_WORKER_SRC = 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';

const HighlightPopup = ({ comment }: HighlightPopupProps): React.JSX.Element | null => {
    if (!comment.text.trim()) {
        return null;
    }

    return (
        <div className="max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-md">
            {comment.emoji} {comment.text}
        </div>
    );
};

const SelectionCommentPopup = ({
    previewText,
    onCancel,
    onSend,
}: {
    previewText?: string;
    onCancel: () => void;
    onSend: (commentText: string) => void;
}): React.JSX.Element => {
    const [draftComment, setDraftComment] = React.useState('');
    const trimmedDraftComment = draftComment.trim();

    const handleCommentChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
        setDraftComment(event.target.value);
    };

    const handleCancel = (): void => {
        setDraftComment('');
        onCancel();
    };

    const handleSend = (): void => {
        if (trimmedDraftComment === '') {
            return;
        }

        onSend(trimmedDraftComment);
    };

    return (
        <div className="z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
            <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Add Comment</p>
            {previewText ? (
                <p className="mt-2 line-clamp-2 rounded border border-yellow-200 bg-yellow-50 px-2 py-1 text-[11px] text-slate-700 italic">
                    &quot;{previewText}&quot;
                </p>
            ) : null}
            <textarea
                autoFocus
                rows={3}
                placeholder="Type your comment..."
                value={draftComment}
                onChange={handleCommentChange}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleSend();
                    }
                }}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 transition outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <div className="mt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={handleCancel} className="text-[11px] font-medium text-slate-500 transition hover:text-slate-700">
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={trimmedDraftComment === ''}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export const PdfHighlighterViewer = ({
    pdfUrl,
    highlights,
    onAddHighlight,
    activeHighlightId = null,
    onHighlightFocused,
    containerClassName = 'h-[65vh] lg:h-[72vh]',
}: PdfHighlighterViewerProps): React.JSX.Element => {
    const hideTipCallbackRef = React.useRef<(() => void) | null>(null);
    const pendingHighlightRef = React.useRef<NewHighlight | null>(null);
    const scrollToHighlightRef = React.useRef<((highlight: IHighlight) => void) | null>(null);
    const [isFallbackViewer, setIsFallbackViewer] = React.useState(false);
    const [viewerErrorMessage, setViewerErrorMessage] = React.useState<string | null>(null);

    const isOffsetParentWarning = React.useCallback((message: string): boolean => {
        return message.includes('offsetParent is not set');
    }, []);

    const isCriticalViewerError = React.useCallback((message: string): boolean => {
        return message.includes('Transport destroyed')
            || message.includes('Unable to get page')
            || message.includes('sendWithPromise');
    }, []);

    const enableFallbackViewer = React.useCallback((message: string): void => {
        setViewerErrorMessage(message);
        setIsFallbackViewer(true);
    }, []);

    const resetPendingState = (): void => {
        hideTipCallbackRef.current = null;
        pendingHighlightRef.current = null;
    };

    const handleSend = (commentText: string): void => {
        const pendingHighlight = pendingHighlightRef.current;
        if (!pendingHighlight || commentText === '') {
            return;
        }

        onAddHighlight({
            ...pendingHighlight,
            comment: {
                text: commentText,
                emoji: '💬',
            },
        });

        hideTipCallbackRef.current?.();
        resetPendingState();
    };

    React.useEffect(() => {
        if (!activeHighlightId || !scrollToHighlightRef.current) {
            return;
        }

        const targetHighlight = highlights.find((highlight) => highlight.id === activeHighlightId);
        if (!targetHighlight) {
            return;
        }

        try {
            scrollToHighlightRef.current(targetHighlight);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (isOffsetParentWarning(message)) {
                onHighlightFocused?.(activeHighlightId);
                return;
            }

            if (isCriticalViewerError(message)) {
                enableFallbackViewer(message);
                return;
            }

            enableFallbackViewer(message);
        }

        onHighlightFocused?.(activeHighlightId);
    }, [activeHighlightId, enableFallbackViewer, highlights, isCriticalViewerError, isOffsetParentWarning, onHighlightFocused]);

    React.useEffect(() => {
        const handleWindowError = (event: ErrorEvent): void => {
            const message = typeof event.message === 'string' ? event.message : '';
            if (isOffsetParentWarning(message)) {
                event.preventDefault();
                return;
            }

            if (isCriticalViewerError(message)) {
                event.preventDefault();
                enableFallbackViewer(message);
                return;
            }

            const isPdfHighlighterError = message === '!'
                || message.toLowerCase().includes('pdfhighlighter')
                || String(event.filename ?? '').includes('react-pdf-highlighter');

            if (isPdfHighlighterError) {
                enableFallbackViewer(message || 'PDF highlighter failed to initialize.');
            }
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
            const reason = event.reason;
            const message = reason instanceof Error ? reason.message : String(reason ?? '');
            if (!message) {
                return;
            }

            if (isOffsetParentWarning(message)) {
                event.preventDefault();
                return;
            }

            if (isCriticalViewerError(message)) {
                event.preventDefault();
                enableFallbackViewer(message);
                return;
            }

            const isPdfHighlighterRejection = message === '!' || message.toLowerCase().includes('pdfhighlighter');
            if (!isPdfHighlighterRejection) {
                return;
            }

            event.preventDefault();
            enableFallbackViewer(message);
        };

        window.addEventListener('error', handleWindowError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleWindowError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, [enableFallbackViewer, isCriticalViewerError, isOffsetParentWarning]);

    if (isFallbackViewer) {
        return (
            <div className={`relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white ${containerClassName}`}>
                <iframe
                    src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                    title="PDF Preview"
                    className="h-full w-full"
                />
                <div className="pointer-events-none absolute top-2 right-2 left-2 rounded-lg border border-amber-200 bg-amber-50/95 px-3 py-2 text-[11px] text-amber-800 shadow-sm">
                    PDF highlighter is temporarily unavailable. Preview mode is active.
                    {viewerErrorMessage ? ` (${viewerErrorMessage})` : ''}
                </div>
            </div>
        );
    }

    return (
        <div className={`relative w-full overflow-auto rounded-2xl border border-slate-200 bg-white ${containerClassName}`}>
            <PdfLoader
                url={pdfUrl}
                workerSrc={PDF_WORKER_SRC}
                beforeLoad={<div className="flex h-full items-center justify-center text-xs text-slate-500">Loading PDF...</div>}
                errorMessage={
                    <div className="flex h-full items-center justify-center p-4 text-center text-xs text-slate-500">
                        Unable to load the interactive highlighter for this PDF.
                    </div>
                }
                onError={(error) => {
                    enableFallbackViewer(error.message || 'Unable to load PDF highlighter.');
                }}
            >
                {(pdfDocument) => (
                    <PdfHighlighter<IHighlight>
                        pdfDocument={pdfDocument}
                        pdfScaleValue="page-width"
                        enableAreaSelection={(event) => event.altKey}
                        onScrollChange={() => {}}
                        scrollRef={(scrollTo) => {
                            scrollToHighlightRef.current = scrollTo;
                        }}
                        highlights={highlights}
                        onSelectionFinished={(position, content, hideTipAndSelection, transformSelection) => {
                            transformSelection();

                            pendingHighlightRef.current = {
                                content,
                                position,
                                comment: { text: '', emoji: '💬' },
                            };
                            hideTipCallbackRef.current = hideTipAndSelection;

                            return (
                                <SelectionCommentPopup
                                    previewText={content.text}
                                    onCancel={() => {
                                        hideTipAndSelection();
                                        resetPendingState();
                                    }}
                                    onSend={handleSend}
                                />
                            );
                        }}
                        highlightTransform={(highlight, index, setTip, hideTip, _viewportToScaled, _screenshot, isScrolledTo) => {
                            const popupContent = <HighlightPopup comment={highlight.comment} />;
                            const hasComment = Boolean(highlight.comment?.text?.trim());
                            const highlightKey = highlight.id && highlight.id !== '' ? highlight.id : `hl-${index}`;
                            const highlightElement = highlight.content?.image ? (
                                <AreaHighlight key={highlightKey} highlight={highlight} onChange={() => {}} isScrolledTo={isScrolledTo} />
                            ) : (
                                <Highlight
                                    key={highlightKey}
                                    isScrolledTo={isScrolledTo}
                                    position={highlight.position}
                                    comment={highlight.comment}
                                />
                            );

                            if (!hasComment || !popupContent) {
                                return highlightElement;
                            }

                            return (
                                <Popup
                                    key={highlightKey}
                                    onMouseOver={(content) => setTip(highlight, () => content)}
                                    onMouseOut={hideTip}
                                    popupContent={popupContent}
                                >
                                    {highlightElement}
                                </Popup>
                            );
                        }}
                    />
                )}
            </PdfLoader>
        </div>
    );
};
