import { usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Settings, Shield, User } from 'lucide-react';
import { useState } from 'react';
import InstructorLayout from './_layout';
import PasswordManager from '@/components/Settings/PasswordManager';
import ESignature from '@/components/Settings/ESignature';

type InstructorUser = {
    id?: number | string;
    name?: string;
    email?: string;
    role?: string;
    roles?: string[];
};

type InstructorPageProps = {
    auth?: {
        user?: InstructorUser;
    };
    eSignature?: {
        signatureData: string;
        mimeType: string;
    } | null;
};

const formatRole = (role: string): string => {
    return role
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const InstructorSettings = () => {
    const { auth, eSignature } = usePage<InstructorPageProps>().props;
    const user = auth?.user;
    const assignedRoles = user?.roles?.length ? user.roles : user?.role ? [user.role] : ['instructor'];

    const [name, setName] = useState(user?.name ?? 'Instructor');
    const [email, setEmail] = useState(user?.email ?? 'instructor@example.com');

    return (
        <InstructorLayout title="Settings" subtitle="Profile details, assigned role, and e-signature setup">
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
                            <div className="text-sm text-slate-500">Profile details from your account and role assignment.</div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
                            {/* Avatar */}
                            <div className="mt-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-md">
                                <span className="text-2xl font-bold text-white">{name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                            </div>

                            {/* Identity */}
                            <p className="mt-4 text-base font-bold text-slate-900">{name}</p>
                            <p className="text-sm text-slate-500">{email}</p>

                            {/* Roles */}
                            <div className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-center gap-2">
                                    <Shield size={15} className="text-slate-500" />
                                    <span className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Assigned Roles</span>
                                </div>
                                <div className="mt-3 flex flex-wrap justify-center gap-2">
                                    {assignedRoles.map((role) => (
                                        <span
                                            key={role}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                            {formatRole(role)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <PasswordManager />
                        <ESignature
                            initialSignature={eSignature?.signatureData ?? ''}
                            upsertUrl="/instructor/settings/e-signature"
                            deleteUrl="/instructor/settings/e-signature"
                        />
                    </div>
                </motion.section>
            </div>
        </InstructorLayout>
    );
};

export default InstructorSettings;
