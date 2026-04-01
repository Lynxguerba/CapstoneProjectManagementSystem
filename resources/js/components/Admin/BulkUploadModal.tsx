import { router } from '@inertiajs/react';
import { CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { bulkStatus, bulkStore, faculty, index, students } from '../../routes/admin/users';

type UserRole = 'admin' | 'student' | 'adviser' | 'instructor' | 'panelist' | 'dean' | 'program_chairperson';
type FacultyRole = 'admin' | 'adviser' | 'instructor' | 'panelist' | 'dean' | 'program_chairperson';
type StudentProgram = 'BSIT' | 'BSIS';
type EntityType = 'user' | 'faculty' | 'student';
type CsvDelimiter = ',' | ';' | '\t';
type UploadSource = 'file' | 'paste';
type RowFocusGroup = 'valid' | 'invalid' | 'selected' | 'total';

type PreviewRow = {
    line: number;
    first_name: string;
    last_name: string;
    email?: string;
    roles?: string[];
    password?: string;
    program?: StudentProgram;
    issues: string[];
};

type BulkUploadModalProps = {
    open: boolean;
    onClose: () => void;
    existingUsers?: Array<{
        email?: string;
    }>;
    existingEmails?: string[];
    userType?: EntityType;
};

type UploadRow = Record<string, string | Array<string> | undefined>;

type ImportFailureItem = {
    line?: number;
    email?: string | null;
    message: string;
};

type BulkImportProgressResponse = {
    import_id: string;
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
    message: string;
    total_rows: number;
    processed_rows: number;
    successful_rows: number;
    failed_rows: number;
    progress_percentage: number;
    failed_items?: ImportFailureItem[];
    cancel_requested?: boolean;
};

type ImportOutcome = {
    successfulRows: number;
    failedRows: number;
};

const availableRoles: UserRole[] = ['admin', 'student', 'adviser', 'instructor', 'panelist', 'dean', 'program_chairperson'];
const availableFacultyRoles: FacultyRole[] = ['admin', 'adviser', 'instructor', 'panelist', 'dean', 'program_chairperson'];
const studentPrograms: StudentProgram[] = ['BSIT', 'BSIS'];

const resolveCsrfToken = (): string => {
    const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');

    if (csrfTokenMeta instanceof HTMLMetaElement) {
        return csrfTokenMeta.content;
    }

    return '';
};

const normalizeHeader = (header: string): string => {
    return header
        .trim()
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .toLowerCase()
        .replace(/[\s-]+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
};

const canonicalizeHeader = (header: string): string => {
    const normalizedHeader = normalizeHeader(header);

    const headerAliases: Record<string, string> = {
        first: 'first_name',
        firstname: 'first_name',
        first_name: 'first_name',
        last: 'last_name',
        lastname: 'last_name',
        last_name: 'last_name',
        roles: 'role',
    };

    return headerAliases[normalizedHeader] ?? normalizedHeader;
};

const parseCsvLine = (line: string, delimiter: CsvDelimiter = ','): string[] => {
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];

        if (character === '"') {
            if (insideQuotes && line[index + 1] === '"') {
                currentValue += '"';
                index += 1;
                continue;
            }

            insideQuotes = !insideQuotes;
            continue;
        }

        if (character === delimiter && !insideQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
            continue;
        }

        currentValue += character;
    }

    values.push(currentValue.trim());

    return values.map((value) => value.replace(/^"|"$/g, '').trim());
};

const countDelimiterOccurrences = (line: string, delimiter: CsvDelimiter): number => {
    let count = 0;
    let insideQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];

        if (character === '"') {
            if (insideQuotes && line[index + 1] === '"') {
                index += 1;
                continue;
            }

            insideQuotes = !insideQuotes;
            continue;
        }

        if (character === delimiter && !insideQuotes) {
            count += 1;
        }
    }

    return count;
};

const detectCsvDelimiter = (headerLine: string): CsvDelimiter => {
    const delimiterCounts: Record<CsvDelimiter, number> = {
        ',': countDelimiterOccurrences(headerLine, ','),
        ';': countDelimiterOccurrences(headerLine, ';'),
        '\t': countDelimiterOccurrences(headerLine, '\t'),
    };

    if (delimiterCounts[';'] > delimiterCounts[','] && delimiterCounts[';'] >= delimiterCounts['\t']) {
        return ';';
    }

    if (delimiterCounts['\t'] > delimiterCounts[','] && delimiterCounts['\t'] > delimiterCounts[';']) {
        return '\t';
    }

    return ',';
};

const stripLeadingBom = (value: string): string => {
    if (value.charCodeAt(0) === 0xfeff) {
        return value.slice(1);
    }

    return value;
};

const tryDecodeCsv = (bytes: Uint8Array, encoding: string, fatal = false): string | null => {
    try {
        const decodedContent = new TextDecoder(encoding, {
            fatal,
        }).decode(bytes);

        return stripLeadingBom(decodedContent);
    } catch {
        return null;
    }
};

