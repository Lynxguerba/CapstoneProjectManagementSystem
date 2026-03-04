import { usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Settings, Shield, User } from 'lucide-react';
import { useState } from 'react';
import DeanLayout from './_layout';
import PasswordManager from '@/components/Settings/PasswordManager';
import ESignature from '@/components/Settings/ESignature';

type DeanUser = {
    id?: number | string;
    name?: string;
    email?: string;
    role?: string;
    roles?: string[];
};

type DeanPageProps = {
    auth?: {
        user?: DeanUser;
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

const DeanSettings = () => {
    const { auth, eSignature } = usePage<DeanPageProps>().props;
    const user = auth?.user;
    const assignedRoles = user?.roles?.length ? user.roles : user?.role ? [user.role] : ['dean'];

    const [name, setName] = useState(user?.name ?? 'Dean');
    const [email, setEmail] = useState(user?.email ?? 'dean@example.com');

    return (
        <DeanLayout title="Settings" subtitle="Profile details, assigned role, and e-signature setup">
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
                        <div className="rounded-2xl border border-slate-200 bg-white p-6">
                            <div className="flex items-center gap-2">
                                <User size={18} className="text-slate-700" />
                                <div className="text-sm font-semibold text-slate-900">Profile</div>
                            </div>

                            <label className="mt-4 block text-sm font-semibold text-slate-700">Name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />

                            <label className="mt-4 block text-sm font-semibold text-slate-700">Email</label>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />

                            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-2">
                                    <Shield size={16} className="text-slate-700" />
                                    <div className="text-sm font-semibold text-slate-900">Assigned Role</div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {assignedRoles.map((role) => (
                                        <span
                                            key={role}
                                            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                                        >
                                            {formatRole(role)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <PasswordManager />
                        <ESignature
                            initialSignature={eSignature?.signatureData ?? ''}
                            upsertUrl="/dean/settings/e-signature"
                            deleteUrl="/dean/settings/e-signature"
                        />
                                    
                    </div>
                </motion.section>
            </div>
        </DeanLayout>
    );
};

export default DeanSettings;
