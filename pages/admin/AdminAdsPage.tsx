import React, { useState, useEffect } from 'react';
import { Save, Trash2, Plus, Image as ImageIcon, Link as LinkIcon, AlertCircle, CheckCircle2, Megaphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdvertisingBanner } from '../../types';

export default function AdminAdsPage() {
    const [banners, setBanners] = useState<AdvertisingBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('advertising_banners')
                .select('*')
                .order('display_order', { ascending: true })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBanners(data || []);
        } catch (error) {
            console.error('Erro ao buscar banners:', error);
            setMessage({ type: 'error', text: 'Erro ao carregar banners.' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploading(true);
        setMessage(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('ads')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('ads')
                .getPublicUrl(fileName);

            // Create new banner record
            const { data: newBanner, error: dbError } = await supabase
                .from('advertising_banners')
                .insert([
                    {
                        image_url: publicUrl,
                        is_active: true,
                        display_order: banners.length
                    }
                ])
                .select()
                .single();

            if (dbError) throw dbError;

            setBanners([...banners, newBanner]);
            setMessage({ type: 'success', text: 'Banner adicionado com sucesso!' });
        } catch (error) {
            console.error('Erro no upload:', error);
            setMessage({ type: 'error', text: 'Erro ao fazer upload da imagem.' });
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este banner?')) return;

        try {
            const { error } = await supabase
                .from('advertising_banners')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setBanners(banners.filter(b => b.id !== id));
            setMessage({ type: 'success', text: 'Banner removido.' });
        } catch (error) {
            console.error('Erro ao deletar:', error);
            setMessage({ type: 'error', text: 'Erro ao remover banner.' });
        }
    };

    const handleUpdate = async (id: string, updates: Partial<AdvertisingBanner>) => {
        try {
            // Optimistic update
            setBanners(banners.map(b => b.id === id ? { ...b, ...updates } : b));

            const { error } = await supabase
                .from('advertising_banners')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            setMessage({ type: 'error', text: 'Erro ao atualizar banner.' });
            fetchBanners(); // Revert on error
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Publicidade</h1>
                    <p className="text-gray-500 font-bold">Gerencie os banners rotativos de publicidade.</p>
                </div>
                
                <div className="relative">
                    <input
                        type="file"
                        id="upload-banner"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                    />
                    <label
                        htmlFor="upload-banner"
                        className={`flex items-center gap-2 px-6 py-3 bg-[#16a34a] text-white rounded-xl font-black hover:bg-green-700 transition-all cursor-pointer shadow-lg shadow-green-900/10 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {uploading ? <Plus className="animate-spin" size={20} /> : <Plus size={20} />}
                        {uploading ? 'Enviando...' : 'Novo Banner'}
                    </label>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="font-bold">{message.text}</span>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                </div>
            ) : banners.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <Megaphone className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">Nenhum banner ativo</h3>
                    <p className="text-gray-500">Adicione imagens para começar a exibir publicidade.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {banners.map((banner) => (
                        <div key={banner.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-start md:items-center">
                            {/* Image Preview */}
                            <div className="w-full md:w-64 h-32 bg-gray-100 rounded-xl overflow-hidden relative shrink-0">
                                <img 
                                    src={banner.image_url} 
                                    alt="Banner Preview" 
                                    className="w-full h-full object-cover"
                                />
                                {!banner.is_active && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="text-white font-bold text-sm px-3 py-1 bg-black/50 rounded-full">Inativo</span>
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="flex-1 space-y-4 w-full">
                                <div className="flex items-center gap-2">
                                    <LinkIcon size={16} className="text-gray-400" />
                                    <input
                                        type="text"
                                        value={banner.link_url || ''}
                                        onChange={(e) => handleUpdate(banner.id, { link_url: e.target.value })}
                                        placeholder="https://exemplo.com.br (Link de destino)"
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Ordem</span>
                                        <input
                                            type="number"
                                            value={banner.display_order}
                                            onChange={(e) => handleUpdate(banner.id, { display_order: parseInt(e.target.value) || 0 })}
                                            className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center font-bold"
                                        />
                                    </div>

                                    <div className="flex-1"></div>

                                    <button
                                        onClick={() => handleUpdate(banner.id, { is_active: !banner.is_active })}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${banner.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {banner.is_active ? 'Ativo' : 'Inativo'}
                                    </button>

                                    <button
                                        onClick={() => handleDelete(banner.id)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remover banner"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
