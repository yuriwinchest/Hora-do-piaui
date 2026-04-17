import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Try to use service role key if available (often not in client env, but maybe in local .env)
// If not, fall back to anon key. If RLS blocks delete, user needs to provide service key or run SQL.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PARTIAL_TITLES = [
    "Prefeito Sílvio Mendes recebe alta",
    "Ciro Nogueira diz que prefeito de Cajueiro",
    "Assembleia discute mudanças no calendário",
    "Bandeira inicia 'campanha' no PT",
    "Senador Ciro Nogueira anuncia R$ 20 milhões",
    "Vilarinho: vereadores terão consenso",
    "CEO da Saks renuncia ao cargo",
    "A chinesa BYD ultrapassa a Tesla",
    "Fábio Novo rebate prefeito que pediu"
];

async function removeAIContent() {
    console.log('Starting cleanup of AI-generated content...');
    let totalDeleted = 0;

    for (const partialTitle of PARTIAL_TITLES) {
        // Search for items containing the title
        const { data: items, error: searchError } = await supabase
            .from('horapiaui_news')
            .select('id, title')
            .ilike('title', `%${partialTitle}%`);

        if (searchError) {
            console.error(`Error searching for "${partialTitle}":`, searchError.message);
            continue;
        }

        if (!items || items.length === 0) {
            console.log(`No items found matching "${partialTitle}"`);
            continue;
        }

        console.log(`Found ${items.length} item(s) for "${partialTitle}"`);

        // Delete them
        const ids = items.map(i => i.id);
        const { error: deleteError } = await supabase
            .from('horapiaui_news')
            .delete()
            .in('id', ids);

        if (deleteError) {
            console.error(`Failed to delete items for "${partialTitle}":`, deleteError.message);
        } else {
            console.log(`Successfully deleted ${ids.length} item(s).`);
            totalDeleted += ids.length;
        }
    }

    console.log('-------------------');
    console.log(`Cleanup complete. Total items deleted: ${totalDeleted}`);
}

removeAIContent();
