import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NewsItem, HomeLayoutConfig, VideoItem, BannerConfig } from '../types';
import { mapNewsFromDb } from '../utils/mappers';

export const useNews = () => {
    const [allNews, setAllNews] = useState<NewsItem[]>([]);
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [homeConfig, setHomeConfig] = useState<HomeLayoutConfig>({
        mainHeadline: 'Bem-vindo ao Hora do Piauí',
        heroMainId: '',
        heroTopIds: [],
        heroSideIds: [],
        marianoMainId: '',
        marianoListIds: []
    });
    const [bannerConfig, setBannerConfig] = useState<BannerConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch News
            let { data: newsData, error: newsError } = await supabase
                .from('horapiaui_news')
                .select('*')
                .order('created_at', { ascending: false });

            if (newsError) {
                console.error('Error fetching news:', newsError);
            }

            setAllNews((newsData || []).map(mapNewsFromDb));

            // 2. Videos
            let { data: videosData } = await supabase.from('horapiaui_videos').select('*').order('created_at', { ascending: false });

            // Set videos state
            setVideos(videosData?.map((v: any) => ({
                id: v.id,
                title: v.title,
                image: v.image,
                thumbnail: v.thumbnail || v.image,
                url: v.url,
                duration: v.duration,
                tag: v.tag,
                tagColor: v.tag_color
            })) || []);

            // 3. Config - tratando caso não exista
            const { data: configData, error: configError } = await supabase
                .from('horapiaui_home_layout')
                .select('*')
                .eq('id', 1)
                .maybeSingle();

            if (!configError && configData) {
                setHomeConfig({
                    mainHeadline: configData.main_headline || 'Bem-vindo ao Hora do Piauí',
                    heroMainId: configData.hero_main_id || '',
                    heroTopIds: (configData.hero_top_ids?.length) ? configData.hero_top_ids : [],
                    heroSideIds: (configData.hero_side_ids?.length) ? configData.hero_side_ids : [],
                    marianoMainId: configData.mariano_main_id || '',
                    marianoListIds: (configData.mariano_list_ids?.length) ? configData.mariano_list_ids : []
                });
            }

            // 4. Banner Config - ignora 406 se tabela vazia ou RLS
            try {
                const { data: bannerData, error: bannerError } = await supabase
                    .from('horapiaui_banners')
                    .select('*')
                    .eq('is_active', true)
                    .limit(1);
                if (!bannerError && bannerData?.[0]) setBannerConfig(bannerData[0]);
            } catch (_) { /* 406 ou RLS - ignora */ }

        } catch (err: any) {
            console.error('Initialization error:', err);
            setFetchError(err.message || 'Erro inesperado.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const saveNews = async (item: NewsItem) => {
        // Manchete urgente: ao marcar uma, desmarca as demais automaticamente
        if (item.isUrgent) {
            const unmarkQuery = item.id && item.id.length > 20
                ? supabase.from('horapiaui_news').update({ is_urgent: false }).neq('id', item.id)
                : supabase.from('horapiaui_news').update({ is_urgent: false });
            await unmarkQuery;
        }

        const dbItem = {
            title: item.title,
            image: item.image,
            description: item.description,
            content: item.content,
            category: item.category,
            section: item.section,
            date: item.date,
            time: item.time,
            is_large: item.isLarge,
            is_urgent: item.isUrgent,
            status: item.status,
            updated_at: new Date().toISOString(),
            author_name: item.authorName,
            author_avatar: item.authorAvatar,
            author_bio: item.authorBio,
            author_role: item.authorRole,
            instagram_url: item.instagramUrl,
            image_description: item.imageDescription,
            slug: item.slug
        };

        let query;
        // UUIDs are 36 chars. If it's shorter, it's likely a new item or invalid ID.
        if (item.id && item.id.length > 20) {
            query = supabase.from('horapiaui_news').update(dbItem).eq('id', item.id);
        } else {
            // Remove ID from insert payload to let DB generate UUID
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...toInsert } = item;

            // Re-construct dbItem without ID for insert (though dbItem defined above doesn't have ID, it's fine)
            // Wait, dbItem above doesn't have 'id' property. It's clean.
            // So we can just insert dbItem.
            query = supabase.from('horapiaui_news').insert([dbItem]);
        }

        const { data, error } = await query.select().single();

        if (error) {
            console.error('FINAL UPDATE/INSERT ERROR:', error);
            let userMessage = 'Erro ao salvar notícia.';

            if (error.code === 'PGRST204') {
                userMessage = 'Erro interno: Colunas do banco de dados não correspondem ao formulário. (PGRST204)';
            } else if (error.message) {
                userMessage += ` Detalhe: ${error.message}`;
            }

            alert(userMessage);
            throw error; // Propagate error so caller knows it failed
        }

        const savedItem = mapNewsFromDb(data);
        setAllNews(prev => {
            const index = prev.findIndex(n => n.id === savedItem.id);
            let updated = index >= 0 ? [...prev] : [savedItem, ...prev];
            if (index >= 0) updated[index] = savedItem;
            // Se marcou como manchete urgente, garante que só ela tem isUrgent no state
            if (savedItem.isUrgent) {
                updated = updated.map(n => n.id === savedItem.id ? n : { ...n, isUrgent: false });
            }
            return updated;
        });
    };

    const deleteNews = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta notícia?')) return;

        const { error } = await supabase.from('horapiaui_news').delete().eq('id', id);

        if (error) {
            alert('Erro ao excluir: ' + error.message);
            return;
        }

        setAllNews(prev => prev.filter(n => n.id !== id));
    };

    const publishNews = async (id: string) => {
        const { error } = await supabase
            .from('horapiaui_news')
            .update({ status: 'published' })
            .eq('id', id);

        if (error) {
            alert('Erro ao publicar: ' + error.message);
            return;
        }

        setAllNews(prev => prev.map(n => n.id === id ? { ...n, status: 'published' } : n));
    };

    const updateHomeConfig = async (newConfig: HomeLayoutConfig) => {
        const { error } = await supabase
            .from('horapiaui_home_layout')
            .upsert({
                id: 1,
                main_headline: newConfig.mainHeadline,
                hero_main_id: newConfig.heroMainId || null,
                hero_top_ids: newConfig.heroTopIds?.filter(id => id && id.trim() !== '') || [],
                hero_side_ids: newConfig.heroSideIds?.filter(id => id && id.trim() !== '') || [],
                mariano_main_id: newConfig.marianoMainId || null,
                mariano_list_ids: newConfig.marianoListIds?.filter(id => id && id.trim() !== '') || []
            });

        if (error) {
            alert('Erro ao salvar configuração: ' + error.message);
            return;
        }

        setHomeConfig(newConfig);
    };

    const saveVideo = async (item: VideoItem) => {
        const dbItem = {
            title: item.title,
            image: item.image,
            thumbnail: item.image, // syncing fields
            url: item.url,
            duration: item.duration,
            tag: item.tag,
            tag_color: item.tagColor
        };

        let query;
        if (item.id && item.id.length > 5) {
            query = supabase.from('horapiaui_videos').update(dbItem).eq('id', item.id);
        } else {
            query = supabase.from('horapiaui_videos').insert([dbItem]);
        }

        const { data, error } = await query.select().single();

        if (error) {
            alert('Erro ao salvar vídeo: ' + error.message);
            return;
        }

        const savedItem: VideoItem = {
            id: data.id,
            title: data.title,
            image: data.image,
            thumbnail: data.thumbnail,
            url: data.url,
            duration: data.duration,
            tag: data.tag,
            tagColor: data.tag_color
        };

        setVideos(prev => {
            const index = prev.findIndex(v => v.id === savedItem.id);
            if (index >= 0) {
                const updated = [...prev];
                updated[index] = savedItem;
                return updated;
            }
            return [savedItem, ...prev];
        });
    };

    const deleteVideo = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este vídeo?')) return;
        const { error } = await supabase.from('horapiaui_videos').delete().eq('id', id);
        if (error) {
            alert('Erro ao excluir vídeo: ' + error.message);
            return;
        }
        setVideos(prev => prev.filter(v => v.id !== id));
    };

    // Derived state
    const publishedNews = allNews.filter(n => n.status === 'published');

    return {
        allNews,
        videos,
        publishedNews,
        homeConfig,
        bannerConfig,
        loading,
        fetchError,
        saveNews,
        deleteNews,
        publishNews,
        updateHomeConfig,
        saveVideo,
        deleteVideo,
        refetch: fetchData
    };
};
