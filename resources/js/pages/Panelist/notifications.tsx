import { Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Bell, Search } from 'lucide-react';
import React from 'react';
import PanelLayout from './_layout';

type NotificationItem = {
    key: string;
    type: string;
    title: string;
    message: string;
    meta?: string | null;
    event_status?: string | null;
    created_at?: string | null;
    created_at_label: string;
    action_url?: string | null;
    is_read: boolean;
    read_status: 'Read' | 'Unread';
};

type NotificationMeta = {
    types?: string[];
    totalCount?: number;
    unreadCount?: number;
    readCount?: number;
    loadError?: string | null;
    stateEnabled?: boolean;
};

type PanelistNotificationsProps = {
    notifications?: NotificationItem[];
    notificationMeta?: NotificationMeta;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

const typeTone = (type: string): string => {
    const normalizedType = type.toLowerCase();

    if (normalizedType === 'announcement') {
        return 'border-sky-200 bg-sky-50 text-sky-700';
    }

    if (normalizedType === 'schedule') {
        return 'border-teal-200 bg-teal-50 text-teal-700';
    }

    if (normalizedType === 'assignment') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    return 'border-lime-200 bg-lime-50 text-lime-700';
};

const statusTone = (status?: string | null): string => {
    if (!status) {
        return 'border-slate-200 bg-slate-50 text-slate-700';
    }

    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === 'approved' || normalizedStatus === 'published' || normalizedStatus === 'scheduled' || normalizedStatus === 'assigned') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    if (normalizedStatus.includes('revision') || normalizedStatus === 'pending') {
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }

    if (normalizedStatus === 'cancelled' || normalizedStatus === 'rejected') {
        return 'border-rose-200 bg-rose-50 text-rose-700';
    }

    return 'border-slate-200 bg-slate-50 text-slate-700';
};

