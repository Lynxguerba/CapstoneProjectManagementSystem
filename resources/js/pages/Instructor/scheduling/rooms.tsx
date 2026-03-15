import { Link, router, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight, PencilLine, Trash2 } from 'lucide-react';
import React from 'react';
import DefenseRoomFormRow, { DefenseRoomFormData } from '../../../components/Instructor/scheduling/AddDefenseRoomModal';
import InstructorLayout from '../_layout';

type RoomRow = {
    id: number;
    name: string;
    capacity: number;
    is_active: boolean;
    notes?: string | null;
};

type ManageRoomsPageProps = {
    rooms?: RoomRow[];
};

const emptyFormState: DefenseRoomFormData = {
    name: '',
    capacity: '',
    notes: '',
    is_active: true,
};

const ManageDefenseRoomsPage = () => {
    const { props } = usePage<ManageRoomsPageProps>();
    const rooms = props.rooms ?? [];

    const form = useForm<DefenseRoomFormData>(emptyFormState);
    const [editingRoom, setEditingRoom] = React.useState<RoomRow | null>(null);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [processingRoomId, setProcessingRoomId] = React.useState<number | null>(null);

    React.useEffect(() => {
        if (editingRoom) {
            form.setData({
                name: editingRoom.name ?? '',
                capacity: editingRoom.capacity ? String(editingRoom.capacity) : '',
                notes: editingRoom.notes ?? '',
                is_active: editingRoom.is_active,
            });
        } else {
            form.reset();
        }

        form.clearErrors();
        setErrorMessage('');
    }, [editingRoom]);

    const handleSubmit = () => {
        setErrorMessage('');

        if (editingRoom) {
            form.patch(`/instructor/defense-rooms/${editingRoom.id}`, {
                preserveScroll: true,
                onError: (errors) => {
                    const firstError = errors.name || errors.capacity || errors.notes || errors.is_active;
                    if (firstError) {
                        setErrorMessage(firstError);
                    }
                },
                onSuccess: () => {
                    setEditingRoom(null);
                },
            });
            return;
        }

        form.post('/instructor/defense-rooms', {
            preserveScroll: true,
            onError: (errors) => {
                const firstError = errors.name || errors.capacity || errors.notes || errors.is_active;
                if (firstError) {
                    setErrorMessage(firstError);
                }
            },
            onSuccess: () => {
                form.reset();
            },
        });
    };

    const handleDelete = (room: RoomRow) => {
        if (!confirm(`Remove ${room.name}? This cannot be undone.`)) {
            return;
        }

        setProcessingRoomId(room.id);
        setErrorMessage('');

        router.delete(`/instructor/defense-rooms/${room.id}`, {
            preserveScroll: true,
            onError: (errors) => {
                if (errors.room) {
                    setErrorMessage(errors.room);
                }
            },
            onSuccess: () => {
                if (editingRoom?.id === room.id) {
                    setEditingRoom(null);
                }
            },
            onFinish: () => {
                setProcessingRoomId(null);
            },
        });
    };

    return (
        <InstructorLayout title="Manage Defense Rooms" subtitle="Add, update, or remove rooms used for defense scheduling">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/instructor/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link href="/instructor/scheduling" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Defense Scheduling
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Manage Rooms
                    </span>
                </nav>

                {errorMessage ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                        {errorMessage}
                    </div>
                ) : null}

                <div className="text-xs text-slate-500">
                    Use the first row to add a room. Edit or remove existing rooms from the actions column.
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Room</th>
                                <th className="px-4 py-3">Capacity</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Notes</th>
                                <th className="px-4 py-3 text-right w-40">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <DefenseRoomFormRow
                                data={form.data}
                                errors={form.errors}
                                processing={form.processing}
                                isEditing={Boolean(editingRoom)}
                                onChange={(field, value) => form.setData(field, value)}
                                onSubmit={handleSubmit}
                                onCancel={() => setEditingRoom(null)}
                            />
                            {rooms.map((room, index) => {
                                const isProcessing = processingRoomId === room.id;

                                return (
                                    <tr
                                        key={room.id}
                                        className={`transition-colors hover:bg-emerald-50/30 ${
                                            index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                                        }`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-800">{room.name}</div>
                                            {editingRoom?.id === room.id ? (
                                                <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                                    Editing
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{room.capacity}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                                                    room.is_active
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-slate-200 text-slate-600'
                                                }`}
                                            >
                                                {room.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {room.notes ? room.notes : <span className="text-slate-400">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingRoom(room)}
                                                    disabled={form.processing}
                                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <PencilLine className="h-3 w-3" />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(room)}
                                                    disabled={isProcessing}
                                                    className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                    Remove
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {rooms.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500">No rooms found. Add the first room above.</div>
                    ) : null}
                </div>
            </motion.section>
        </InstructorLayout>
    );
};

export default ManageDefenseRoomsPage;
