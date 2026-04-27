import { CalendarClock, FilePlus, Filter, Pencil, Trash2 } from 'lucide-react';

type RequirementRecord = {
    id: number;
    requirement_type: string;
    due_date: string | null;
    academic_year_id: number | null;
    academic_year_label?: string | null;
};

type DeadlineRow = {
    id: string;
    requirementType: string;
    academicYear: string;
    dueDate: string | null;
    submitted: number;
    total: number;
    status: 'Due Soon' | 'On Track';
    record: RequirementRecord;
};

type DeadlinesTabProps = {
    requirementsStatus: 'All' | 'Due Soon' | 'On Track';
    rows: DeadlineRow[];
    pagedRows: DeadlineRow[];
    pageStart: number;
    perPage: number;
    page: number;
    totalPages: number;
    onStatusChange: (value: 'All' | 'Due Soon' | 'On Track') => void;
    onAddRequirement: () => void;
    onEditRequirement: (record: RequirementRecord) => void;
    onDeleteRequirement: (record: RequirementRecord) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    formatDateLabel: (value?: string | null) => string;
    statusBadge: (status: DeadlineRow['status']) => string;
    headingTitle?: string;
    headingDescription?: string;
};

const DeadlinesTab = ({
    requirementsStatus,
    rows,
    pagedRows,
    pageStart,
    perPage,
    page,
    totalPages,
    onStatusChange,
    onAddRequirement,
    onEditRequirement,
    onDeleteRequirement,
    onPrevPage,
    onNextPage,
    formatDateLabel,
    statusBadge,
    headingTitle,
    headingDescription,
}: DeadlinesTabProps) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-emerald-600" />
                            <h3 className="text-sm font-semibold text-slate-900">{headingTitle ?? 'Outline Requirements Manager'}</h3>
                        </div>
                        <p className="text-xs text-slate-500">{headingDescription ?? 'Manage submission requirements for Phase 2 groups'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Filter className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={requirementsStatus}
                                onChange={(event) => onStatusChange(event.target.value as 'All' | 'Due Soon' | 'On Track')}
                                aria-label="Filter status"
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Due Soon">Due Soon</option>
                                <option value="On Track">On Track</option>
                            </select>
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onAddRequirement}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
                >
                    <FilePlus className="h-4 w-4" />
                    Add Requirement
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                        <tr>
                            <th className="px-6 py-3 text-left">Requirement Type</th>
                            <th className="px-6 py-3 text-left">Academic Year</th>
                            <th className="px-6 py-3 text-left">Due Date</th>
                            <th className="px-6 py-3 text-left">Groups Completed</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                                    No requirements found. Add a new requirement to get started.
                                </td>
                            </tr>
                        ) : (
                            pagedRows.map((row) => (
                                <tr key={row.id} className="text-slate-600 transition-colors hover:bg-emerald-50/40">
                                    <td className="px-6 py-3 font-semibold text-slate-900">{row.requirementType}</td>
                                    <td className="px-6 py-3 text-xs text-slate-500">{row.academicYear}</td>
                                    <td className="px-6 py-3 font-semibold text-emerald-600">{formatDateLabel(row.dueDate)}</td>
                                    <td className="px-6 py-3">
                                        {row.total === 0 ? (
                                            <span className="text-xs text-slate-400">No groups yet</span>
                                        ) : row.submitted === 0 ? (
                                            <span className="text-xs text-slate-400">No submissions yet</span>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200">
                                                    <div
                                                        className="h-full rounded-full bg-emerald-500"
                                                        style={{
                                                            width: `${Math.round((row.submitted / row.total) * 100)}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                    {row.submitted}/{row.total}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold ${statusBadge(
                                                row.status,
                                            )}`}
                                        >
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => onEditRequirement(row.record)}
                                                className="flex h-8 w-8 items-center justify-center rounded-xl text-emerald-600 transition hover:bg-emerald-50"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteRequirement(row.record)}
                                                className="flex h-8 w-8 items-center justify-center rounded-xl text-amber-600 transition hover:bg-amber-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
                <span>
                    {rows.length === 0
                        ? 'No requirements to paginate'
                        : `Showing ${pageStart + 1}–${Math.min(pageStart + perPage, rows.length)} of ${rows.length}`}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onPrevPage}
                        disabled={page === 1}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-[11px] text-slate-500">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={onNextPage}
                        disabled={page === totalPages}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeadlinesTab;
