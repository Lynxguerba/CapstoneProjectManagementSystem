import { usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Settings, ShieldCheck } from 'lucide-react';
import React from 'react';
import PasswordManager from '@/components/Settings/PasswordManager';
import ProfileCard from '@/components/Settings/ProfileCard';
import StudentLayout from './_layout';

type StudentUser = {
    id?: number | string;
    name?: string;
    email?: string;
    role?: string;
    roles?: string[];
    program?: string;
    section?: string;
    groupRole?: string;
};

type StudentPageProps = {
    auth?: {
        user?: StudentUser;
    };
};

const StudentSettings = () => {
    const { auth } = usePage<StudentPageProps>().props;
    const user = auth?.user;

    // Show only the group role and program set (section) in the profile card
    const assignedRoles = [user?.groupRole, user?.section].filter((role): role is string => Boolean(role));

    const getRoleDescription = (role?: string) => {
        const normalizedRole = role?.toLowerCase() ?? '';

        if (normalizedRole.includes('leader') || normalizedRole.includes('project manager')) {
            return 'Has full access to project-related actions including submitting documents, managing project details, and requesting an adviser. This role acts as the primary controller of the project workflow.';
        }

        if (
            normalizedRole.includes('programmer') ||
            normalizedRole.includes('developer') ||
            normalizedRole.includes('document') ||
            normalizedRole.includes('analyst')
        ) {
            return 'Has view-only access to project progress, status, and group details. Limitations include the inability to request an adviser or upload/update document requirements.';
        }

        return 'Your role is assigned by your Group Leader or the Program Chairperson. This role determines your specific permissions and tasks within the capstone group.';
    };

    return (
        <StudentLayout title="Settings" subtitle="Profile details, academic info, and account security">
            <div className="space-y-6">
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <div className="flex items-center gap-2">
                        <Settings size={18} className="text-slate-700" />
                        <div>
                            <div className="text-lg font-semibold text-slate-900">Account Settings</div>
                            <div className="text-sm text-slate-500">Profile details and role assignment within your capstone group.</div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                        <ProfileCard name={user?.name ?? 'Student'} email={user?.email ?? ''} assignedRoles={assignedRoles} />

                        <PasswordManager updateUrl="/student/settings/password" />

                        <motion.section
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg"
                        >
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={18} className="text-emerald-600" />
                                <h3 className="text-sm font-semibold text-slate-900">Current Role</h3>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">Your designated role within your assigned capstone group.</p>

                            <div className="mt-4 flex-1 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                                <div className="text-base font-bold text-emerald-900">{user?.groupRole ?? 'Student'}</div>
                                <div className="mt-1 text-xs text-emerald-700">
                                    {user?.program} • {user?.section ?? 'Unassigned Section'}
                                </div>
                                <div className="mt-4 text-[11px] leading-relaxed text-slate-600">{getRoleDescription(user?.groupRole)}</div>
                            </div>
                        </motion.section>
                    </div>
                </motion.section>
            </div>
        </StudentLayout>
    );
};

export default StudentSettings;
