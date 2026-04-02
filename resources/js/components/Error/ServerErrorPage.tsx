import StatusErrorPage from '@/components/Error/StatusErrorPage';

export default function ServerErrorPage() {
    return (
        <StatusErrorPage
            code={500}
            title="Internal Server Error"
            message="Something went wrong on our side while processing your request. Please try again."
            primaryActionLabel="Reload"
            primaryAction="reload"
        />
    );
}
