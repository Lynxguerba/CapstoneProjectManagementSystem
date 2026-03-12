import { usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import React from 'react';
import Sidebar from '../../components/sidebar';

type Props = {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
};

type AcademicYearOption = {
    id: number;
    label: string;
    is_current: boolean;
};

type StudentAuthUser = {
    role?: string;
    roles?: string[];
};

type StudentLayoutPageProps = {
    academicYears?: AcademicYearOption[];
    auth?: {
        user?: StudentAuthUser;
    };
};

const formatRoleLabel = (role: string): string => {
    return role
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Student
const StudentLayout = ({ title, subtitle, children }: Props) => {
    const { academicYears = [], auth } = usePage<StudentLayoutPageProps>().props;
    const user = auth?.user;
    const activeRole = user?.role ?? user?.roles?.[0] ?? '';

    const currentAcademicYear = academicYears.find((y) => y.is_current) ?? academicYears[0] ?? null;

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-sm">
            <Sidebar />

            <main className="ml-0 flex-1 md:ml-56">
                <motion.div
                    initial={{ y: -12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md md:px-6 md:py-3"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="pl-10 text-lg font-semibold text-slate-800 md:pl-0 md:text-xl">{title}</h2>
                            {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
                        </div>

                        {/* Right side: show current Academic Year and Role (non-interactive for students) */}
                        <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900 shadow-sm">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                                <GraduationCap className="h-5 w-5" aria-hidden="true" />
                            </span>

                            <span className="hidden items-center gap-3 text-left leading-tight sm:flex">
                                <span>
                                    <span className="block text-[10px] font-semibold tracking-wide text-emerald-700/80 uppercase">Current Year Level</span>
                                    <span className="block text-sm font-semibold">{currentAcademicYear?.label ?? 'No Academic Year'}</span>
                                </span>

                                {activeRole ? <span className="h-8 w-px bg-emerald-200/80" aria-hidden="true" /> : null}

                                {activeRole ? (
                                    <span>
                                        <span className="block text-[10px] font-semibold tracking-wide text-emerald-700/80 uppercase">Role</span>
                                        <span className="block text-sm font-semibold">{formatRoleLabel(activeRole)}</span>
                                    </span>
                                ) : null}
                            </span>

                            <span className="text-sm font-semibold sm:hidden">
                                {currentAcademicYear?.label ?? 'Academic Year'}{activeRole ? ` • ${formatRoleLabel(activeRole)}` : ''}
                            </span>
                        </div>
                    </div>
                </motion.div>

                <div className="p-3 md:p-5">{children}</div>
            </main>
        </div>
    );
};

export default StudentLayout;
