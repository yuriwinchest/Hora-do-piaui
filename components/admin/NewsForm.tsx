import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Send, ArrowLeft, Image as ImageIcon, Eye, Upload } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { NewsItem, NewsStatus } from '../../types';
import NewsCardPreview from './NewsCardPreview';
import { uploadImage } from '../../utils/upload';

import { useAuth } from '../../hooks/useAuth';

interface NewsFormProps {
    onSave: (item: NewsItem) => void;
    existingItem?: NewsItem;
}

const NewsForm: React.FC<NewsFormProps> = ({ onSave, existingItem }) => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [formData, setFormData] = useState<Partial<NewsItem>>({
        title: '',
        category: 'geral',
        section: 'Geral',
        image: '',
        description: '',
        content: '',
        status: 'draft',
        ...existingItem
    });

    // Auto-fill author info if creating new item and profile exists
    useEffect(() => {
        if (!existingItem && profile) {
            setFormData(prev => ({
                ...prev,
                authorName: profile.full_name || prev.authorName,
                authorAvatar: profile.avatar_url || prev.authorAvatar,
                authorBio: profile.bio || prev.authorBio,
                authorRole: profile.role || prev.authorRole
            }));
        }
    }, [profile, existingItem]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleContentChange = (content: string) => {
        setFormData(prev => ({ ...prev, content }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = await uploadImage(file);
            if (url) {
                setFormData(prev => ({ ...prev, image: url }));
            } else {
                alert('Erro ao fazer upload da imagem.');
            }
        }
    };

    const handleSubmit = async (status: NewsStatus) => {
        if (!formData.title || !formData.image) {
            alert('Por favor, preencha o título e a imagem.');
            return;
        }

        const newItem: NewsItem = {
            ...formData as NewsItem,
            // If it's a new item (no ID or temp ID), send empty/undefined so DB generates it
            // Assuming existingItem has a valid UUID if it exists
            id: existingItem?.id || '',
            date: formData.date || new Date().toLocaleDateString('pt-BR'),
            time: formData.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            status,
            authorName: profile?.full_name || formData.authorName,
            authorAvatar: profile?.avatar_url || formData.authorAvatar,
            authorBio: profile?.bio || formData.authorBio,
            authorRole: profile?.role || formData.authorRole
        };

        try {
            await onSave(newItem);
            navigate('/admin/noticias');
        } catch (error) {
            console.error("Error saving news:", error);
            // Alert is handled in onSave/useNews
        }
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image', 'video'],
            ['clean']
        ],
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/admin/noticias')}
                    className="flex items-center gap-2 text-gray-500 hover:text-black transition-all font-bold"
                >
                    <ArrowLeft size={20} />
                    Voltar
                </button>
                <div className="flex gap-4">
                    <button
                        onClick={() => handleSubmit('draft')}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-gray-200 font-bold hover:bg-gray-50 transition-all text-gray-700"
                    >
                        <Save size={18} />
                        Salvar Rascunho
                    </button>
                    <button
                        onClick={() => handleSubmit('published')}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        <Send size={18} />
                        Publicar Agora
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Título da Notícia</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Ex: Novo ataque à Venezuela é anunciado..."
                                className="w-full text-2xl font-serif font-bold p-0 border-none outline-none focus:ring-0 placeholder:text-gray-300"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Descrição Curta (Resumo)</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={2}
                                placeholder="Um breve resumo para aparecer nos cards..."
                                className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Conteúdo da Notícia (Editor Rico)</label>
                            <div className="quill-wrapper">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.content}
                                    onChange={handleContentChange}
                                    modules={quillModules}
                                    className="bg-white rounded-xl overflow-hidden min-h-[400px]"
                                    placeholder="Escreva sua notícia aqui..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <NewsCardPreview item={formData} />

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Imagem de Capa</label>
                            <div
                                className="relative group overflow-hidden rounded-xl bg-gray-50 aspect-video flex items-center justify-center border-2 border-dashed border-gray-200 hover:border-primary/50 transition-colors cursor-pointer"
                                onClick={() => document.getElementById('imageInput')?.click()}
                            >
                                {formData.image ? (
                                    <>
                                        <img
                                            src={formData.image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <p className="text-white font-bold flex items-center gap-2">
                                                <Upload size={20} /> Trocar Imagem
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center space-y-2">
                                        <ImageIcon className="mx-auto text-gray-300" size={40} />
                                        <p className="text-xs text-gray-400 font-bold">Clique para fazer upload</p>
                                        <p className="text-[10px] text-gray-300 uppercase">ou cole uma URL abaixo</p>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                id="imageInput"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                            <input
                                type="text"
                                name="image"
                                value={formData.image}
                                onChange={handleChange}
                                placeholder="Ou cole a URL da imagem aqui..."
                                className="w-full p-3 bg-gray-50 rounded-lg text-sm border-none focus:ring-2 focus:ring-primary/20 outline-none mt-2"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="category" className="text-sm font-bold text-gray-500 uppercase tracking-wider">Categoria</label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 rounded-lg font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer appearance-none"
                                >
                                    <option value="geral">Geral</option>
                                    <option value="politica">Política</option>
                                    <option value="coluna-mariano">Coluna Mariano</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Seção (Tag)</label>
                                <input
                                    type="text"
                                    name="section"
                                    value={formData.section}
                                    onChange={handleChange}
                                    placeholder="Ex: ECONOMIA"
                                    className="w-full p-3 bg-gray-50 rounded-lg font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none uppercase"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="instagramUrl" className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                Link do Instagram da Matéria
                            </label>
                            <input
                                id="instagramUrl"
                                type="text"
                                name="instagramUrl"
                                value={formData.instagramUrl || ''}
                                onChange={handleChange}
                                placeholder="https://instagram.com/p/..."
                                className="w-full p-3 bg-gray-50 rounded-lg font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                    </div>

                    {/* Author inputs removed - auto-filled from profile */}

                    <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                        <div className="flex items-center gap-3 mb-2 text-primary">
                            <Eye size={20} />
                            <span className="font-black">Dica do Editor</span>
                        </div>
                        <p className="text-xs text-primary/80 leading-relaxed font-bold">
                            Use o preview acima para conferir como os leitores verão a notícia na Home. Tente manter títulos curtos e impactantes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsForm;
