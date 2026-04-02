import { Head } from '@inertiajs/react';
import ServiceUnavailablePage from '@/components/Error/ServiceUnavailablePage';

export default function ServiceUnavailable() {
    return (
        <>
            <Head title="503 - Service Unavailable" />
            <ServiceUnavailablePage />
        </>
    );
}
