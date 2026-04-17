
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    console.error('SUPABASE_URL/VITE_SUPABASE_URL is missing in .env');
    process.exit(1);
}

if (!supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is missing in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
    console.log('Checking storage buckets...');

    // Check if 'images' bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }

    const imagesBucket = buckets.find(b => b.name === 'images');

    if (!imagesBucket) {
        console.log('Creating "images" bucket...');
        const { data, error: createError } = await supabase.storage.createBucket('images', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
            fileSizeLimit: 5242880 // 5MB
        });

        if (createError) {
            console.error('Error creating bucket:', createError);
        } else {
            console.log('Bucket "images" created successfully.');
        }
    } else {
        console.log('Bucket "images" already exists.');
        // Ensure it is public
        if (!imagesBucket.public) {
            console.log('Updating "images" bucket to be public...');
            await supabase.storage.updateBucket('images', { public: true });
        }
    }
}

setupStorage();
