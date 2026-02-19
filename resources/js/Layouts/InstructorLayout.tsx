import React, { useState } from 'react';
import { Link } from '@inertiajs/react';

interface Props {
    children: React.ReactNode;
}

export default function InstructorLayout({ children }: Props) {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        console.log('Program changed to:', e.target.value);
    };

    const handlePhaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        console.log('Phase changed to:', e.target.value);
    };

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const role = e.target.value;
        switch(role) {
            case 'panel':
                window.location.href = '/panel/dashboard';
                break;
            case 'panelChair':
                window.location.href = '/panel-chair/dashboard';
                break;
            case 'adviser':
                window.location.href = '/adviser/dashboard';
                break;
            default:
                console.log('Staying in Instructor view');
        }
    };

    return (
        <div className="bg-slate-50 flex font-sans text-slate-700">
            {/* SIDEBAR */}
            <aside className="w-72 bg-gradient-to-b from-slate-900 to-slate-800 text-slate-100 flex flex-col fixed h-screen shadow-2xl">
                <div className="p-6 border-b border-slate-700/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <i className="fas fa-graduation-cap text-2xl text-white"></i>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Capstone MS
                            </h1>
                            <p className="text-xs text-slate-400">v2.0 · Instructor Portal</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                            <p className="text-xs text-slate-400">AY 2024-2025</p>
                            <p className="text-sm font-semibold text-white">1st Sem</p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                            <p className="text-xs text-slate-400">Section</p>
                            <p className="text-sm font-semibold text-white">BSIT-3A</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">Main</p>
                    <Link
                        href="/instructor/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/20"
                    >
                        <i className="fas fa-tachometer-alt w-5"></i>
                        <span className="flex-1">Dashboard</span>
                        <span className="bg-white/20 text-xs px-2 py-1 rounded-full">12</span>
                    </Link>

                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mt-4 mb-2">Management</p>
                    <Link
                        href="/instructor/groups"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all group"
                    >
                        <i className="fas fa-users w-5 text-slate-400 group-hover:text-blue-400"></i>
                        <span className="flex-1">Group Management</span>
                        <i className="fas fa-chevron-right text-xs text-slate-500"></i>
                    </Link>
                    <Link
                        href="/instructor/advisers"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all group"
                    >
                        <i className="fas fa-user-tie w-5 text-slate-400 group-hover:text-blue-400"></i>
                        <span className="flex-1">Adviser Assignment</span>
                        <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-full">3 slots</span>
                    </Link>
                    <Link
                        href="/instructor/schedules"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all group"
                    >
                        <i className="fas fa-calendar-alt w-5 text-slate-400 group-hover:text-blue-400"></i>
                        <span className="flex-1">Defense Scheduling</span>
                        <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full">2</span>
                    </Link>

                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mt-4 mb-2">Academic Control</p>
                    <Link
                        href="/instructor/deadlines"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all group"
                    >
                        <i className="fas fa-clock w-5 text-slate-400 group-hover:text-blue-400"></i>
                        <span className="flex-1">Deadline Manager</span>
                    </Link>
                    <Link
                        href="/instructor/payments"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all group"
                    >
                        <i className="fas fa-credit-card w-5 text-slate-400 group-hover:text-blue-400"></i>
                        <span className="flex-1">Payment Verification</span>
                    </Link>
                    <Link
                        href="/instructor/deployments"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all group"
                    >
                        <i className="fas fa-rocket w-5 text-slate-400 group-hover:text-blue-400"></i>
                        <span className="flex-1">Deployment Tracker</span>
                    </Link>

                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mt-4 mb-2">Reports</p>
                    <Link
                        href="/instructor/analytics"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all group"
                    >
                        <i className="fas fa-chart-line w-5 text-slate-400 group-hover:text-blue-400"></i>
                        <span className="flex-1">Analytics</span>
                    </Link>
                    <Link
                        href="/instructor/documents"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all group"
                    >
                        <i className="fas fa-file-alt w-5 text-slate-400 group-hover:text-blue-400"></i>
                        <span className="flex-1">Documents</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg">
                            PD
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-sm">Prof. Dela Cruz</p>
                            <p className="text-xs text-slate-400">Capstone Coordinator</p>
                        </div>
                        <Link
                            href="/panel/dashboard"
                            className="w-8 h-8 rounded-lg hover:bg-slate-700 flex items-center justify-center transition"
                            title="Switch to Panel"
                        >
                            <i className="fas fa-exchange-alt text-slate-400"></i>
                        </Link>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col overflow-y-auto ml-72">
                {/* TOP BAR */}
                <div className="glass-effect border-b border-slate-200/50 px-8 py-4 flex justify-between items-center fixed top-0 left-72 right-0 z-40 shadow-sm bg-white/70 backdrop-blur">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-slate-800">Instructor Command Center</h2>
                        <span className="bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                            <i className="fas fa-circle text-[8px] text-green-500"></i> Active Session
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notification Bell */}
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition relative notification-dot"
                        >
                            <i className="fas fa-bell text-slate-600"></i>
                        </button>

                        {/* Settings Icon */}
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
                        >
                            <i className="fas fa-cog text-slate-600"></i>
                        </button>

                        {/* Control Selectors */}
                        <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
                            <div className="relative">
                                <select
                                    onChange={handleProgramChange}
                                    className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
                                >
                                    <option value="bsit">BS Information Technology</option>
                                    <option value="bsis">BS Information Systems</option>
                                </select>
                                <i className="fas fa-chevron-down absolute right-3 top-3.5 text-slate-400 text-xs"></i>
                            </div>

                            <div className="relative">
                                <select
                                    onChange={handlePhaseChange}
                                    className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
                                >
                                    <option value="concept">Phase 1: Concept</option>
                                    <option value="outline">Phase 2: Outline</option>
                                    <option value="predeployment">Phase 3: Pre-Deployment</option>
                                    <option value="deployment">Phase 4: Deployment</option>
                                    <option value="final">Phase 5: Final</option>
                                </select>
                                <i className="fas fa-chevron-down absolute right-3 top-3.5 text-slate-400 text-xs"></i>
                            </div>

                            <div className="relative">
                                <select
                                    onChange={handleRoleChange}
                                    className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
                                >
                                    <option value="instructor">Instructor</option>
                                    <option value="panel">Panel Member</option>
                                    <option value="panelChair">Panel Chair</option>
                                    <option value="adviser">Adviser</option>
                                </select>
                                <i className="fas fa-chevron-down absolute right-3 top-3.5 text-slate-400 text-xs"></i>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page Content with top padding to account for fixed header */}
                <div className="pt-20">
                    {children}
                </div>
            </main>

            <style>{`
                .glass-effect {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }
                .notification-dot {
                    position: relative;
                }
                .notification-dot::after {
                    content: '';
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    width: 8px;
                    height: 8px;
                    background: #ef4444;
                    border-radius: 50%;
                    border: 2px solid white;
                }
            `}</style>
        </div>
    );
}