import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Video, Tag, Link as LinkIcon, Clock, Upload, Image as ImageIcon } from 'lucide-react';
import { VideoItem } from '../../types';
import { uploadImage } from '../../utils/upload';

interface VideoFormProps {
    onSave: (item: VideoItem) => Promise<void>;
    existingItem?: VideoItem;
}

const VideoForm: React.FC<VideoFormProps> = ({ onSave, existingItem }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

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

        try {
            await onSave({
                id: existingItem?.id || crypto.randomUUID(), // Temporarily random if new, DB triggers usually handle ID but this mimics front-end safety
                title: formData.title || '',
                image: formData.image || '',
                thumbnail: formData.image, // syncing
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
                        <label className="text-sm font-black uppercase tracking-wider text-gray-500 flex items-center gap-2">
                            <LinkIcon size={16} /> URL do Vídeo (YouTube/Embed)
                        </label>
                        <input
                            type="text"
                            name="url"
                            value={formData.url}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black rounded-xl outline-none font-bold transition-all"
                            placeholder="https://www.youtube.com/embed/..."
                            required
                        />
                    </div>

                    {/* Image URL with Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-black uppercase tracking-wider text-gray-500 flex items-center gap-2">
                            <Video size={16} /> Thumbnail (Upload ou URL)
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
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            id="videoImageInput"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />

                        <input
                            type="text"
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-black rounded-xl outline-none font-bold transition-all text-sm"
                            placeholder="Ou cole a URL da imagem..."
                            required
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
                        <label className="text-sm font-black uppercase tracking-wider text-gray-500 flex items-center gap-2">
                            <Tag size={16} /> Tag
                        </label>
                        <input
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
                        <label className="text-sm font-black uppercase tracking-wider text-gray-500">Cor da Tag (Classe Tailwind)</label>
                        <select
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
