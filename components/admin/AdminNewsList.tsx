import React from 'react';
import { Edit2, Trash2, Calendar, Clock, Send, FileText } from 'lucide-react';
import { NewsItem } from '../../types';

interface AdminNewsListProps {
    items: NewsItem[];
    onEdit: (item: NewsItem) => void;
    onDelete: (id: string) => void;
    onPublish: (id: string) => void;
}

const AdminNewsList: React.FC<AdminNewsListProps> = ({ items, onEdit, onDelete, onPublish }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-700">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                    <FileText className="text-primary" size={24} />
                    Gerenciar Notícias
                </h2>
                <span className="text-sm font-bold text-gray-500">{items.length} Notícias totais</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-50 uppercase text-[10px] tracking-[0.2em] font-black text-gray-400">
                            <th className="px-6 py-4">Notícia</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4">Data/Hora</th>
                            <th className="px-6 py-4">Categoria</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-4">
                                        <img src={item.image} alt="" className="w-16 h-12 object-cover rounded-lg bg-gray-100 shadow-sm" />
                                        <div className="max-w-md">
                                            <p className="font-serif font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{item.title}</p>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{item.section}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex justify-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === 'published'
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-amber-100 text-amber-600'
                                            }`}>
                                            {item.status === 'published' ? 'Publicado' : 'Rascunho'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col gap-1">
                                        <span className="flex items-center gap-1.5 text-xs text-gray-600 font-bold">
                                            <Calendar size={12} className="text-gray-400" />
                                            {item.date}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs text-gray-600 font-bold">
                                            <Clock size={12} className="text-gray-400" />
                                            {item.time}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-xs text-gray-500 font-black uppercase tracking-widest">{item.category}</span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.status === 'draft' && (
                                            <button
                                                onClick={() => onPublish(item.id)}
                                                className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-all"
                                                title="Publicar agora"
                                            >
                                                <Send size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onEdit(item)}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} />
                                        </button>
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
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminNewsList;
