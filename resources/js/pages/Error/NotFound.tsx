import { Head } from '@inertiajs/react';
import NotFoundPage from '@/components/Error/NotFoundPage';

export default function NotFound() {
    return (
        <>
            <Head title="404 - Page Not Found" />
            <NotFoundPage />
        </>
    );
}
