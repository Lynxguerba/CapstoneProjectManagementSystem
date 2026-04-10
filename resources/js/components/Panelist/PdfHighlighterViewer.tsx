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
    isReadOnly?: boolean;
    selectionControls?: React.ReactNode;
    isSelectionSendDisabled?: boolean;
    selectionSendDisabledReason?: string;
};

type HighlightPopupProps = {
    comment: {
        text: string;
        emoji: string;
    };
};

const PDF_WORKER_SRC = 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
const HIGHLIGHT_SCROLL_RETRY_MS = 120;
const MAX_HIGHLIGHT_SCROLL_RETRIES = 8;

const toPositiveInteger = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value > 0) {
        return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed) && Number.isInteger(parsed) && parsed > 0) {
            return parsed;
        }
    }

    return null;
};

const collectPositionPageNumbers = (position: unknown): number[] => {
    if (!position || typeof position !== 'object') {
        return [];
    }

    const candidatePosition = position as {
        pageNumber?: unknown;
        boundingRect?: { pageNumber?: unknown } | null;
        rects?: Array<{ pageNumber?: unknown }> | null;
    };

    const pageNumbers = new Set<number>();
    const directPageNumber = toPositiveInteger(candidatePosition.pageNumber);
    if (directPageNumber !== null) {
        pageNumbers.add(directPageNumber);
    }

    const boundingRectPageNumber = toPositiveInteger(candidatePosition.boundingRect?.pageNumber);
    if (boundingRectPageNumber !== null) {
        pageNumbers.add(boundingRectPageNumber);
    }

    if (Array.isArray(candidatePosition.rects)) {
        candidatePosition.rects.forEach((rect) => {
            const rectPageNumber = toPositiveInteger(rect?.pageNumber);
            if (rectPageNumber !== null) {
                pageNumbers.add(rectPageNumber);
            }
        });
    }

    return Array.from(pageNumbers);
};

const isHighlightCompatibleWithDocument = (highlight: IHighlight, pageCount: number): boolean => {
    const highlightPageNumbers = collectPositionPageNumbers(highlight.position);
    if (highlightPageNumbers.length === 0) {
        return false;
    }

    return highlightPageNumbers.every((pageNumber) => pageNumber <= pageCount);
};

