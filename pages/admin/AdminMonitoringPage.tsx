import React, { useMemo, useState, useEffect } from 'react';
import {
    BarChart3, TrendingUp, Eye, Newspaper, ArrowUpRight,
    MousePointer2, Search, X, ChevronRight, Activity,
    Users, Globe, Clock, Layout
} from 'lucide-react';
import { NewsItem } from '../../types';
import { normalizeText } from '../../utils/mappers';
import { supabase } from '../../lib/supabase';

interface AdminMonitoringPageProps {
    items: NewsItem[];
}

const AdminMonitoringPage: React.FC<AdminMonitoringPageProps> = ({ items }) => {
    const [siteVisits, setSiteVisits] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

    useEffect(() => {
        const fetchSiteVisits = async () => {
            const { data, error } = await supabase
                .from('horapiaui_site_stats')
                .select('visits_count')
                .eq('id', 'main')
                .single();

            if (data && !error) {
                setSiteVisits(Number(data.visits_count));
            }
        };
        fetchSiteVisits();
    }, []);

    const totalViews = useMemo(() => items.reduce((acc, item) => acc + (item.views || 0), 0), [items]);
    const topNews = useMemo(() => [...items].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5), [items]);

    const filteredItems = useMemo(() => {
        if (!searchTerm) return items.sort((a, b) => (b.views || 0) - (a.views || 0));
        return items.filter(item =>
            normalizeText(item.title || '').includes(normalizeText(searchTerm)) ||
            normalizeText(item.category || '').includes(normalizeText(searchTerm))
        ).sort((a, b) => (b.views || 0) - (a.views || 0));
    }, [items, searchTerm]);

    const statsByCategory = useMemo(() => {
        const stats: Record<string, number> = {};
        items.forEach(item => {
            const cat = normalizeText(item.category || 'Geral');
            stats[cat] = (stats[cat] || 0) + (item.views || 0);
        });
        return Object.entries(stats).sort((a, b) => b[1] - a[1]);
    }, [items]);

    const stats = [
        { label: 'Visitas ao Site', value: siteVisits.toLocaleString(), icon: MousePointer2, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Leituras de Matérias', value: totalViews.toLocaleString(), icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Média por Matéria', value: items.length > 0 ? Math.round(totalViews / items.length).toLocaleString() : '0', icon: BarChart3, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Total de Matérias', value: items.length.toString(), icon: Newspaper, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Monitoramento & Performance</h1>
                    <p className="text-gray-500 font-bold">Análise detalhada do engajamento dos seus leitores.</p>
                </div>

                {/* Search Bar */}
                <div className="relative group max-w-md w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar matéria por título ou categoria..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-900 placeholder:text-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-gray-900 leading-none">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main List / Table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-black text-gray-900 uppercase tracking-wider text-xs">Performance das Publicações</h3>
                            <Activity size={18} className="text-primary" />
                        </div>
                        <div className="max-h-[600px] overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white shadow-sm z-10">
                                    <tr className="border-b border-gray-100">
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Matéria</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Leituras</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredItems.map((news) => (
                                        <tr
                                            key={news.id}
                                            className={`hover:bg-primary/5 cursor-pointer transition-colors group ${selectedNews?.id === news.id ? 'bg-primary/5' : ''}`}
                                            onClick={() => setSelectedNews(news)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <p className="font-bold text-gray-900 leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                                                        {news.title}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                            {news.category || 'Geral'}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-gray-300 italic">{news.date}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-black text-gray-900 flex items-center gap-1">
                                                        {(news.views || 0).toLocaleString()}
                                                        <ArrowUpRight size={14} className="text-green-500" />
                                                    </span>
                                                    {totalViews > 0 && (
                                                        <span className="text-[10px] font-bold text-gray-400">
                                                            {(((news.views || 0) / totalViews) * 100).toFixed(1)}% do total
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <ChevronRight size={18} className={`text-gray-300 group-hover:text-primary transition-all ${selectedNews?.id === news.id ? 'translate-x-1 text-primary' : ''}`} />
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredItems.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-12 text-center">
                                                <p className="text-gray-400 font-bold">Nenhuma matéria encontrada com esse termo.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Detail View / Contextual Panel */}
                <div className="space-y-6">
                    {selectedNews ? (
                        <div className="bg-white rounded-3xl shadow-xl border border-primary/10 p-8 space-y-8 animate-in slide-in-from-right duration-500 sticky top-8">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        ANÁLISE INDIVIDUAL
                                    </span>
                                    <h4 className="font-black text-xl text-gray-900 leading-tight text-wrap">
                                        {selectedNews.title}
                                    </h4>
                                </div>
                                <button
                                    onClick={() => setSelectedNews(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 text-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Impacto Geral</p>
                                    <p className="text-3xl font-black text-primary">
                                        {totalViews > 0 ? (((selectedNews.views || 0) / totalViews) * 100).toFixed(1) : 0}%
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">da audiência</p>
                                </div>
                                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 text-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Performance</p>
                                    <Activity className="mx-auto text-green-500 mb-1" size={24} />
                                    <p className="text-[10px] font-black text-green-600 uppercase">Em Alta</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h5 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                    <Globe size={14} className="text-primary" />
                                    Estimativa de Público
                                </h5>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-gray-500">
                                            <span>Móvel (Celulares)</span>
                                            <span>85%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 w-[85%]" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-gray-500">
                                            <span>Desktop (PC)</span>
                                            <span>15%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gray-400 w-[15%]" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex items-center justify-between font-bold text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Clock size={14} />
                                    <span>Publicado há {selectedNews.date}</span>
                                </div>
                                <a
                                    href={`/noticia/${selectedNews.slug || selectedNews.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary hover:underline flex items-center gap-1"
                                >
                                    Ver no site <ArrowUpRight size={14} />
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 h-full flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
                            <div className="bg-primary/5 p-6 rounded-full text-primary">
                                <MousePointer2 size={40} className="animate-bounce" />
                            </div>
                            <div>
                                <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight text-wrap">Selecione uma matéria</h4>
                                <p className="text-gray-400 font-bold max-w-[200px] mx-auto text-sm">
                                    Clique em qualquer item da lista ao lado para ver insights detalhados.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Category Breakdown Always Visible if no news selected or below it */}
                    {!selectedNews && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
                            <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs flex items-center gap-2">
                                <Layout size={16} className="text-primary" />
                                Visitas por Categoria
                            </h3>
                            <div className="space-y-6">
                                {statsByCategory.map(([cat, views]) => {
                                    const percentage = totalViews > 0 ? (views / totalViews) * 100 : 0;
                                    return (
                                        <div key={cat} className="space-y-2 group">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-primary transition-colors">{cat}</span>
                                                <span className="text-sm font-black text-gray-900">{views.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary/80 transition-all duration-1000 shadow-sm"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminMonitoringPage;