const readCsvContent = async (file: File): Promise<string> => {
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    if (fileBytes.length === 0) {
        return '';
    }

    const hasUtf8Bom = fileBytes.length >= 3 && fileBytes[0] === 0xef && fileBytes[1] === 0xbb && fileBytes[2] === 0xbf;
    if (hasUtf8Bom) {
        return stripLeadingBom(new TextDecoder('utf-8').decode(fileBytes));
    }

    const hasUtf16LeBom = fileBytes.length >= 2 && fileBytes[0] === 0xff && fileBytes[1] === 0xfe;
    if (hasUtf16LeBom) {
        return stripLeadingBom(new TextDecoder('utf-16le').decode(fileBytes));
    }

    const hasUtf16BeBom = fileBytes.length >= 2 && fileBytes[0] === 0xfe && fileBytes[1] === 0xff;
    if (hasUtf16BeBom) {
        return stripLeadingBom(new TextDecoder('utf-16be').decode(fileBytes));
    }

    const decodedUtf8 = tryDecodeCsv(fileBytes, 'utf-8', true);
    if (decodedUtf8 !== null) {
        return decodedUtf8;
    }

    const decodedUtf16Le = tryDecodeCsv(fileBytes, 'utf-16le');
    if (decodedUtf16Le !== null) {
        return decodedUtf16Le;
    }

    const decodedUtf16Be = tryDecodeCsv(fileBytes, 'utf-16be');
    if (decodedUtf16Be !== null) {
        return decodedUtf16Be;
    }

    const decodedWindows1252 = tryDecodeCsv(fileBytes, 'windows-1252');
    if (decodedWindows1252 !== null) {
        return decodedWindows1252;
    }

    throw new Error('Could not decode this CSV file. Save it as UTF-8 CSV and try again.');
};

const normalizeRoleToken = (rawRole: string): string | null => {
    const normalized = rawRole.trim().toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_');

    if (normalized === 'advisor') {
        return 'adviser';
    }

    if (normalized === 'program_chair' || normalized === 'programchair') {
        return 'program_chairperson';
    }

    if (availableRoles.includes(normalized as UserRole) || availableFacultyRoles.includes(normalized as FacultyRole)) {
        return normalized;
    }

    return null;
};

const parseRoles = (roleCell: string): { roles: string[]; hasInvalidRole: boolean } => {
    const parts = roleCell
        .split(/[;,|]/)
        .flatMap((part) => part.split('/'))
        .map((part) => part.trim())
        .filter((part) => part !== '');

    const normalizedRoles: string[] = [];
    let hasInvalidRole = false;

    parts.forEach((part) => {
        const normalizedRole = normalizeRoleToken(part);

        if (normalizedRole === null) {
            hasInvalidRole = true;
            return;
        }

        if (!normalizedRoles.includes(normalizedRole)) {
            normalizedRoles.push(normalizedRole);
        }
    });

    return {
        roles: normalizedRoles,
        hasInvalidRole,
    };
};

