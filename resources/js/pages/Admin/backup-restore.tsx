import { motion } from 'framer-motion';
import { 
    Database, 
    Download, 
    Upload, 
    History, 
    ShieldCheck, 
    RefreshCcw, 
    AlertCircle,
    HardDrive
} from 'lucide-react';
import React from 'react';
import AdminLayout from './_layout';

// Mock Data for UI consistency
const backupHistory = [
    { id: 1, name: 'Weekly_Full_Backup_Feb2026.sql', size: '124 MB', type: 'Full System', status: 'Success', date: 'Feb 28, 2026' },
    { id: 2, name: 'Capstone_Docs_Archive.zip', size: '850 MB', type: 'Documents Only', status: 'Success', date: 'Feb 21, 2026' },
    { id: 3, name: 'Incremental_Backup_01.sql', size: '12 MB', type: 'Database', status: 'Success', date: 'Feb 14, 2026' },
];

export default function BackupRestore() {
    return (
        <AdminLayout title="Backup & Restore" subtitle="Ensure system safety and data integrity">
            <motion.section 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.4 }} 
                className="space-y-6"
            >
                {/* System Status Cards - Specific to Safety Objectives */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-green-700">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Security</p>
                            <p className="text-sm font-bold text-slate-800">Encrypted Storage</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                            <HardDrive size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Storage Used</p>
                            <p className="text-sm font-bold text-slate-800">1.2 GB / 5 GB</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                            <History size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Backup</p>
                            <p className="text-sm font-bold text-slate-800">8 hours ago</p>
                        </div>
                    </div>
                </div>

                {/* Primary Action Section */}
                <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-amber-500" size={18} />
                        <p className="text-xs text-slate-600 font-medium">
                            Regular backups ensure institutional transparency and record tracking.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50">
                            <Upload className="h-3.5 w-3.5" />
                            Restore System
                        </button>
                        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-800 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-green-900 active:scale-95">
                            <Download className="h-3.5 w-3.5" />
                            Create New Backup
                        </button>
                    </div>
                </div>

                {/* Backup History Table - Consistent with Faculty Table Scale */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Database size={14} /> Backup History Log
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Backup Filename</th>
                                    <th className="px-6 py-4">File Size</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Created At</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {backupHistory.map((log, index) => (
                                    <tr key={log.id} className={`transition-colors hover:bg-green-50/30 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                                        <td className="px-6 py-3.5 font-semibold text-slate-800 tracking-tight">{log.name}</td>
                                        <td className="px-6 py-3.5 text-slate-500">{log.size}</td>
                                        <td className="px-6 py-3.5 text-slate-500">{log.type}</td>
                                        <td className="px-6 py-3.5">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-500">{log.date}</td>
                                        <td className="px-6 py-3.5 text-right">
                                            <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50">
                                                <RefreshCcw className="h-3 w-3" />
                                                Rollback
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.section>
        </AdminLayout>
    );
}