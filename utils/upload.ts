
import { supabase } from '../lib/supabase';

export const uploadImage = async (file: File): Promise<string | null> => {
    try {
        // 1. Get signed URL and token from our API (bypassing RLS)
        const response = await fetch('/api/sign-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileName: file.name,
                fileType: file.type
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const { path, token, publicUrl } = await response.json();

        // 2. Upload to Supabase using the signed token
        const { error: uploadError } = await supabase.storage
            .from('images')
            .uploadToSignedUrl(path, token, file);

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            throw uploadError;
        }

        return publicUrl;
    } catch (error) {
        console.error('Upload failed:', error);
        return null; // Handle error appropriately in UI
    }
};
