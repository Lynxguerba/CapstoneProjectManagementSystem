import StatusErrorPage from '@/components/Error/StatusErrorPage';

export default function UnauthorizedPage() {
    return (
        <StatusErrorPage
            code={401}
            title="Unauthorized"
            message="You need to sign in before accessing this page."
            primaryActionLabel="Go to Login"
            primaryAction="login"
        />
    );
}
