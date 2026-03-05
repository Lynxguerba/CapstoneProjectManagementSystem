import { Box, Typography } from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ClipboardList, Layers3, TriangleAlert, Users } from 'lucide-react';
import React, { useState } from 'react';
import Sidebar from '../../components/sidebar';

interface Member {
    fullName: string;
    program: string;
    set: string;
    year: string;
    role: string;
}

interface Group {
    name: string;
    members: string[];
    status: string;
    color: string;
}

interface Document {
    name: string;
    submitted: string;
    status: string;
    type: string;
}

interface Schedule {
    group: string;
    date: string;
    room: string;
    time: string;
}

type DashboardNotification = {
    id: string;
    title: string;
    message: string;
    date: string;
    tone: 'info' | 'success' | 'warning' | 'danger';
};

const Dashboard = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedProgram, setSelectedProgram] = useState('bsit');
    const [selectedPhase, setSelectedPhase] = useState('concept');
    const [isSignoutModalOpen, setIsSignoutModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [newGroupName, setNewGroupName] = useState('');
    const [members, setMembers] = useState<Member[]>([{ fullName: '', program: 'BSIT', set: '', year: '', role: 'Project Manager' }]);
    const [currentMemberPage, setCurrentMemberPage] = useState(0);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [defenseForm, setDefenseForm] = useState({
        group: '',
        date: '',
        room: '',
        time: '',
    });

    const groupsPerPage = 6;

    const stats = [
        { label: 'Total Groups', value: '28', style: 'from-slate-700 to-slate-900', icon: Users },
        { label: 'Pending Concepts', value: '9', style: 'from-amber-500 to-amber-600', icon: ClipboardList },
        { label: 'Scheduled Defenses', value: '6', style: 'from-indigo-500 to-indigo-600', icon: Layers3 },
        { label: 'Re-Defense Cases', value: '3', style: 'from-rose-500 to-rose-600', icon: TriangleAlert },
        { label: 'Approved Projects', value: '14', style: 'from-teal-500 to-teal-600', icon: CheckCircle2 },
    ];

    const upcomingDefenses: Schedule[] = [
        { group: 'Group 2', date: '2026-03-20', room: 'Room 101', time: '9:00 AM - 10:00 AM' },
        { group: 'Group 5', date: '2026-03-21', room: 'Room 102', time: '10:00 AM - 11:00 AM' },
        { group: 'Group 1', date: '2026-03-22', room: 'Room 101', time: '8:00 AM - 9:00 AM' },
    ];

    const dashboardNotifications: DashboardNotification[] = [
        { id: 'n1', title: 'Concept Submitted', message: 'Group 1 submitted a concept paper.', date: '2026-03-12', tone: 'info' },
        { id: 'n2', title: 'Deadline Approaching', message: 'Concept deadline is in 3 days.', date: '2026-03-22', tone: 'warning' },
        { id: 'n3', title: 'Payment Verified', message: 'Payment verified for Group 2.', date: '2026-03-12', tone: 'success' },
        { id: 'n4', title: 'Evaluation Submitted', message: 'Panel evaluation submitted for Group 2.', date: '2026-03-20', tone: 'info' },
    ];

    const approvalTrend = [52, 56, 60, 61, 64, 68, 70];
    const defenseStatus = [
        { label: 'Not Scheduled', value: 14, className: 'from-slate-500 to-slate-600', color: '#64748b' },
        { label: 'Scheduled', value: 6, className: 'from-indigo-500 to-indigo-600', color: '#6366f1' },
        { label: 'Completed', value: 8, className: 'from-teal-500 to-teal-600', color: '#14b8a6' },
        { label: 'Re-Defense', value: 3, className: 'from-rose-500 to-rose-600', color: '#f43f5e' },
    ];

    const toneStyles: Record<DashboardNotification['tone'], string> = {
        info: 'bg-indigo-50 border-indigo-200 text-indigo-700',
        success: 'bg-teal-50 border-teal-200 text-teal-700',
        warning: 'bg-amber-50 border-amber-200 text-amber-700',
        danger: 'bg-rose-50 border-rose-200 text-rose-700',
    };

    const groups: Group[] = [
        {
            name: 'Group 1',
            members: ['Juan – PM', 'Maria – Analyst', 'Carlo – Programmer', 'Ana – Documentarian'],
            status: 'Adviser Assigned',
            color: 'bg-teal-100 text-teal-600',
        },
        {
            name: 'Group 2',
            members: ['Mark – PM', 'Lea – Analyst', 'John – Programmer', 'Kate – Documentarian'],
            status: 'Adviser Not Assigned',
            color: 'bg-amber-100 text-amber-600',
        },
        {
            name: 'Group 3',
            members: ['Luis – PM', 'Ella – Analyst', 'Ryan – Programmer', 'Mia – Documentarian'],
            status: 'Adviser Assigned',
            color: 'bg-teal-100 text-teal-600',
        },
        {
            name: 'Group 4',
            members: ['Tom – PM', 'Amy – Analyst', 'Ken – Programmer', 'Lara – Documentarian'],
            status: 'Adviser Not Assigned',
            color: 'bg-amber-100 text-amber-600',
        },
        {
            name: 'Group 5',
            members: ['James – PM', 'Sofia – Analyst', 'Eric – Programmer', 'Nina – Documentarian'],
            status: 'Adviser Assigned',
            color: 'bg-teal-100 text-teal-600',
        },
        {
            name: 'Group 6',
            members: ['Alex – PM', 'Lily – Analyst', 'Sam – Programmer', 'Ivy – Documentarian'],
            status: 'Adviser Not Assigned',
            color: 'bg-amber-100 text-amber-600',
        },
        {
            name: 'Group 7',
            members: ['Chris – PM', 'Anna – Analyst', 'Leo – Programmer', 'Zoe – Documentarian'],
            status: 'Adviser Assigned',
            color: 'bg-teal-100 text-teal-600',
        },
        {
            name: 'Group 8',
            members: ['Ben – PM', 'Eva – Analyst', 'Nick – Programmer', 'Lana – Documentarian'],
            status: 'Adviser Not Assigned',
            color: 'bg-amber-100 text-amber-600',
        },
    ];

    const groupDocuments: Record<string, Document[]> = {
        'Group 1': [
            { name: 'Concept Paper', submitted: 'March 10, 2026', status: 'Pending', type: 'Proposal' },
            { name: 'System Design', submitted: 'March 12, 2026', status: 'Approved', type: 'Design' },
        ],
        'Group 2': [
            { name: 'Concept Paper', submitted: 'March 11, 2026', status: 'Pending', type: 'Proposal' },
            { name: 'System Design', submitted: 'March 15, 2026', status: 'Pending', type: 'Design' },
        ],
    };

    const filteredGroups = groups.filter((group) => {
        const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'assigned' && group.status === 'Adviser Assigned') ||
            (statusFilter === 'not-assigned' && group.status === 'Adviser Not Assigned');
        return matchesSearch && matchesStatus;
    });

    const paginatedGroups = filteredGroups.slice((currentPage - 1) * groupsPerPage, currentPage * groupsPerPage);

    const totalPages = Math.ceil(filteredGroups.length / groupsPerPage);

    const handleAddMember = () => {
        setMembers([...members, { fullName: '', program: 'BSIT', set: '', year: '', role: 'Project Manager' }]);
        setCurrentMemberPage(members.length);
    };

    const updateMember = (field: keyof Member, value: string) => {
        const updatedMembers = [...members];
        updatedMembers[currentMemberPage] = { ...updatedMembers[currentMemberPage], [field]: value };
        setMembers(updatedMembers);
    };

    const handleCreateGroup = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName || members.length === 0) {
            alert('Please fill in group name and add at least one member.');
            return;
        }
        console.log('Group Created:', { name: newGroupName, members });
        alert(`Group "${newGroupName}" created with ${members.length} member(s).`);
        setNewGroupName('');
        setMembers([{ fullName: '', program: 'BSIT', set: '', year: '', role: 'Project Manager' }]);
        setCurrentMemberPage(0);
        setIsCreateModalOpen(false);
    };

    const handleScheduleDefense = () => {
        const { group, date, room, time } = defenseForm;
        if (!group || !date || !room || !time) {
            alert('Please complete all fields.');
            return;
        }

        const conflict = schedules.find((s) => s.date === date && s.room === room && s.time === time);

        if (conflict) {
            alert('Schedule conflict! Room and time already booked.');
            return;
        }

        setSchedules([...schedules, { group, date, room, time }]);
        setDefenseForm({ group: '', date: '', room: '', time: '' });
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <Sidebar onModalOpen={setIsSignoutModalOpen} />

            <main className="ml-0 flex-1 md:ml-64">
                {/* Top Bar */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`sticky top-0 z-40 border-b border-slate-200 bg-white/80 px-4 py-5 shadow-sm backdrop-blur-lg md:px-8 md:py-6 ${isSignoutModalOpen ? 'blur-sm' : ''}`}
                >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text pl-12 text-xl font-bold text-slate-800 text-transparent md:pl-0 md:text-2xl">
                                Dashboard
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">Instructor Dashboard</p>
                        </div>
                    </div>
                </motion.div>

                {/* Content */}
                <div className="space-y-8 p-4 md:p-8">
                    {/* Statistics Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5"
                    >
                        {stats.map((s, idx) => (
                            <motion.div
                                key={s.label}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.08 * idx }}
                                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                            >
                                <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{s.label}</div>
                                <div className="mt-3 flex items-end justify-between">
                                    <div className="text-3xl font-bold text-slate-900">{s.value}</div>
                                    <div
                                        className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${s.style} flex items-center justify-center opacity-95 shadow-sm`}
                                    >
                                        <s.icon size={18} className="text-white" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Adviser Load Cards */}
                    <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, delay: 0 } }}
                            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                        >
                            <h3 className="text-lg font-semibold text-slate-800">Prof. Cruz</h3>
                            <p className="mb-4 text-sm text-slate-500">Adviser Load</p>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '60%' }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className="h-3 rounded-full bg-gradient-to-r from-teal-400 to-teal-600"
                                />
                            </div>
                            <p className="mt-3 text-xs font-medium text-slate-600">3 / 5 groups</p>
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, delay: 0.1 } }}
                            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                        >
                            <h3 className="text-lg font-semibold text-slate-800">Prof. Reyes</h3>
                            <p className="mb-4 text-sm text-slate-500">Adviser Load</p>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '80%' }}
                                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                                    className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                                />
                            </div>
                            <p className="mt-3 text-xs font-medium text-slate-600">4 / 5 groups</p>
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, delay: 0.2 } }}
                            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                        >
                            <h3 className="text-lg font-semibold text-slate-800">Prof. Santos</h3>
                            <p className="mb-4 text-sm text-slate-500">Adviser Load</p>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                                    className="h-3 rounded-full bg-gradient-to-r from-rose-400 to-rose-600"
                                />
                            </div>
                            <p className="mt-3 text-xs font-semibold text-rose-600">5 / 5 groups (Full)</p>
                        </motion.div>
                    </motion.div>

                    {/* Charts + Notifications */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="grid grid-cols-1 gap-6 xl:grid-cols-3"
                    >
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:col-span-2">
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800">Approval Rate</h3>
                                        <p className="mt-1 text-sm text-slate-500">Dummy trend (weekly)</p>
                                    </div>
                                    <div className="text-sm font-semibold text-slate-700">{approvalTrend[approvalTrend.length - 1]}%</div>
                                </div>

                                <div className="mt-6 flex h-36 items-end gap-2">
                                    {approvalTrend.map((v, i) => (
                                        <div key={i} className="flex-1">
                                            <div className="flex h-28 w-full items-end overflow-hidden rounded-xl bg-slate-100">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${v}%` }}
                                                    transition={{ duration: 0.7, delay: 0.05 * i }}
                                                    className="bg-gradient-to-t from-teal-500 to-indigo-500"
                                                    style={{ height: `${v}%` }}
                                                />
                                            </div>
                                            <div className="mt-2 text-center text-[10px] text-slate-500">W{i + 1}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">Defense Status</h3>
                                    <p className="mt-1 text-sm text-slate-500">Distribution snapshot</p>
                                </div>

                                <div className="mt-6">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex flex-1 justify-center">
                                            <PieChart
                                                height={260}
                                                series={[
                                                    {
                                                        data: [...defenseStatus],
                                                        innerRadius: 60,
                                                        outerRadius: 100,
                                                        paddingAngle: 3,
                                                        cornerRadius: 6,
                                                        highlightScope: { faded: 'global', highlighted: 'item' },
                                                        faded: { innerRadius: 60, additionalRadius: -4, color: 'gray' },
                                                    },
                                                ]}
                                                slotProps={{ legend: { hidden: true } }}
                                            />
                                        </div>

                                        <div className="lg:w-40">
                                            <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Legend</div>
                                            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-1">
                                                {defenseStatus.map((item) => (
                                                    <div key={item.label} className="flex items-center gap-2 text-sm text-slate-700">
                                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                        <span className="truncate font-medium">{item.label}</span>
                                                        <span className="ml-auto text-slate-500 tabular-nums">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">Notifications</h3>
                                    <p className="mt-1 text-sm text-slate-500">Latest events</p>
                                </div>
                                <button
                                    onClick={() => alert('UI only: open notifications center')}
                                    className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                                >
                                    View all
                                </button>
                            </div>

                            <div className="mt-6 space-y-3">
                                {dashboardNotifications.map((n) => (
                                    <div key={n.id} className={`rounded-2xl border p-4 ${toneStyles[n.tone]} bg-white`}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="text-sm font-semibold">{n.title}</div>
                                            <div className="text-xs opacity-80">{n.date}</div>
                                        </div>
                                        <div className="mt-1 text-sm text-slate-600">{n.message}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Upcoming Defenses + Deadlines Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="grid grid-cols-1 gap-6 xl:grid-cols-3"
                    >
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm xl:col-span-2">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Upcoming Defenses</h2>
                                    <p className="mt-1 text-sm text-slate-500">Quick view of scheduled defenses</p>
                                </div>
                                <button
                                    onClick={() => alert('UI only: open scheduling page')}
                                    className="rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 px-5 py-2.5 font-medium text-white transition-all hover:shadow-lg"
                                >
                                    Go to Scheduling
                                </button>
                            </div>

                            <div className="mt-6 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-600">
                                            <th className="py-4 text-left font-semibold">Group</th>
                                            <th className="py-4 text-left font-semibold">Date</th>
                                            <th className="py-4 text-left font-semibold">Time</th>
                                            <th className="py-4 text-left font-semibold">Room</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {upcomingDefenses.map((d, i) => (
                                            <tr key={`${d.group}-${i}`} className="transition-colors hover:bg-slate-50">
                                                <td className="py-4 font-medium text-slate-800">{d.group}</td>
                                                <td className="py-4 text-slate-600">{d.date}</td>
                                                <td className="py-4 text-slate-600">{d.time}</td>
                                                <td className="py-4 text-slate-600">{d.room}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Upcoming Deadlines</h2>
                                    <p className="mt-1 text-sm text-slate-500">At-a-glance tracking</p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                {[
                                    { phase: 'Concept', date: '2026-03-25', tone: 'bg-amber-100 text-amber-700' },
                                    { phase: 'Proposal', date: '2026-04-10', tone: 'bg-teal-100 text-teal-700' },
                                    { phase: 'Final Manuscript', date: '2026-04-15', tone: 'bg-teal-100 text-teal-700' },
                                ].map((x) => (
                                    <div key={x.phase} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-semibold text-slate-800">{x.phase}</div>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${x.tone}`}>{x.date}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => alert('UI only: open deadline management')}
                                className="mt-6 w-full rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-800 transition-all hover:bg-slate-50"
                            >
                                Manage Deadlines
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Create Group Modal */}
                <AnimatePresence>
                    {isCreateModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ type: 'spring', damping: 25 }}
                                onClick={(e) => e.stopPropagation()}
                                className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl"
                            >
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-slate-800">Create New Group</h2>
                                    <button
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="text-2xl font-bold text-slate-400 transition-colors hover:text-slate-600"
                                    >
                                        ×
                                    </button>
                                </div>

                                <form onSubmit={handleCreateGroup} className="space-y-6">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">Group Name</label>
                                        <input
                                            type="text"
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            placeholder="Enter group name"
                                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="border-t border-slate-200 pt-6">
                                        <h3 className="mb-4 text-lg font-bold text-slate-800">
                                            Member {currentMemberPage + 1} of {members.length}
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={members[currentMemberPage]?.fullName || ''}
                                                    onChange={(e) => updateMember('fullName', e.target.value)}
                                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Program</label>
                                                    <select
                                                        value={members[currentMemberPage]?.program || 'BSIT'}
                                                        onChange={(e) => updateMember('program', e.target.value)}
                                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="BSIT">BS Information Technology</option>
                                                        <option value="BSIS">BS Information Systems</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Set</label>
                                                    <input
                                                        type="text"
                                                        value={members[currentMemberPage]?.set || ''}
                                                        onChange={(e) => updateMember('set', e.target.value)}
                                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Year</label>
                                                    <input
                                                        type="text"
                                                        value={members[currentMemberPage]?.year || ''}
                                                        onChange={(e) => updateMember('year', e.target.value)}
                                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Role</label>
                                                    <select
                                                        value={members[currentMemberPage]?.role || 'Project Manager'}
                                                        onChange={(e) => updateMember('role', e.target.value)}
                                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option>Project Manager</option>
                                                        <option>System Analyst</option>
                                                        <option>Programmer</option>
                                                        <option>Documentarian</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-between">
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setCurrentMemberPage(Math.max(0, currentMemberPage - 1))}
                                                disabled={currentMemberPage === 0}
                                                className="rounded-xl bg-slate-200 px-5 py-2.5 font-medium text-slate-800 transition-all hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Prev
                                            </motion.button>
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setCurrentMemberPage(Math.min(members.length - 1, currentMemberPage + 1))}
                                                disabled={currentMemberPage === members.length - 1}
                                                className="rounded-xl bg-slate-200 px-5 py-2.5 font-medium text-slate-800 transition-all hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Next
                                            </motion.button>
                                        </div>

                                        <div className="mt-4 flex justify-center">
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleAddMember}
                                                className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 font-medium text-white shadow-md transition-all hover:from-amber-600 hover:to-amber-700"
                                            >
                                                + Add Member
                                            </motion.button>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                                        <motion.button
                                            type="button"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setIsCreateModalOpen(false)}
                                            className="rounded-xl bg-slate-200 px-6 py-3 font-medium text-slate-800 transition-all hover:bg-slate-300"
                                        >
                                            Cancel
                                        </motion.button>
                                        <motion.button
                                            type="submit"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 font-medium text-white shadow-md transition-all hover:from-amber-600 hover:to-amber-700"
                                        >
                                            Create Group
                                        </motion.button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Group Details Modal */}
                <AnimatePresence>
                    {isGroupModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                            onClick={() => setIsGroupModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ type: 'spring', damping: 25 }}
                                onClick={(e) => e.stopPropagation()}
                                className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl"
                            >
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-slate-800">{selectedGroup} - Documents</h2>
                                    <button
                                        onClick={() => setIsGroupModalOpen(false)}
                                        className="text-2xl font-bold text-slate-400 transition-colors hover:text-slate-600"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {(groupDocuments[selectedGroup] || []).map((doc, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6"
                                        >
                                            <h3 className="mb-2 text-lg font-bold text-slate-800">{doc.name}</h3>
                                            <div className="mb-4 grid grid-cols-2 gap-4 text-sm text-slate-600">
                                                <p>
                                                    <span className="font-medium">Submitted:</span> {doc.submitted}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Type:</span> {doc.type}
                                                </p>
                                                <p className="col-span-2">
                                                    <span className="font-medium">Status: </span>
                                                    <span
                                                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                                            doc.status === 'Approved' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
                                                        }`}
                                                    >
                                                        {doc.status}
                                                    </span>
                                                </p>
                                            </div>
                                            <textarea
                                                placeholder="Add your comment..."
                                                className="mb-3 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                                rows={3}
                                            />
                                            <div className="flex gap-3">
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-md"
                                                >
                                                    Approve
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-md"
                                                >
                                                    Route to Panel
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Dashboard;
