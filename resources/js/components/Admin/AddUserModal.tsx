import { useForm } from '@inertiajs/react';
import { UserPlus, X } from 'lucide-react';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

type UserRole = 'admin' | 'student' | 'adviser' | 'instructor' | 'panelist' | 'dean' | 'program_chairperson';

type AddUserModalProps = {
    open: boolean;
    onClose: () => void;
    availableRoles?: UserRole[];
};

type AddUserForm = {
    name: string;
    email: string;
    role: UserRole;
    password: string;
};

const defaultRoles: UserRole[] = ['admin', 'student', 'adviser', 'instructor', 'panelist', 'dean', 'program_chairperson'];

const AddUserModal = ({ open, onClose, availableRoles = defaultRoles }: AddUserModalProps) => {
    const addUserForm = useForm<AddUserForm>({
        name: '',
        email: '',
        role: availableRoles[0] ?? 'student',
        password: '',
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !addUserForm.processing) {
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
    }, [open, onClose, addUserForm.processing]);

    const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        addUserForm.post('/admin/users', {
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => {
                addUserForm.reset();
                onClose();
            },
        });
    };

    if (!open) {
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
                if (event.target === event.currentTarget && !addUserForm.processing) {
                    onClose();
                }
            }}
        >
            <div
                className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-emerald-800" />
                        <h2 className="text-lg font-bold text-emerald-900">Add User</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={addUserForm.processing}
                        className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={submitForm} className="space-y-4 p-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-700">Full name</label>
                        <input
                            value={addUserForm.data.name}
                            onChange={(event) => addUserForm.setData('name', event.target.value)}
                            placeholder="Juan Dela Cruz"
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        />
                        {addUserForm.errors.name ? <p className="mt-1 text-xs text-rose-600">{addUserForm.errors.name}</p> : null}
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">Email</label>
                        <input
                            type="email"
                            value={addUserForm.data.email}
                            onChange={(event) => addUserForm.setData('email', event.target.value)}
                            placeholder="user@campus.edu"
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        />
                        {addUserForm.errors.email ? <p className="mt-1 text-xs text-rose-600">{addUserForm.errors.email}</p> : null}
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">Role</label>
                        <select
                            value={addUserForm.data.role}
                            onChange={(event) => addUserForm.setData('role', event.target.value as UserRole)}
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm capitalize focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        >
                            {availableRoles.map((role) => (
                                <option key={role} value={role} className="capitalize">
                                    {role}
                                </option>
                            ))}
                        </select>
                        {addUserForm.errors.role ? <p className="mt-1 text-xs text-rose-600">{addUserForm.errors.role}</p> : null}
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">Temporary password</label>
                        <input
                            type="password"
                            value={addUserForm.data.password}
                            onChange={(event) => addUserForm.setData('password', event.target.value)}
                            placeholder="At least 8 characters"
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        />
                        {addUserForm.errors.password ? <p className="mt-1 text-xs text-rose-600">{addUserForm.errors.password}</p> : null}
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={addUserForm.processing}
                            className="rounded-lg border-2 border-slate-300 px-5 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={addUserForm.processing}
                            className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {addUserForm.processing ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
};

export default AddUserModal;
