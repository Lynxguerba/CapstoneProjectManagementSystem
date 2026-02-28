import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    FolderOpen,
    BookOpen,
    FileText,
    Calendar,
    ClipboardCheck,
    Scale,
    Printer,
    Clock,
    Archive,
    Bell,
    MessageSquareText,
    BarChart3,
    Settings,
    ChevronRight,
    Menu,
    X,
    LogOut,
} from 'lucide-react';

import logoCpms from '../assets/logo-cpms.png';
import SignOutModal from './signout-modal';

const Sidebar = ({ onModalOpen }: { onModalOpen?: (open: boolean) => void }) => {
    const page = usePage() as any;
    const { auth } = page.props as any;
    const user = auth?.user;
    const role = user?.role || 'student';
    const currentUrl: string = page.url ?? '';
    const [showModal, setShowModal] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        onModalOpen?.(showModal);
    }, [showModal, onModalOpen]);

    useEffect(() => {
        setIsMobileOpen(false);
    }, [currentUrl]);

    useEffect(() => {
        if (!isMobileOpen) {
            return;
        }

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isMobileOpen]);

    const capitalizeRole = (r: string) =>
        r
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

    const isActiveHref = (href?: string): boolean => {
        if (!href || href === '#') {
            return false;
        }

        if (href === '/') {
            return currentUrl === '/';
        }

        return currentUrl === href || currentUrl.startsWith(`${href}/`);
    };

    const getMenuItems = (role: string) => {
        const commonItems = [
            { icon: LayoutDashboard, label: 'Dashboard', href: '#' },
            { icon: FolderOpen, label: 'Documents', href: '#' },
            { icon: Settings, label: 'Settings', href: '#' },
        ];

        switch (role) {
            case 'student':
                return [
                    { icon: LayoutDashboard, label: 'Dashboard', href: '/student/dashboard' },
                    { icon: Users, label: 'My Capstone Group', href: '/student/group' },
                    { icon: BookOpen, label: 'Title Repository', href: '/student/titles' },
                    { icon: FileText, label: 'Concept Submission', href: '/student/concepts' },
                    { icon: FolderOpen, label: 'Documents & Uploads', href: '/student/documents' },
                    { icon: Calendar, label: 'Defense Schedule', href: '/student/schedule' },
                    { icon: ClipboardCheck, label: 'Evaluation & Feedback', href: '/student/evaluation' },
                    { icon: Scale, label: 'Verdict Results', href: '/student/verdict' },
                    { icon: Archive, label: 'Deployment Submission', href: '/student/deployment' },
                    { icon: Clock, label: 'Deadlines & Notifications', href: '/student/deadlines' },
                    { icon: Settings, label: 'Profile & Settings', href: '/student/settings' },
                ];
            case 'adviser':
                return [
                    { icon: LayoutDashboard, label: 'Dashboard', href: '/adviser/dashboard' },
                    { icon: Users, label: 'Groups', href: '/adviser/groups' },
                    { icon: FileText, label: 'Concepts', href: '/adviser/concepts' },
                    { icon: FolderOpen, label: 'Documents', href: '/adviser/documents' },
                    { icon: ClipboardCheck, label: 'Evaluations', href: '/adviser/evaluations' },
                    { icon: Calendar, label: 'Schedule', href: '/adviser/schedule' },
                    { icon: Scale, label: 'Verdict', href: '/adviser/verdict' },
                    { icon: Printer, label: 'Minutes', href: '/adviser/minutes' },
                    { icon: Bell, label: 'Notifications', href: '/adviser/notifications' },
                    { icon: Clock, label: 'Deadlines', href: '/adviser/deadlines' },
                    { icon: BarChart3, label: 'Reports', href: '/adviser/reports' },
                    { icon: Settings, label: 'Settings', href: '/adviser/settings' },
                ];

            case 'panelist':
                return [
                    { icon: LayoutDashboard, label: 'Dashboard', href: '/panelist/dashboard' },
                    { icon: Users, label: 'Assigned Groups', href: '/panelist/assigned-groups' },
                    { icon: Calendar, label: 'Defense Schedule', href: '/panelist/schedule' },
                    { icon: FolderOpen, label: 'Document Review Center', href: '/panelist/documents' },
                    { icon: ClipboardCheck, label: 'Evaluation & Scoring', href: '/panelist/evaluation' },
                    { icon: MessageSquareText, label: 'Comments & Feedback', href: '/panelist/comments' },
                    { icon: Scale, label: 'Verdict Recommendation', href: '/panelist/verdict' },
                    { icon: Archive, label: 'Past Evaluations', href: '/panelist/history' },
                    { icon: Bell, label: 'Notifications', href: '/panelist/notifications' },
                    { icon: Settings, label: 'Settings', href: '/panelist/settings' },
                ];
            case 'instructor':
                return [
                    { icon: LayoutDashboard, label: 'Dashboard', href: '/instructor/dashboard' },
                    { icon: Users, label: 'Groups Management', href: '/instructor/groups' },
                    { icon: BookOpen, label: 'Title Repository', href: '/instructor/titles' },
                    { icon: FileText, label: 'Concept Review', href: '/instructor/concepts' },
                    { icon: Calendar, label: 'Defense Scheduling', href: '/instructor/scheduling' },
                    { icon: ClipboardCheck, label: 'Evaluation Monitoring', href: '/instructor/evaluation' },
                    { icon: Scale, label: 'Verdict Management', href: '/instructor/verdict' },
                    { icon: Printer, label: 'Minutes & Approval Sheet', href: '/instructor/minutes' },
                    { icon: Clock, label: 'Deadline Management', href: '/instructor/deadlines' },
                    { icon: Archive, label: 'Deployment & Archiving', href: '/instructor/deployment' },
                    { icon: Bell, label: 'Notifications', href: '/instructor/notifications' },
                    { icon: BarChart3, label: 'Reports & Analytics', href: '/instructor/reports' },
                    { icon: Settings, label: 'Profile & Settings', href: '/instructor/settings' },
                ];

            case 'dean':
            case 'program_chairperson':
                return commonItems;
            default:
                return commonItems;
        }
    };

    const menuItems = getMenuItems(role);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsMobileOpen((v) => !v)}
                className="fixed top-4 left-4 z-[60] inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-800 shadow-sm backdrop-blur md:hidden"
                aria-label={isMobileOpen ? 'Close navigation' : 'Open navigation'}
            >
                <span className="relative h-5 w-5">
                    <Menu
                        size={20}
                        className={`absolute inset-0 transition-all duration-300 ${isMobileOpen ? 'scale-75 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`}
                    />
                    <X
                        size={20}
                        className={`absolute inset-0 transition-all duration-300 ${isMobileOpen ? 'scale-100 rotate-0 opacity-100' : 'scale-75 -rotate-90 opacity-0'}`}
                    />
                </span>
            </button>

            <div
                className={`fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                onClick={() => setIsMobileOpen(false)}
            />

            <aside
                className={`fixed inset-y-0 left-0 z-[56] flex w-64 transform flex-col border-r border-slate-800 bg-green-900 text-slate-300 shadow-xl transition-transform duration-300 ease-out will-change-transform md:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
            >
                {/* Brand Section */}
                <div className="flex flex-col items-center p-8">
                    <div className="relative mb-4">
                        <div className="absolute inset-0 rounded-full"></div>
                        <img
                            src={logoCpms}
                            alt="CPMS Logo"
                            className="relative h-20 w-20 rounded-2xl bg-transparent object-cover transition-transform duration-300 hover:scale-105"
                        />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-white">Capstone Projects</h1>
                    <p className="text-[10px] font-bold tracking-[0.2em] text-slate-300 uppercase">Management System</p>
                </div>

                {/* Navigation */}
                <nav className="cpms-scroll mt-4 min-h-0 flex-1 overflow-y-auto px-4">
                    <div className="space-y-1.5 pb-4">
                        {menuItems.map((item) => {
                            const active = isActiveHref(item.href);

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href ?? '#'}
                                    onClick={() => setIsMobileOpen(false)}
                                    preserveScroll
                                    className={`group flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 ${
                                        active ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' : 'hover:bg-slate-800 hover:text-slate-100'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon size={20} className={active ? 'text-white' : 'text-slate-400 group-hover:text-green-400'} />
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </div>
                                    {!active && (
                                        <ChevronRight size={14} className="text-slate-500 opacity-0 transition-opacity group-hover:opacity-100" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Profile Section */}
                <div className="m-4 mt-auto flex-shrink-0 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-green-500 to-green-400 text-[10px] font-bold text-white">
                            {role.substring(0, 3).toUpperCase()}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-sm font-semibold text-slate-200">{user?.name || capitalizeRole(role)}</span>
                            <span className="text-[10px] text-slate-500">{user?.email}</span>
                        </div>
                    </div>
                    <button
                        className="flex w-full items-center justify-center gap-2 border-t border-slate-800/50 py-2 text-xs font-medium text-slate-400 transition-colors hover:text-red-400"
                        onClick={() => setShowModal(true)}
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
                <SignOutModal open={showModal} onClose={() => setShowModal(false)} />

                <style>{`
          .cpms-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(148, 163, 184, 0.35) transparent;
          }

          .cpms-scroll::-webkit-scrollbar {
            width: 8px;
          }

          .cpms-scroll::-webkit-scrollbar-track {
            background: transparent;
          }

          .cpms-scroll::-webkit-scrollbar-thumb {
            background-color: rgba(148, 163, 184, 0.35);
            border-radius: 9999px;
            border: 2px solid transparent;
            background-clip: content-box;
          }

          .cpms-scroll::-webkit-scrollbar-thumb:hover {
            background-color: rgba(148, 163, 184, 0.55);
          }
        `}</style>
            </aside>
        </>
    );
};

export default Sidebar;
