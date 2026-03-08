import { motion } from 'framer-motion';
import { 
    Search, 
    Filter, 
    FolderArchive, 
    ExternalLink, 
    FileText, 
    Users, 
    Calendar 
} from 'lucide-react';
import React from 'react';
import AdminLayout from './_layout';

// Mock Type for UI Consistency
type ProjectRepositoryRow = {
    id: number;
    title: string;
    authors: string[]; // 2-3 members as requested
    adviser: string;
    academicYear: string;
    status: 'Archived' | 'Finalized';
    dateAdded: string;
};

const AdminProjectRepository = () => {
    // Mock Data for UI demonstration
    const projects: ProjectRepositoryRow[] = [
        {
            id: 1,
            title: "Capstone Project Management System",
            authors: ["Baquero, K.", "Egnio, A.", "Guerba, D."],
            adviser: "Dr. Juan Dela Cruz",
            academicYear: "2025-2026",
            status: "Archived",
            dateAdded: "Feb 2026"
        },
        {
            id: 2,
            title: "Records Tracking Management System with QR Code",
            authors: ["Rellon, J.", "Abidin, A."],
            adviser: "Prof. Maria Santos",
            academicYear: "2023-2024",
            status: "Archived",
            dateAdded: "Aug 2024"
        }
    ];

    return (
        <AdminLayout title="Project Repository" subtitle="Centralized archive of finalized capstone project records">
            <motion.section 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.4 }} 
                className="space-y-5"
            >
                {/* Action Bar - Matching Faculty.tsx design scale */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search titles or authors..."
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm transition-all outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/10 md:w-80"
                            />
                        </div>

                        <div className="relative">
                            <Filter className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs capitalize shadow-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/10">
                                <option>All Years</option>
                                <option>2025-2026</option>
                                <option>2024-2025</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50">
                            <FolderArchive className="h-3.5 w-3.5" />
                            Export Archive
                        </button>
                    </div>
                </div>

                {/* Project Table - Matching Striped Table scale */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                            <tr>
                                <th className="px-6 py-4">Capstone Title</th>
                                <th className="px-6 py-4">Authors / Group Members</th>
                                <th className="px-6 py-4">Adviser</th>
                                <th className="px-6 py-4">AY / Term</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {projects.map((project, index) => (
                                <tr
                                    key={project.id}
                                    className={`transition-colors hover:bg-green-50/30 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                                >
                                    <td className="px-6 py-4 max-w-xs">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 rounded bg-green-100 p-1.5 text-green-700">
                                                <FileText size={14} />
                                            </div>
                                            <span className="font-semibold text-slate-800 leading-relaxed">
                                                {project.title}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        <div className="flex flex-col gap-1">
                                            {project.authors.map((author, i) => (
                                                <span key={i} className="flex items-center gap-1.5">
                                                    <Users size={12} className="text-slate-400" />
                                                    {author}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 italic">
                                        {project.adviser}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                            <Calendar size={10} />
                                            {project.academicYear}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:border-green-200 hover:bg-green-50 hover:text-green-700">
                                            <ExternalLink className="h-3 w-3" />
                                            View Records
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Simple Footer Stats */}
                <div className="flex items-center justify-between px-1">
                    <p className="text-[11px] text-slate-400 italic">
                        * All records are encrypted and archived for institutional transparency[cite: 208].
                    </p>
                </div>
            </motion.section>
        </AdminLayout>
    );
};

export default AdminProjectRepository;