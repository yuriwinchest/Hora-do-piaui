import React from 'react';
import { Sliders } from 'lucide-react';

export const ErrorState: React.FC<{ message: string }> = ({ message }) => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center border-t-4 border-black">
        <div className="max-w-md space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sliders size={32} />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Erro de Conexão</h2>
            <p className="text-gray-500 font-bold leading-relaxed">{message}</p>
            <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-black text-white font-black rounded-xl hover:bg-gray-800 transition-all uppercase tracking-widest text-xs shadow-lg"
            >
                Tentar Novamente
            </button>
            <p className="text-[10px] text-gray-400 mt-8 leading-relaxed font-bold">
                Se o erro persistir, verifique se as tabelas foram criadas corretamente no seu projeto Supabase.
            </p>
        </div>
    </div>
);
