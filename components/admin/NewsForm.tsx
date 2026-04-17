import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Send, ArrowLeft, Image as ImageIcon, Eye, Upload } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { NewsItem, NewsStatus } from '../../types';
import NewsCardPreview from './NewsCardPreview';
import { uploadImage } from '../../utils/upload';
import { slugify } from '../../utils/slugify';
import imageCompression from 'browser-image-compression';

import { useAuth } from '../../hooks/useAuth';
import { getCurrentDateBR, getCurrentTimeBR } from '../../utils/dateTime';

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
        isUrgent: false,
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
            try {
                // Sênior Engine: Adestramento Inteligente - força limite brutal mas com 1200px para qualidade full HD
                const options = {
                    maxSizeMB: 0.150,
                    maxWidthOrHeight: 1200,
                    useWebWorker: true,
                    fileType: "image/webp"
                };
                const compressedFile = await imageCompression(file, options);
                const url = await uploadImage(compressedFile);
                
                if (url) {
                    setFormData(prev => ({ ...prev, image: url }));
                } else {
                    alert('Erro ao fazer upload da imagem.');
                }
            } catch (error) {
                console.error("Erro na compressão:", error);
                alert("Erro ao comprimir e salvar a imagem.");
            }
        }
    };

    const handleSubmit = async (status: NewsStatus) => {
        if (!formData.title) {
            alert('Por favor, preencha o título.');
            return;
        }

        const newItem: NewsItem = {
            ...formData as NewsItem,
            id: existingItem?.id || '',
            slug: existingItem?.slug || slugify(formData.title || ''),
            date: formData.date || getCurrentDateBR(),
            time: formData.time || getCurrentTimeBR(),
            status,
            authorName: profile?.full_name || formData.authorName || 'Redação Hora do Piauí',
            authorAvatar: profile?.avatar_url || formData.authorAvatar,
            authorBio: profile?.bio || formData.authorBio,
            authorRole: profile?.role || formData.authorRole || 'Jornalismo'
        };

        try {
            await onSave(newItem);
            navigate('/admin/noticias');
        } catch (error) {
            console.error("Error saving news:", error);
            // Alert is handled in onSave/useNews
        }
    };

    const quillRef = React.useRef<ReactQuill>(null);

    const quillModules = React.useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['link', 'image', 'video'],
                ['clean']
            ],
            handlers: {
                image: () => {
                    const input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('accept', 'image/*');
                    input.click();

                    input.onchange = async () => {
                        const file = input.files?.[0];
                        if (file) {
                            try {
                                const options = {
                                    maxSizeMB: 0.150,
                                    maxWidthOrHeight: 1200,
                                    useWebWorker: true,
                                    fileType: "image/webp"
                                };
                                const compressedFile = await imageCompression(file, options);
                                const url = await uploadImage(compressedFile);
                                
                                if (url) {
                                    const credit = window.prompt('(Opcional) Digite o crédito ou descrição para esta foto:', 'FOTO: DIVULGAÇÃO');

                                    const quill = quillRef.current?.getEditor();
                                    if (quill) {
                                        const range = quill.getSelection(true);

                                        // Insert Image
                                        quill.insertEmbed(range.index, 'image', url);

                                        // Insert Caption if provided
                                        if (credit) {
                                            // We use a safe way to insert styled blocks. 
                                            // Note: Quill's handling of specialized HTML can be tricky.
                                            // A simple approach that usually works in standard setups is to insert text with attributes,
                                            // or insert a custom block if registered.
                                            // Here we will try to insert a new line with the caption text and apply a class or style.

                                            // Move cursor after image
                                            quill.setSelection(range.index + 1, 0);

                                            // Insert new line
                                            quill.insertText(range.index + 1, '\n');

                                            // Insert Caption text
                                            const captionText = credit.startsWith('FOTO:') ? credit : `FOTO: ${credit}`;
                                            quill.insertText(range.index + 2, captionText, {
                                                'size': 'small',
                                                'color': '#666666',
                                                'italic': true
                                            });

                                            // Insert another new line to reset style
                                            quill.insertText(range.index + 2 + captionText.length, '\n');
                                            quill.setSelection(range.index + 2 + captionText.length + 1, 0);
                                        } else {
                                            quill.setSelection(range.index + 1, 0);
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error("Error uploading image:", error);
                                alert("Erro ao fazer upload da imagem.");
                            }
                        }
                    };
                }
            }
        }
    }), []); // Dependencies array empty as we don't depend on props/state here (uploadImage is imported)

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
                            <label htmlFor="title" className="text-sm font-bold text-gray-500 uppercase tracking-wider">Título da Notícia</label>
                            <input
                                id="title"
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Ex: Novo ataque à Venezuela é anunciado..."
                                className="w-full text-2xl font-serif font-bold p-0 border-none outline-none focus:ring-0 placeholder:text-gray-300"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-bold text-gray-500 uppercase tracking-wider">Descrição Curta (Resumo)</label>
                            <textarea
                                id="description"
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
                                    ref={quillRef}
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
                                aria-label="Upload de imagem de capa"
                            />
                            <input
                                type="text"
                                name="image"
                                value={formData.image}
                                onChange={handleChange}
                                placeholder="Ou cole a URL da imagem aqui..."
                                className="w-full p-3 bg-gray-50 rounded-lg text-sm border-none focus:ring-2 focus:ring-primary/20 outline-none mt-2"
                                aria-label="URL da imagem de capa"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="imageDescription" className="text-sm font-bold text-gray-500 uppercase tracking-wider">Crédito / Descrição da Foto</label>
                            <input
                                id="imageDescription"
                                type="text"
                                name="imageDescription"
                                value={formData.imageDescription || ''}
                                onChange={handleChange}
                                placeholder="FOTO: DIVULGAÇÃO / REDAÇÃO"
                                className="w-full p-3 bg-gray-50 rounded-lg font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none uppercase"
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
                                <label htmlFor="section" className="text-sm font-bold text-gray-500 uppercase tracking-wider">Seção (Tag)</label>
                                <input
                                    id="section"
                                    type="text"
                                    name="section"
                                    value={formData.section}
                                    onChange={handleChange}
                                    placeholder="Ex: ECONOMIA"
                                    className="w-full p-3 bg-gray-50 rounded-lg font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none uppercase"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="date" className="text-sm font-bold text-gray-500 uppercase tracking-wider">Data de Publicação</label>
                                <input
                                    id="date"
                                    type="text"
                                    name="date"
                                    value={formData.date || ''}
                                    onChange={handleChange}
                                    placeholder="DD/MM/AAAA"
                                    className="w-full p-3 bg-gray-50 rounded-lg font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                                <p className="text-xs text-gray-400">Formato: DD/MM/AAAA (ex: 02/02/2026)</p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="time" className="text-sm font-bold text-gray-500 uppercase tracking-wider">Hora de Publicação</label>
                                <input
                                    id="time"
                                    type="text"
                                    name="time"
                                    value={formData.time || ''}
                                    onChange={handleChange}
                                    placeholder="HH:MM"
                                    className="w-full p-3 bg-gray-50 rounded-lg font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                                <p className="text-xs text-gray-400">Formato: HH:MM (ex: 14:30)</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                            <input
                                type="checkbox"
                                id="isUrgent"
                                name="isUrgent"
                                checked={formData.isUrgent || false}
                                onChange={(e) => setFormData(prev => ({ ...prev, isUrgent: e.target.checked }))}
                                className="w-5 h-5 text-red-600 rounded focus:ring-red-500 border-gray-300 cursor-pointer"
                            />
                            <label htmlFor="isUrgent" className="text-sm font-bold text-red-800 cursor-pointer select-none flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                MANCHETE URGENTE (Topo do Site)
                            </label>
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

                    {/* Author Section - auto-filled from profile but editable */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Informações do Autor</h3>

                        <div className="space-y-2">
                            <label htmlFor="authorName" className="text-sm font-bold text-gray-500 uppercase tracking-wider">Nome Completo do Jornalista</label>
                            <input
                                id="authorName"
                                type="text"
                                name="authorName"
                                value={formData.authorName || ''}
                                onChange={handleChange}
                                placeholder="Ex: João Silva Santos"
                                className="w-full p-3 bg-gray-50 rounded-lg font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                            <p className="text-xs text-gray-400">Digite o nome completo do jornalista (incluindo sobrenome)</p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="authorRole" className="text-sm font-bold text-gray-500 uppercase tracking-wider">Cargo/Função</label>
                            <input
                                id="authorRole"
                                type="text"
                                name="authorRole"
                                value={formData.authorRole || ''}
                                onChange={handleChange}
                                placeholder="Ex: Jornalista, Repórter, Editor"
                                className="w-full p-3 bg-gray-50 rounded-lg font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="authorBio" className="text-sm font-bold text-gray-500 uppercase tracking-wider">Biografia Curta</label>
                            <textarea
                                id="authorBio"
                                name="authorBio"
                                value={formData.authorBio || ''}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Uma breve descrição sobre o autor..."
                                className="w-full p-3 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="authorAvatar" className="text-sm font-bold text-gray-500 uppercase tracking-wider">URL do Avatar</label>
                            <input
                                id="authorAvatar"
                                type="text"
                                name="authorAvatar"
                                value={formData.authorAvatar || ''}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="w-full p-3 bg-gray-50 rounded-lg font-bold border-none focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                    </div>

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
