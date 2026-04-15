import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import React, { useEffect } from 'react';

export type NotificationTone = 'success' | 'warning' | 'error';

export type NotificationData = {
    tone: NotificationTone;
    title: string;
    message: string;
};

interface NotificationProps {
    notification: NotificationData | null;
    onDismiss: () => void;
    duration?: number;
}

const Notification: React.FC<NotificationProps> = ({ notification, onDismiss, duration = 4500 }) => {
    useEffect(() => {
        if (!notification) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            onDismiss();
        }, duration);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [notification, onDismiss, duration]);

    return (
        <AnimatePresence initial={false}>
            {notification ? (
                <motion.div
                    initial={{ opacity: 0, y: -16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="pointer-events-none fixed inset-x-0 top-3 z-[10000] flex justify-center px-3 sm:top-4 sm:justify-end sm:px-6"
                >
                    <div
                        role="alert"
                        className={`pointer-events-auto w-full max-w-[30rem] overflow-hidden rounded-2xl border px-4 py-3 shadow-xl ring-1 ring-black/5 sm:w-fit sm:min-w-[22rem] ${
                            notification.tone === 'error'
                                ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-red-50'
                                : notification.tone === 'warning'
                                  ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50'
                                  : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <span
                                className={`mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${
                                    notification.tone === 'error'
                                        ? 'bg-rose-100 text-rose-600'
                                        : notification.tone === 'warning'
                                          ? 'bg-amber-100 text-amber-600'
                                          : 'bg-emerald-100 text-emerald-600'
                                }`}
                            >
                                {notification.tone === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p
                                    className={`text-xs font-bold ${
                                        notification.tone === 'error'
                                            ? 'text-rose-700'
                                            : notification.tone === 'warning'
                                              ? 'text-amber-700'
                                              : 'text-emerald-700'
                                    }`}
                                >
                                    {notification.title}
                                </p>
                                <p
                                    className={`mt-1 text-xs font-medium ${
                                        notification.tone === 'error'
                                            ? 'text-rose-700/90'
                                            : notification.tone === 'warning'
                                              ? 'text-amber-700/90'
                                              : 'text-emerald-700/90'
                                    }`}
                                >
                                    {notification.message}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onDismiss}
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                                    notification.tone === 'error'
                                        ? 'border-rose-200 text-rose-500 hover:bg-rose-100'
                                        : notification.tone === 'warning'
                                          ? 'border-amber-200 text-amber-500 hover:bg-amber-100'
                                          : 'border-emerald-200 text-emerald-500 hover:bg-emerald-100'
                                }`}
                                aria-label="Dismiss notification"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div
                            className={`mt-3 h-1 w-full overflow-hidden rounded-full ${
                                notification.tone === 'error' ? 'bg-rose-100' : notification.tone === 'warning' ? 'bg-amber-100' : 'bg-emerald-100'
                            }`}
                        >
                            <motion.div
                                key={`${notification.tone}-${notification.message}`}
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{ duration: duration / 1000, ease: 'linear' }}
                                className={`h-full ${
                                    notification.tone === 'error'
                                        ? 'bg-rose-400'
                                        : notification.tone === 'warning'
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-500'
                                }`}
                            />
                        </div>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
};

export default Notification;
