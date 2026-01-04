
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fileName, fileType } = req.body;

        // Create a unique file path
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        const extension = fileName.split('.').pop();
        const filePath = `${timestamp}-${random}.${extension}`;

        // Generate signed upload URL (valid for 60 seconds is enough to start upload)
        const { data, error } = await supabase.storage
            .from('images')
            .createSignedUploadUrl(filePath);

        if (error) throw error;

        return res.status(200).json({
            signedUrl: data.signedUrl,
            path: data.path,
            token: data.token,
            publicUrl: supabase.storage.from('images').getPublicUrl(data.path).data.publicUrl
        });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return res.status(500).json({ error: error.message });
    }
}
