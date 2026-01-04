
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
            {/* Highlight Modal */}
            {highlightModalOpen && selectedNews && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-8 sticky top-0 bg-white z-10 pb-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Onde essa notícia deve aparecer?</h3>
                                <p className="text-gray-500 font-bold mt-1 line-clamp-1">Selecionado: <span className="text-black">{selectedNews.title}</span></p>
                            </div>
                            <button onClick={() => setHighlightModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-12">
                            {/* Section 1: Manchete 1 (Primeira Dobra) */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-6 bg-red-600 rounded-sm"></span>
                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Seção 1: Manchetes Principais</h4>
                                </div>

                                <div className="bg-gray-100 p-6 rounded-2xl border-2 border-dashed border-gray-200">
                                    {/* Visual Mockup of Fold 1 */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-64">
                                        {/* Left Column (Main) - 2 Slots Stacked */}
                                        <div className="md:col-span-2 flex flex-col gap-4 h-full">
                                            <button
                                                onClick={() => handleAssignPosition('heroTopIds', 0)}
                                                className={`flex-1 rounded-xl border-2 text-left p-4 relative transition-all group hover:scale-[1.01] hover:shadow-lg ${checkAssignment('heroTopIds', 0)
                                                    ? 'border-red-600 bg-red-50'
                                                    : 'border-white bg-white hover:border-red-200'}`}
                                            >
                                                <span className="absolute top-2 left-2 px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-500 uppercase">Esquerda 1</span>
                                                <div className="mt-6 w-full h-3 bg-gray-100 rounded mb-2"></div>
                                                <div className="w-2/3 h-3 bg-gray-100 rounded"></div>
                                                {checkAssignment('heroTopIds', 0) && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-red-600/10 backdrop-blur-[1px] rounded-xl border-2 border-red-600">
                                                        <CheckCircle2 size={32} className="text-red-600 drop-shadow-sm" />
                                                    </div>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleAssignPosition('heroTopIds', 1)}
                                                className={`flex-1 rounded-xl border-2 text-left p-4 relative transition-all group hover:scale-[1.01] hover:shadow-lg ${checkAssignment('heroTopIds', 1)
                                                    ? 'border-red-600 bg-red-50'
                                                    : 'border-white bg-white hover:border-red-200'}`}
                                            >
                                                <span className="absolute top-2 left-2 px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-500 uppercase">Esquerda 2</span>
                                                <div className="mt-6 w-full h-3 bg-gray-100 rounded mb-2"></div>
                                                <div className="w-1/2 h-3 bg-gray-100 rounded"></div>
                                                {checkAssignment('heroTopIds', 1) && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-red-600/10 backdrop-blur-[1px] rounded-xl border-2 border-red-600">
                                                        <CheckCircle2 size={32} className="text-red-600 drop-shadow-sm" />
                                                    </div>
                                                )}
                                            </button>
                                        </div>

                                        {/* Right Column (Side) - 2 Slots Stacked */}
                                        <div className="md:col-span-1 flex flex-col gap-4 h-full">
                                            <button
                                                onClick={() => handleAssignPosition('heroSideIds', 0)}
                                                className={`flex-1 rounded-xl border-2 text-left p-4 relative transition-all group hover:scale-[1.01] hover:shadow-lg ${checkAssignment('heroSideIds', 0)
                                                    ? 'border-red-600 bg-red-50'
                                                    : 'border-white bg-gray-50 hover:border-red-200'}`}
                                            >
                                                <span className="absolute top-2 left-2 px-2 py-1 bg-white rounded text-[10px] font-bold text-gray-500 uppercase">Lateral 1</span>
                                                <div className="mt-6 flex gap-2">
                                                    <div className="w-8 h-8 bg-gray-200 rounded shrink-0"></div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="w-full h-2 bg-gray-200 rounded"></div>
                                                        <div className="w-2/3 h-2 bg-gray-200 rounded"></div>
                                                    </div>
                                                </div>
                                                {checkAssignment('heroSideIds', 0) && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-red-600/10 backdrop-blur-[1px] rounded-xl border-2 border-red-600">
                                                        <CheckCircle2 size={32} className="text-red-600 drop-shadow-sm" />
                                                    </div>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleAssignPosition('heroSideIds', 1)}
                                                className={`flex-1 rounded-xl border-2 text-left p-4 relative transition-all group hover:scale-[1.01] hover:shadow-lg ${checkAssignment('heroSideIds', 1)
                                                    ? 'border-red-600 bg-red-50'
                                                    : 'border-white bg-gray-50 hover:border-red-200'}`}
                                            >
                                                <span className="absolute top-2 left-2 px-2 py-1 bg-white rounded text-[10px] font-bold text-gray-500 uppercase">Lateral 2</span>
                                                <div className="mt-6 flex gap-2">
                                                    <div className="w-8 h-8 bg-gray-200 rounded shrink-0"></div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="w-full h-2 bg-gray-200 rounded"></div>
                                                    </div>
                                                </div>
                                                {checkAssignment('heroSideIds', 1) && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-red-600/10 backdrop-blur-[1px] rounded-xl border-2 border-red-600">
                                                        <CheckCircle2 size={32} className="text-red-600 drop-shadow-sm" />
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Mariano (Segunda Dobra) */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-6 bg-amber-500 rounded-sm"></span>
                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Seção 2: Coluna Mariano</h4>
                                </div>

                                <div className="bg-gray-100 p-6 rounded-2xl border-2 border-dashed border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-64">
                                        {/* Main Feature */}
                                        <div className="md:col-span-1 h-full">
                                            <button
                                                onClick={() => handleAssignPosition('marianoMainId')}
                                                className={`w-full h-full rounded-xl border-2 text-left p-4 relative transition-all group hover:scale-[1.01] hover:shadow-lg ${checkAssignment('marianoMainId')
                                                    ? 'border-amber-500 bg-amber-50'
                                                    : 'border-white bg-white hover:border-amber-200'}`}
                                            >
                                                <div className="absolute inset-x-4 bottom-4 h-1/2 bg-gray-100 rounded-lg group-hover:bg-amber-100/50 transition-colors"></div>
                                                <span className="absolute top-2 left-2 px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-500 uppercase">Destaque</span>
                                                {checkAssignment('marianoMainId') && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-amber-500/10 backdrop-blur-[1px] rounded-xl border-2 border-amber-500">
                                                        <CheckCircle2 size={32} className="text-amber-500 drop-shadow-sm" />
                                                    </div>
                                                )}
                                            </button>
                                        </div>

                                        {/* Grid 2x2 */}
                                        <div className="md:col-span-2 grid grid-cols-2 gap-4 h-full">
                                            {[0, 1, 2, 3].map(idx => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleAssignPosition('marianoListIds', idx)}
                                                    className={`rounded-xl border-2 text-left p-3 relative transition-all group hover:scale-[1.01] hover:shadow-lg flex flex-col justify-end ${checkAssignment('marianoListIds', idx)
                                                        ? 'border-amber-500 bg-amber-50'
                                                        : 'border-white bg-white hover:border-amber-200'}`}
                                                >
                                                    <span className="absolute top-2 left-2 text-[10px] font-bold text-gray-300">#{idx + 1}</span>
                                                    <div className="w-full h-2 bg-gray-100 rounded mb-1"></div>
                                                    <div className="w-1/2 h-2 bg-gray-100 rounded"></div>

                                                    {checkAssignment('marianoListIds', idx) && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-amber-500/10 backdrop-blur-[1px] rounded-xl border-2 border-amber-500">
                                                            <CheckCircle2 size={24} className="text-amber-500 drop-shadow-sm" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
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
