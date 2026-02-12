import React from 'react';

export default function Dashboard({ user }: { user: string }) {
    return (
        <div>
            <h1>Welcome, {user}!</h1>
            <p>This is your new page.</p>
        </div>
    );
}