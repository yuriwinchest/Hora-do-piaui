import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, FileText, LayoutGrid, Plus, Sliders } from 'lucide-react';
import { NewsItem } from '../../types';

interface AdminDashboardProps {
    items: NewsItem[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ items }) => {
    // Ensure we have items logic
    const publishedCount = items ? items.filter(i => i.status === 'published').length : 0;
    const draftCount = items ? items.filter(i => i.status === 'draft').length : 0;

    const stats = [
        { label: 'Publicadas', value: publishedCount, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
        { label: 'Rascunhos', value: draftCount, icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'Geral', value: items ? items.filter(i => i.category === 'geral').length : 0, icon: LayoutGrid, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Política', value: items ? items.filter(i => i.category === 'politica').length : 0, icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Painel de Controle</h1>
                <p className="text-gray-500 font-bold">Bem-vindo de volta ao editor do Hora Piauí.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Novo Conteúdo</h3>
                        <p className="text-gray-500 font-bold mb-6 text-sm">Crie uma nova notícia em qualquer categoria.</p>
                    </div>
                    <Link
                        to="/admin/noticia/nova"
                        className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-black text-white font-black hover:bg-gray-800 transition-all shadow-xl shadow-black/10 w-full"
                    >
                        <Plus size={20} />
                        Nova Notícia
                    </Link>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Capa do Site</h3>
                        <p className="text-gray-500 font-bold mb-6 text-sm">Configure os destaques da página inicial.</p>
                    </div>
                    <Link
                        to="/admin/layout"
                        className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-black font-black hover:bg-gray-50 transition-all w-full"
                    >
                        <Sliders size={20} />
                        Configurar Home
                    </Link>
                </div>

                <div className="bg-primary/5 p-8 rounded-2xl border border-primary/10 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-black text-primary mb-2">Tutorial Rápido</h3>
                        <p className="text-primary/70 font-bold mb-6 text-sm leading-relaxed">
                            Você pode salvar rascunhos sem que eles apareçam no site. Quando estiver tudo pronto, clique em "Publicar" para que a notícia fique visível para os leitores.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
