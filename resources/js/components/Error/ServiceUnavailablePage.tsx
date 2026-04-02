import StatusErrorPage from '@/components/Error/StatusErrorPage';

export default function ServiceUnavailablePage() {
    return (
        <StatusErrorPage
            code={503}
            title="Service Unavailable"
            message="The service is temporarily unavailable. Please try again in a few minutes."
            primaryActionLabel="Retry"
            primaryAction="reload"
        />
    );
}
