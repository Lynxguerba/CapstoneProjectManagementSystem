import React from 'react';
import 'react-pdf-highlighter/dist/style.css';
import { AreaHighlight, Highlight, IHighlight, NewHighlight, PdfHighlighter, PdfLoader, Popup } from 'react-pdf-highlighter';

type PdfHighlighterViewerProps = {
    pdfUrl: string;
    highlights: IHighlight[];
    onAddHighlight: (highlight: NewHighlight) => void;
    activeHighlightId?: string | null;
    onHighlightFocused?: (highlightId: string) => void;
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
}: PdfHighlighterViewerProps): React.JSX.Element => {
    const hideTipCallbackRef = React.useRef<(() => void) | null>(null);
    const pendingHighlightRef = React.useRef<NewHighlight | null>(null);
    const scrollToHighlightRef = React.useRef<((highlight: IHighlight) => void) | null>(null);

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

        scrollToHighlightRef.current(targetHighlight);
        onHighlightFocused?.(activeHighlightId);
    }, [activeHighlightId, highlights, onHighlightFocused]);

    return (
        <div className="relative h-[65vh] w-full overflow-auto rounded-2xl border border-slate-200 bg-white lg:h-[72vh]">
            <PdfLoader
                url={pdfUrl}
                workerSrc={PDF_WORKER_SRC}
                beforeLoad={<div className="flex h-full items-center justify-center text-xs text-slate-500">Loading PDF...</div>}
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
                            const highlightElement = highlight.content?.image ? (
                                <AreaHighlight key={index} highlight={highlight} onChange={() => {}} isScrolledTo={isScrolledTo} />
                            ) : (
                                <Highlight key={index} isScrolledTo={isScrolledTo} position={highlight.position} comment={highlight.comment} />
                            );

                            if (!hasComment || !popupContent) {
                                return highlightElement;
                            }

                            return (
                                <Popup onMouseOver={(content) => setTip(highlight, () => content)} onMouseOut={hideTip} popupContent={popupContent}>
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
