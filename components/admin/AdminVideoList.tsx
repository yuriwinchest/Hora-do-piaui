import React from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, Video, Tag, Clock } from 'lucide-react';
import { VideoItem } from '../../types';

interface AdminVideoListProps {
    items: VideoItem[];
    onDelete: (id: string) => void;
}

const AdminVideoList: React.FC<AdminVideoListProps> = ({ items, onDelete }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-700">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                    <Video className="text-primary" size={24} />
                    Gerenciar Vídeos
                </h2>
                <span className="text-sm font-bold text-gray-500">{items.length} Vídeos totais</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-50 uppercase text-[10px] tracking-[0.2em] font-black text-gray-400">
                            <th className="px-6 py-4">Vídeo</th>
                            <th className="px-6 py-4">Tag</th>
                            <th className="px-6 py-4">Duração</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 h-16 rounded-lg bg-gray-100 shadow-sm overflow-hidden relative">
                                            <img src={item.thumbnail || item.image} alt="" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                <div className="bg-white/90 rounded-full p-1 opacity-80">
                                                    <Video size={12} className="text-black" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="max-w-md">
                                            <p className="font-serif font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">{item.title}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white ${item.tagColor || 'bg-gray-500'}`}>
                                        <Tag size={10} />
                                        {item.tag || 'Geral'}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="flex items-center gap-1.5 text-xs text-gray-600 font-bold">
                                        <Clock size={12} className="text-gray-400" />
                                        {item.duration || '0:00'}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            to={`/admin/video/${item.id}`}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} />
                                        </Link>
                                        <button
                                            onClick={() => onDelete(item.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Excluir"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold">
                                    Nenhum vídeo cadastrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminVideoList;
