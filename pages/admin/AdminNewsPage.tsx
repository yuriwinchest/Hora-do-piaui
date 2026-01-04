
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, X, Check, LayoutGrid, CheckCircle2 } from 'lucide-react';
import AdminNewsList from '../../components/admin/AdminNewsList';
import { NewsItem, HomeLayoutConfig } from '../../types';

interface AdminNewsPageProps {
    items: NewsItem[];
    onDelete: (id: string) => Promise<void>;
    onPublish: (id: string) => Promise<void>;
    homeConfig: HomeLayoutConfig;
    onUpdateHomeConfig: (config: HomeLayoutConfig) => Promise<void>;
}

const AdminNewsPage: React.FC<AdminNewsPageProps> = ({ items, onDelete, onPublish, homeConfig, onUpdateHomeConfig }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentCategory = searchParams.get('category') || 'all';
    const [highlightModalOpen, setHighlightModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

    // Filter items based on category
    const filteredItems = currentCategory === 'all'
        ? items
        : items.filter(item => item.category === currentCategory);

    const categories = [
        { id: 'all', label: 'Todas' },
        { id: 'politica', label: 'Política' },
        { id: 'policia', label: 'Polícia' },
        { id: 'geral', label: 'Geral' },
        { id: 'coluna-mariano', label: 'Coluna Mariano' },
    ];

    const handleHighlightClick = (item: NewsItem) => {
        setSelectedNews(item);
        setHighlightModalOpen(true);
    };

    const handleAssignPosition = async (position: string, index?: number) => {
        if (!selectedNews) return;

        const newConfig = { ...homeConfig };

        if (position === 'marianoMainId') {
            newConfig.marianoMainId = selectedNews.id;
        } else if (position === 'marianoListIds' && index !== undefined) {
            const list = [...newConfig.marianoListIds];
            list[index] = selectedNews.id;
            newConfig.marianoListIds = list;
        } else if (position === 'heroTopIds' && index !== undefined) {
            const list = [...newConfig.heroTopIds];
            list[index] = selectedNews.id;
            newConfig.heroTopIds = list;
        } else if (position === 'heroSideIds' && index !== undefined) {
            const list = [...newConfig.heroSideIds];
            list[index] = selectedNews.id;
            newConfig.heroSideIds = list;
        }

        await onUpdateHomeConfig(newConfig);
        setHighlightModalOpen(false);
        setSelectedNews(null);
    };

    // Check where the current news is assigned
    const checkAssignment = (pos: string, idx?: number) => {
        if (!selectedNews) return false;
        if (pos === 'marianoMainId') return homeConfig.marianoMainId === selectedNews.id;
        if (pos === 'marianoListIds' && idx !== undefined) return homeConfig.marianoListIds[idx] === selectedNews.id;
        if (pos === 'heroTopIds' && idx !== undefined) return homeConfig.heroTopIds[idx] === selectedNews.id;
        if (pos === 'heroSideIds' && idx !== undefined) return homeConfig.heroSideIds[idx] === selectedNews.id;
        return false;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gerenciar Notícias</h1>
                    <p className="text-gray-500 font-bold">Liste, edite ou remova conteúdos e defina destaques.</p>
                </div>
                <Link
                    to="/admin/noticia/nova"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white font-black rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
                >
                    <Plus size={20} />
                    Nova Notícia
                </Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-100">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSearchParams({ category: cat.id })}
                        className={`px-4 py-2 rounded-lg text-sm font-black whitespace-nowrap transition-colors ${currentCategory === cat.id
                                ? 'bg-black text-white'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <AdminNewsList
                    items={filteredItems}
                    onDelete={onDelete}
                    onPublish={onPublish}
                    onHighlight={handleHighlightClick}
                />
            </div>

            {/* Highlight Modal */}
            {highlightModalOpen && selectedNews && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">Destacar Notícia</h3>
                                <p className="text-sm text-gray-500 font-bold mt-1 line-clamp-1">{selectedNews.title}</p>
                            </div>
                            <button onClick={() => setHighlightModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* General Sections */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Manchete 1 (Primeira Dobra)</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleAssignPosition('heroTopIds', 0)}
                                        className={`p-3 rounded-xl border text-left flex items-center justify-between group transition-all ${checkAssignment('heroTopIds', 0) ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:border-primary hover:shadow-md'}`}
                                    >
                                        <span className="font-bold text-sm">Esquerda 1</span>
                                        {checkAssignment('heroTopIds', 0) && <CheckCircle2 size={16} className="text-primary" />}
                                    </button>
                                    <button
                                        onClick={() => handleAssignPosition('heroTopIds', 1)}
                                        className={`p-3 rounded-xl border text-left flex items-center justify-between group transition-all ${checkAssignment('heroTopIds', 1) ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:border-primary hover:shadow-md'}`}
                                    >
                                        <span className="font-bold text-sm">Esquerda 2</span>
                                        {checkAssignment('heroTopIds', 1) && <CheckCircle2 size={16} className="text-primary" />}
                                    </button>
                                    <button
                                        onClick={() => handleAssignPosition('heroSideIds', 0)}
                                        className={`p-3 rounded-xl border text-left flex items-center justify-between group transition-all ${checkAssignment('heroSideIds', 0) ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:border-primary hover:shadow-md'}`}
                                    >
                                        <span className="font-bold text-sm">Lateral 1</span>
                                        {checkAssignment('heroSideIds', 0) && <CheckCircle2 size={16} className="text-primary" />}
                                    </button>
                                    <button
                                        onClick={() => handleAssignPosition('heroSideIds', 1)}
                                        className={`p-3 rounded-xl border text-left flex items-center justify-between group transition-all ${checkAssignment('heroSideIds', 1) ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:border-primary hover:shadow-md'}`}
                                    >
                                        <span className="font-bold text-sm">Lateral 2</span>
                                        {checkAssignment('heroSideIds', 1) && <CheckCircle2 size={16} className="text-primary" />}
                                    </button>
                                </div>
                            </div>

                            {/* Mariano Section - Only specific categories?? Or allow all? 
                                User said "quando eu criar a notícia ela vai pra coluna Mariano". 
                                But technically any news *could* be put there. I'll allow all for flexibility.
                            */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Coluna Mariano (Segunda Dobra)</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => handleAssignPosition('marianoMainId')}
                                        className={`p-3 rounded-xl border text-left flex items-center justify-between group transition-all ${checkAssignment('marianoMainId') ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' : 'border-gray-200 hover:border-amber-500 hover:shadow-md'}`}
                                    >
                                        <span className="font-bold text-sm">Destaque Principal (Foto Grande)</span>
                                        {checkAssignment('marianoMainId') && <CheckCircle2 size={16} className="text-amber-500" />}
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[0, 1, 2, 3].map(idx => (
                                        <button
                                            key={idx}
                                            onClick={() => handleAssignPosition('marianoListIds', idx)}
                                            className={`p-3 rounded-xl border text-left flex items-center justify-between group transition-all ${checkAssignment('marianoListIds', idx) ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' : 'border-gray-200 hover:border-amber-500 hover:shadow-md'}`}
                                        >
                                            <span className="font-bold text-sm">Lista {idx + 1}</span>
                                            {checkAssignment('marianoListIds', idx) && <CheckCircle2 size={16} className="text-amber-500" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default AdminNewsPage;
