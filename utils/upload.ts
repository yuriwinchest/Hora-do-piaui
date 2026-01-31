import { supabase } from '../lib/supabase';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const uploadImage = async (file: File): Promise<string | null> => {
    try {
        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            throw new Error(`Tipo de arquivo inválido. Use: JPEG, PNG, GIF ou WebP.`);
        }
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Arquivo muito grande. Máximo: 5MB.');
        }

        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = fileName;

        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) {
            console.error('Usuário não autenticado para upload.');
            return null;
        }

        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            if (uploadError.message?.includes('Not Allowed') || uploadError.message?.includes('new row violates')) {
                console.error('Storage RLS bloqueou. Execute a migration em supabase/migrations/20250131_increment_news_views_and_storage.sql');
            }
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Erro ao enviar imagem.';
        console.error('Upload failed:', msg);
        return null;
    }
};
