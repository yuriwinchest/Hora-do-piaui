import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("ERRO: Faltando chaves do Supabase no .env");
    process.exit(1);
}

const supabase = createClient(url, key);

async function runCompression() {
    console.log("🔥 [HORA DO PIAUI SÊNIOR] Iniciando a varredura da Tropa de Elite no Banco...");

    // Pega as últimas 20 notícias publicadas que tenham imagem PNG ou JPG vindo da nuvem e não optimizada.
    // Como a url pública original vem de bucket "images", vamos re-upar no mesmo.
    const { data: newsList, error } = await supabase
        .from('horapiaui_news')
        .select('id, title, image')
        .ilike('image', '%/storage/v1/object/public/%')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erro ao ler tabela:", error.message);
        process.exit(1);
    }

    if (!newsList || newsList.length === 0) {
        console.log("Nenhuma manchete recente para comprimir hoje.");
        return;
    }

    let savedMB = 0;
    
    for (const news of newsList) {
        try {
            const originalUrl = news.image;
            
            // Só avança se não foi já tratada pro nosso schema de webp da nova lógica
            if (originalUrl.includes('optm_')) {
                continue;
            }
            
            const response = await fetch(originalUrl);
            if (!response.ok) {
                 continue; // Se imagem deu erro 404, pula
            }
            
            const buffer = await response.arrayBuffer();
            const originalSizeKB = buffer.byteLength / 1024;
            
            // Pula se já for super leve (tipo, menos de 250kb) e não precisar forçar barra
            if (originalSizeKB < 250) {
                continue;
            }

            console.log(`\n⏳ Inspecionando: "${news.title.substring(0, 40)}..."`);
            console.log(`   Tamanho Antigo: ${(originalSizeKB / 1024).toFixed(2)} MB`);

            // Mágica de compressão Node local em Milisegundos
            // Limita a largura em no máximo 1000px mantendo proporção e salva como WEBP 80 de qualidade
            const webpBuffer = await sharp(buffer)
                .resize(1000, null, { withoutEnlargement: true })
                .webp({ quality: 75 })
                .toBuffer();
                
            const newSizeKB = webpBuffer.byteLength / 1024;
            savedMB += (buffer.byteLength - webpBuffer.byteLength) / (1024 * 1024);
            
            console.log(`   Tamanho Novo WebP: ${newSizeKB.toFixed(2)} KB (Maravilha!)`);
            
            // Tenta identificar o bucket e joga a nova imagem lá dentro
            const bucketName = 'images'; // Seu container default de storage
            const randomID = Math.random().toString(36).substring(7);
            const fileName = `optm_${Date.now()}_${randomID}.webp`;
            
            const { data: uploadData, error: upErr } = await supabase.storage
                .from(bucketName)
                .upload(fileName, webpBuffer, { contentType: 'image/webp' });
                
            if (upErr) {
                 console.log("   --> Erro ao subir para nuvem:", upErr.message);
                 continue;
            }
            
            // Pega a URL pública
            const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);
            const newPublicUrl = publicData.publicUrl;
            
            // Atualiza a tabela na tora
            await supabase
                .from('horapiaui_news')
                .update({ image: newPublicUrl })
                .eq('id', news.id);
                
            console.log("   ✅ Banco de Dados atualizado com Sucesso para URL veloz!");
            
        } catch (e) {
            console.log(`   [Passou batido] Falha ao renderizar a imagem da url. Segue...`);
        }
    }

    console.log(`\n🎉 FAXINA COMPLETA! Você economizou ${(savedMB).toFixed(2)} Megabytes das conexões da sua tela Inicial para sempre.`);
}

runCompression();
