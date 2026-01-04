import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NewsItem, HomeLayoutConfig, VideoItem } from '../types';
import { TOP_NEWS, SIDE_NEWS, MIDDLE_FEATURE, MIDDLE_LIST, VIDEOS } from '../constants';
import { mapNewsFromDb } from '../utils/mappers';

export const useNews = () => {
    const [allNews, setAllNews] = useState<NewsItem[]>([]);
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [homeConfig, setHomeConfig] = useState<HomeLayoutConfig>({
        mainHeadline: 'Bem-vindo ao Hora do Piauí',
        heroMainId: 'f47ac10b-58cc-4372-a567-0e02b2c3d475',
        heroTopIds: ['f47ac10b-58cc-4372-a567-0e02b2c3d471', 'f47ac10b-58cc-4372-a567-0e02b2c3d472'],
        heroSideIds: ['f47ac10b-58cc-4372-a567-0e02b2c3d473', 'f47ac10b-58cc-4372-a567-0e02b2c3d474'],
        marianoMainId: 'f47ac10b-58cc-4372-a567-0e02b2c3d476',
        marianoListIds: ['f47ac10b-58cc-4372-a567-0e02b2c3d477', 'f47ac10b-58cc-4372-a567-0e02b2c3d478', 'f47ac10b-58cc-4372-a567-0e02b2c3d479']
    });
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            console.log('Fetching data...');

            // 1. Fetch News
            let { data: newsData, error: newsError } = await supabase
                .from('horapiaui_news')
                .select('*')
                .order('created_at', { ascending: false });

            if (newsError) {
                console.error('Error fetching news:', newsError);
                // Continue to try restoration
            }

            // Robust Content Restoration
            const initialItems = [...TOP_NEWS, ...SIDE_NEWS, MIDDLE_FEATURE, ...MIDDLE_LIST];
            const existingIds = new Set((newsData || []).map((n: any) => n.id));
            const missingItems = initialItems.filter(item => !existingIds.has(item.id));

            if (missingItems.length > 0) {
                console.log(`Restoring ${missingItems.length} missing default items...`);
                const { error: seedError } = await supabase.from('horapiaui_news').upsert(
                    missingItems.map(n => ({
                        id: n.id,
                        title: n.title,
                        image: n.image,
                        description: n.description,
                        content: n.content,
                        category: n.category,
                        section: n.section,
                        date: n.date,
                        time: n.time,
                        is_large: n.isLarge,
                        status: 'published'
                    }))
                );

                if (seedError) {
                    console.error('Error restoring items:', seedError);
                } else {
                    const { data: refreshed } = await supabase.from('horapiaui_news').select('*').order('created_at', { ascending: false });
                    if (refreshed) newsData = refreshed;
                }
            }

            setAllNews((newsData || []).map(mapNewsFromDb));

            // 2. Videos
            let { data: videosData } = await supabase.from('horapiaui_videos').select('*').order('created_at', { ascending: false });
            const existingVideoIds = new Set((videosData || []).map((v: any) => v.id));
            const missingVideos = VIDEOS.filter(v => !existingVideoIds.has(v.id));

            if (missingVideos.length > 0) {
                await supabase.from('horapiaui_videos').upsert(
                    missingVideos.map(v => ({
                        id: v.id,
                        title: v.title,
                        image: v.image,
                        thumbnail: v.image,
                        url: v.url || '',
                        duration: v.duration || '0:00',
                        tag: v.tag || '',
                        tag_color: v.tagColor || 'bg-black'
                    }))
                );
            }

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

            // 3. Config
            const { data: configData } = await supabase.from('horapiaui_home_layout').select('*').eq('id', 1).single();

            setHomeConfig({
                mainHeadline: configData?.main_headline || 'Bem-vindo ao Hora do Piauí',
                heroMainId: configData?.hero_main_id || 'f47ac10b-58cc-4372-a567-0e02b2c3d475',
                heroTopIds: (configData?.hero_top_ids?.length) ? configData.hero_top_ids : ['f47ac10b-58cc-4372-a567-0e02b2c3d471', 'f47ac10b-58cc-4372-a567-0e02b2c3d472'],
                heroSideIds: (configData?.hero_side_ids?.length) ? configData.hero_side_ids : ['f47ac10b-58cc-4372-a567-0e02b2c3d473', 'f47ac10b-58cc-4372-a567-0e02b2c3d474'],
                marianoMainId: configData?.mariano_main_id || 'f47ac10b-58cc-4372-a567-0e02b2c3d476',
                marianoListIds: (configData?.mariano_list_ids?.length) ? configData.mariano_list_ids : ['f47ac10b-58cc-4372-a567-0e02b2c3d477', 'f47ac10b-58cc-4372-a567-0e02b2c3d478', 'f47ac10b-58cc-4372-a567-0e02b2c3d479']
            });

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
            status: item.status,
            updated_at: new Date().toISOString(),
            author_name: item.authorName,
            author_avatar: item.authorAvatar,
            author_bio: item.authorBio,
            author_role: item.authorRole,
            instagram_url: item.instagramUrl
        };

        let query;
        if (item.id && item.id.length > 5) {
            query = supabase.from('horapiaui_news').update(dbItem).eq('id', item.id);
        } else {
            query = supabase.from('horapiaui_news').insert([dbItem]);
        }

        const { data, error } = await query.select().single();

        if (error) {
            console.error('FINAL UPDATE/INSERT ERROR:', error);
            alert(`Erro ao salvar notícia:\nMessage: ${error.message}\nCode: ${error.code || 'N/A'}\nDetails: ${error.details || 'N/A'}\nHint: ${error.hint || 'N/A'}`);
            return;
        }

        const savedItem = mapNewsFromDb(data);
        setAllNews(prev => {
            const index = prev.findIndex(n => n.id === savedItem.id);
            if (index >= 0) {
                const updated = [...prev];
                updated[index] = savedItem;
                return updated;
            }
            return [savedItem, ...prev];
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
                hero_main_id: newConfig.heroMainId,
                hero_top_ids: newConfig.heroTopIds,
                hero_side_ids: newConfig.heroSideIds,
                mariano_main_id: newConfig.marianoMainId,
                mariano_list_ids: newConfig.marianoListIds
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
