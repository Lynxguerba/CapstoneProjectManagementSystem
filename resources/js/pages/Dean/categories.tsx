import { Link, router, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, ChevronRight, PencilLine, Plus, Save, Tags, Trash2, X } from 'lucide-react';
import React from 'react';
import DeleteCategoryModal from '../../components/Dean/DeleteCategoryModal';

import DeanLayout from './_layout';

type ProgramCode = 'BSIT' | 'BSIS';

type CategoryRow = {
    id: number;
    program: ProgramCode;
    name: string;
    description?: string | null;
    linkedProjectsCount?: number;
    projectStatusCounts?: Array<{
        status: string;
        count: number;
    }>;
};

type CategoriesPageProps = {
    categoriesByProgram?: Record<ProgramCode, CategoryRow[]>;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

type CategoryEditFormData = {
    name: string;
    description: string;
};

const programMeta: Record<ProgramCode, { label: string; accent: string; panel: string }> = {
    BSIT: {
        label: 'BSIT Categories',
        accent: 'text-sky-700',
        panel: 'border-sky-200 bg-sky-50/30',
    },
    BSIS: {
        label: 'BSIS Categories',
        accent: 'text-emerald-700',
        panel: 'border-emerald-200 bg-emerald-50/30',
    },
};

const DeanCategoriesPage = () => {
    const { props } = usePage<CategoriesPageProps>();
    const categoriesByProgram = React.useMemo(
        () => props.categoriesByProgram ?? { BSIT: [], BSIS: [] },
        [props.categoriesByProgram],
    );
    const flashSuccess = props.flash?.success ?? '';
    const flashError = props.flash?.error ?? '';

    const editForm = useForm<CategoryEditFormData>({
        name: '',
        description: '',
    });

    const [errorMessage, setErrorMessage] = React.useState('');
    const [successMessage, setSuccessMessage] = React.useState('');
    const [editingCategory, setEditingCategory] = React.useState<CategoryRow | null>(null);
    const [draftByProgram, setDraftByProgram] = React.useState<Record<ProgramCode, { name: string; description: string }>>({
        BSIT: { name: '', description: '' },
        BSIS: { name: '', description: '' },
    });
    const [creatingProgram, setCreatingProgram] = React.useState<ProgramCode | null>(null);
    const [pendingDeleteCategory, setPendingDeleteCategory] = React.useState<CategoryRow | null>(null);
    const [processingCategoryId, setProcessingCategoryId] = React.useState<number | null>(null);

    const dismissNotification = React.useCallback(() => {
        setErrorMessage('');
        setSuccessMessage('');
    }, []);

    React.useEffect(() => {
        if (flashSuccess) {
            setSuccessMessage(flashSuccess);
        }
    }, [flashSuccess]);

    React.useEffect(() => {
        if (flashError) {
            setErrorMessage(flashError);
        }
    }, [flashError]);

    React.useEffect(() => {
        if (!errorMessage && !successMessage) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            dismissNotification();
        }, 4500);

        return () => window.clearTimeout(timeoutId);
    }, [dismissNotification, errorMessage, successMessage]);

    const setDraftValue = (program: ProgramCode, field: 'name' | 'description', value: string) => {
        setDraftByProgram((previous) => ({
            ...previous,
            [program]: {
                ...previous[program],
                [field]: value,
            },
        }));
    };

    const toErrorText = (value: unknown): string => {
        if (typeof value === 'string') {
            return value;
        }

        if (Array.isArray(value) && typeof value[0] === 'string') {
            return value[0];
        }

        return '';
    };

    const resolveFirstError = (errors: Record<string, unknown>) => {
        return toErrorText(errors.name) || toErrorText(errors.program) || toErrorText(errors.description) || toErrorText(errors.category);
    };

    const notification = React.useMemo(() => {
        if (errorMessage) {
            return {
                tone: 'error' as const,
                title: 'Unable to Save Category',
                message: errorMessage,
            };
        }

        if (successMessage) {
            return {
                tone: 'success' as const,
                title: 'Category Saved',
                message: successMessage,
            };
        }

        return null;
    }, [errorMessage, successMessage]);

    const handleCreate = (program: ProgramCode) => {
        const draft = draftByProgram[program];
        const categoryName = draft.name.trim();
        const description = draft.description.trim();

        if (categoryName === '') {
            setSuccessMessage('');
            setErrorMessage(`Please enter a category name for ${program} before adding.`);
            return;
        }

        setErrorMessage('');
        setSuccessMessage('');
        setCreatingProgram(program);

        router.post(
            '/dean/categories',
            {
                program,
                name: categoryName,
                description,
            },
            {
                preserveScroll: true,
                onError: (errors) => {
                    const firstError = resolveFirstError(errors);
                    if (firstError) {
                        setSuccessMessage('');
                        setErrorMessage(firstError);
                    }
                },
                onSuccess: () => {
                    setDraftByProgram((previous) => ({
                        ...previous,
                        [program]: { name: '', description: '' },
                    }));
                    setErrorMessage('');
                    setSuccessMessage(`Category added successfully to ${program}.`);
                },
                onFinish: () => {
                    setCreatingProgram(null);
                },
            },
        );
    };

    const beginEdit = (category: CategoryRow) => {
        setErrorMessage('');
        setSuccessMessage('');
        setEditingCategory(category);
        editForm.setData({
            name: category.name,
            description: category.description ?? '',
        });
        editForm.clearErrors();
    };

    const cancelEdit = () => {
        setEditingCategory(null);
        editForm.reset();
        editForm.clearErrors();
    };

    const handleUpdate = (category: CategoryRow) => {
        setErrorMessage('');
        setSuccessMessage('');

        editForm.put(`/dean/categories/${category.id}`, {
            preserveScroll: true,
            onError: (errors) => {
                const firstError = resolveFirstError(errors);
                if (firstError) {
                    setErrorMessage(firstError);
                }
            },
            onSuccess: () => {
                cancelEdit();
                setSuccessMessage(`Category updated successfully for ${category.program}.`);
            },
        });
    };

    const handleDelete = (category: CategoryRow) => {
        if (processingCategoryId !== null) {
            return;
        }

        setErrorMessage('');
        setSuccessMessage('');
        setPendingDeleteCategory(category);
    };

    const confirmDelete = () => {
        if (!pendingDeleteCategory) {
            return;
        }

        const category = pendingDeleteCategory;
        setPendingDeleteCategory(null);
        setErrorMessage('');
        setSuccessMessage('');
        setProcessingCategoryId(category.id);

        router.delete(`/dean/categories/${category.id}`, {
            preserveScroll: true,
            onError: (errors) => {
                const firstError = resolveFirstError(errors);
                if (firstError) {
                    setErrorMessage(firstError);
                }
            },
                onSuccess: () => {
                    if (editingCategory?.id === category.id) {
                        cancelEdit();
                    }
                    setPendingDeleteCategory(null);
                    setSuccessMessage(`Category removed successfully from ${category.program}.`);
                },
                onFinish: () => {
                    setProcessingCategoryId(null);
                },
        });
    };

    const renderProgramCard = (program: ProgramCode) => {
        const items = categoriesByProgram[program] ?? [];
        const meta = programMeta[program];
        const draft = draftByProgram[program];

        return (
            <div key={program} className={`rounded-2xl border p-4 shadow-sm ${meta.panel}`}>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className={`text-sm font-bold ${meta.accent}`}>{meta.label}</h3>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">{items.length} total</span>
                </div>

                <div className="mb-4 grid gap-2 rounded-xl border border-white/70 bg-white p-3 md:grid-cols-[1.2fr_1.8fr_auto]">
                    <input
                        value={draft.name}
                        onChange={(event) => setDraftValue(program, 'name', event.target.value)}
                        placeholder={`Add new ${program} category`}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <input
                        value={draft.description}
                        onChange={(event) => setDraftValue(program, 'description', event.target.value)}
                        placeholder="Category description (optional)"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                        type="button"
                        onClick={() => handleCreate(program)}
                        disabled={creatingProgram !== null}
                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        {creatingProgram === program ? 'Adding...' : 'Add'}
                    </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                            <tr>
                                <th className="px-4 py-3">Category Name</th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3">Student Project Status</th>
                                <th className="w-44 px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((category, index) => {
                                const isEditing = editingCategory?.id === category.id;
                                const isDeleting = processingCategoryId === category.id;

                                return (
                                    <tr
                                        key={category.id}
                                        className={`transition-colors hover:bg-emerald-50/30 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                                    >
                                        <td className="px-4 py-3 align-top">
                                            {isEditing ? (
                                                <input
                                                    value={editForm.data.name}
                                                    onChange={(event) => editForm.setData('name', event.target.value)}
                                                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 outline-none focus:border-emerald-500"
                                                />
                                            ) : (
                                                <p className="font-semibold text-slate-800">{category.name}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top text-slate-600">
                                            {isEditing ? (
                                                <input
                                                    value={editForm.data.description}
                                                    onChange={(event) => editForm.setData('description', event.target.value)}
                                                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 outline-none focus:border-emerald-500"
                                                />
                                            ) : category.description ? (
                                                category.description
                                            ) : (
                                                <span className="text-slate-400">No description</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="space-y-1.5">
                                                <p className="text-[11px] font-semibold text-slate-700">
                                                    {category.linkedProjectsCount ?? 0} linked student project
                                                    {(category.linkedProjectsCount ?? 0) === 1 ? '' : 's'}
                                                </p>
                                                {category.projectStatusCounts && category.projectStatusCounts.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {category.projectStatusCounts.map((statusItem) => (
                                                            <span
                                                                key={`${category.id}-${statusItem.status}`}
                                                                className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                                                            >
                                                                {statusItem.status}: {statusItem.count}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-[11px] text-slate-400">No linked statuses yet.</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right align-top">
                                            <div className="flex justify-end gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdate(category)}
                                                            disabled={editForm.processing}
                                                            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-2 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
                                                        >
                                                            <Save className="h-3 w-3" />
                                                            Save
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={cancelEdit}
                                                            disabled={editForm.processing}
                                                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
                                                        >
                                                            <X className="h-3 w-3" />
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => beginEdit(category)}
                                                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100"
                                                        >
                                                            <PencilLine className="h-3 w-3" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(category)}
                                                            disabled={isDeleting}
                                                            className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                            Remove
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {items.length === 0 ? <div className="p-6 text-center text-xs text-slate-500">No categories added yet for {program}.</div> : null}
                </div>
            </div>
        );
    };

    return (
        <DeanLayout title="Project Categories" subtitle="Manage BSIT and BSIS category options for Dean project review">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
                <AnimatePresence initial={false}>
                    {notification ? (
                        <motion.div
                            key={`${notification.tone}-${notification.message}`}
                            initial={{ opacity: 0, y: -16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -12, scale: 0.98 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-4 sm:justify-end sm:px-6"
                        >
                            <div
                                role="alert"
                                className={`pointer-events-auto w-full max-w-[30rem] overflow-hidden rounded-2xl border px-4 py-3 shadow-xl ring-1 ring-black/5 sm:w-fit sm:min-w-[22rem] ${
                                    notification.tone === 'error'
                                        ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-red-50'
                                        : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span
                                        className={`mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${
                                            notification.tone === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                                        }`}
                                    >
                                        {notification.tone === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-xs font-bold ${notification.tone === 'error' ? 'text-rose-700' : 'text-emerald-700'}`}>
                                            {notification.title}
                                        </p>
                                        <p
                                            className={`mt-1 text-xs font-medium ${notification.tone === 'error' ? 'text-rose-700/90' : 'text-emerald-700/90'}`}
                                        >
                                            {notification.message}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={dismissNotification}
                                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                                            notification.tone === 'error'
                                                ? 'border-rose-200 text-rose-500 hover:bg-rose-100'
                                                : 'border-emerald-200 text-emerald-500 hover:bg-emerald-100'
                                        }`}
                                        aria-label="Dismiss notification"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <div
                                    className={`mt-3 h-1 w-full overflow-hidden rounded-full ${
                                        notification.tone === 'error' ? 'bg-rose-100' : 'bg-emerald-100'
                                    }`}
                                >
                                    <motion.div
                                        key={`${notification.tone}-${notification.message}`}
                                        initial={{ width: '100%' }}
                                        animate={{ width: '0%' }}
                                        transition={{ duration: 4.5, ease: 'linear' }}
                                        className={`h-full ${notification.tone === 'error' ? 'bg-rose-400' : 'bg-emerald-500'}`}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                <DeleteCategoryModal
                    open={pendingDeleteCategory !== null}
                    categoryName={pendingDeleteCategory?.name ?? ''}
                    program={pendingDeleteCategory?.program ?? ''}
                    processing={processingCategoryId === pendingDeleteCategory?.id}
                    onClose={() => {
                        if (processingCategoryId !== null) {
                            return;
                        }

                        setPendingDeleteCategory(null);
                    }}
                    onConfirm={confirmDelete}
                />

                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/dean/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Categories
                    </span>
                </nav>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
                    <p className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                        <Tags className="h-4 w-4 text-emerald-600" />
                        Category Assignment Rule
                    </p>
                    <p className="mt-1">Only categories under the same group program (BSIT or BSIS) are shown in Set Project Category inside Project Details.</p>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">{(['BSIT', 'BSIS'] as ProgramCode[]).map((program) => renderProgramCard(program))}</div>
            </motion.section>
        </DeanLayout>
    );
};

export default DeanCategoriesPage;
