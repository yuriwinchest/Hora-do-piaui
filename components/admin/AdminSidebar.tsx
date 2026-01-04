import React from 'react';
import { LayoutDashboard, FileText, Settings, LogOut, PlusCircle, Video } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const AdminSidebar: React.FC = () => {
    const navItems = [
        { label: 'Painel', href: '/admin', icon: LayoutDashboard },
        { label: 'Configurar Home', href: '/admin/layout', icon: LayoutGrid },
        { label: 'Notícias', href: '/admin/noticias', icon: FileText },
        { label: 'Vídeos', href: '/admin/videos', icon: Video },
        { label: 'Nova Notícia', href: '/admin/noticia/nova', icon: PlusCircle },
        { label: 'Configurações', href: '/admin/configuracoes', icon: Settings },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full sticky top-0">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <img src="/assets/logo.png" alt="Logo" className="h-8 w-auto" />
                <span className="font-black text-gray-800 tracking-tight">ADMIN</span>
            </div>

            <nav className="flex-1 p-4 flex flex-col gap-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        end={item.href === '/admin'}
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
                <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg font-bold text-red-500 hover:bg-red-50 transition-all">
                    <LogOut size={20} />
                    Sair
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