const PanelistNotifications = () => {
    const { props } = usePage<PanelistNotificationsProps>();
    const notifications = React.useMemo(() => props.notifications ?? [], [props.notifications]);
    const notificationMeta = props.notificationMeta;
    const availableTypes = notificationMeta?.types ?? [];
    const loadError = notificationMeta?.loadError ?? props.flash?.error ?? null;
    const successMessage = props.flash?.success ?? null;
    const stateEnabled = notificationMeta?.stateEnabled ?? false;

    const [query, setQuery] = React.useState('');
    const [typeFilter, setTypeFilter] = React.useState('all');
    const [readFilter, setReadFilter] = React.useState<'all' | 'read' | 'unread'>('all');
    const [isMarkingAllRead, setIsMarkingAllRead] = React.useState(false);
    const [pendingNotificationKeys, setPendingNotificationKeys] = React.useState<string[]>([]);

    const isInitialLoading = props.notifications === undefined || props.notificationMeta === undefined;

    const filteredNotifications = React.useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return notifications.filter((notification) => {
            const matchesType = typeFilter === 'all' || notification.type === typeFilter;
            const matchesReadFilter =
                readFilter === 'all' ||
                (readFilter === 'read' && notification.is_read) ||
                (readFilter === 'unread' && !notification.is_read);

            if (!matchesType || !matchesReadFilter) {
                return false;
            }

            if (normalizedQuery === '') {
                return true;
            }

            const haystack = `${notification.title} ${notification.message} ${notification.meta ?? ''} ${notification.event_status ?? ''}`.toLowerCase();

            return haystack.includes(normalizedQuery);
        });
    }, [notifications, query, typeFilter, readFilter]);

    const unreadFilteredKeys = React.useMemo(() => {
        return filteredNotifications.filter((notification) => !notification.is_read).map((notification) => notification.key);
    }, [filteredNotifications]);

    const mutateNotification = React.useCallback((notificationKey: string, method: 'patch' | 'delete', url: string) => {
        setPendingNotificationKeys((previousKeys) => (previousKeys.includes(notificationKey) ? previousKeys : [...previousKeys, notificationKey]));

        const onFinish = () => {
            setPendingNotificationKeys((previousKeys) => previousKeys.filter((key) => key !== notificationKey));
        };

        if (method === 'delete') {
            router.delete(url, {
                preserveScroll: true,
                preserveState: true,
                onFinish,
            });

            return;
        }

        router.patch(
            url,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onFinish,
            },
        );
    }, []);

    const markAsRead = (notificationKey: string) => {
        mutateNotification(notificationKey, 'patch', `/panelist/notifications/${encodeURIComponent(notificationKey)}/read`);
    };

    const dismissNotification = (notificationKey: string) => {
        mutateNotification(notificationKey, 'delete', `/panelist/notifications/${encodeURIComponent(notificationKey)}`);
    };

    const markAllAsRead = () => {
        if (isMarkingAllRead || unreadFilteredKeys.length === 0) {
            return;
        }

        setIsMarkingAllRead(true);

        router.patch(
            '/panelist/notifications/read-all',
            {
                notification_keys: unreadFilteredKeys,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    setIsMarkingAllRead(false);
                },
            },
        );
    };

    return (
        <PanelLayout title="Notifications" subtitle="Track announcements, assignments, submissions, and defense schedule updates.">
            <div className="space-y-6">

                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm"
                >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                                <Bell className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Notification Feed</p>
                                <p className="text-xs text-slate-500">Filter by type, status, and message content.</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative w-full sm:w-72">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search notifications..."
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>

                            <select
                                value={typeFilter}
                                onChange={(event) => setTypeFilter(event.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            >
                                <option value="all">All Types</option>
                                {availableTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={readFilter}
                                onChange={(event) => setReadFilter(event.target.value as typeof readFilter)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            >
                                <option value="all">All Read States</option>
                                <option value="unread">Unread</option>
                                <option value="read">Read</option>
                            </select>

                            <button
                                type="button"
                                onClick={markAllAsRead}
                                disabled={!stateEnabled || unreadFilteredKeys.length === 0 || isMarkingAllRead}
                                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isMarkingAllRead ? 'Marking...' : 'Mark All Read'}
                            </button>
                        </div>
                    </div>
                </motion.section>

                {loadError ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</div>
                ) : null}

                {successMessage ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
                ) : null}

                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm"
                >
                    <div className="space-y-3">
                        {isInitialLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div key={index} className="h-24 animate-pulse rounded-2xl border border-emerald-100 bg-emerald-50/60" />
                                ))}
                            </div>
                        ) : null}

                        {!isInitialLoading && filteredNotifications.length === 0 ? (
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-10 text-center text-sm text-slate-600">
                                No notifications match the selected filters.
                            </div>
                        ) : null}

                        {!isInitialLoading &&
                            filteredNotifications.map((notification) => {
                                const isPending = pendingNotificationKeys.includes(notification.key);

                                return (
                                    <div
                                        key={notification.key}
                                        className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-white p-5 shadow-sm transition hover:border-emerald-200"
                                    >
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0 space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${typeTone(notification.type)}`}>
                                                        {notification.type}
                                                    </span>
                                                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusTone(notification.event_status)}`}>
                                                        {notification.event_status ?? 'Updated'}
                                                    </span>
                                                    <span
                                                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                                                            notification.is_read
                                                                ? 'border-slate-200 bg-slate-50 text-slate-700'
                                                                : 'border-rose-200 bg-rose-50 text-rose-700'
                                                        }`}
                                                    >
                                                        {notification.read_status}
                                                    </span>
                                                </div>

                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                                                    <p className="mt-1 text-sm text-slate-700">{notification.message}</p>
                                                    {notification.meta ? <p className="mt-1 text-xs text-slate-500">{notification.meta}</p> : null}
                                                </div>

                                                <p className="text-xs text-slate-500">{notification.created_at_label}</p>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {notification.action_url ? (
                                                    <Link
                                                        href={notification.action_url}
                                                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                                    >
                                                        Open
                                                    </Link>
                                                ) : null}

                                                {!notification.is_read && stateEnabled ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => markAsRead(notification.key)}
                                                        disabled={isPending}
                                                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {isPending ? 'Saving...' : 'Mark as Read'}
                                                    </button>
                                                ) : null}

                                                {stateEnabled ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => dismissNotification(notification.key)}
                                                        disabled={isPending}
                                                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {isPending ? 'Saving...' : 'Dismiss'}
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </motion.section>
            </div>
        </PanelLayout>
    );
};

export default PanelistNotifications;
