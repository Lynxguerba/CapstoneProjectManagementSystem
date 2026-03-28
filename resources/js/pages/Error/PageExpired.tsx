import { Head } from '@inertiajs/react';
import PageExpiredPage from '@/components/Error/PageExpiredPage';

export default function PageExpired() {
    return (
        <>
            <Head title="419 - Page Expired" />
            <PageExpiredPage />
        </>
    );
}
