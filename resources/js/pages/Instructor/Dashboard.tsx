import React, { useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Chart, registerables } from 'chart.js';
import InstructorLayout from '@/Layouts/InstructorLayout';

// Register Chart.js components
Chart.register(...registerables);

interface Group {
    name: string;
    members: { initials: string; color: string }[];
    adviser: string;
    status: 'approved' | 'pending' | 'review' | 'redefense' | 'completed';
    progress: number;
}

interface Deadline {
    title: string;
    description: string;
    date: string;
    daysLeft: number;
    type: 'warning' | 'info';
}

interface Activity {
    user: string;
    action: string;
    target: string;
    time: string;
    category: 'assignment' | 'submission' | 'payment' | 'scheduling' | 'override';
}

export default function Dashboard() {
    const adviserChartRef = useRef<HTMLCanvasElement>(null);
    const statusChartRef = useRef<HTMLCanvasElement>(null);
    const prefChartRef = useRef<HTMLCanvasElement>(null);
    const adviserChartInstance = useRef<Chart | null>(null);
    const statusChartInstance = useRef<Chart | null>(null);
    const prefChartInstance = useRef<Chart | null>(null);

    // Sample data
    const groups: Group[] = [
        {
            name: 'Alpha',
            members: [
                { initials: 'JD', color: 'bg-blue-500' },
                { initials: 'MS', color: 'bg-green-500' },
                { initials: 'AR', color: 'bg-purple-500' },
                { initials: '+2', color: 'bg-slate-300' },
            ],
            adviser: 'Prof. Cruz',
            status: 'approved',
            progress: 75,
        },
        {
            name: 'Beta',
            members: [
                { initials: 'RC', color: 'bg-amber-500' },
                { initials: 'MT', color: 'bg-indigo-500' },
                { initials: 'LJ', color: 'bg-pink-500' },
            ],
            adviser: 'Unassigned',
            status: 'pending',
            progress: 30,
        },
    ];

    const deadlines: Deadline[] = [
        {
            title: 'Proposal Submission',
            description: 'Phase 1 Documentation',
            date: 'March 10, 2026',
            daysLeft: 3,
            type: 'warning',
        },
        {
            title: 'Final Documentation',
            description: 'Capstone 2 Completion',
            date: 'April 15, 2026',
            daysLeft: 60,
            type: 'info',
        },
    ];

    const activities: Activity[] = [
        {
            user: 'Prof. Santos',
            action: 'assigned as adviser to',
            target: 'Group Alpha',
            time: '5 minutes ago',
            category: 'assignment',
        },
        {
            user: 'Group Beta',
            action: 'submitted',
            target: 'concept paper',
            time: '1 hour ago',
            category: 'submission',
        },
        {
            user: 'Payment verified',
            action: 'for',
            target: 'Group Delta',
            time: '3 hours ago',
            category: 'payment',
        },
        {
            user: 'Defense schedule',
            action: 'created for',
            target: 'Group Gamma',
            time: '5 hours ago',
            category: 'scheduling',
        },
        {
            user: 'Deadline extended',
            action: 'for',
            target: 'proposal submission',
            time: '1 day ago',
            category: 'override',
        },
    ];

    const getStatusBadgeClass = (status: Group['status']) => {
        const classes = {
            approved: 'bg-green-100 text-green-700',
            pending: 'bg-amber-100 text-amber-700',
            review: 'bg-blue-100 text-blue-700',
            redefense: 'bg-red-100 text-red-700',
            completed: 'bg-sky-100 text-sky-700',
        };
        return classes[status];
    };

    const getStatusIcon = (status: Group['status']) => {
        switch (status) {
            case 'approved':
            case 'completed':
                return 'fa-check-circle';
            case 'pending':
                return 'fa-clock';
            case 'review':
                return 'fa-eye';
            case 'redefense':
                return 'fa-exclamation-triangle';
        }
    };

    const getActivityBadgeClass = (category: Activity['category']) => {
        const classes = {
            assignment: 'bg-green-100 text-green-700',
            submission: 'bg-blue-100 text-blue-700',
            payment: 'bg-amber-100 text-amber-700',
            scheduling: 'bg-purple-100 text-purple-700',
            override: 'bg-red-100 text-red-700',
        };
        return classes[category];
    };

    const getActivityBadgeText = (category: Activity['category']) => {
        const texts = {
            assignment: 'Assignment',
            submission: 'Submission',
            payment: 'Payment',
            scheduling: 'Scheduling',
            override: 'Override',
        };
        return texts[category];
    };

    // Initialize charts
    useEffect(() => {
        if (adviserChartRef.current) {
            if (adviserChartInstance.current) {
                adviserChartInstance.current.destroy();
            }
            adviserChartInstance.current = new Chart(adviserChartRef.current, {
                type: 'bar',
                data: {
                    labels: ['Prof. Cruz', 'Prof. Reyes', 'Prof. Santos', 'Prof. Villanueva', 'Prof. Lim'],
                    datasets: [{
                        label: 'Groups Assigned',
                        data: [3, 4, 5, 2, 3],
                        backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'],
                        borderRadius: 6,
                        barPercentage: 0.6,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { backgroundColor: '#1e293b' }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { display: false },
                            border: { display: false },
                            ticks: { stepSize: 1, color: '#64748b' }
                        },
                        x: {
                            grid: { display: false },
                            border: { display: false },
                            ticks: { maxRotation: 45, minRotation: 45, color: '#64748b' }
                        }
                    }
                }
            });
        }

        if (statusChartRef.current) {
            if (statusChartInstance.current) {
                statusChartInstance.current.destroy();
            }
            statusChartInstance.current = new Chart(statusChartRef.current, {
                type: 'doughnut',
                data: {
                    labels: ['Assigned', 'Not Assigned', 'Locked', 'Completed'],
                    datasets: [{
                        data: [5, 3, 2, 5],
                        backgroundColor: ['#10b981', '#f59e0b', '#a855f7', '#3b82f6'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { boxWidth: 12, padding: 15, color: '#334155' }
                        },
                        tooltip: { backgroundColor: '#1e293b' }
                    }
                }
            });
        }

        if (prefChartRef.current) {
            if (prefChartInstance.current) {
                prefChartInstance.current.destroy();
            }
            prefChartInstance.current = new Chart(prefChartRef.current, {
                type: 'pie',
                data: {
                    labels: ['AI/ML', 'Web Development', 'Mobile Apps', 'Data Science', 'IoT'],
                    datasets: [{
                        data: [30, 25, 20, 15, 10],
                        backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { boxWidth: 12, padding: 15, color: '#334155' }
                        },
                        tooltip: { backgroundColor: '#1e293b' }
                    }
                }
            });
        }

        return () => {
            if (adviserChartInstance.current) adviserChartInstance.current.destroy();
            if (statusChartInstance.current) statusChartInstance.current.destroy();
            if (prefChartInstance.current) prefChartInstance.current.destroy();
        };
    }, []);

    const showNotification = (message: string) => {
        // You can implement a toast notification here
        console.log(message);
    };

    return (
        <InstructorLayout>
            <Head title="Instructor Dashboard" />

            {/* TOP BAR - Already in Layout */}

            {/* DASHBOARD CONTENT */}
            <div className="p-8 space-y-8">
                {/* QUICK STATS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Total Groups</p>
                                <p className="text-3xl font-bold text-slate-800">15</p>
                                <p className="text-xs text-green-600 mt-2">
                                    <i className="fas fa-arrow-up mr-1"></i> +2 this week
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <i className="fas fa-users text-2xl text-blue-600"></i>
                            </div>
                        </div>
                        <div className="progress-bar mt-4">
                            <div className="progress-fill bg-blue-600" style={{ width: '75%' }}></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Approved Concepts</p>
                                <p className="text-3xl font-bold text-green-600">12</p>
                                <p className="text-xs text-green-600 mt-2">
                                    <i className="fas fa-check-circle mr-1"></i> 80% completion
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <i className="fas fa-check-circle text-2xl text-green-600"></i>
                            </div>
                        </div>
                        <div className="progress-bar mt-4">
                            <div className="progress-fill bg-green-600" style={{ width: '80%' }}></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Pending Reviews</p>
                                <p className="text-3xl font-bold text-amber-600">3</p>
                                <p className="text-xs text-amber-600 mt-2">
                                    <i className="fas fa-clock mr-1"></i> Requires attention
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                <i className="fas fa-clock text-2xl text-amber-600"></i>
                            </div>
                        </div>
                        <div className="progress-bar mt-4">
                            <div className="progress-fill bg-amber-600" style={{ width: '30%' }}></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">For Re-defense</p>
                                <p className="text-3xl font-bold text-red-600">2</p>
                                <p className="text-xs text-red-600 mt-2">
                                    <i className="fas fa-exclamation-triangle mr-1"></i> Action required
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <i className="fas fa-exclamation-triangle text-2xl text-red-600"></i>
                            </div>
                        </div>
                        <div className="progress-bar mt-4">
                            <div className="progress-fill bg-red-600" style={{ width: '15%' }}></div>
                        </div>
                    </div>
                </div>

                {/* TABS for different views */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 px-6">
                        <div className="flex gap-8">
                            <button className="tab-active py-4 px-2 text-sm font-medium transition border-b-2 border-blue-600 text-blue-600">
                                Overview
                            </button>
                            <Link href="/instructor/groups" className="py-4 px-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition">
                                Groups
                            </Link>
                            <Link href="/instructor/schedules" className="py-4 px-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition">
                                Schedules
                            </Link>
                            <Link href="/instructor/payments" className="py-4 px-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition">
                                Payments
                            </Link>
                            <Link href="/instructor/analytics" className="py-4 px-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition">
                                Analytics
                            </Link>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* VISUALIZATIONS */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Adviser Load Chart */}
                            <div className="h-80 bg-slate-50 rounded-xl p-5 flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                        <i className="fas fa-chart-bar text-blue-500"></i> Adviser Load
                                    </h3>
                                    <span className="text-xs text-slate-500">Current AY</span>
                                </div>
                                <div className="flex-1 min-h-0 relative">
                                    <canvas ref={adviserChartRef} className="w-full h-full"></canvas>
                                </div>
                            </div>

                            {/* Group Status Chart */}
                            <div className="h-80 bg-slate-50 rounded-xl p-5 flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                        <i className="fas fa-pie-chart text-green-500"></i> Group Status
                                    </h3>
                                    <span className="text-xs text-slate-500">Distribution</span>
                                </div>
                                <div className="flex-1 min-h-0 relative">
                                    <canvas ref={statusChartRef} className="w-full h-full"></canvas>
                                </div>
                            </div>

                            {/* Project Preferences */}
                            <div className="h-80 bg-slate-50 rounded-xl p-5 flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                        <i className="fas fa-chart-pie text-purple-500"></i> Project Preferences
                                    </h3>
                                    <span className="text-xs text-slate-500">Student choice</span>
                                </div>
                                <div className="flex-1 min-h-0 relative">
                                    <canvas ref={prefChartRef} className="w-full h-full"></canvas>
                                </div>
                            </div>
                        </div>

                        {/* GROUP MANAGEMENT OVERVIEW */}
                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-800">Active Groups</h2>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center gap-2">
                                        <i className="fas fa-download text-slate-500"></i> Export
                                    </button>
                                    <Link
                                        href="/instructor/groups"
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/20 flex items-center gap-2"
                                    >
                                        <i className="fas fa-arrow-right"></i> Full Management
                                    </Link>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-100">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr className="text-slate-500">
                                            <th className="text-left py-4 px-6">Group</th>
                                            <th className="text-left py-4 px-6">Members</th>
                                            <th className="text-left py-4 px-6">Adviser</th>
                                            <th className="text-left py-4 px-6">Status</th>
                                            <th className="text-left py-4 px-6">Progress</th>
                                            <th className="text-left py-4 px-6">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {groups.map((group) => (
                                            <tr key={group.name} className="hover:bg-slate-50 transition">
                                                <td className="py-4 px-6 font-medium">{group.name}</td>
                                                <td className="py-4 px-6">
                                                    <div className="flex -space-x-2">
                                                        {group.members.map((member, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-white text-xs border-2 border-white`}
                                                            >
                                                                {member.initials}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className={`py-4 px-6 ${group.adviser === 'Unassigned' ? 'text-amber-600' : ''}`}>
                                                    {group.adviser}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`status-badge ${getStatusBadgeClass(group.status)} px-3 py-1 rounded-full text-xs inline-flex items-center gap-1`}>
                                                        <i className={`fas fa-${getStatusIcon(group.status)}`}></i>
                                                        {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="progress-bar w-20 bg-slate-200 rounded-full h-2">
                                                            <div
                                                                className={`progress-fill h-2 rounded-full ${
                                                                    group.status === 'approved' ? 'bg-green-600' :
                                                                    group.status === 'pending' ? 'bg-amber-600' :
                                                                    'bg-blue-600'
                                                                }`}
                                                                style={{ width: `${group.progress}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs text-slate-600">{group.progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex gap-2">
                                                        <button className="w-8 h-8 rounded-lg hover:bg-blue-100 text-blue-600 transition">
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button className="w-8 h-8 rounded-lg hover:bg-red-100 text-red-600 transition">
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                        <Link
                                                            href={`/instructor/groups/${group.name.toLowerCase()}`}
                                                            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-600 transition inline-flex items-center justify-center"
                                                        >
                                                            <i className="fas fa-ellipsis-v"></i>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CAPSTONE DEADLINES & PAYMENT VERIFICATION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Deadlines Card */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <i className="fas fa-calendar-check text-green-500"></i> Upcoming Deadlines
                            </h2>
                            <Link href="/instructor/deadlines" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                Manage
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {deadlines.map((deadline) => (
                                <div
                                    key={deadline.title}
                                    className={`flex items-center justify-between p-4 rounded-xl border ${
                                        deadline.type === 'warning'
                                            ? 'bg-amber-50 border-amber-100'
                                            : 'bg-blue-50 border-blue-100'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            deadline.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                                        }`}>
                                            <i className={`fas fa-${
                                                deadline.type === 'warning' ? 'file-alt' : 'book'
                                            } text-${
                                                deadline.type === 'warning' ? 'amber' : 'blue'
                                            }-600`}></i>
                                        </div>
                                        <div>
                                            <p className="font-medium">{deadline.title}</p>
                                            <p className="text-xs text-slate-500">{deadline.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold text-${
                                            deadline.type === 'warning' ? 'amber' : 'blue'
                                        }-600`}>{deadline.date}</p>
                                        <p className="text-xs text-slate-500">in {deadline.daysLeft} days</p>
                                    </div>
                                </div>
                            ))}

                            <Link
                                href="/instructor/deadlines/create"
                                className="w-full py-3 border border-dashed border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-plus"></i> Add New Deadline
                            </Link>
                        </div>
                    </div>

                    {/* Payment & Deployment Card */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <i className="fas fa-credit-card text-purple-500"></i> Financial & Deployment Status
                        </h2>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <Link
                                href="/instructor/payments"
                                className="p-4 bg-purple-50 rounded-xl border border-purple-100 hover:shadow-md transition"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <i className="fas fa-credit-card text-purple-600"></i>
                                    </div>
                                    <span className="font-medium">Payments</span>
                                </div>
                                <p className="text-2xl font-bold text-purple-600">12/15</p>
                                <p className="text-xs text-slate-500">3 pending verification</p>
                            </Link>

                            <Link
                                href="/instructor/deployments"
                                className="p-4 bg-orange-50 rounded-xl border border-orange-100 hover:shadow-md transition"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <i className="fas fa-rocket text-orange-600"></i>
                                    </div>
                                    <span className="font-medium">Deployed</span>
                                </div>
                                <p className="text-2xl font-bold text-orange-600">8/15</p>
                                <p className="text-xs text-slate-500">7 in progress</p>
                            </Link>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-circle text-[8px] text-green-500"></i>
                                    <span className="text-sm">Group Alpha - Payment verified</span>
                                </div>
                                <span className="text-xs text-slate-500">2 days ago</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-circle text-[8px] text-amber-500"></i>
                                    <span className="text-sm">Group Beta - Awaiting payment</span>
                                </div>
                                <span className="text-xs text-slate-500">Pending</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-circle text-[8px] text-blue-500"></i>
                                    <span className="text-sm">Group Gamma - Deployment verified</span>
                                </div>
                                <span className="text-xs text-slate-500">Completed</span>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <Link
                                href="/instructor/payments"
                                className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl hover:bg-purple-700 transition text-sm text-center"
                            >
                                Verify Payments
                            </Link>
                            <Link
                                href="/instructor/deployments"
                                className="flex-1 bg-orange-600 text-white py-2.5 rounded-xl hover:bg-orange-700 transition text-sm text-center"
                            >
                                Check Deployments
                            </Link>
                        </div>
                    </div>
                </div>

                {/* RECENT ACTIVITY LOG */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <i className="fas fa-history text-slate-500"></i> Recent System Activity
                        </h2>
                        <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {activities.map((activity, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition">
                                <div className={`w-2 h-2 rounded-full ${
                                    activity.category === 'assignment' ? 'bg-green-500' :
                                    activity.category === 'submission' ? 'bg-blue-500' :
                                    activity.category === 'payment' ? 'bg-amber-500' :
                                    activity.category === 'scheduling' ? 'bg-purple-500' :
                                    'bg-red-500'
                                }`}></div>
                                <div className="flex-1">
                                    <p className="text-sm">
                                        <span className="font-medium">{activity.user}</span>{' '}
                                        {activity.action}{' '}
                                        <span className="font-medium">{activity.target}</span>
                                    </p>
                                    <p className="text-xs text-slate-500">{activity.time}</p>
                                </div>
                                <span className={`text-xs ${getActivityBadgeClass(activity.category)} px-2 py-1 rounded-full`}>
                                    {getActivityBadgeText(activity.category)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .progress-bar {
                    height: 0.5rem;
                    border-radius: 9999px;
                    background: #e2e8f0;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    border-radius: 9999px;
                    transition: width 0.3s ease;
                }
            `}</style>
        </InstructorLayout>
    );
}