const buildConsoleMessage = (args: unknown[]): string => {
    return args
        .map((value) => {
            if (typeof value === 'string') {
                return value;
            }

            if (value instanceof Error) {
                return value.message;
            }

            try {
                return JSON.stringify(value);
            } catch {
                return String(value);
            }
        })
        .join(' ');
};

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
    controls,
    isSendDisabled = false,
    sendDisabledReason,
}: {
    previewText?: string;
    onCancel: () => void;
    onSend: (commentText: string) => void;
    controls?: React.ReactNode;
    isSendDisabled?: boolean;
    sendDisabledReason?: string;
}): React.JSX.Element => {
    const [draftComment, setDraftComment] = React.useState('');
    const trimmedDraftComment = draftComment.trim();
    const stopInteractionPropagation = (event: React.SyntheticEvent): void => {
        event.stopPropagation();
    };

    const handleCommentChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
        setDraftComment(event.target.value);
    };

    const handleCancel = (): void => {
        setDraftComment('');
        onCancel();
    };

    const handleSend = (): void => {
        if (trimmedDraftComment === '' || isSendDisabled) {
            return;
        }

        onSend(trimmedDraftComment);
    };

    return (
        <div
            className="z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
            onPointerDown={stopInteractionPropagation}
            onMouseDown={stopInteractionPropagation}
            onMouseUp={stopInteractionPropagation}
            onClick={stopInteractionPropagation}
        >
            <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Add Comment</p>
            {previewText ? (
                <p className="mt-2 line-clamp-2 rounded border border-yellow-200 bg-yellow-50 px-2 py-1 text-[11px] text-slate-700 italic">
                    &quot;{previewText}&quot;
                </p>
            ) : null}
            {controls ? <div className="mt-2">{controls}</div> : null}
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
            {isSendDisabled && sendDisabledReason ? <p className="mt-1 text-[11px] text-amber-700">{sendDisabledReason}</p> : null}
            <div className="mt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={handleCancel} className="text-[11px] font-medium text-slate-500 transition hover:text-slate-700">
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={trimmedDraftComment === '' || isSendDisabled}
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
    isReadOnly = false,
    selectionControls,
    isSelectionSendDisabled = false,
    selectionSendDisabledReason,
}: PdfHighlighterViewerProps): React.JSX.Element => {
    const hideTipCallbackRef = React.useRef<(() => void) | null>(null);
    const pendingHighlightRef = React.useRef<NewHighlight | null>(null);
    const scrollToHighlightRef = React.useRef<((highlight: IHighlight) => void) | null>(null);
    const viewerContainerRef = React.useRef<HTMLDivElement | null>(null);
    const [isFallbackViewer, setIsFallbackViewer] = React.useState(false);
    const [viewerErrorMessage, setViewerErrorMessage] = React.useState<string | null>(null);

    const isOffsetParentWarning = React.useCallback((message: string): boolean => {
        return message.includes('offsetParent is not set');
    }, []);

    const isCriticalViewerError = React.useCallback((message: string): boolean => {
        return message.includes('Transport destroyed') || message.includes('Unable to get page') || message.includes('sendWithPromise');
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

        let isCancelled = false;
        let retryTimeout: number | null = null;
        let retryCount = 0;

        const tryScrollToHighlight = (): void => {
            if (isCancelled) {
                return;
            }

            const viewerContainer = viewerContainerRef.current;
            if (!viewerContainer || viewerContainer.offsetParent === null || !scrollToHighlightRef.current) {
                if (retryCount < MAX_HIGHLIGHT_SCROLL_RETRIES) {
                    retryCount += 1;
                    retryTimeout = window.setTimeout(tryScrollToHighlight, HIGHLIGHT_SCROLL_RETRY_MS);
                }
                return;
            }

            try {
                scrollToHighlightRef.current(targetHighlight);
                onHighlightFocused?.(activeHighlightId);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                if (isOffsetParentWarning(message) && retryCount < MAX_HIGHLIGHT_SCROLL_RETRIES) {
                    retryCount += 1;
                    retryTimeout = window.setTimeout(tryScrollToHighlight, HIGHLIGHT_SCROLL_RETRY_MS);
                    return;
                }

                if (isOffsetParentWarning(message)) {
                    return;
                }

                if (isCriticalViewerError(message)) {
                    enableFallbackViewer(message);
                    return;
                }

                enableFallbackViewer(message);
            }
        };

        tryScrollToHighlight();

        return () => {
            isCancelled = true;
            if (retryTimeout !== null) {
                window.clearTimeout(retryTimeout);
            }
        };
    }, [activeHighlightId, enableFallbackViewer, highlights, isCriticalViewerError, isOffsetParentWarning, onHighlightFocused]);

    React.useEffect(() => {
        const originalConsoleWarn = console.warn;
        const originalConsoleError = console.error;

        const shouldSuppressPdfNoise = (message: string): boolean => {
            return (
                message.includes('offsetParent is not set -- cannot scroll') ||
                message.includes('getOperatorList - ignoring XObject') ||
                message.includes('getOperatorList - ignoring errors during "GetOperatorList') ||
                message.includes('GlobalImageCache.setData - expected "shouldCache"') ||
                message.includes('Worker task was terminated')
            );
        };

        const patchedConsoleWarn: typeof console.warn = (...args: unknown[]): void => {
            const message = buildConsoleMessage(args);
            if (shouldSuppressPdfNoise(message)) {
                return;
            }

            originalConsoleWarn(...args);
        };

        const patchedConsoleError: typeof console.error = (...args: unknown[]): void => {
            const message = buildConsoleMessage(args);
            if (shouldSuppressPdfNoise(message)) {
                return;
            }

            originalConsoleError(...args);
        };

        console.warn = patchedConsoleWarn;
        console.error = patchedConsoleError;

        return () => {
            if (console.warn === patchedConsoleWarn) {
                console.warn = originalConsoleWarn;
            }

            if (console.error === patchedConsoleError) {
                console.error = originalConsoleError;
            }
        };
    }, []);

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

            const isPdfHighlighterError =
                message === '!' || message.toLowerCase().includes('pdfhighlighter') || String(event.filename ?? '').includes('react-pdf-highlighter');

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
            <div
                ref={viewerContainerRef}
                className={`relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white ${containerClassName}`}
            >
                <iframe src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`} title="PDF Preview" className="h-full w-full" />
                <div className="pointer-events-none absolute top-2 right-2 left-2 rounded-lg border border-amber-200 bg-amber-50/95 px-3 py-2 text-[11px] text-amber-800 shadow-sm">
                    PDF highlighter is temporarily unavailable. Preview mode is active.
                    {viewerErrorMessage ? ` (${viewerErrorMessage})` : ''}
                </div>
            </div>
        );
    }

    return (
        <div ref={viewerContainerRef} className={`relative w-full overflow-auto rounded-2xl border border-slate-200 bg-white ${containerClassName}`}>
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
                {(pdfDocument) => {
                    const safeHighlights = highlights.filter((highlight) => isHighlightCompatibleWithDocument(highlight, pdfDocument.numPages));

                    return (
                        <PdfHighlighter<IHighlight>
                            pdfDocument={pdfDocument}
                            pdfScaleValue="page-width"
                            enableAreaSelection={(event) => !isReadOnly && event.altKey}
                            onScrollChange={() => {}}
                            scrollRef={(scrollTo) => {
                                scrollToHighlightRef.current = scrollTo;
                            }}
                            highlights={safeHighlights}
                            onSelectionFinished={(position, content, hideTipAndSelection, transformSelection) => {
                                if (isReadOnly) {
                                    hideTipAndSelection();
                                    resetPendingState();

                                    return <></>;
                                }

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
                                        controls={selectionControls}
                                        isSendDisabled={isSelectionSendDisabled}
                                        sendDisabledReason={selectionSendDisabledReason}
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
                    );
                }}
            </PdfLoader>
        </div>
    );
};
