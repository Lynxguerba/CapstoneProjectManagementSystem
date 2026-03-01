import { useForm } from '@inertiajs/react';
import { Settings, UserCheck, X } from 'lucide-react';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

type UserRole = 'admin' | 'student' | 'adviser' | 'instructor' | 'panelist' | 'dean' | 'program_chairperson';
type UserStatus = 'active' | 'inactive';

type ManagedUser = {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
};

type ManageUserActionModalProps = {
    open: boolean;
    user: ManagedUser | null;
    onClose: () => void;
    onSave: (updatedUser: ManagedUser) => void;
};

const roleOptions: UserRole[] = ['admin', 'student', 'adviser', 'instructor', 'panelist', 'dean', 'program_chairperson'];
type ManageUserForm = {
    name: string;
    email: string;
    role: UserRole;
};

const ManageUserActionModal = ({ open, user, onClose, onSave }: ManageUserActionModalProps) => {
    const { data, setData, errors, processing, clearErrors, put } = useForm<ManageUserForm>({
        name: '',
        email: '',
        role: 'student',
    });
    const initializedUserIdRef = React.useRef<number | null>(null);

    useEffect(() => {
        if (user === null) {
            initializedUserIdRef.current = null;
            return;
        }

        if (initializedUserIdRef.current === user.id) {
            return;
        }

        initializedUserIdRef.current = user.id;
        clearErrors();
        setData({
            name: user.name,
            email: user.email,
            role: user.role,
        });
    }, [user, clearErrors, setData]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !processing) {
                onClose();
            }
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose, processing]);

    if (!open || user === null) {
        return null;
    }

    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !processing) {
                    onClose();
                }
            }}
        >
            <div className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-emerald-800" />
                        <h2 className="text-lg font-bold text-emerald-900">Manage User</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 p-4">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <p className="text-sm font-semibold text-emerald-900">Managing account</p>
                        <p className="text-xs text-emerald-800">
                            {user.name} ({user.email})
                        </p>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">Full name</label>
                        <input
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        />
                        {errors.name ? <p className="mt-1 text-xs text-rose-600">{errors.name}</p> : null}
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">Email</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(event) => setData('email', event.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        />
                        {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email}</p> : null}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Role</label>
                            <select
                                value={data.role}
                                onChange={(event) => setData('role', event.target.value as UserRole)}
                                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm capitalize focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                            >
                                {roleOptions.map((role) => (
                                    <option key={role} value={role} className="capitalize">
                                        {role}
                                    </option>
                                ))}
                            </select>
                            {errors.role ? <p className="mt-1 text-xs text-rose-600">{errors.role}</p> : null}
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700">Status</label>
                            <div className="mt-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 capitalize">
                                {user.status}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                        Created at: {user.createdAt}
                    </div>
                </div>

                <div className="border-t border-slate-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3">
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="rounded-lg border-2 border-slate-300 px-5 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:shadow-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() => {
                                put(`/admin/users/${user.id}`, {
                                    preserveScroll: true,
                                    preserveState: false,
                                    onSuccess: () => {
                                        onSave({
                                            ...user,
                                            name: data.name,
                                            email: data.email,
                                            role: data.role,
                                        });
                                        clearErrors();
                                    },
                                });
                            }}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md"
                        >
                            {processing ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <UserCheck className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ManageUserActionModal;
