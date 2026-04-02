import { Head } from '@inertiajs/react';
import TooManyRequestsPage from '@/components/Error/TooManyRequestsPage';

export default function TooManyRequests() {
    return (
        <>
            <Head title="429 - Too Many Requests" />
            <TooManyRequestsPage />
        </>
    );
}
