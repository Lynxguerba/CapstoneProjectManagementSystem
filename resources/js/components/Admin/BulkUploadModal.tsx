import { useForm } from '@inertiajs/react';
import { CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { bulkStore } from '../../routes/admin/users';

type UserRole = 'admin' | 'student' | 'adviser' | 'instructor' | 'panelist' | 'dean' | 'program_chairperson';
type FacultyRole = 'admin' | 'faculty';
type UserStatus = 'active' | 'inactive';
type StudentProgram = 'BSIT' | 'BSIS';
type EntityType = 'user' | 'faculty' | 'student';

type PreviewRow = {
    line: number;
    first_name: string;
    last_name: string;
    email?: string;
    roles?: string[];
    status?: UserStatus;
    password?: string;
    program?: StudentProgram;
    issues: string[];
};

type BulkUploadModalProps = {
    open: boolean;
    onClose: () => void;
    existingUsers?: Array<{
        email: string;
    }>;
    userType?: EntityType;
};

type BulkUploadForm = {
    rows: Array<Record<string, unknown>>;
};

const availableRoles: UserRole[] = ['admin', 'student', 'adviser', 'instructor', 'panelist', 'dean', 'program_chairperson'];
const availableFacultyRoles: FacultyRole[] = ['admin', 'faculty'];
const availableStatuses: UserStatus[] = ['active', 'inactive'];
const studentPrograms: StudentProgram[] = ['BSIT', 'BSIS'];

const normalizeHeader = (header: string): string => {
    return header.trim().toLowerCase().replace(/[\s-]+/g, '_');
};

const parseCsvLine = (line: string): string[] => {
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

        if (character === ',' && !insideQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
            continue;
        }

        currentValue += character;
    }

    values.push(currentValue.trim());

    return values.map((value) => value.replace(/^"|"$/g, '').trim());
};

