import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  FolderOpen, 
  Settings, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import logoCpms from '../assets/logo-cpms.png';

const Sidebar = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: Users, label: 'Group Creation' },
    { icon: GraduationCap, label: 'Adviser Load' },
    { icon: FolderOpen, label: 'Documents' },
    { icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-screen border-r border-slate-800 shadow-xl">
      
      {/* Brand Section */}
      <div className="p-8 flex flex-col items-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full"></div>
          <img 
            src={logoCpms} 
            alt="CPMS Logo" 
            className="relative w-20 h-20 rounded-2xl object-cover border border-slate-700 shadow-2xl transition-transform hover:scale-105 duration-300"
          />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Capstone MS</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">BS Info Technology</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 mt-4">
        {menuItems.map((item) => (
          <a
            key={item.label}
            href="#"
            className={`flex items-center justify-between group px-4 py-3 rounded-xl transition-all duration-200 ${
              item.active 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} className={item.active ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} />
              <span className="font-medium text-sm">{item.label}</span>
            </div>
            {!item.active && <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />}
          </a>
        ))}
      </nav>

      {/* Profile Section */}
      <div className="p-4 m-4 rounded-2xl bg-slate-950/50 border border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-white">
            INST
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold text-slate-200 truncate">Instructor</span>
            <span className="text-[10px] text-slate-500">active session</span>
          </div>
        </div>
        <button className="w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-red-400 transition-colors py-2 border-t border-slate-800/50">
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;