
import React from 'react';
import { LayoutGrid, Type, Newspaper, User, CheckCircle2, Grid2X2 } from 'lucide-react';
import { NewsItem, HomeLayoutConfig } from '../../types';

interface AdminHomeConfigProps {
    items: NewsItem[];
    config: HomeLayoutConfig;
    onUpdate: (newConfig: HomeLayoutConfig) => void;
    // onSaveNews removed as per request to be read-only
}

const AdminHomeConfig: React.FC<AdminHomeConfigProps> = ({ items, config, onUpdate }) => {

    // Read Only Display Component
    const NewsPreview = ({ label, value }: { label: string, value: string }) => {
        const selectedNews = items.find(n => n.id === value);

        return (
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{label}</label>

                {selectedNews ? (
                    <div className="flex gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm items-start opacity-75">
                        <div className="w-24 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                            <img src={selectedNews.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle2 size={12} className="text-gray-400" />
                                <span className="text-[10px] text-gray-400 font-black uppercase">Definido</span>
                            </div>
                            <p className="text-xs font-black text-gray-900 line-clamp-2 leading-snug">{selectedNews.title}</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                        <p className="text-xs text-gray-400 font-bold">Nenhuma notícia selecionada.</p>
                        <p className="text-[10px] text-gray-400 mt-1">Vá em "Notícias" para definir.</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Visualizar Home</h1>
                <p className="text-gray-500 font-bold">Visualize como o conteúdo está organizado. Para alterar, use a aba "Notícias".</p>
            </div>

            {/* Fold 1: Manchete 1 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-8 pointer-events-none select-none grayscale-[0.1]">
                {/* Visualizer Mode Style */}
                <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <Type size={20} />
                    </div>
                    <h2 className="text-xl font-black text-gray-800">Manchete 1 (Primeira Dobra)</h2>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2 pointer-events-auto">
                        {/* Allowed editing of Headline text since it's unique here? 
                            User: "não vai poder fazer nada". 
                            I will DISABLE it to be safe. If they want to edit, they might need to ask or I'll add it to the News Highlight modal?
                            Actually, Main Headline text is usually independent. 
                            I'll leave it DISABLED for now to strictly follow "não vai poder fazer nada".
                        */}
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Manchete Principal (Texto Grande)</label>
                        <input
                            type="text"
                            value={config.mainHeadline}
                            readOnly
                            className="w-full text-2xl font-serif font-black text-gray-900 p-4 bg-gray-50 rounded-2xl border-none focus:ring-0 cursor-default placeholder-gray-300"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: 2 Items */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Grid2X2 size={14} />
                                Esquerda (2 Itens)
                            </h3>
                            <NewsPreview label="Esquerda 1" value={config.heroTopIds[0]} />
                            <NewsPreview label="Esquerda 2" value={config.heroTopIds[1]} />
                        </div>

                        {/* Right Column: 2 Items */}
                        <div className="bg-gray-50/50 p-6 rounded-2xl space-y-6">
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Newspaper size={14} />
                                Lista Lateral (2 Itens)
                            </h3>
                            <NewsPreview label="Lateral 1" value={config.heroSideIds[0]} />
                            <NewsPreview label="Lateral 2" value={config.heroSideIds[1]} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Fold 2: Coluna do Mariano */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-8 pointer-events-none select-none grayscale-[0.1]">
                <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                        <User size={20} />
                    </div>
                    <h2 className="text-xl font-black text-gray-800">Segunda Dobra: Coluna Mariano</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-fit">
                            <div className="md:col-span-1">
                                <NewsPreview label="Destaque (Foto Grande)" value={config.marianoMainId} />
                            </div>
                            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                <NewsPreview label="Card 1" value={config.marianoListIds[0]} />
                                <NewsPreview label="Card 2" value={config.marianoListIds[1]} />
                                <NewsPreview label="Card 3" value={config.marianoListIds[2]} />
                                <NewsPreview label="Card 4" value={config.marianoListIds[3]} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminHomeConfig;
