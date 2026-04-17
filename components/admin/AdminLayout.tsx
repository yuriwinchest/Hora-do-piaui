import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
    children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        <div className="flex min-h-screen bg-gray-50/50 flex-col md:flex-row">
            
            {/* Header Mobile */}
            <div className="md:hidden bg-white p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                     <img src="/assets/logo.png" alt="Logo" className="h-8 w-auto" />
                     <span className="font-black text-gray-800 tracking-tight">ADMIN</span>
                </div>
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Abrir menu"
                >
                    <Menu size={24} />
                </button>
            </div>

            <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                <div className="max-w-6xl mx-auto">
                    {children || <Outlet />}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
