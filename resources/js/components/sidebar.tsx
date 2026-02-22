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
  UserCheck,
  Rocket,
  CreditCard,
  GraduationCap,
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
    r.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const isActiveHref = (href?: string): boolean => {
    if (!href || href === '#') return false;
    if (href === '/') return currentUrl === '/';
    return currentUrl === href || currentUrl.startsWith(`${href}/`);
  };

  // ─── Menu definitions ────────────────────────────────────────────────────────

  type MenuItem = {
    icon: React.ElementType;
    label: string;
    href: string;
    badge?: string;
    badgeColor?: string;
  };

  type MenuSection = {
    section: string;
    items: MenuItem[];
  };

  type FlatMenuItem = MenuItem & { section?: undefined };

  const getInstructorMenu = (): MenuSection[] => [
    {
      section: 'Main',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/instructor/dashboard', badge: '12', badgeColor: 'blue' },
      ],
    },
    {
      section: 'Management',
      items: [
        { icon: Users, label: 'Groups Management', href: '/instructor/groups' },
        { icon: UserCheck, label: 'Adviser Assignment', href: '/instructor/advisers', badge: '3 slots', badgeColor: 'amber' },
        { icon: Calendar, label: 'Defense Scheduling', href: '/instructor/scheduling', badge: '2', badgeColor: 'red' },
        { icon: FileText, label: 'Concept Review', href: '/instructor/concepts' },
        { icon: BookOpen, label: 'Title Repository', href: '/instructor/titles' },
      ],
    },
    {
      section: 'Academic Control',
      items: [
        { icon: Clock, label: 'Deadline Management', href: '/instructor/deadlines' },
        { icon: CreditCard, label: 'Payment Verification', href: '/instructor/payments' },
        { icon: Scale, label: 'Verdict Management', href: '/instructor/verdict' },
        { icon: Printer, label: 'Minutes & Approval Sheet', href: '/instructor/minutes' },
        { icon: Rocket, label: 'Deployment & Archiving', href: '/instructor/deployment' },
      ],
    },
    {
      section: 'Reports',
      items: [
        { icon: BarChart3, label: 'Reports & Analytics', href: '/instructor/reports' },
        { icon: ClipboardCheck, label: 'Evaluation Monitoring', href: '/instructor/evaluation' },
        { icon: FolderOpen, label: 'Documents', href: '/instructor/documents' },
        { icon: Bell, label: 'Notifications', href: '/instructor/notifications' },
        { icon: Settings, label: 'Profile & Settings', href: '/instructor/settings' },
      ],
    },
  ];

  const getMenuItems = (role: string): (FlatMenuItem | MenuSection)[] => {
    const commonItems: FlatMenuItem[] = [
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
        return getInstructorMenu();

      case 'dean':
      case 'program_chairperson':
        return commonItems;

      default:
        return commonItems;
    }
  };

  const menuItems = getMenuItems(role);
  const isInstructor = role === 'instructor';

  // Badge colour helper
  const badgeClass = (color?: string) => {
    switch (color) {
      case 'amber': return 'bg-amber-500/20 text-amber-400';
      case 'red':   return 'bg-red-500/20 text-red-400';
      case 'blue':  return 'bg-white/20 text-white';
      default:      return 'bg-slate-600/50 text-slate-300';
    }
  };

  // ─── Shared link renderer ────────────────────────────────────────────────────

  const NavLink = ({ item }: { item: FlatMenuItem | MenuItem }) => {
    const active = isActiveHref(item.href);
    return (
      <Link
        key={item.label}
        href={item.href ?? '#'}
        onClick={() => setIsMobileOpen(false)}
        preserveScroll
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
          active
            ? isInstructor
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/20'
              : 'bg-green-600 text-white shadow-lg shadow-green-900/20'
            : isInstructor
            ? 'hover:bg-slate-700/50 hover:text-slate-100 text-slate-300'
            : 'hover:bg-slate-800 hover:text-slate-100 text-slate-300'
        }`}
      >
        <item.icon
          size={18}
          className={active ? 'text-white' : isInstructor ? 'text-slate-400 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-green-400'}
        />
        <span className="flex-1 font-medium text-sm">{item.label}</span>
        {'badge' in item && item.badge ? (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${active ? 'bg-white/20 text-white' : badgeClass(item.badgeColor)}`}>
            {item.badge}
          </span>
        ) : !active ? (
          <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
        ) : null}
      </Link>
    );
  };

  // ─── Sidebar content ─────────────────────────────────────────────────────────

  const sidebarBg = isInstructor
    ? 'bg-gradient-to-b from-slate-900 to-slate-800'
    : 'bg-green-900';

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : role.substring(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setIsMobileOpen((v) => !v)}
        className="md:hidden fixed top-4 left-4 z-[60] inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/90 backdrop-blur border border-slate-200 shadow-sm text-slate-800"
        aria-label={isMobileOpen ? 'Close navigation' : 'Open navigation'}
      >
        <span className="relative w-5 h-5">
          <Menu
            size={20}
            className={`absolute inset-0 transition-all duration-300 ${isMobileOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'}`}
          />
          <X
            size={20}
            className={`absolute inset-0 transition-all duration-300 ${isMobileOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`}
          />
        </span>
      </button>

      {/* Mobile overlay */}
      <div
        className={`md:hidden fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`${isInstructor ? 'w-72' : 'w-64'} ${sidebarBg} text-slate-300 flex flex-col fixed inset-y-0 left-0 z-[56] border-r border-slate-700/50 shadow-2xl transform transition-transform duration-300 ease-out will-change-transform md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >

        {/* ── Brand / Header ─────────────────────────────────────────────────── */}
        {isInstructor ? (
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <GraduationCap size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent leading-tight">
                  Capstone MS
                </h1>
                <p className="text-[10px] text-slate-400">v2.0 · Instructor Portal</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-slate-400">AY 2024-2025</p>
                <p className="text-sm font-semibold text-white">1st Sem</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-slate-400">Section</p>
                <p className="text-sm font-semibold text-white">BSIT-3A</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center">
            <div className="relative mb-4">
              <img
                src={logoCpms}
                alt="CPMS Logo"
                className="relative w-20 h-20 rounded-2xl object-cover transition-transform hover:scale-105 duration-300 bg-transparent"
              />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Capstone Projects</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300 font-bold">Management System</p>
          </div>
        )}

        {/* ── Navigation ─────────────────────────────────────────────────────── */}
        <nav className={`flex-1 min-h-0 px-4 overflow-y-auto cpms-scroll ${isInstructor ? 'py-4' : 'mt-4'}`}>
          <div className="space-y-0.5 pb-4">
            {isInstructor ? (
              // Sectioned layout for instructor
              (menuItems as MenuSection[]).map((group) => (
                <div key={group.section} className="mb-1">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 mt-4 mb-2">
                    {group.section}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <NavLink key={item.label} item={item} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Flat layout for all other roles
              (menuItems as FlatMenuItem[]).map((item) => (
                <NavLink key={item.label} item={item} />
              ))
            )}
          </div>
        </nav>

        {/* ── Profile / Footer ───────────────────────────────────────────────── */}
        {isInstructor ? (
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg text-sm flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-medium text-sm text-white truncate">{user?.name || 'Instructor'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'Capstone Coordinator'}</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="w-8 h-8 rounded-lg hover:bg-slate-700 flex items-center justify-center transition-colors"
                aria-label="Sign out"
              >
                <LogOut size={15} className="text-slate-400 hover:text-red-400 transition-colors" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 m-4 rounded-2xl bg-slate-950/50 border border-slate-800 flex-shrink-0 mt-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-500 to-green-400 flex items-center justify-center text-[10px] font-bold text-white">
                {role.substring(0, 3).toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold text-slate-200 truncate">{user?.name || capitalizeRole(role)}</span>
                <span className="text-[10px] text-slate-500">{user?.email}</span>
              </div>
            </div>
            <button
              className="w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-red-400 transition-colors py-2 border-t border-slate-800/50"
              onClick={() => setShowModal(true)}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        )}

        <SignOutModal open={showModal} onClose={() => setShowModal(false)} />

        <style>{`
          .cpms-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(148, 163, 184, 0.35) transparent;
          }
          .cpms-scroll::-webkit-scrollbar { width: 8px; }
          .cpms-scroll::-webkit-scrollbar-track { background: transparent; }
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