import { Head } from '@inertiajs/react';
import UnauthorizedPage from '@/components/Error/UnauthorizedPage';

export default function Unauthorized() {
    return (
        <>
            <Head title="401 - Unauthorized" />
            <UnauthorizedPage />
        </>
    );
}
