import { Box, Typography } from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ClipboardList, Layers3, TriangleAlert, Users, Download, ArrowRight, Edit, Trash, MoreVertical, CalendarCheck, FileText, Book, Plus } from 'lucide-react';
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
            progress: 75
        },
        {
            label: 'Approved Concepts',
            value: 12,
            change: '80% completion',
            icon: CheckCircle2,
            color: 'green',
            progress: 80
        },
        {
            label: 'Pending Reviews',
            value: 3,
            change: 'Requires attention',
            icon: ClipboardList,
            color: 'amber',
            progress: 30
        },
        {
            label: 'For Re-defense',
            value: 2,
            change: 'Action required',
            icon: TriangleAlert,
            color: 'red',
            progress: 15
        }
    ];

    // Chart Data
    const adviserLoadData = [
        { adviser: 'Prof. Cruz', groups: 3 },
        { adviser: 'Prof. Reyes', groups: 4 },
        { adviser: 'Prof. Santos', groups: 5 },
        { adviser: 'Prof. Villanueva', groups: 2 },
        { adviser: 'Prof. Lim', groups: 3 }
    ];

    const groupStatusData = [
        { label: 'Assigned', value: 5, color: '#10b981' },
        { label: 'Not Assigned', value: 3, color: '#f59e0b' },
        { label: 'Locked', value: 2, color: '#a855f7' },
        { label: 'Completed', value: 5, color: '#3b82f6' }
    ];

    const projectPrefsData = [
        { label: 'AI/ML', value: 30, color: '#3b82f6' },
        { label: 'Web Development', value: 25, color: '#f59e0b' },
        { label: 'Mobile Apps', value: 20, color: '#10b981' },
        { label: 'Data Science', value: 15, color: '#ef4444' },
        { label: 'IoT', value: 10, color: '#8b5cf6' }
    ];

    // Groups Data
    const groups = [
        {
            name: 'Alpha',
            members: ['JD', 'MS', 'AR', '+2'],
            adviser: 'Prof. Cruz',
            status: 'Approved',
            progress: 75
        },
        {
            name: 'Beta',
            members: ['RC', 'MT', 'LJ'],
            adviser: 'Unassigned',
            status: 'Pending',
            progress: 30
        }
    ];

    // Deadlines Data
    const deadlines = [
        {
            phase: 'Proposal Submission',
            description: 'Phase 1 Documentation',
            date: 'March 10, 2026',
            timeLeft: 'in 3 days',
            icon: FileText,
            color: 'amber'
        },
        {
            phase: 'Final Documentation',
            description: 'Capstone 2 Completion',
            date: 'April 15, 2026',
            timeLeft: 'in 2 months',
            icon: Book,
            color: 'blue'
        }
    ];

    return (
        <>
            <InstructorLayout title="Dashboard" subtitle="Instructor Dashboard">
                <div className="space-y-8">
                    {/* QUICK STATS */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {stats.map((stat, idx) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.08 * idx }}
                                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                                        <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                                        <p className={`text-xs mt-2 text-${stat.color}-600`}>{stat.change}</p>
                                    </div>
                                    <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                                        <stat.icon className={`text-2xl text-${stat.color}-600`} />
                                    </div>
                                </div>
                                <div className="progress-bar mt-4">
                                    <div
                                        className={`progress-fill bg-${stat.color}-600`}
                                        style={{ width: `${stat.progress}%` }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* TABS */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                        <div className="border-b border-slate-100 px-6">
                            <div className="flex gap-8">
                                <button className="tab-active py-4 px-2 text-sm font-medium transition">Overview</button>
                                <button className="py-4 px-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition">Groups</button>
                                <button className="py-4 px-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition">Schedules</button>
                                <button className="py-4 px-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition">Payments</button>
                                <button className="py-4 px-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition">Analytics</button>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* VISUALIZATIONS */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
                            >
                                {/* Adviser Load Chart */}
                                <div className="bg-slate-50 rounded-xl p-5 h-72 flex flex-col">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                            <Layers3 className="text-emerald-500" /> Adviser Load
                                        </h3>
                                        <span className="text-xs text-slate-500">Current AY</span>
                                    </div>
                                    <div className="flex-1">
                                        <Box>
                                            <BarChart
                                                height={280}
                                                xAxis={[{ data: adviserLoadData.map(d => d.adviser), scaleType: 'band' }]}
                                                series={[{ data: adviserLoadData.map(d => d.groups), color: '#10b981' }]}
                                                margin={{ top: 20, right: 20, bottom: 60, left: 40 }}
                                                grid={{ vertical: true, horizontal: true }}
                                                skipAnimation={false}
                                            />
                                        </Box>
                                    </div>
                                </div>

                                {/* Group Status Chart */}
                                <div className="bg-slate-50 rounded-xl p-5 h-72 flex flex-col">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                            <CheckCircle2 className="text-green-500" /> Group Status
                                        </h3>
                                        <span className="text-xs text-slate-500">Distribution</span>
                                    </div>
                                    <div className="flex-1">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <PieChart
                                                height={260}
                                                margin={{left: 90}}
                                                series={[
                                                    {
                                                        data: groupStatusData,
                                                        innerRadius: 55,
                                                        outerRadius: 95,
                                                        paddingAngle: 2,
                                                        cornerRadius: 6,
                                                        highlightScope: { faded: 'global', highlighted: 'item' },
                                                        faded: { innerRadius: 50, additionalRadius: -6, color: 'gray' },
                                                    },
                                                ]}
                                                slotProps={{ legend: { hidden: true } }}
                                                skipAnimation={false}
                                            />
                                        </Box>

                                        <div className="mt-1 space-y-2">
                                            {groupStatusData.map((item) => (
                                                <div key={item.label} className="flex items-center gap-2 text-sm text-slate-700">
                                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                    <span className="font-medium">{item.label}</span>
                                                    <span className="ml-auto text-slate-500 tabular-nums">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Project Preferences */}
                                <div className="bg-slate-50 rounded-xl p-5 h-72 flex flex-col">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                            <TriangleAlert className="text-purple-500" /> Project Preferences
                                        </h3>
                                        <span className="text-xs text-slate-500">Student choice</span>
                                    </div>
                                    <div className="flex-1">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <PieChart
                                                height={260}
                                                margin={{left: 90}}
                                                series={[
                                                    {
                                                        data: projectPrefsData,
                                                        innerRadius: 0,
                                                        outerRadius: 95,
                                                        paddingAngle: 2,
                                                        cornerRadius: 6,
                                                        highlightScope: { faded: 'global', highlighted: 'item' },
                                                        faded: { innerRadius: 0, additionalRadius: -6, color: 'gray' },
                                                    },
                                                ]}
                                                slotProps={{ legend: { hidden: true } }}
                                                skipAnimation={false}
                                            />
                                        </Box>

                                        <div className="mt-1 space-y-2">
                                            {projectPrefsData.map((item) => (
                                                <div key={item.label} className="flex items-center gap-2 text-sm text-slate-700">
                                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                    <span className="font-medium">{item.label}</span>
                                                    <span className="ml-auto text-slate-500 tabular-nums">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* GROUP MANAGEMENT OVERVIEW */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-slate-800">Active Groups</h2>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center gap-2">
                                            <Download className="w-4 h-4 text-slate-500" /> Export
                                        </button>
                                        <button className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 rounded-xl hover:from-emerald-700 hover:to-green-700 transition shadow-lg shadow-emerald-600/20 flex items-center gap-2">
                                            <ArrowRight className="w-4 h-4" /> Full Management
                                        </button>
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
                                                
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {groups.map((group, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition">
                                                    <td className="py-4 px-6 font-medium">{group.name}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex -space-x-2">
                                                            {group.members.map((member, i) => (
                                                                <div
                                                                    key={i}
                                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs border-2 border-white ${
                                                                        member === '+2' ? 'bg-slate-300 text-slate-600' : 'bg-blue-500'
                                                                    }`}
                                                                >
                                                                    {member}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">{group.adviser}</td>
                                                    <td className="py-4 px-6">
                                                        <span className={`status-badge ${group.status === 'Approved' ? 'approved' : 'pending'}`}>
                                                            <CheckCircle2 className="w-3 h-3" /> {group.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="progress-bar w-20">
                                                                <div
                                                                    className={`progress-fill ${
                                                                        group.status === 'Approved' ? 'bg-green-600' : 'bg-amber-600'
                                                                    }`}
                                                                    style={{ width: `${group.progress}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-slate-600">{group.progress}%</span>
                                                        </div>
                                                    </td>
                                                   
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* CAPSTONE DEADLINES & PAYMENT VERIFICATION */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                        {/* Deadlines Card */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <CalendarCheck className="w-5 h-5 text-green-500" /> Upcoming Deadlines
                                </h2>
                                <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Manage</button>
                            </div>

                            <div className="space-y-4">
                                {deadlines.map((deadline, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-4 bg-${deadline.color}-50 rounded-xl border border-${deadline.color}-100`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 bg-${deadline.color}-100 rounded-xl flex items-center justify-center`}>
                                                <deadline.icon className={`w-5 h-5 text-${deadline.color}-600`} />
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

                                <button className="w-full py-3 border border-dashed border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition flex items-center justify-center gap-2">
                                    <Plus className="w-4 h-4" /> Add New Deadline
                                </button>
                            </div>
                        </div>

                        {/* Payment Verification Card */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500" /> Payment Verification
                                </h2>
                                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
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

                                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                            <ClipboardList className="w-5 h-5 text-amber-600" />
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

                                <button className="w-full py-3 border border-dashed border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition flex items-center justify-center gap-2">
                                    <Download className="w-4 h-4" /> Download Report
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </InstructorLayout>
        </>
    );
};

export default Dashboard;
