import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FolderOpen,
  Settings,
  ChevronRight,
  LogOut
} from 'lucide-react';
import logoCpms from '../assets/logo-cpms.png';
import { router } from '@inertiajs/react'
import SignOutModal from './signout-modal';

const Sidebar = ({ onModalOpen }: { onModalOpen?: (open: boolean) => void }) => {
  const { auth } = usePage().props as any;
  const user = auth?.user;
  const role = user?.role || 'student';
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    onModalOpen?.(showModal);
  }, [showModal, onModalOpen]);

  const capitalizeRole = (r: string) => r.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const getMenuItems = (role: string) => {
    const commonItems = [
      { icon: LayoutDashboard, label: 'Dashboard', active: true },
      { icon: FolderOpen, label: 'Documents' },
      { icon: Settings, label: 'Settings' },
    ];

    switch (role) {
      case 'student':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', active: true },
          { icon: Users, label: 'Group Creation' },
          { icon: FolderOpen, label: 'Documents' },
          { icon: Settings, label: 'Settings' },
        ];
      case 'adviser':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', active: true },
          { icon: Users, label: 'Group Creation' },
          { icon: GraduationCap, label: 'Adviser Load' },
          { icon: FolderOpen, label: 'Documents' },
          { icon: Settings, label: 'Settings' },
        ];
      case 'panelist':
        return commonItems;
      case 'instructor':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', active: true },
          { icon: GraduationCap, label: 'Adviser Load' },
          { icon: FolderOpen, label: 'Documents' },
          { icon: Settings, label: 'Settings' },
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
    <aside className="w-64 bg-green-900 text-slate-300 flex flex-col fixed h-screen border-r border-slate-800 shadow-xl">

      {/* Brand Section */}
      <div className="p-8 flex flex-col items-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-full"></div>
          <img
            src={logoCpms}
            alt="CPMS Logo"
            className="relative w-20 h-20 rounded-2xl object-cover transition-transform hover:scale-105 duration-300 bg-transparent"
          />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Capstone Projects</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300 font-bold">Management System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 mt-4">
        {menuItems.map((item) => (
          <a
            key={item.label}
            href="#"
            className={`flex items-center justify-between group px-4 py-3 rounded-xl transition-all duration-200 ${item.active
              ? 'bg-green-600 text-white shadow-lg shadow-green-900/20'
              : 'hover:bg-slate-800 hover:text-slate-100'
              }`}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} className={item.active ? 'text-white' : 'text-slate-400 group-hover:text-green-400'} />
              <span className="font-medium text-sm">{item.label}</span>
            </div>
            {!item.active && <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />}
          </a>
        ))}
      </nav>

      {/* Profile Section */}
      <div className="p-4 m-4 rounded-2xl bg-slate-950/50 border border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-500 to-green-400 flex items-center justify-center text-[10px] font-bold text-white">
            {role.substring(0, 3).toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold text-slate-200 truncate">{user?.name || capitalizeRole(role)}</span>
            <span className="text-[10px] text-slate-500">{user?.email}</span>
          </div>
        </div>
        <button className="w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-red-400 transition-colors py-2 border-t border-slate-800/50"
          onClick={() => setShowModal(true)}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
      <SignOutModal open={showModal} onClose={() => setShowModal(false)} />
    </aside>
  );
};

export default Sidebar;