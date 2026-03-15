import React from 'react';

export type DefenseRoomFormData = {
    name: string;
    capacity: string;
    notes: string;
    is_active: boolean;
};

type DefenseRoomFormRowProps = {
    data: DefenseRoomFormData;
    errors?: Partial<Record<keyof DefenseRoomFormData, string>>;
    processing?: boolean;
    isEditing?: boolean;
    onChange: (field: keyof DefenseRoomFormData, value: string | boolean) => void;
    onSubmit: () => void;
    onCancel?: () => void;
};

const DefenseRoomFormRow = ({
    data,
    errors = {},
    processing = false,
    isEditing = false,
    onChange,
    onSubmit,
    onCancel,
}: DefenseRoomFormRowProps) => {
    return (
        <tr className="bg-emerald-50/70">
            <td className="px-4 py-3">
                <input
                    value={data.name}
                    onChange={(event) => onChange('name', event.target.value)}
                    placeholder="Room name"
                    aria-label="Room name"
                    disabled={processing}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                {errors.name ? <p className="mt-1 text-[10px] text-rose-600">{errors.name}</p> : null}
            </td>
            <td className="px-4 py-3">
                <input
                    type="number"
                    min={1}
                    value={data.capacity}
                    onChange={(event) => onChange('capacity', event.target.value)}
                    placeholder="Capacity"
                    aria-label="Capacity"
                    disabled={processing}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                {errors.capacity ? <p className="mt-1 text-[10px] text-rose-600">{errors.capacity}</p> : null}
            </td>
            <td className="px-4 py-3">
                <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(event) => onChange('is_active', event.target.checked)}
                        disabled={processing}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Active
                </label>
                {errors.is_active ? <p className="mt-1 text-[10px] text-rose-600">{errors.is_active}</p> : null}
            </td>
            <td className="px-4 py-3">
                <input
                    value={data.notes}
                    onChange={(event) => onChange('notes', event.target.value)}
                    placeholder="Notes"
                    aria-label="Notes"
                    disabled={processing}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                {errors.notes ? <p className="mt-1 text-[10px] text-rose-600">{errors.notes}</p> : null}
            </td>
            <td className="px-4 py-3 text-right">
                <div className="flex flex-wrap justify-end gap-2">
                    {isEditing ? (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={processing}
                            className="rounded-md border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                    ) : null}
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={processing}
                        className="rounded-md bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? 'Saving...' : isEditing ? 'Update' : 'Add Room'}
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default DefenseRoomFormRow;
