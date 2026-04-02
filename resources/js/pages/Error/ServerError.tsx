import { Head } from '@inertiajs/react';
import ServerErrorPage from '@/components/Error/ServerErrorPage';

export default function ServerError() {
    return (
        <>
            <Head title="500 - Server Error" />
            <ServerErrorPage />
        </>
    );
}