const BulkUploadModal = ({ open, onClose, existingUsers = [], existingEmails = [], userType = 'user' }: BulkUploadModalProps) => {
    const [isMainModalAppearing, setIsMainModalAppearing] = React.useState(false);
    const [isReviewModalAppearing, setIsReviewModalAppearing] = React.useState(false);
    const [isUploadProgressModalAppearing, setIsUploadProgressModalAppearing] = React.useState(false);
    const [uploadProgressValue, setUploadProgressValue] = React.useState(0);
    const [uploadProgressMessage, setUploadProgressMessage] = React.useState('Import queued.');
    const [activeImportId, setActiveImportId] = React.useState<string | null>(null);
    const [isQueueRequestRunning, setIsQueueRequestRunning] = React.useState(false);
    const [uploadSource, setUploadSource] = React.useState<UploadSource>('file');
    const [fileName, setFileName] = React.useState('');
    const [pastedCsvContent, setPastedCsvContent] = React.useState('');
    const [previewRows, setPreviewRows] = React.useState<PreviewRow[]>([]);
    const [selectedRowLines, setSelectedRowLines] = React.useState<number[]>([]);
    const [showReviewModal, setShowReviewModal] = React.useState(false);
    const [fileError, setFileError] = React.useState('');
    const [importErrorMessages, setImportErrorMessages] = React.useState<string[]>([]);
    const [importOutcome, setImportOutcome] = React.useState<ImportOutcome | null>(null);
    const [isCancellingImport, setIsCancellingImport] = React.useState(false);
    const [highlightedRowLine, setHighlightedRowLine] = React.useState<number | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const queueRequestAbortControllerRef = React.useRef<AbortController | null>(null);
    const previewRowElementRefs = React.useRef<Map<number, HTMLTableRowElement>>(new Map());
    const highlightedRowTimeoutRef = React.useRef<number | null>(null);
    const rowFocusIndexRef = React.useRef<Record<RowFocusGroup, number>>({
        valid: 0,
        invalid: 0,
        selected: 0,
        total: 0,
    });
    const isImportRunning = isQueueRequestRunning || activeImportId !== null;

    const resolveListingUrl = React.useCallback((): string => {
        if (userType === 'student') {
            return students.url();
        }

        if (userType === 'faculty') {
            return faculty.url();
        }

        return index.url();
    }, [userType]);

    const existingUserEmails = React.useMemo(() => {
        const normalizedFromUsers = existingUsers
            .map((user) => user.email?.trim().toLowerCase())
            .filter((email): email is string => typeof email === 'string' && email !== '');
        const normalizedFromSystem = existingEmails
            .map((email) => email.trim().toLowerCase())
            .filter((email) => email !== '');

        return new Set([...normalizedFromUsers, ...normalizedFromSystem]);
    }, [existingEmails, existingUsers]);

    const selectedRowLinesSet = React.useMemo(() => {
        return new Set(selectedRowLines);
    }, [selectedRowLines]);

    const selectedRows = React.useMemo<UploadRow[]>(() => {
        return previewRows
            .filter((row) => row.issues.length === 0 && selectedRowLinesSet.has(row.line))
            .map((row) => {
                if (userType === 'student') {
                    return {
                        first_name: row.first_name,
                        last_name: row.last_name,
                        email: row.email,
                        program: row.program,
                        password: row.password,
                    };
                }

                return {
                    first_name: row.first_name,
                    last_name: row.last_name,
                    email: row.email,
                    roles: row.roles,
                    password: row.password,
                };
            });
    }, [previewRows, selectedRowLinesSet, userType]);

    const rowLinesByGroup = React.useMemo<Record<RowFocusGroup, number[]>>(() => {
        return {
            valid: previewRows.filter((row) => row.issues.length === 0).map((row) => row.line),
            invalid: previewRows.filter((row) => row.issues.length > 0).map((row) => row.line),
            selected: previewRows.filter((row) => row.issues.length === 0 && selectedRowLinesSet.has(row.line)).map((row) => row.line),
            total: previewRows.map((row) => row.line),
        };
    }, [previewRows, selectedRowLinesSet]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isImportRunning) {
                if (showReviewModal) {
                    setShowReviewModal(false);
                    return;
                }

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
    }, [open, onClose, isImportRunning, showReviewModal]);

    useEffect(() => {
        if (!open) {
            setIsMainModalAppearing(false);
            return;
        }

        setIsMainModalAppearing(false);
        const animationFrame = window.requestAnimationFrame(() => {
            setIsMainModalAppearing(true);
        });

        return () => {
            window.cancelAnimationFrame(animationFrame);
        };
    }, [open]);

    useEffect(() => {
        if (!showReviewModal) {
            setIsReviewModalAppearing(false);
            return;
        }

        setIsReviewModalAppearing(false);
        const animationFrame = window.requestAnimationFrame(() => {
            setIsReviewModalAppearing(true);
        });

        return () => {
            window.cancelAnimationFrame(animationFrame);
        };
    }, [showReviewModal]);

    useEffect(() => {
        if (!isImportRunning) {
            setIsUploadProgressModalAppearing(false);
            return;
        }

        setIsUploadProgressModalAppearing(false);
        const animationFrame = window.requestAnimationFrame(() => {
            setIsUploadProgressModalAppearing(true);
        });

        return () => {
            window.cancelAnimationFrame(animationFrame);
        };
    }, [isImportRunning]);

    const clearUploadState = React.useCallback(() => {
        setUploadSource('file');
        setFileName('');
        setPastedCsvContent('');
        setPreviewRows([]);
        setSelectedRowLines([]);
        setShowReviewModal(false);
        setFileError('');
        setImportErrorMessages([]);
        setImportOutcome(null);
        setIsCancellingImport(false);
        setUploadProgressMessage('Import queued.');
        setUploadProgressValue(0);
        setActiveImportId(null);
        setIsQueueRequestRunning(false);
        if (fileInputRef.current !== null) {
            fileInputRef.current.value = '';
        }
    }, []);

    useEffect(() => {
        if (activeImportId === null) {
            return;
        }

        let isCancelled = false;

        const pollImportProgress = async () => {
            try {
                const response = await fetch(
                    bulkStatus.url({
                        importId: activeImportId,
                    }),
                    {
                        method: 'GET',
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        credentials: 'same-origin',
                    },
                );

                const payload: BulkImportProgressResponse = await response.json();

                if (isCancelled) {
                    return;
                }

                if (!response.ok) {
                    throw new Error(typeof payload.message === 'string' && payload.message !== '' ? payload.message : 'Unable to track import progress.');
                }

                setUploadProgressValue(Math.max(0, Math.min(100, payload.progress_percentage)));
                setUploadProgressMessage(payload.message);

                if (payload.status === 'failed') {
                    setActiveImportId(null);
                    setIsQueueRequestRunning(false);
                    setIsCancellingImport(false);
                    setImportOutcome({
                        successfulRows: payload.successful_rows,
                        failedRows: payload.failed_rows,
                    });
                    setImportErrorMessages([payload.message]);

                    if (payload.successful_rows > 0) {
                        router.reload();
                    }

                    return;
                }

                if (payload.status === 'cancelled') {
                    setActiveImportId(null);
                    setIsQueueRequestRunning(false);
                    setIsCancellingImport(false);
                    setImportOutcome({
                        successfulRows: payload.successful_rows,
                        failedRows: payload.failed_rows,
                    });
                    setImportErrorMessages([payload.message]);

                    if (payload.successful_rows > 0) {
                        clearUploadState();
                        onClose();
                        router.visit(resolveListingUrl(), {
                            replace: true,
                            preserveState: false,
                        });
                    }

                    return;
                }

                if (payload.status !== 'completed') {
                    return;
                }

                setActiveImportId(null);
                setIsQueueRequestRunning(false);
                setIsCancellingImport(false);
                setUploadProgressValue(100);
                setImportOutcome({
                    successfulRows: payload.successful_rows,
                    failedRows: payload.failed_rows,
                });

                if (payload.failed_rows > 0) {
                    const failedItems = Array.isArray(payload.failed_items) ? payload.failed_items : [];
                    const rowFailureMessages = failedItems
                        .map((failedItem) => {
                            const lineLabel = typeof failedItem.line === 'number' ? `Row ${failedItem.line}` : 'Row';
                            const emailLabel = typeof failedItem.email === 'string' && failedItem.email !== '' ? ` (${failedItem.email})` : '';
                            const message = typeof failedItem.message === 'string' && failedItem.message !== '' ? failedItem.message : 'Failed to import this row.';

                            return `${lineLabel}${emailLabel}: ${message}`;
                        })
                        .slice(0, 10);

                    setImportErrorMessages(
                        rowFailureMessages.length > 0
                            ? rowFailureMessages
                            : [`${payload.failed_rows} row(s) failed to import. Please review and retry those rows.`],
                    );

                    return;
                }

                setImportErrorMessages([]);
                clearUploadState();
                onClose();
                router.visit(resolveListingUrl(), {
                    replace: true,
                    preserveState: false,
                });
            } catch (error) {
                if (isCancelled) {
                    return;
                }

                setActiveImportId(null);
                setIsQueueRequestRunning(false);
                setIsCancellingImport(false);
                setImportErrorMessages([error instanceof Error ? error.message : 'Unable to fetch import progress.']);
            }
        };

        void pollImportProgress();
        const pollingTimer = window.setInterval(() => {
            void pollImportProgress();
        }, 1200);

        return () => {
            isCancelled = true;
            window.clearInterval(pollingTimer);
        };
    }, [activeImportId, clearUploadState, onClose, resolveListingUrl]);

    useEffect(() => {
        return () => {
            if (highlightedRowTimeoutRef.current !== null) {
                window.clearTimeout(highlightedRowTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        rowFocusIndexRef.current = {
            valid: 0,
            invalid: 0,
            selected: 0,
            total: 0,
        };
        setHighlightedRowLine(null);
    }, [previewRows, selectedRowLines]);

    const cancelImport = async () => {
        if (isCancellingImport || !isImportRunning) {
            return;
        }

        if (isQueueRequestRunning && activeImportId === null) {
            queueRequestAbortControllerRef.current?.abort();
            setIsQueueRequestRunning(false);
            setIsCancellingImport(false);
            setUploadProgressValue(0);
            setUploadProgressMessage('Import cancelled.');
            setImportErrorMessages(['Import queue request was cancelled.']);

            return;
        }

        if (activeImportId === null) {
            return;
        }

        setIsCancellingImport(true);
        const csrfToken = resolveCsrfToken();

        try {
            const response = await fetch(`/admin/users/bulk/${encodeURIComponent(activeImportId)}/cancel`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            const payload = (await response.json()) as Partial<BulkImportProgressResponse> & {
                message?: string;
            };

            if (!response.ok) {
                throw new Error(typeof payload.message === 'string' && payload.message !== '' ? payload.message : 'Failed to cancel import.');
            }

            const successfulRows = typeof payload.successful_rows === 'number' ? payload.successful_rows : 0;
            const failedRows = typeof payload.failed_rows === 'number' ? payload.failed_rows : 0;
            const message = typeof payload.message === 'string' && payload.message !== '' ? payload.message : 'Import cancellation requested.';

            setUploadProgressMessage(message);
            setImportOutcome({
                successfulRows,
                failedRows,
            });
            setImportErrorMessages([message]);
            setActiveImportId(null);
            setIsQueueRequestRunning(false);
            setIsCancellingImport(false);

            if ((payload.status ?? '') === 'cancelled' && successfulRows > 0) {
                clearUploadState();
                onClose();
                router.visit(resolveListingUrl(), {
                    replace: true,
                    preserveState: false,
                });
            }
        } catch (error) {
            setIsCancellingImport(false);
            setImportErrorMessages([error instanceof Error ? error.message : 'Failed to cancel import.']);
        }
    };

    const switchUploadSource = (nextSource: UploadSource) => {
        if (nextSource === uploadSource) {
            return;
        }

        setUploadSource(nextSource);
        setFileName('');
        setPreviewRows([]);
        setSelectedRowLines([]);
        setShowReviewModal(false);
        setFileError('');
        setImportErrorMessages([]);
        setImportOutcome(null);
        setIsCancellingImport(false);

        if (fileInputRef.current !== null) {
            fileInputRef.current.value = '';
        }
    };

    const closeAll = () => {
        if (isImportRunning) {
            return;
        }

        clearUploadState();
        onClose();
    };

    const parseRawCsvContent = (rawCsvContent: string) => {
        const rawContent = stripLeadingBom(rawCsvContent);
        const lines = rawContent
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        if (lines.length <= 1) {
            setFileError('CSV content must include a header row and at least one row.');
            return;
        }

        const requiredHeaders =
            userType === 'student'
                ? (['last_name', 'first_name', 'email', 'program', 'password'] as const)
                : userType === 'faculty'
                  ? (['last_name', 'first_name', 'email', 'role', 'password'] as const)
                  : (['last_name', 'first_name', 'email', 'role', 'password'] as const);

        const delimiter = detectCsvDelimiter(lines[0]);
        const headers = parseCsvLine(lines[0], delimiter).map((header) => canonicalizeHeader(header));
        const headerIndex = headers.reduce<Record<string, number>>((accumulator, header, index) => {
            accumulator[header] = index;

            return accumulator;
        }, {});

        const missingHeaders = requiredHeaders.filter((header) => headerIndex[header] === undefined);
        if (missingHeaders.length > 0) {
            setFileError(`Missing required headers: ${missingHeaders.join(', ')}.`);
            return;
        }

        const emailTracker = new Set<string>();
        const parsedPreviewRows: PreviewRow[] = lines.slice(1).map((line, lineIndex) => {
            const values = parseCsvLine(line, delimiter);
            const firstName = values[headerIndex.first_name] ?? '';
            const lastName = values[headerIndex.last_name] ?? '';
            const issues: string[] = [];

            if (lastName === '') {
                issues.push('Last name is required.');
            }

            if (firstName === '') {
                issues.push('First name is required.');
            }

            if (userType === 'student') {
                const email = values[headerIndex.email] ?? '';
                const rawProgram = (values[headerIndex.program] ?? '').toUpperCase();
                const password = values[headerIndex.password] ?? '';

                if (email === '') {
                    issues.push('Email is required.');
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    issues.push('Email format is invalid.');
                } else if (emailTracker.has(email.toLowerCase())) {
                    issues.push('Duplicate email in file.');
                } else if (existingUserEmails.has(email.toLowerCase())) {
                    issues.push('Email already exists in the system.');
                }

                if (!studentPrograms.includes(rawProgram as StudentProgram)) {
                    issues.push('Program must be BSIT or BSIS.');
                }

                if (password.length < 8) {
                    issues.push('Password must be at least 8 characters.');
                }

                emailTracker.add(email.toLowerCase());

                return {
                    line: lineIndex + 2,
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    program: studentPrograms.includes(rawProgram as StudentProgram) ? (rawProgram as StudentProgram) : undefined,
                    password,
                    issues,
                };
            }

            const email = values[headerIndex.email] ?? '';
            const rawRoleValue = values[headerIndex.role] ?? '';
            const parsedRoles = parseRoles(rawRoleValue);

            if (email === '') {
                issues.push('Email is required.');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                issues.push('Email format is invalid.');
            } else if (emailTracker.has(email.toLowerCase())) {
                issues.push('Duplicate email in file.');
            } else if (existingUserEmails.has(email.toLowerCase())) {
                issues.push('Email already exists in the system.');
            }

            const allowedRoles = userType === 'faculty' ? availableFacultyRoles : availableRoles;
            if (parsedRoles.roles.length === 0) {
                issues.push('At least one role is required.');
            }

            if (parsedRoles.hasInvalidRole || parsedRoles.roles.some((role) => !allowedRoles.includes(role as never))) {
                issues.push('One or more roles are invalid.');
            }

            let password: string | undefined;
            if (userType === 'user' || userType === 'faculty') {
                password = values[headerIndex.password] ?? '';

                if (password.length < 8) {
                    issues.push('Password must be at least 8 characters.');
                }
            }

            emailTracker.add(email.toLowerCase());

            return {
                line: lineIndex + 2,
                first_name: firstName,
                last_name: lastName,
                email,
                roles: parsedRoles.roles,
                password,
                issues,
            };
        });

        setPreviewRows(parsedPreviewRows);
        setSelectedRowLines(parsedPreviewRows.filter((row) => row.issues.length === 0).map((row) => row.line));
        setFileError('');
        setShowReviewModal(true);
    };

    const parseFile = async (file: File) => {
        const rawContent = await readCsvContent(file);

        parseRawCsvContent(rawContent);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setFileName(file.name);
        setImportErrorMessages([]);
        setFileError('');

        const normalizedFileName = file.name.toLowerCase();
        const isCsvFile = normalizedFileName.endsWith('.csv');

        if (!isCsvFile) {
            setFileError('Please select a valid .csv file.');
            event.target.value = '';
            return;
        }

        try {
            await parseFile(file);
        } catch (error) {
            setFileError(error instanceof Error ? error.message : 'Could not read the selected file. Please try again.');
        } finally {
            event.target.value = '';
        }
    };

    const handlePastePreview = () => {
        setImportErrorMessages([]);
        setFileError('');
        setFileName('Pasted CSV');

        if (pastedCsvContent.trim() === '') {
            setFileError('Paste CSV content before previewing.');

            return;
        }

        try {
            parseRawCsvContent(pastedCsvContent);
        } catch {
            setFileError('Could not parse the pasted CSV content. Check the format and try again.');
        }
    };

    const invalidRowsCount = previewRows.filter((row) => row.issues.length > 0).length;
    const validRowsCount = previewRows.length - invalidRowsCount;
    const selectedRowsCount = selectedRows.length;
    const hasPartialImportSuccess = importOutcome !== null && importOutcome.successfulRows > 0 && importOutcome.failedRows > 0;

    const focusRow = React.useCallback((line: number) => {
        const rowElement = previewRowElementRefs.current.get(line);

        if (!rowElement) {
            return;
        }

        rowElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
        });
        setHighlightedRowLine(line);

        if (highlightedRowTimeoutRef.current !== null) {
            window.clearTimeout(highlightedRowTimeoutRef.current);
        }

        highlightedRowTimeoutRef.current = window.setTimeout(() => {
            setHighlightedRowLine((previousLine) => (previousLine === line ? null : previousLine));
        }, 1600);
    }, []);

    const focusNextRowByGroup = (group: RowFocusGroup) => {
        const targetLines = rowLinesByGroup[group];

        if (targetLines.length === 0) {
            return;
        }

        const currentIndex = rowFocusIndexRef.current[group] % targetLines.length;
        const targetLine = targetLines[currentIndex];
        rowFocusIndexRef.current[group] = (currentIndex + 1) % targetLines.length;
        focusRow(targetLine);
    };

    const toggleRowSelection = (line: number) => {
        setSelectedRowLines((previousSelectedRows) => {
            if (previousSelectedRows.includes(line)) {
                return previousSelectedRows.filter((selectedLine) => selectedLine !== line);
            }

            return [...previousSelectedRows, line];
        });
    };

    const importRows = async () => {
        if (selectedRows.length === 0 || isImportRunning) {
            return;
        }

        setImportErrorMessages([]);
        setImportOutcome(null);
        setFileError('');
        setIsCancellingImport(false);
        setIsQueueRequestRunning(true);
        setUploadProgressValue(0);
        setUploadProgressMessage('Queueing import job...');

        const csrfToken = resolveCsrfToken();
        const requestAbortController = new AbortController();
        queueRequestAbortControllerRef.current = requestAbortController;

        try {
            const response = await fetch(
                bulkStore.url({
                    query: {
                        type: userType,
                    },
                }),
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        type: userType,
                        rows: selectedRows,
                    }),
                    signal: requestAbortController.signal,
                },
            );

            const payload = (await response.json()) as
                | (BulkImportProgressResponse & {
                      errors?: Record<string, string | string[]>;
                  })
                | { message?: string; errors?: Record<string, string | string[]> };

            if (!response.ok) {
                const responseErrors = payload.errors ?? {};
                const flattenedErrors = Object.values(responseErrors)
                    .flatMap((error) => (Array.isArray(error) ? error : [error]))
                    .map((error) => (typeof error === 'string' ? error.trim() : ''))
                    .filter((error) => error !== '');

                setImportErrorMessages(
                    flattenedErrors.length > 0
                        ? flattenedErrors
                        : [typeof payload.message === 'string' ? payload.message : 'Failed to queue the bulk import.'],
                );
                setIsQueueRequestRunning(false);
                setUploadProgressValue(0);
                setUploadProgressMessage('Failed to queue import.');

                return;
            }

            const importId = 'import_id' in payload ? payload.import_id : null;

            if (typeof importId !== 'string' || importId.trim() === '') {
                setImportErrorMessages(['Bulk import was queued, but no import ID was returned.']);
                setIsQueueRequestRunning(false);
                setUploadProgressValue(0);
                setUploadProgressMessage('Failed to start progress tracking.');

                return;
            }

            setUploadProgressMessage(
                'message' in payload && typeof payload.message === 'string' ? payload.message : 'Import queued. Waiting for queue worker...',
            );
            setUploadProgressValue('progress_percentage' in payload ? payload.progress_percentage : 0);
            setActiveImportId(importId);
            setIsQueueRequestRunning(false);
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                setImportErrorMessages(['Import queue request was cancelled.']);
                setIsQueueRequestRunning(false);
                setUploadProgressValue(0);
                setUploadProgressMessage('Import cancelled.');

                return;
            }

            setImportErrorMessages([error instanceof Error ? error.message : 'Failed to queue the bulk import.']);
            setIsQueueRequestRunning(false);
            setUploadProgressValue(0);
            setUploadProgressMessage('Failed to queue import.');
        } finally {
            queueRequestAbortControllerRef.current = null;
        }
    };

    if (!open || typeof document === 'undefined') {
        return null;
    }

    const uploadLabel = userType === 'student' ? 'Bulk Upload Students' : userType === 'faculty' ? 'Bulk Upload Faculty' : 'Bulk Upload Users';
    const csvGuide =
        userType === 'student'
            ? 'Last Name, First Name, Email, Program, and Password'
            : userType === 'faculty'
              ? 'Last Name, First Name, Email, Role, and Password'
              : 'Last Name, First Name, Email, Role, and Password';
    const csvTemplateFileName =
        userType === 'student'
            ? 'student-upload-template.csv'
            : userType === 'faculty'
              ? 'faculty-upload-template.csv'
              : 'user-upload-template.csv';
    const csvTemplateContent =
        userType === 'student'
            ? ['last_name,first_name,email,program,password', 'Dela Cruz,Juan,juan.delacruz@example.com,BSIT,StrongPass123'].join('\n')
            : userType === 'faculty'
              ? [
                    'last_name,first_name,email,role,password',
                    'Santos,Maria,maria.santos@example.com,instructor,StrongPass123',
                    'Reyes,Carlo,carlo.reyes@example.com,adviser;panelist,StrongPass123',
                ].join('\n')
              : [
                    'last_name,first_name,email,role,password',
                    'Garcia,Ana,ana.garcia@example.com,student,StrongPass123',
                    'Lopez,Marco,marco.lopez@example.com,admin,StrongPass123',
                ].join('\n');

    const downloadCsvTemplate = () => {
        const blob = new Blob([csvTemplateContent], {
            type: 'text/csv;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const anchorElement = document.createElement('a');

        anchorElement.href = url;
        anchorElement.setAttribute('download', csvTemplateFileName);
        anchorElement.click();

        URL.revokeObjectURL(url);
    };

    return createPortal(
        <>
            <div
                className={`fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
                    isMainModalAppearing ? 'opacity-100' : 'opacity-0'
                }`}
                role="dialog"
                aria-modal="true"
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                        closeAll();
                    }
                }}
            >
                <div
                    className={`w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                        isMainModalAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                    }`}
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <div className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <Upload className="h-5 w-5 text-emerald-800" />
                            <h2 className="text-lg font-bold text-emerald-900">{uploadLabel}</h2>
                        </div>
                        <button
                            type="button"
                            onClick={closeAll}
                            disabled={isImportRunning}
                            className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="space-y-4 p-4">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                            Upload a CSV file or paste CSV text with headers:
                            <br />
                            <span className="font-semibold">{csvGuide}</span>
                            <div className="mt-3">
                                <button
                                    type="button"
                                    onClick={downloadCsvTemplate}
                                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Download CSV Template (Recommended)
                                </button>
                            </div>
                        </div>

                        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => switchUploadSource('file')}
                                className={`rounded-md px-3 py-1.5 transition-colors ${
                                    uploadSource === 'file' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                                Upload File
                            </button>
                            <button
                                type="button"
                                onClick={() => switchUploadSource('paste')}
                                className={`rounded-md px-3 py-1.5 transition-colors ${
                                    uploadSource === 'paste' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                                Paste CSV Text
                            </button>
                        </div>

                        {uploadSource === 'file' ? (
                            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                <FileSpreadsheet className="h-8 w-8 text-slate-500" />
                                <span className="text-sm font-semibold text-slate-700">{fileName || 'Choose CSV file'}</span>
                                <span className="text-xs text-slate-500">Click to browse and preview before importing.</span>
                                <input
                                    type="file"
                                    accept=".csv,text/csv"
                                    onChange={handleFileChange}
                                    ref={fileInputRef}
                                    className="hidden"
                                />
                            </label>
                        ) : (
                            <div className="rounded-xl border border-slate-300 bg-slate-50 p-3">
                                <p className="mb-2 text-xs text-slate-600">Paste CSV content including the header row.</p>
                                <textarea
                                    value={pastedCsvContent}
                                    onChange={(event) => setPastedCsvContent(event.target.value)}
                                    rows={8}
                                    placeholder={csvTemplateContent}
                                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-700 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                />
                                <div className="mt-3 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handlePastePreview}
                                        disabled={isImportRunning || pastedCsvContent.trim() === ''}
                                        className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Preview Pasted CSV
                                    </button>
                                </div>
                            </div>
                        )}

                        {fileError ? <p className="text-sm text-rose-600">{fileError}</p> : null}

                        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                            <button
                                type="button"
                                onClick={closeAll}
                                disabled={isImportRunning}
                                className="rounded-lg border-2 border-slate-300 px-5 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowReviewModal(true)}
                                disabled={previewRows.length === 0}
                                className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Review Upload
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showReviewModal ? (
                <div
                    className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm transition-opacity duration-200 ${
                        isReviewModalAppearing ? 'opacity-100' : 'opacity-0'
                    }`}
                    role="dialog"
                    aria-modal="true"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !isImportRunning) {
                            setShowReviewModal(false);
                        }
                    }}
                >
                    <div
                        className={`max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                            isReviewModalAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                        }`}
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-800" />
                                <h2 className="text-lg font-bold text-emerald-900">Review Import File</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowReviewModal(false)}
                                disabled={isImportRunning}
                                className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4 p-4">
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                <button
                                    type="button"
                                    onClick={() => focusNextRowByGroup('valid')}
                                    disabled={validRowsCount === 0}
                                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    title="Click to focus valid rows one by one"
                                >
                                    Valid: {validRowsCount}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => focusNextRowByGroup('invalid')}
                                    disabled={invalidRowsCount === 0}
                                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    title="Click to focus rows with issues one by one"
                                >
                                    With issues: {invalidRowsCount}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => focusNextRowByGroup('selected')}
                                    disabled={selectedRowsCount === 0}
                                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    title="Click to focus selected rows one by one"
                                >
                                    Selected: {selectedRowsCount}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => focusNextRowByGroup('total')}
                                    disabled={previewRows.length === 0}
                                    className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    title="Click to focus all rows one by one"
                                >
                                    Total rows: {previewRows.length}
                                </button>
                            </div>

                            <div className="max-h-[55vh] overflow-auto rounded-xl border border-slate-200">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-slate-100">
                                        <tr className="text-left text-slate-700">
                                            <th className="px-3 py-2 font-semibold">First Name</th>
                                            <th className="px-3 py-2 font-semibold">Last Name</th>
                                            {userType === 'student' ? <th className="px-3 py-2 font-semibold">Email</th> : null}
                                            {userType === 'student' ? <th className="px-3 py-2 font-semibold">Program</th> : null}
                                            {userType !== 'student' ? <th className="px-3 py-2 font-semibold">Email</th> : null}
                                            {userType !== 'student' ? <th className="px-3 py-2 font-semibold">Roles</th> : null}
                                            <th className="px-3 py-2 font-semibold">Issues</th>
                                            <th className="px-3 py-2 font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {previewRows.map((row) => (
                                            <tr
                                                key={`${row.line}-${row.first_name}-${row.last_name}`}
                                                ref={(element) => {
                                                    if (element === null) {
                                                        previewRowElementRefs.current.delete(row.line);
                                                        return;
                                                    }

                                                    previewRowElementRefs.current.set(row.line, element);
                                                }}
                                                className={`transition-colors duration-300 ${row.issues.length > 0 ? 'bg-rose-50' : ''} ${
                                                    highlightedRowLine === row.line ? 'bg-blue-50' : ''
                                                }`}
                                            >
                                                <td className="px-3 py-2">{row.first_name}</td>
                                                <td className="px-3 py-2">{row.last_name}</td>
                                                {userType === 'student' ? <td className="px-3 py-2">{row.email ?? '-'}</td> : null}
                                                {userType === 'student' ? <td className="px-3 py-2">{row.program ?? '-'}</td> : null}
                                                {userType !== 'student' ? <td className="px-3 py-2">{row.email}</td> : null}
                                                {userType !== 'student' ? (
                                                    <td className="px-3 py-2 capitalize">{(row.roles ?? []).join(', ').replaceAll('_', ' ')}</td>
                                                ) : null}
                                                <td className="px-3 py-2">
                                                    {row.issues.length > 0 ? (
                                                        <ul className="list-disc pl-4 text-xs text-rose-700">
                                                            {row.issues.map((issue) => (
                                                                <li key={issue}>{issue}</li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span className="text-xs text-emerald-700">Ready to import</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {row.issues.length > 0 ? (
                                                        <span className="text-xs text-slate-400">Not selectable</span>
                                                    ) : (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRowLinesSet.has(row.line)}
                                                            onChange={() => toggleRowSelection(row.line)}
                                                            disabled={isImportRunning}
                                                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                        />
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {importErrorMessages.length > 0 ? (
                                <div
                                    className={`rounded-lg p-3 text-sm ${
                                        hasPartialImportSuccess
                                            ? 'border border-amber-200 bg-amber-50 text-amber-800'
                                            : 'border border-rose-200 bg-rose-50 text-rose-700'
                                    }`}
                                >
                                    <p className="font-semibold">
                                        {hasPartialImportSuccess
                                            ? `Import completed with issues. ${importOutcome?.successfulRows ?? 0} row(s) were saved.`
                                            : 'Import failed. Fix the following issues and try again.'}
                                    </p>
                                    <ul className="mt-2 list-disc pl-4">
                                        {importErrorMessages.map((errorMessage) => (
                                            <li key={errorMessage}>{errorMessage}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}

                            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowReviewModal(false)}
                                    disabled={isImportRunning}
                                    className="rounded-lg border-2 border-slate-300 px-5 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={importRows}
                                    disabled={isImportRunning || selectedRowsCount === 0}
                                    className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isImportRunning ? 'Importing...' : `Approve and Import (${selectedRowsCount})`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {isImportRunning ? (
                <div
                    className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm transition-opacity duration-200 ${
                        isUploadProgressModalAppearing ? 'opacity-100' : 'opacity-0'
                    }`}
                    role="status"
                    aria-live="polite"
                    aria-modal="true"
                >
                    <div
                        className={`w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl transition-all duration-200 ${
                            isUploadProgressModalAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </span>
                            <div>
                                <p className="text-base font-semibold text-slate-900">Importing CSV data</p>
                                <p className="text-sm text-slate-600">{uploadProgressMessage}</p>
                            </div>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                                className="h-full rounded-full bg-emerald-600 transition-[width] duration-300 ease-out"
                                style={{ width: `${uploadProgressValue}%` }}
                            />
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                            <span>
                                {selectedRowsCount} row{selectedRowsCount === 1 ? '' : 's'} queued
                            </span>
                            <span>{uploadProgressValue}%</span>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={cancelImport}
                                disabled={isCancellingImport}
                                className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isCancellingImport ? 'Cancelling...' : 'Cancel Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>,
        document.body,
    );
};

export default BulkUploadModal;