const normalizeRoleToken = (rawRole: string): string | null => {
    const normalized = rawRole
        .trim()
        .toLowerCase()
        .replace(/-/g, '_')
        .replace(/\s+/g, '_');

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

const BulkUploadModal = ({ open, onClose, existingUsers = [], userType = 'user' }: BulkUploadModalProps) => {
    const [isMainModalAppearing, setIsMainModalAppearing] = React.useState(false);
    const [isReviewModalAppearing, setIsReviewModalAppearing] = React.useState(false);
    const [fileName, setFileName] = React.useState('');
    const [previewRows, setPreviewRows] = React.useState<PreviewRow[]>([]);
    const [selectedRowLines, setSelectedRowLines] = React.useState<number[]>([]);
    const [showReviewModal, setShowReviewModal] = React.useState(false);
    const [fileError, setFileError] = React.useState('');

    const { data, setData, post, processing, errors, clearErrors, reset } = useForm<BulkUploadForm>({
        rows: [],
    });

    const existingUserEmails = React.useMemo(() => {
        return new Set(existingUsers.map((user) => user.email.trim().toLowerCase()));
    }, [existingUsers]);

    const selectedRowLinesSet = React.useMemo(() => {
        return new Set(selectedRowLines);
    }, [selectedRowLines]);

    useEffect(() => {
        const selectedRows = previewRows
            .filter((row) => row.issues.length === 0 && selectedRowLinesSet.has(row.line))
            .map((row) => {
                if (userType === 'student') {
                    return {
                        first_name: row.first_name,
                        last_name: row.last_name,
                        program: row.program,
                        password: row.password,
                    };
                }

                if (userType === 'faculty') {
                    return {
                        first_name: row.first_name,
                        last_name: row.last_name,
                        email: row.email,
                        roles: row.roles,
                        status: row.status,
                    };
                }

                return {
                    first_name: row.first_name,
                    last_name: row.last_name,
                    email: row.email,
                    roles: row.roles,
                    status: row.status,
                    password: row.password,
                };
            });

        setData('rows', selectedRows);
    }, [previewRows, selectedRowLinesSet, setData, userType]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !processing) {
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
    }, [open, onClose, processing, showReviewModal]);

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

    const clearUploadState = () => {
        setFileName('');
        setPreviewRows([]);
        setSelectedRowLines([]);
        setShowReviewModal(false);
        setFileError('');
        clearErrors();
        reset();
    };

    const closeAll = () => {
        if (processing) {
            return;
        }

        clearUploadState();
        onClose();
    };

    const parseFile = async (file: File) => {
        const rawContent = await file.text();
        const lines = rawContent
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        if (lines.length <= 1) {
            setFileError('CSV file must include a header row and at least one row.');
            return;
        }

        const requiredHeaders = userType === 'student'
            ? (['last_name', 'first_name', 'program', 'password'] as const)
            : userType === 'faculty'
                ? (['last_name', 'first_name', 'email', 'role'] as const)
                : (['last_name', 'first_name', 'email', 'role', 'password'] as const);

        const headers = parseCsvLine(lines[0]).map((header) => normalizeHeader(header));
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
            const values = parseCsvLine(line);
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
                const rawProgram = (values[headerIndex.program] ?? '').toUpperCase();
                const password = values[headerIndex.password] ?? '';

                if (!studentPrograms.includes(rawProgram as StudentProgram)) {
                    issues.push('Program must be BSIT or BSIS.');
                }

                if (password.length < 8) {
                    issues.push('Password must be at least 8 characters.');
                }

                return {
                    line: lineIndex + 2,
                    first_name: firstName,
                    last_name: lastName,
                    program: studentPrograms.includes(rawProgram as StudentProgram) ? (rawProgram as StudentProgram) : undefined,
                    password,
                    issues,
                };
            }

            const email = values[headerIndex.email] ?? '';
            const rawRoleValue = values[headerIndex.role] ?? '';
            const parsedRoles = parseRoles(rawRoleValue);
            const rawStatus = values[headerIndex.status] ?? 'active';
            const statusValue = rawStatus.toLowerCase() as UserStatus;

            if (email === '') {
                issues.push('Email is required.');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                issues.push('Email format is invalid.');
            } else if (emailTracker.has(email.toLowerCase())) {
                issues.push('Duplicate email in CSV.');
            } else if (existingUserEmails.has(email.toLowerCase())) {
                issues.push('Email already exists in this table.');
            }

            const allowedRoles = userType === 'faculty' ? availableFacultyRoles : availableRoles;
            if (parsedRoles.roles.length === 0) {
                issues.push('At least one role is required.');
            }

            if (parsedRoles.hasInvalidRole || parsedRoles.roles.some((role) => !allowedRoles.includes(role as never))) {
                issues.push('One or more roles are invalid.');
            }

            if (!availableStatuses.includes(statusValue)) {
                issues.push('Status is invalid.');
            }

            let password: string | undefined;
            if (userType === 'user') {
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
                status: availableStatuses.includes(statusValue) ? statusValue : 'active',
                password,
                issues,
            };
        });

        setPreviewRows(parsedPreviewRows);
        setSelectedRowLines(parsedPreviewRows.filter((row) => row.issues.length === 0).map((row) => row.line));
        setFileError('');
        setShowReviewModal(true);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setFileName(file.name);
        clearErrors();
        setFileError('');

        if (!file.name.toLowerCase().endsWith('.csv')) {
            setFileError('Please select a valid .csv file.');
            return;
        }

        await parseFile(file);
    };

    const invalidRowsCount = previewRows.filter((row) => row.issues.length > 0).length;
    const validRowsCount = previewRows.length - invalidRowsCount;
    const selectedRowsCount = data.rows.length;

    const toggleRowSelection = (line: number) => {
        setSelectedRowLines((previousSelectedRows) => {
            if (previousSelectedRows.includes(line)) {
                return previousSelectedRows.filter((selectedLine) => selectedLine !== line);
            }

            return [...previousSelectedRows, line];
        });
    };

    const importRows = () => {
        if (data.rows.length === 0) {
            return;
        }

        post(
            bulkStore.url({
                query: {
                    type: userType,
                },
            }),
            {
                preserveScroll: true,
                preserveState: false,
                onSuccess: () => {
                    clearUploadState();
                    onClose();
                },
            },
        );
    };

    if (!open || typeof document === 'undefined') {
        return null;
    }

    const uploadLabel = userType === 'student' ? 'Bulk Upload Students' : userType === 'faculty' ? 'Bulk Upload Faculty' : 'Bulk Upload Users';
    const csvGuide = userType === 'student'
        ? 'Last Name, First Name, Program, Password'
        : userType === 'faculty'
            ? 'Last Name, First Name, Email, Role, and optionally Status'
            : 'Last Name, First Name, Email, Role, Password, and optionally Status';

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
                            disabled={processing}
                            className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="space-y-4 p-4">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                            Upload a CSV file with headers:
                            <br />
                            <span className="font-semibold">{csvGuide}</span>
                        </div>

                        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                            <FileSpreadsheet className="h-8 w-8 text-slate-500" />
                            <span className="text-sm font-semibold text-slate-700">{fileName || 'Choose CSV file'}</span>
                            <span className="text-xs text-slate-500">Click to browse and preview before importing.</span>
                            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                        </label>

                        {fileError ? <p className="text-sm text-rose-600">{fileError}</p> : null}

                        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                            <button
                                type="button"
                                onClick={closeAll}
                                disabled={processing}
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
                        if (event.target === event.currentTarget && !processing) {
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
                                <h2 className="text-lg font-bold text-emerald-900">Review CSV Import</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowReviewModal(false)}
                                disabled={processing}
                                className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4 p-4">
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">Valid: {validRowsCount}</span>
                                <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">With issues: {invalidRowsCount}</span>
                                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">Selected: {selectedRowsCount}</span>
                                <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-slate-700">Total rows: {previewRows.length}</span>
                            </div>

                            <div className="max-h-[55vh] overflow-auto rounded-xl border border-slate-200">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-slate-100">
                                        <tr className="text-left text-slate-700">
                                            <th className="px-3 py-2 font-semibold">Last Name</th>
                                            <th className="px-3 py-2 font-semibold">First Name</th>
                                            {userType === 'student' ? <th className="px-3 py-2 font-semibold">Program</th> : null}
                                            {userType !== 'student' ? <th className="px-3 py-2 font-semibold">Email</th> : null}
                                            {userType !== 'student' ? <th className="px-3 py-2 font-semibold">Roles</th> : null}
                                            <th className="px-3 py-2 font-semibold">Issues</th>
                                            <th className="px-3 py-2 font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {previewRows.map((row) => (
                                            <tr key={`${row.line}-${row.first_name}-${row.last_name}`} className={row.issues.length > 0 ? 'bg-rose-50' : ''}>
                                                <td className="px-3 py-2">{row.last_name}</td>
                                                <td className="px-3 py-2">{row.first_name}</td>
                                                {userType === 'student' ? <td className="px-3 py-2">{row.program ?? '-'}</td> : null}
                                                {userType !== 'student' ? <td className="px-3 py-2">{row.email}</td> : null}
                                                {userType !== 'student' ? <td className="px-3 py-2 capitalize">{(row.roles ?? []).join(', ').replaceAll('_', ' ')}</td> : null}
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
                                                            disabled={processing}
                                                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                        />
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {Object.keys(errors).length > 0 ? (
                                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                                    Import failed. Please fix row issues and try again.
                                </div>
                            ) : null}

                            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowReviewModal(false)}
                                    disabled={processing}
                                    className="rounded-lg border-2 border-slate-300 px-5 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={importRows}
                                    disabled={processing || selectedRowsCount === 0}
                                    className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing ? 'Importing...' : `Approve and Import (${selectedRowsCount})`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>,
        document.body,
    );
};

export default BulkUploadModal;
