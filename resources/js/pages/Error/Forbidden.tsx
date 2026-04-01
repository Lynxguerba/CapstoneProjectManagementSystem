import { Head } from '@inertiajs/react';
import ForbiddenPage from '@/components/Error/ForbiddenPage';

export default function Forbidden() {
    return (
        <>
            <Head title="403 - Forbidden" />
            <ForbiddenPage />
        </>
    );
}
