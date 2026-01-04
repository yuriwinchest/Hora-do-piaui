import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <AdminSidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
