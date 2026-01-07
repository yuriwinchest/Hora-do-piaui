import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Video, Tag, Link as LinkIcon, Clock, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { VideoItem } from '../../types';
import { uploadImage } from '../../utils/upload';

interface VideoFormProps {
    onSave: (item: VideoItem) => Promise<void>;
    existingItem?: VideoItem;
}

const getEmbedUrl = (url: string) => {
    if (!url) return '';

    if (url.includes('instagram.com')) {
        const cleanUrl = url.split('?')[0].replace(/\/$/, '');
        return `${cleanUrl}/embed`;
    }

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (match && match[1]) {
            return `https://www.youtube.com/embed/${match[1]}`;
        }
    }

    return url;
};

const VideoForm: React.FC<VideoFormProps> = ({ onSave, existingItem }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [extracting, setExtracting] = useState(false);

    const [formData, setFormData] = useState<Partial<VideoItem>>({
        title: '',
        image: '',
        url: '',
        duration: '',
        tag: 'Destaque',
        tagColor: 'bg-red-600'
    });

    useEffect(() => {
        if (existingItem) {
            setFormData(existingItem);
        }
    }, [existingItem]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUrlBlur = async () => {
        const url = formData.url;
        if (!url || formData.image) return; // Don't overwrite if image exists? Or maybe yes? User said "automaticamente".

        setExtracting(true);
        try {
            // YouTube Thumbnail
            const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            if (ytMatch) {
                const id = ytMatch[1];
                const thumb = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
                setFormData(prev => ({ ...prev, image: thumb }));
            }
            // Instagram - Logic: We can't easily fetch the image URL client-side without API/Auth.
            // But we can verify it's an IG link and maybe set a placeholder or specific instruction?
            // User requested "trazer a thumbnail". Since we can't efficiently scrape, 
            // valid behavior for now is to allow the user to continue, 
            // possibly providing feedback or leaving it to manual upload if auto-fail.
            else if (url.includes('instagram.com')) {
                // Try basic OEmbed endpoint if public (often fails CORS/Auth)
                // For now, we won't block the user but we can't reliably set the image.
                // We just rely on the fallback logic in VideoCard if image is missing?
                // But DB requires 'image'.
                // If we can't get it, we don't set it.
                // Maybe warn user?
            }
        } finally {
            setExtracting(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLoading(true);
            const url = await uploadImage(file);
            setLoading(false);
            if (url) {
                setFormData(prev => ({ ...prev, image: url }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validation - Allow image to be empty if it's Instagram
        const isInstagram = formData.url?.includes('instagram.com');

        if (!formData.title) {
            alert('O título é obrigatório.');
            setLoading(false);
            return;
        }

        let finalImage = formData.image;

        // Try to auto-extract YouTube thumbnail if image is missing but URL is present
        if (!finalImage && formData.url) {
            const ytMatch = formData.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            if (ytMatch) {
                finalImage = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
            }
        }

        if (!finalImage && !isInstagram) {
            alert('Por favor, adicione uma imagem de capa ou use um link do YouTube para gerar automaticamente.');
            setLoading(false);
            return;
        }

        try {
            await onSave({
                id: existingItem?.id || '',
                title: formData.title || '',
                image: finalImage || 'https://placehold.co/600x400?text=Video', // Safe fallback
                thumbnail: finalImage,
                url: formData.url || '',
                duration: formData.duration || '',
                tag: formData.tag || '',
                tagColor: formData.tagColor || 'bg-black'
            } as VideoItem);
            navigate('/admin/videos');
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar vídeo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/videos')}
                    className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                    aria-label="Voltar para a lista de vídeos"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        {existingItem ? 'Editar Vídeo' : 'Novo Vídeo'}
                    </h1>
                    <p className="text-gray-500 font-bold">Preencha os dados do vídeo abaixo.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-8">

                {/* Title */}
                <div className="space-y-2">
                    <label className="text-sm font-black uppercase tracking-wider text-gray-500">Título do Vídeo</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black rounded-xl outline-none font-bold transition-all"
                        placeholder="Ex: Piauí registra crescimento econômico..."
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* URL Video */}
                    <div className="space-y-2">
                        <label htmlFor="videoUrl" className="text-sm font-black uppercase tracking-wider text-gray-500 flex items-center gap-2">
                            <LinkIcon size={16} /> URL do Vídeo (Instagram ou YouTube)
                        </label>
                        <div className="relative">
                            <input
                                id="videoUrl"
                                type="text"
                                name="url"
                                value={formData.url}
                                onChange={handleChange}
                                onBlur={handleUrlBlur}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black rounded-xl outline-none font-bold transition-all"
                                placeholder="Cole o link aqui..."
                                required
                            />
                            {extracting && (
                                <div className="absolute right-3 top-3">
                                    <Loader2 className="animate-spin text-gray-400" size={20} />
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 font-medium">
                            Para YouTube, a capa será gerada automaticamente. Para Instagram, cole o link do post.
                        </p>
                        {formData.url && (
                            <div className="mt-4">
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Prévia do Vídeo</label>
                                <div className="aspect-video rounded-xl overflow-hidden bg-black border border-gray-200 shadow-sm relative z-0">
                                    <iframe
                                        src={getEmbedUrl(formData.url)}
                                        className="w-full h-full"
                                        allowFullScreen
                                        title="Video Preview"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Image URL with Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-black uppercase tracking-wider text-gray-500 flex items-center gap-2">
                            <Video size={16} /> Capa do Vídeo (Thumbnail)
                        </label>

                        <div
                            className="relative group overflow-hidden rounded-xl bg-gray-50 aspect-video flex items-center justify-center border-2 border-dashed border-gray-200 hover:border-black/20 transition-colors cursor-pointer mb-2"
                            onClick={() => document.getElementById('videoImageInput')?.click()}
                        >
                            {formData.image ? (
                                <>
                                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <p className="text-white font-bold flex items-center gap-2">
                                            <Upload size={20} /> Trocar Imagem
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center space-y-2">
                                    <ImageIcon className="mx-auto text-gray-300" size={32} />
                                    <p className="text-xs text-gray-400 font-bold">Clique para upload</p>
                                    <p className="text-[10px] text-gray-300 uppercase">Automático para YouTube</p>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            id="videoImageInput"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                            title="Upload de imagem de capa"
                        />

                        <input
                            type="text"
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black rounded-xl outline-none font-bold transition-all text-sm"
                            placeholder="URL da imagem (opcional se automático)"
                        />
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                        <label className="text-sm font-black uppercase tracking-wider text-gray-500 flex items-center gap-2">
                            <Clock size={16} /> Duração
                        </label>
                        <input
                            type="text"
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black rounded-xl outline-none font-bold transition-all"
                            placeholder="12:30"
                        />
                    </div>

                    {/* Tag */}
                    <div className="space-y-2">
                        <label htmlFor="videoTag" className="text-sm font-black uppercase tracking-wider text-gray-500 flex items-center gap-2">
                            <Tag size={16} /> Tag
                        </label>
                        <input
                            id="videoTag"
                            type="text"
                            name="tag"
                            value={formData.tag}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black rounded-xl outline-none font-bold transition-all"
                            placeholder="Ex: Entrevista"
                        />
                    </div>

                    {/* Tag Color */}
                    <div className="space-y-2">
                        <label htmlFor="tagColor" className="text-sm font-black uppercase tracking-wider text-gray-500">Cor da Tag (Classe Tailwind)</label>
                        <select
                            id="tagColor"
                            name="tagColor"
                            value={formData.tagColor}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black rounded-xl outline-none font-bold transition-all appearance-none"
                        >
                            <option value="bg-red-600">Vermelho (bg-red-600)</option>
                            <option value="bg-blue-600">Azul (bg-blue-600)</option>
                            <option value="bg-green-600">Verde (bg-green-600)</option>
                            <option value="bg-black">Preto (bg-black)</option>
                            <option value="bg-purple-600">Roxo (bg-purple-600)</option>
                        </select>
                    </div>
                </div>

                {/* Preview */}
                <div className="p-6 bg-gray-50 rounded-xl border border-dotted border-gray-300">
                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-4">Pré-visualização da Thumbnail</h3>
                    {formData.image ? (
                        <div className="w-64 h-40 rounded-lg overflow-hidden relative shadow-lg">
                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2">
                                <span className={`text-[10px] font-black text-white px-2 py-1 rounded uppercase tracking-wider ${formData.tagColor}`}>
                                    {formData.tag}
                                </span>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                {formData.duration}
                            </div>
                        </div>
                    ) : (
                        <div className="w-64 h-40 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 font-bold text-sm">
                            Sem imagem
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-50">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-4 bg-teal-600 text-white font-black rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={20} />
                        {loading ? 'Salvando...' : 'Salvar Vídeo'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VideoForm;
