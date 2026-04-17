import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle2, LayoutTemplate, MonitorPlay, Tv, LayoutPanelLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BannerConfig } from '../../types';
import DynamicVideoBanner from '../../components/DynamicVideoBanner';

const AdminBannerPage: React.FC = () => {
    const [banners, setBanners] = useState<BannerConfig[]>([]);
    const [activeTab, setActiveTab] = useState<'home_main' | 'home_secondary'>('home_main');
    const [currentConfig, setCurrentConfig] = useState<BannerConfig>({
        title: '',
        video_url: '',
        alignment: 'left',
        is_active: true,
        position: 'home_main'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchConfigs();
    }, []);

    // Update current config when tab or banners change
    useEffect(() => {
        const found = banners.find(b => b.position === activeTab);
        if (found) {
            setCurrentConfig(found);
        } else {
            // Default if not found
            setCurrentConfig({
                title: activeTab === 'home_main'
                    ? 'Ao Hora Piauí, Sílvio Mendes\nfala sobre\ncontas, Jeová, eleição da\nCâmara e\nsecretariado'
                    : 'Banner Secundário',
                video_url: '',
                alignment: 'left',
                is_active: false,
                position: activeTab
            });
        }
    }, [activeTab, banners]);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('horapiaui_banners')
                .select('*');

            if (error) throw error;

            if (data) {
                setBanners(data);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setMessage({ type: 'error', text: 'Erro ao carregar configurações.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const configToSave = { ...currentConfig, position: activeTab };

            // Check if exists
            const existing = banners.find(b => b.position === activeTab);

            let error;
            if (existing && existing.id) {
                const { error: updateError } = await supabase
                    .from('horapiaui_banners')
                    .update({
                        title: configToSave.title,
                        video_url: configToSave.video_url,
                        alignment: configToSave.alignment,
                        is_active: configToSave.is_active,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('horapiaui_banners')
                    .insert([{
                        title: configToSave.title,
                        video_url: configToSave.video_url,
                        alignment: configToSave.alignment,
                        is_active: configToSave.is_active,
                        position: activeTab
                    }]);
                error = insertError;
            }

            if (error) throw error;

            setMessage({ type: 'success', text: 'Banner atualizado com sucesso!' });
            fetchConfigs();
        } catch (err) {
            console.error('Error saving banner:', err);
            setMessage({ type: 'error', text: 'Erro ao salvar.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading && banners.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gerenciar Banners</h1>
                    <p className="text-gray-500 font-bold">Configure os vídeos e textos dos banners do site.</p>
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-black hover:bg-gray-800 transition-all disabled:opacity-50 shadow-lg shadow-black/10"
                >
                    {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('home_main')}
                    className={`px-6 py-3 font-bold text-sm rounded-t-xl transition-all ${activeTab === 'home_main'
                        ? 'bg-white border-x border-t border-gray-200 text-[#16a34a] -mb-px'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                >
                    Banner Principal (Topo)
                </button>
                <button
                    onClick={() => setActiveTab('home_secondary')}
                    className={`px-6 py-3 font-bold text-sm rounded-t-xl transition-all ${activeTab === 'home_secondary'
                        ? 'bg-white border-x border-t border-gray-200 text-[#16a34a] -mb-px'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                >
                    Banner Secundário (Mariano)
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="font-bold">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Editor Column */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-b-2xl rounded-tr-2xl shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center gap-2 border-b border-gray-50 pb-4 mb-4">
                            <LayoutTemplate className="text-gray-400" size={20} />
                            <h2 className="text-lg font-black text-gray-800">
                                Editando: {activeTab === 'home_main' ? 'Banner Principal' : 'Banner Secundário'}
                            </h2>
                        </div>

                        {/* Toggle Active */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <span className="font-bold text-gray-700" id="banner-active-label">Exibir Banner?</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={currentConfig.is_active}
                                    onChange={(e) => setCurrentConfig({ ...currentConfig, is_active: e.target.checked })}
                                    className="sr-only peer"
                                    title="Exibir Banner?"
                                    aria-label="Exibir Banner?"
                                />
                                <span className="h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-[#16a34a] transition-colors" />
                                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                            </label>
                        </div>

                        {/* Video URL */}
                        <div className="space-y-2">
                            <label htmlFor="video_url" className="text-xs font-black text-gray-400 uppercase tracking-widest">Link do Vídeo (YouTube ou Instagram)</label>
                            <div className="relative">
                                <MonitorPlay className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    id="video_url"
                                    type="text"
                                    value={currentConfig.video_url}
                                    onChange={(e) => setCurrentConfig({ ...currentConfig, video_url: e.target.value })}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                />
                            </div>
                        </div>

                        <fieldset className="space-y-2">
                            <legend className="text-xs font-black text-gray-400 uppercase tracking-widest">Posição do Vídeo</legend>
                            <div className="grid grid-cols-2 gap-2">
                                <label
                                    className={`p-3 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${currentConfig.alignment === 'right' ? 'border-[#16a34a] bg-[#16a34a]/5 text-[#16a34a]' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                >
                                    <input
                                        type="radio"
                                        name="banner-alignment"
                                        value="right"
                                        checked={currentConfig.alignment === 'right'}
                                        onChange={() => setCurrentConfig({ ...currentConfig, alignment: 'right' })}
                                        className="sr-only"
                                    />
                                    Vídeo à Direita
                                </label>
                                <label
                                    className={`p-3 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${currentConfig.alignment === 'left' ? 'border-[#16a34a] bg-[#16a34a]/5 text-[#16a34a]' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                >
                                    <input
                                        type="radio"
                                        name="banner-alignment"
                                        value="left"
                                        checked={currentConfig.alignment === 'left'}
                                        onChange={() => setCurrentConfig({ ...currentConfig, alignment: 'left' })}
                                        className="sr-only"
                                    />
                                    Vídeo à Esquerda
                                </label>
                            </div>
                        </fieldset>

                        {/* Title Text */}
                        <div className="space-y-2">
                            <label htmlFor="banner_title" className="text-xs font-black text-gray-400 uppercase tracking-widest">Texto do Banner</label>
                            <textarea
                                id="banner_title"
                                value={currentConfig.title}
                                onChange={(e) => setCurrentConfig({ ...currentConfig, title: e.target.value })}
                                rows={6}
                                placeholder="Digite o texto aqui..."
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-lg resize-none"
                            />
                            <p className="text-[10px] text-gray-400 font-bold">
                                Use "Enter" para quebrar linhas. Cada linha será destacada.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Preview Column */}
                <div className="space-y-6">
                    <div className="sticky top-24">
                        <div className="flex items-center gap-2 mb-4">
                            <Tv className="text-gray-400" size={20} />
                            <h2 className="text-lg font-black text-gray-800">Pré-visualização</h2>
                        </div>

                        <div className="border-4 border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50 min-h-[300px] flex items-center justify-center">
                            {currentConfig.is_active ? (
                                <div className="w-full transform scale-95 origin-center">
                                    <DynamicVideoBanner config={currentConfig} />
                                </div>
                            ) : (
                                <div className="text-center text-gray-400">
                                    <p className="font-bold">Este banner está oculto.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBannerPage;
