import { Box, Typography } from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    ClipboardList,
    Layers3,
    TriangleAlert,
    Users,
    Download,
    ArrowRight,
    Edit,
    Trash,
    MoreVertical,
    CalendarCheck,
    FileText,
    Book,
    Plus,
} from 'lucide-react';
import React, { useState } from 'react';
import InstructorLayout from './_layout';

const Dashboard = () => {
    // Quick Stats Data
    const stats = [
        {
            label: 'Total Groups',
            value: 15,
            change: '+2 this week',
            icon: Users,
            color: 'emerald',
            progress: 75,
        },
        {
            label: 'Approved Concepts',
            value: 12,
            change: '80% completion',
            icon: CheckCircle2,
            color: 'green',
            progress: 80,
        },
        {
            label: 'Pending Reviews',
            value: 3,
            change: 'Requires attention',
            icon: ClipboardList,
            color: 'amber',
            progress: 30,
        },
        {
            label: 'For Re-defense',
            value: 2,
            change: 'Action required',
            icon: TriangleAlert,
            color: 'red',
            progress: 15,
        },
    ];

    // Chart Data
    const adviserLoadData = [
        { adviser: 'Prof. Cruz', groups: 3 },
        { adviser: 'Prof. Reyes', groups: 4 },
        { adviser: 'Prof. Santos', groups: 5 },
        { adviser: 'Prof. Villanueva', groups: 2 },
        { adviser: 'Prof. Lim', groups: 3 },
    ];

    const groupStatusData = [
        { label: 'Assigned', value: 5, color: '#10b981' },
        { label: 'Not Assigned', value: 3, color: '#f59e0b' },
        { label: 'Locked', value: 2, color: '#a855f7' },
        { label: 'Completed', value: 5, color: '#3b82f6' },
    ];

    const projectPrefsData = [
        { label: 'AI/ML', value: 30, color: '#3b82f6' },
        { label: 'Web Development', value: 25, color: '#f59e0b' },
        { label: 'Mobile Apps', value: 20, color: '#10b981' },
        { label: 'Data Science', value: 15, color: '#ef4444' },
        { label: 'IoT', value: 10, color: '#8b5cf6' },
    ];

    // Groups Data
    const groups = [
        {
            name: 'Alpha',
            members: ['Doe, John', 'Smith, Jane', 'Reyes, Ana', '+2'],
            adviser: 'Prof. Cruz',
            status: 'Approved',
            progress: 75,
        },
        {
            name: 'Beta',
            members: ['Cruz, Ryan', 'Tan, Maria', 'Lopez, Jose'],
            adviser: 'Unassigned',
            status: 'Pending',
            progress: 30,
        },
        {
            name: 'Gamma',
            members: ['Garcia, Luis', 'Hernandez, Sofia', 'Martinez, Carlos'],
            adviser: 'Prof. Santos',
            status: 'Pending',
            progress: 20,
        },
        {
            name: 'Delta',
            members: ['Lee, David', 'Kim, Emily', 'Park, Alex'],
            adviser: 'Prof. Lim',
            status: 'Approved',
            progress: 90,
        },
        {
            name: 'Epsilon',
            members: ['Wilson, Michael', 'Brown, Olivia', 'Davis, Ethan'],
            adviser: 'Prof. Reyes',
            status: 'Pending',
            progress: 50,
        },
    ];

    // Deadlines Data
    const deadlines = [
        {
            phase: 'Proposal Submission',
            description: 'Phase 1 Documentation',
            date: 'March 10, 2026',
            timeLeft: 'in 3 days',
            icon: FileText,
            color: 'amber',
        },
        {
            phase: 'Final Documentation',
            description: 'Capstone 2 Completion',
            date: 'April 15, 2026',
            timeLeft: 'in 2 months',
            icon: Book,
            color: 'blue',
        },
    ];

    return (
        <>
            <InstructorLayout title="Dashboard" subtitle="Instructor Dashboard">
                <div className="space-y-8">
                    {/* QUICK STATS */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
                    >
                        {stats.map((stat, idx) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.08 * idx }}
                                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="mb-1 text-sm text-slate-500">{stat.label}</p>
                                        <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                                        <p className={`mt-2 text-xs text-${stat.color}-600`}>{stat.change}</p>
                                    </div>
                                    <div className={`h-12 w-12 bg-${stat.color}-100 flex items-center justify-center rounded-xl`}>
                                        <stat.icon className={`text-2xl text-${stat.color}-600`} />
                                    </div>
                                </div>
                                <div className="progress-bar mt-4">
                                    <div className={`progress-fill bg-${stat.color}-600`} style={{ width: `${stat.progress}%` }} />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                    >
                        <div className="border-b border-slate-100 px-6">
                            <div className="flex gap-8">
                                <h1 className="tab-active px-2 py-4 text-sm font-medium transition">Overview</h1>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* VISUALIZATIONS */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2"
                            >
                                {/* Adviser Load Chart */}
                                <div className="flex h-72 flex-col rounded-xl bg-slate-50 p-5">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                                            <Layers3 className="text-emerald-500" /> Adviser Load
                                        </h3>
                                        <span className="text-xs text-slate-500">Current AY</span>
                                    </div>
                                    <div className="flex-1">
                                        <Box>
                                            <BarChart
                                                height={280}
                                                xAxis={[{ data: adviserLoadData.map((d) => d.adviser), scaleType: 'band' }]}
                                                series={[{ data: adviserLoadData.map((d) => d.groups), color: '#10b981' }]}
                                                margin={{ top: 20, right: 20, bottom: 60, left: 40 }}
                                                grid={{ vertical: true, horizontal: true }}
                                                skipAnimation={false}
                                            />
                                        </Box>
                                    </div>
                                </div>

                                {/* Group Status Chart */}
                                <div className="flex min-h-[400px] flex-col rounded-xl border border-slate-100 bg-slate-50 p-5 transition-all">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                                            <CheckCircle2 className="h-5 w-5 text-green-500" /> Group Status
                                        </h3>
                                        <span className="text-xs text-slate-500">Distribution</span>
                                    </div>
                                    <div className="flex w-full flex-1 items-center justify-center">
                                        <PieChart
                                            series={[
                                                {
                                                    data: groupStatusData,
                                                    innerRadius: 50,
                                                    outerRadius: 85,
                                                    paddingAngle: 3,
                                                    cornerRadius: 6,
                                                    cx: '50%', // Centers the pie horizontally
                                                    highlightScope: { faded: 'global', highlighted: 'item' },
                                                    faded: { innerRadius: 45, additionalRadius: -6, color: 'gray' },
                                                },
                                            ]}
                                            height={280}
                                            slotProps={{
                                                legend: {
                                                    direction: 'row',
                                                    position: { vertical: 'bottom', horizontal: 'middle' },
                                                    padding: 0,
                                                    labelStyle: { fontSize: 12 },
                                                },
                                            }}
                                            margin={{ top: 0, bottom: 60, left: 0, right: 0 }}
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            {/* GROUP MANAGEMENT OVERVIEW */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <div className="grid gap-6 lg:grid-cols-2">
                                    {/* Project Preferences */}
                                    <div className="flex min-h-[400px] flex-col rounded-xl border border-slate-100 bg-slate-50 p-5 transition-all">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                                                <TriangleAlert className="h-5 w-5 text-purple-500" /> Project Preferences
                                            </h3>
                                            <span className="text-xs text-slate-500">Student choice</span>
                                        </div>

                                        <div className="flex w-full flex-1 items-center justify-center">
                                            <PieChart
                                                series={[
                                                    {
                                                        data: projectPrefsData,
                                                        innerRadius: 0, // Kept at 0 as per original (Full Pie)
                                                        outerRadius: 85,
                                                        paddingAngle: 2,
                                                        cornerRadius: 6,
                                                        cx: '50%', // Centers the pie horizontally
                                                        highlightScope: { faded: 'global', highlighted: 'item' },
                                                        faded: { innerRadius: 0, additionalRadius: -6, color: 'gray' },
                                                    },
                                                ]}
                                                height={280}
                                                skipAnimation={false} // Kept your animation settings
                                                slotProps={{
                                                    legend: {
                                                        direction: 'row',
                                                        position: { vertical: 'bottom', horizontal: 'middle' },
                                                        padding: 0,
                                                        labelStyle: { fontSize: 12 },
                                                    },
                                                }}
                                                margin={{ top: 0, bottom: 60, left: 0, right: 0 }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex min-h-[400px] flex-col rounded-xl border border-slate-100 p-5 transition-all">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                                                <Users className="h-5 w-5 text-blue-500" /> Active Groups
                                            </h3>
                                            <button className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-all hover:bg-blue-100 hover:shadow-sm active:scale-95">
                                                View
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-x-auto">
                                            <table className="w-full border border-slate-100 text-sm">
                                                <thead>
                                                    <tr className="bg-slate-100 text-slate-600">
                                                        <th className="px-4 py-3 text-left font-medium">Project Manager</th>
                                                        <th className="px-4 py-3 text-left font-medium">Members</th>
                                                        <th className="px-4 py-3 text-left font-medium">Adviser</th>
                                                        <th className="px-4 py-3 text-left font-medium">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {groups.map((group, idx) => (
                                                        <tr
                                                            key={idx}
                                                            className={`rounded-lg transition hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                                                        >
                                                            <td className="px-4 py-3 font-medium text-slate-800">{group.members[0]}</td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex -space-x-2">
                                                                    {group.members.map((member, i) => (
                                                                        <div
                                                                            key={i}
                                                                            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-medium text-white ${
                                                                                member === '+2' ? 'bg-slate-300 text-slate-600' : 'bg-blue-500'
                                                                            }`}
                                                                        >
                                                                            {member === '+2'
                                                                                ? '+2'
                                                                                : `${member.split(', ')[1][0]}${member.split(', ')[0][0]}`}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600">{group.adviser}</td>
                                                            <td className="px-4 py-3">
                                                                <span
                                                                    className={`status-badge ${group.status === 'Approved' ? 'approved' : 'pending'}`}
                                                                >
                                                                    {group.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* CAPSTONE DEADLINES & PAYMENT VERIFICATION */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
                    >
                        {/* Deadlines Card */}
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                    <CalendarCheck className="h-5 w-5 text-green-500" /> Upcoming Deadlines
                                </h2>
                                <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700">Manage</button>
                            </div>

                            <div className="space-y-4">
                                {deadlines.map((deadline, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center justify-between p-4 bg-${deadline.color}-50 rounded-xl border border-${deadline.color}-100`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 bg-${deadline.color}-100 flex items-center justify-center rounded-xl`}>
                                                <deadline.icon className={`h-5 w-5 text-${deadline.color}-600`} />
                                            </div>
                                            <div>
                                                <p className="font-medium">{deadline.phase}</p>
                                                <p className="text-xs text-slate-500">{deadline.description}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-semibold text-${deadline.color}-600`}>{deadline.date}</p>
                                            <p className="text-xs text-slate-500">{deadline.timeLeft}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment Verification Card */}
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                    <CheckCircle2 className="h-5 w-5 text-blue-500" /> Payment Verification
                                </h2>
                                <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Group Alpha</p>
                                            <p className="text-xs text-slate-500">Capstone Fee - ₱500</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-green-600">Verified</p>
                                        <p className="text-xs text-slate-500">March 5, 2026</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                                            <ClipboardList className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Group Beta</p>
                                            <p className="text-xs text-slate-500">Capstone Fee - ₱500</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-amber-600">Pending</p>
                                        <p className="text-xs text-slate-500">Due March 8, 2026</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </InstructorLayout>
        </>
    );
};

export default Dashboard;
