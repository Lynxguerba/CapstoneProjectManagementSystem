import { Shield } from 'lucide-react';

type ProfileCardProps = {
    name: string;
    email: string;
    assignedRoles: string[];
};

const formatRole = (role: string): string => {
    return role
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const ProfileCard = ({ name, email, assignedRoles }: ProfileCardProps) => {
    return (
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center transition-shadow duration-300 hover:shadow-lg">
            {/* Avatar */}
            <div className="mt-2 flex h-16 w-16 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-md transition-transform duration-300 hover:scale-110 hover:shadow-lg">
                <span className="text-2xl font-bold text-white">{name?.charAt(0)?.toUpperCase() ?? '?'}</span>
            </div>

            {/* Identity */}
            <p className="mt-4 text-base font-bold text-slate-900">{name}</p>
            <p className="text-sm text-slate-500">{email}</p>

            {/* Roles */}
            <div className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors duration-300 hover:bg-slate-100">
                <div className="flex items-center justify-center gap-2">
                    <Shield size={15} className="text-slate-500" />
                    <span className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Assigned Roles</span>
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {assignedRoles.map((role) => (
                        <span
                            key={role}
                            className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition-all duration-200 hover:scale-105 hover:border-emerald-300 hover:bg-emerald-100"
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            {formatRole(role)}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;
