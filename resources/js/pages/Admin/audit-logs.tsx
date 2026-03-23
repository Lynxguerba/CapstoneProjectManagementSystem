import { router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight, Filter, Search } from 'lucide-react';
import React from 'react';
import adminRoutes from '../../routes/admin';
import AdminLayout from './_layout';

type AuditSeverity = 'info' | 'warning' | 'critical';

type AuditLogItem = {
    id: number;
    actor: string;
    action: string;
    entity: string;
    timestamp: string;
    severity: AuditSeverity;
    description?: string | null;
};

type AuditLogFilters = {
    search?: string;
    severity?: AuditSeverity | 'all';
};

type PaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type AuditLogsProps = {
    logs?: AuditLogItem[];
    filters?: AuditLogFilters;
    pagination?: PaginationMeta;
};

const severityStyles: Record<AuditSeverity, string> = {
    info: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    critical: 'border-rose-200 bg-rose-50 text-rose-700',
};

const defaultPagination: PaginationMeta = {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
};

const localTimestampFormatter = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
});

const formatLocalTimestamp = (value: string): string => {
    if (value.trim() === '') {
        return '';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return value;
    }

    return localTimestampFormatter.format(parsedDate);
};

const AdminAuditLogs = ({ logs = [], filters, pagination = defaultPagination }: AuditLogsProps) => {
    const [query, setQuery] = React.useState(filters?.search ?? '');
    const [severity, setSeverity] = React.useState<AuditSeverity | 'all'>(filters?.severity ?? 'all');
    const isInitialRender = React.useRef(true);

    React.useEffect(() => {
        setQuery(filters?.search ?? '');
        setSeverity(filters?.severity ?? 'all');
    }, [filters?.search, filters?.severity]);

    const filterParams = React.useMemo((): Record<string, string> => {
        const params: Record<string, string> = {};

        const trimmedSearch = query.trim();
        if (trimmedSearch !== '') {
            params.search = trimmedSearch;
        }

        if (severity !== 'all') {
            params.severity = severity;
        }

        return params;
    }, [query, severity]);

    React.useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                adminRoutes.auditLogs.url(),
                {
                    ...filterParams,
                    page: '1',
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                    only: ['logs', 'filters', 'pagination'],
                },
            );
        }, 250);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [filterParams]);

    const totalPages = Math.max(1, pagination.last_page || 1);
    const currentPage = Math.min(Math.max(1, pagination.current_page || 1), totalPages);

    const pages = React.useMemo(() => {
        const maxVisiblePages = 3;
        const halfWindow = Math.floor(maxVisiblePages / 2);
        const startPage = Math.max(1, Math.min(currentPage - halfWindow, totalPages - (maxVisiblePages - 1)));
        const endPage = Math.min(totalPages, startPage + (maxVisiblePages - 1));

        return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
    }, [currentPage, totalPages]);

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages || page === currentPage) {
            return;
        }

        router.get(
            adminRoutes.auditLogs.url(),
            {
                ...filterParams,
                page: String(page),
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                only: ['logs', 'filters', 'pagination'],
            },
        );
    };

    const rangeStart = pagination.total > 0 ? (currentPage - 1) * pagination.per_page + 1 : 0;
    const rangeEnd = pagination.total > 0 ? Math.min(currentPage * pagination.per_page, pagination.total) : 0;

    return (
        <AdminLayout title="Audit Logs" subtitle="Track sensitive system activity and data integrity events">
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">System Activity Logs</h3>
                        <p className="text-xs text-slate-500">Filter logs by severity and search by actor, action, or entity.</p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative w-full sm:w-56">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search logs"
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                            />
                        </div>

                        <div className="relative w-full sm:w-40">
                            <Filter className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={severity}
                                onChange={(event) => setSeverity(event.target.value as AuditSeverity | 'all')}
                                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs capitalize shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                            >
                                <option value="all">All severity</option>
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                            <tr>
                                <th className="px-4 py-3">Timestamp (Local)</th>
                                <th className="px-4 py-3">Actor</th>
                                <th className="px-4 py-3">Action</th>
                                <th className="px-4 py-3">Entity</th>
                                <th className="px-4 py-3">Severity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map((log, index) => (
                                <tr
                                    key={log.id}
                                    className={`transition-colors hover:bg-green-50/30 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}
                                >
                                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatLocalTimestamp(log.timestamp)}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-800">{log.actor}</td>
                                    <td className="px-4 py-3 text-slate-700">{log.action}</td>
                                    <td className="px-4 py-3 text-slate-600">{log.entity}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityStyles[log.severity]}`}
                                        >
                                            {log.severity}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {logs.length === 0 ? (
                    <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-xs text-slate-500">
                        No audit logs found for the selected filters.
                    </div>
                ) : null}

                {pagination.total > 0 ? (
                    <div className="mt-4 flex flex-col items-center justify-between gap-3 md:flex-row">
                        <p className="text-xs font-medium text-slate-500">
                            Showing <span className="text-slate-900">{rangeStart}</span> to <span className="text-slate-900">{rangeEnd}</span> of{' '}
                            <span className="text-slate-900">{pagination.total}</span> logs
                        </p>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                            >
                                <ChevronRight size={14} className="rotate-180" />
                            </button>

                            <div className="flex items-center gap-1">
                                {pages.map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => goToPage(page)}
                                        className={`h-8 min-w-[32px] rounded-lg text-xs font-bold transition-all ${
                                            page === currentPage
                                                ? 'bg-green-700 text-white shadow-md shadow-green-700/20'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                ) : null}
            </motion.section>
        </AdminLayout>
    );
};

export default AdminAuditLogs;
