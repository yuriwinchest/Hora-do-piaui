import React from 'react';
import { LayoutGrid, Type, Newspaper, User, CheckCircle2 } from 'lucide-react';
import { NewsItem, HomeLayoutConfig } from '../../types';

interface AdminHomeConfigProps {
    items: NewsItem[];
    config: HomeLayoutConfig;
    onUpdate: (newConfig: HomeLayoutConfig) => void;
}

const AdminHomeConfig: React.FC<AdminHomeConfigProps> = ({ items, config, onUpdate }) => {
    const publishedNews = items.filter(n => n.status === 'published');

    const handleConfigChange = (field: keyof HomeLayoutConfig, value: any) => {
        onUpdate({ ...config, [field]: value });
    };

    const handleListChange = (field: 'heroTopIds' | 'heroSideIds' | 'marianoListIds', index: number, value: string) => {
        const list = [...config[field]];
        list[index] = value;
        onUpdate({ ...config, [field]: list });
    };

    const NewsSelector = ({ label, value, onChange, category }: { label: string, value: string, onChange: (val: string) => void, category?: string }) => {
        const filtered = category ? publishedNews.filter(n => n.category === category) : publishedNews;

        return (
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{label}</label>
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer appearance-none"
                >
                    <option value="">Selecione uma notícia...</option>
                    {filtered.map(news => (
                        <option key={news.id} value={news.id}>{news.title}</option>
                    ))}
                </select>
                {value && (
                    <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-green-50 rounded-lg">
                        <CheckCircle2 size={12} className="text-green-500" />
                        <span className="text-[10px] text-green-600 font-black uppercase">Selecionado</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configuração da Home</h1>
                <p className="text-gray-500 font-bold">Gerencie o que aparece nas principais dobras do site.</p>
            </div>

            {/* Fold 1: Capa (Headline & Hero) */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-8">
                <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <Type size={20} />
                    </div>
                    <h2 className="text-xl font-black text-gray-800">Primeira Dobra: Capa</h2>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Manchete Principal (Texto Grande)</label>
                        <input
                            type="text"
                            value={config.mainHeadline}
                            onChange={(e) => handleConfigChange('mainHeadline', e.target.value)}
                            className="w-full text-2xl font-serif font-black p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="Ex: Trump anuncia ataque à Venezuela..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <NewsSelector
                                label="Notícia Destaque (Principal)"
                                value={config.heroMainId}
                                onChange={(val) => handleConfigChange('heroMainId', val)}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <NewsSelector
                                    label="Topo Esquerda"
                                    value={config.heroTopIds[0]}
                                    onChange={(val) => handleListChange('heroTopIds', 0, val)}
                                />
                                <NewsSelector
                                    label="Topo Direita"
                                    value={config.heroTopIds[1]}
                                    onChange={(val) => handleListChange('heroTopIds', 1, val)}
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50/50 p-6 rounded-2xl space-y-6">
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Newspaper size={14} />
                                Lista Lateral
                            </h3>
                            <NewsSelector
                                label="Lateral Item 1"
                                value={config.heroSideIds[0]}
                                onChange={(val) => handleListChange('heroSideIds', 0, val)}
                            />
                            <NewsSelector
                                label="Lateral Item 2"
                                value={config.heroSideIds[1]}
                                onChange={(val) => handleListChange('heroSideIds', 1, val)}
                            />
                            <NewsSelector
                                label="Lateral Item 3"
                                value={config.heroSideIds[2]}
                                onChange={(val) => handleListChange('heroSideIds', 2, val)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Fold 2: Coluna do Mariano */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-8">
                <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                        <User size={20} />
                    </div>
                    <h2 className="text-xl font-black text-gray-800">Segunda Dobra: Coluna Mariano</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5">
                        <NewsSelector
                            label="Destaque Mariano (Foto Grande)"
                            value={config.marianoMainId}
                            onChange={(val) => handleConfigChange('marianoMainId', val)}
                            category="coluna-mariano"
                        />
                    </div>
                    <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
                        <NewsSelector
                            label="Card 1 (Lista Superior)"
                            value={config.marianoListIds[0]}
                            onChange={(val) => handleListChange('marianoListIds', 0, val)}
                            category="coluna-mariano"
                        />
                        <NewsSelector
                            label="Card 2 (Lista)"
                            value={config.marianoListIds[1]}
                            onChange={(val) => handleListChange('marianoListIds', 1, val)}
                            category="coluna-mariano"
                        />
                        <NewsSelector
                            label="Card 3 (Lista)"
                            value={config.marianoListIds[2]}
                            onChange={(val) => handleListChange('marianoListIds', 2, val)}
                            category="coluna-mariano"
                        />
                        <NewsSelector
                            label="Card 4 (Lista Inferior)"
                            value={config.marianoListIds[3]}
                            onChange={(val) => handleListChange('marianoListIds', 3, val)}
                            category="coluna-mariano"
                        />
                    </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs text-amber-800 font-bold leading-relaxed">
                        As notícias da Coluna do Mariano devem ter a categoria "coluna-mariano" para aparecerem nestas opções.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminHomeConfig;
