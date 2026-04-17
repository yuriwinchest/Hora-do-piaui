import React from 'react';
import { LayoutDashboard, FileText, Settings, LogOut, PlusCircle, Video, LayoutGrid, User, Tv, Megaphone, X, BarChart3 } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        navigate('/admin/login');
    };

    const navItems = [
        { label: 'Painel', href: '/admin', icon: LayoutDashboard },
        { label: 'Monitoramento', href: '/admin/monitoramento', icon: BarChart3 },
        { label: 'Configurar Home', href: '/admin/layout', icon: LayoutGrid },
        { label: 'Banner Dinâmico', href: '/admin/banner', icon: Tv },
        { label: 'Publicidade', href: '/admin/publicidade', icon: Megaphone },
        { label: 'Notícias', href: '/admin/noticias', icon: FileText },
        { label: 'Coluna Mariano', href: '/admin/noticias?category=coluna-mariano', icon: User },
        { label: 'Vídeos', href: '/admin/videos', icon: Video },
        { label: 'Nova Notícia', href: '/admin/noticia/nova', icon: PlusCircle },
        { label: 'Configurações', href: '/admin/configuracoes', icon: Settings },
    ];

    return (
        <>
            {/* Overlay para mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside className={`
                w-64 bg-white border-r border-gray-200 flex flex-col h-full 
                fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
                md:translate-x-0 md:static md:h-screen md:sticky md:top-0
                ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/assets/logo.png" alt="Logo" className="h-8 w-auto" />
                        <span className="font-black text-gray-800 tracking-tight">ADMIN</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Fechar menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            end={item.href === '/admin'}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all ${isActive
                                    ? 'bg-primary/10 text-primary shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-lg font-bold text-red-500 hover:bg-red-50 transition-all">
                        <LogOut size={20} />
                        Sair
                    </button>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;
