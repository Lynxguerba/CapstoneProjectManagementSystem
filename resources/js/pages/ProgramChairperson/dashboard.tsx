import React from 'react';
import Sidebar from '../../components/sidebar';

const Dashboard = () => {
    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* The Modern Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="ml-64 flex-1 p-8">
                <header className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
                    <p className="text-slate-500">Welcome back, Program Chairperson!</p>
                </header>

                {/* Dashboard Cards Example */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">Total Users</p>
                        <h3 className="text-3xl font-bold text-slate-900">150</h3>
                    </div>
                    {/* Add more cards here... */}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
