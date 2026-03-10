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
    GraduationCap,
    FolderArchive,
    History
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import logoCpms from '../assets/logo-cpms.png';
import SignOutModal from './signout-modal';

type SidebarAuthUser = {
    role?: string;
    roles?: string[];
    name?: string;
    email?: string;
};

type SidebarPageProps = {
    auth?: {
        user?: SidebarAuthUser;
    };
};

type MenuItem = { icon: LucideIcon; label: string; href?: string; isSection?: false } | { label: string; isSection: true };

const Sidebar = ({ onModalOpen }: { onModalOpen?: (open: boolean) => void }) => {
    const page = usePage<SidebarPageProps>();
    const { auth } = page.props;
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

        if (href === '/admin/users') {
            return currentUrl === '/admin/users';
        }

        if (href === '/') {
            return currentUrl === '/';
        }

        return currentUrl === href || currentUrl.startsWith(`${href}/`);
    };

    const getMenuItems = (role: string): MenuItem[] => {
        const commonItems: MenuItem[] = [
            { icon: LayoutDashboard, label: 'Dashboard', href: '#' },
            { icon: FolderOpen, label: 'Documents', href: '#' },
            { icon: Settings, label: 'Settings', href: '#' },
        ];

        switch (role) {
            case 'admin':
                return [
                    { label: 'Main', isSection: true },
                    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
                    { label: 'User Management', isSection: true },
                    { icon: GraduationCap, label: 'Students', href: '/admin/users/students' },
                    { icon: BookOpen, label: 'Faculties', href: '/admin/users/faculty' },
                    { label: 'Archive', isSection: true },
                    { icon: FolderArchive, label: 'Project Repository ', href: '/admin/project-repository' },
                    { icon: History, label: 'Backup & Restore ', href: '/admin/backup-restore' },
                    { icon: Settings, label: 'System Settings', href: '/admin/system-settings' },
                    { icon: Archive, label: 'Audit Logs', href: '/admin/audit-logs' },
                ];
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
                    { label: "Main", isSection: true },
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
                return [
                    { icon: LayoutDashboard, label: 'Dashboard', href: '/dean/dashboard' },
                    { icon: FolderOpen, label: 'Projects', href: '/dean/projects' },
                    { icon: Archive, label: 'Projects Details', href: '/dean/project-details' },
                    { icon: Users, label: 'Student Monitoring', href: '/dean/students' },
                    { icon: Settings, label: 'Settings', href: '/dean/settings' },
                    { icon: FileText, label: 'Reports', href: '/dean/reports' },
                ];
            case 'program_chairperson':
                return [
                    { icon: LayoutDashboard, label: 'Dashboard', href: '/program_chairperson/dashboard' },
                    { icon: FileText, label: 'Pre-Deployment Letters', href: '/program_chairperson/pre-deployment-letters' },
                    { icon: ClipboardCheck, label: 'Deployment Approval', href: '/program_chairperson/deployment-approval' },
                    { icon: Archive, label: 'Deployment Monitoring', href: '/program_chairperson/deployment-monitoring' },
                    { icon: FolderOpen, label: 'Post-Deployment Review', href: '/program_chairperson/post-deployment-review' },
                    { icon: BookOpen, label: 'Document Approval', href: '/program_chairperson/document-approval' },
                    { icon: Clock, label: 'Deployment History', href: '/program_chairperson/deployment-history' },
                    { icon: Bell, label: 'Notifications', href: '/program_chairperson/notifications' },
                    { icon: Settings, label: 'Settings', href: '/program_chairperson/settings' },
                ];
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
                className="fixed top-3 left-3 z-[60] inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-slate-800 shadow-sm backdrop-blur md:hidden"
                aria-label={isMobileOpen ? 'Close navigation' : 'Open navigation'}
            >
                <span className="relative h-4 w-4">
                    <Menu
                        size={18}
                        className={`absolute inset-0 transition-all duration-300 ${isMobileOpen ? 'scale-75 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`}
                    />
                    <X
                        size={18}
                        className={`absolute inset-0 transition-all duration-300 ${isMobileOpen ? 'scale-100 rotate-0 opacity-100' : 'scale-75 -rotate-90 opacity-0'}`}
                    />
                </span>
            </button>

            <div
                className={`fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                onClick={() => setIsMobileOpen(false)}
            />

            <aside
                className={`fixed inset-y-0 left-0 z-[56] flex w-56 transform flex-col border-r border-slate-800 bg-green-900 text-slate-300 shadow-xl transition-transform duration-300 ease-out will-change-transform md:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
            >
                {/* Brand Section - Tightened */}
                <div className="flex flex-col items-center p-5">
                    <div className="relative mb-2">
                        <img src={logoCpms} alt="CPMS Logo" className="relative h-14 w-14 rounded-xl bg-transparent object-cover" />
                    </div>
                    <h1 className="text-lg font-bold tracking-tight text-white">Capstone Projects</h1>
                    <p className="text-[9px] font-bold tracking-[0.15em] text-slate-400 uppercase">Management System</p>
                </div>

                {/* Navigation - Compressed items */}
                <nav className="cpms-scroll mt-2 min-h-0 flex-1 overflow-y-auto px-3">
                    <div className="space-y-1 pb-3">
                        {menuItems.map((item) => {
                            if (item.isSection) {
                                return (
                                    <div key={item.label} className="mt-3 px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                        {item.label}
                                    </div>
                                );
                            }

                            const active = isActiveHref(item.href);
                            const ItemIcon = item.icon;

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href ?? '#'}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={`group flex items-center justify-between rounded-lg px-3 py-2 transition-all duration-200 ${
                                        active ? 'bg-green-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-slate-100'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <ItemIcon size={18} className={active ? 'text-white' : 'text-slate-400 group-hover:text-green-400'} />
                                        <span className="text-xs font-medium">{item.label}</span>
                                    </div>
                                    {!active && <ChevronRight size={12} className="text-slate-600 opacity-0 group-hover:opacity-100" />}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Profile Section - Downsized */}
                <div className="m-3 mt-auto flex-shrink-0 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-green-500 to-green-400 text-[9px] font-bold text-white">
                            {role.substring(0, 3).toUpperCase()}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-xs font-semibold text-slate-200">{user?.name || capitalizeRole(role)}</span>
                            <span className="truncate text-[9px] text-slate-500">{user?.email}</span>
                        </div>
                    </div>
                    <button
                        className="flex w-full items-center justify-center gap-2 border-t border-slate-800/50 pt-2 text-[11px] font-medium text-slate-400 hover:text-red-400"
                        onClick={() => setShowModal(true)}
                    >
                        <LogOut size={12} />
                        Sign Out
                    </button>
                </div>
                <SignOutModal open={showModal} onClose={() => setShowModal(false)} activeRole={role} assignedRoles={user?.roles ?? []} />
            </aside>
        </>
    );
};

export default Sidebar;
