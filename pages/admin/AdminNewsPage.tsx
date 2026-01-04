import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import AdminNewsList from '../../components/admin/AdminNewsList';
import { NewsItem } from '../../types';

interface AdminNewsPageProps {
    items: NewsItem[];
    onDelete: (id: string) => Promise<void>;
    onPublish: (id: string) => Promise<void>;
}

const AdminNewsPage: React.FC<AdminNewsPageProps> = ({ items, onDelete, onPublish }) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gerenciar Notícias</h1>
                    <p className="text-gray-500 font-bold">Liste, edite ou remova conteúdos do site.</p>
                </div>
                <Link
                    to="/admin/noticia/nova"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white font-black rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
                >
                    <Plus size={20} />
                    Nova Notícia
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <AdminNewsList items={items} onDelete={onDelete} onPublish={onPublish} />
            </div>
        </div>
    );
};
export default AdminNewsPage;
