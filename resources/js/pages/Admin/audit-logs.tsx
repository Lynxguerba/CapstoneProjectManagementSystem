import React from 'react';
import { motion } from 'framer-motion';
import { Filter, Search } from 'lucide-react';
import AdminLayout from './_layout';

type AuditSeverity = 'info' | 'warning' | 'critical';

type AuditLogItem = {
    id: string;
    actor: string;
    action: string;
    entity: string;
    timestamp: string;
    severity: AuditSeverity;
};

type AuditLogsProps = {
    logs?: AuditLogItem[];
};

const severityStyles: Record<AuditSeverity, string> = {
    info: 'border-sky-200 bg-sky-50 text-sky-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    critical: 'border-rose-200 bg-rose-50 text-rose-700',
};

const AdminAuditLogs = ({ logs = [] }: AuditLogsProps) => {
    const [query, setQuery] = React.useState('');
    const [severity, setSeverity] = React.useState<AuditSeverity | 'all'>('all');

    const filteredLogs = React.useMemo(() => {
        const value = query.trim().toLowerCase();

        return logs.filter((log) => {
            const matchesQuery =
                !value ||
                log.actor.toLowerCase().includes(value) ||
                log.action.toLowerCase().includes(value) ||
                log.entity.toLowerCase().includes(value);

            const matchesSeverity = severity === 'all' || log.severity === severity;

            return matchesQuery && matchesSeverity;
        });
    }, [logs, query, severity]);

    return (
        <AdminLayout title="Audit Logs" subtitle="Track sensitive system activity and data integrity events">
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">System Activity Logs</h3>
                        <p className="text-sm text-slate-500">Filter logs by severity and search by actor, action, or entity.</p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative w-full sm:w-64">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search logs"
                                className="w-full rounded-xl border border-slate-300 py-2.5 pr-3 pl-9 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="relative w-full sm:w-44">
                            <Filter className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <select
                                value={severity}
                                onChange={(event) => setSeverity(event.target.value as AuditSeverity | 'all')}
                                className="w-full rounded-xl border border-slate-300 py-2.5 pr-3 pl-9 text-sm capitalize focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All severity</option>
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-left text-slate-600">
                                <th className="py-3 font-semibold">Timestamp</th>
                                <th className="py-3 font-semibold">Actor</th>
                                <th className="py-3 font-semibold">Action</th>
                                <th className="py-3 font-semibold">Entity</th>
                                <th className="py-3 font-semibold">Severity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="transition-colors hover:bg-slate-50">
                                    <td className="py-3 whitespace-nowrap text-slate-600">{log.timestamp}</td>
                                    <td className="py-3 font-medium text-slate-800">{log.actor}</td>
                                    <td className="py-3 text-slate-700">{log.action}</td>
                                    <td className="py-3 text-slate-600">{log.entity}</td>
                                    <td className="py-3">
                                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${severityStyles[log.severity]}`}>
                                            {log.severity}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredLogs.length === 0 ? (
                        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                            No logs available. Pass `logs` from the backend Inertia response.
                        </div>
                    ) : null}
                </div>
            </motion.section>
        </AdminLayout>
    );
};

export default AdminAuditLogs;
