import StatusErrorPage from '@/components/Error/StatusErrorPage';

export default function TooManyRequestsPage() {
    return (
        <StatusErrorPage
            code={429}
            title="Too Many Requests"
            message="You have made too many requests in a short period. Please wait a moment and try again."
            primaryActionLabel="Try Again"
            primaryAction="reload"
        />
    );
}
