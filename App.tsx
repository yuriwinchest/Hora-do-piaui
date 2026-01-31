
import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import NewsFeedPage from './pages/NewsFeedPage';
import VideosPage from './pages/VideosPage';
import NewsDetailPage from './pages/NewsDetailPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminNewsPage from './pages/admin/AdminNewsPage';
import AdminNewsEditor from './pages/admin/AdminNewsEditor';
import AdminVideosPage from './pages/admin/AdminVideosPage';
import AdminVideoEditor from './pages/admin/AdminVideoEditor';
import AdminLayoutPage from './pages/admin/AdminLayoutPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminBannerPage from './pages/admin/AdminBannerPage';
import AdminAdsPage from './pages/admin/AdminAdsPage';
import AdminMonitoringPage from './pages/admin/AdminMonitoringPage';
import AdminLayout from './components/admin/AdminLayout';
import LoginPage from './pages/admin/LoginPage';
import GoogleAnalytics from './components/GoogleAnalytics';
import { useNews } from './hooks/useNews';
import { ErrorState } from './components/common/ErrorState';

import { supabase } from './lib/supabase';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);

    // Track site-wide visit (silently - 404 ok se RPC não existir)
    void (async () => {
      try {
        await supabase.rpc('increment_site_visits');
      } catch (_) {}
    })();
  }, [pathname]);

  return null;
}

function App() {
  const {
    allNews,
    videos,
    homeConfig,
    bannerConfig,
    loading,
    fetchError,
    saveNews,
    deleteNews,
    publishNews,
    updateHomeConfig,
    saveVideo,
    deleteVideo
  } = useNews();

  if (loading && !allNews.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (fetchError && !allNews.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <ErrorState
          message={fetchError}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <>
      <GoogleAnalytics />
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <>
            <Header />
            <HomePage
              items={allNews}
              config={homeConfig}
              bannerConfig={bannerConfig}
            />
            <Footer />
          </>
        } />

        <Route path="/politica" element={
          <>
            <Header />
            <NewsFeedPage items={allNews} category="politica" title="Política" />
            <Footer />
          </>
        } />

        <Route path="/policia" element={
          <>
            <Header />
            <NewsFeedPage items={allNews} category="policia" title="Polícia" />
            <Footer />
          </>
        } />

        <Route path="/geral" element={
          <>
            <Header />
            <NewsFeedPage items={allNews} category="geral" title="Geral" />
            <Footer />
          </>
        } />

        <Route path="/videos" element={
          <>
            <Header />
            <VideosPage />
            <Footer />
          </>
        } />

        <Route path="/noticia/:slug" element={
          <>
            <Header />
            <NewsDetailPage items={allNews} />
            <Footer />
          </>
        } />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={
          <AdminLayout>
            <AdminDashboard items={allNews} />
          </AdminLayout>
        } />

        <Route path="/admin/noticias" element={
          <AdminLayout>
            <AdminNewsPage
              items={allNews}
              onDelete={deleteNews}
              onPublish={publishNews}
              homeConfig={homeConfig}
              onUpdateHomeConfig={updateHomeConfig}
            />
          </AdminLayout>
        } />

        <Route path="/admin/noticia/nova" element={
          <AdminLayout>
            <AdminNewsEditor items={allNews} onSave={saveNews} />
          </AdminLayout>
        } />

        <Route path="/admin/configuracoes" element={
          <AdminLayout>
            <AdminSettingsPage />
          </AdminLayout>
        } />

        <Route path="/admin/noticia/:id" element={
          <AdminLayout>
            <AdminNewsEditor items={allNews} onSave={saveNews} />
          </AdminLayout>
        } />

        <Route path="/admin/videos" element={
          <AdminLayout>
            <AdminVideosPage
              items={videos}
              onDelete={deleteVideo}
            />
          </AdminLayout>
        } />

        <Route path="/admin/video/novo" element={
          <AdminLayout>
            <AdminVideoEditor items={videos} onSave={saveVideo} />
          </AdminLayout>
        } />

        <Route path="/admin/video/:id" element={
          <AdminLayout>
            <AdminVideoEditor items={videos} onSave={saveVideo} />
          </AdminLayout>
        } />

        <Route path="/admin/layout" element={
          <AdminLayout>
            <AdminLayoutPage
              items={allNews}
              config={homeConfig}
              onUpdate={updateHomeConfig}
              onSaveNews={saveNews}
            />
          </AdminLayout>
        } />

        <Route path="/admin/banner" element={
          <AdminLayout>
            <AdminBannerPage />
          </AdminLayout>
        } />

        <Route path="/admin/publicidade" element={
          <AdminLayout>
            <AdminAdsPage />
          </AdminLayout>
        } />
        <Route path="/admin/monitoramento" element={
          <AdminLayout>
            <AdminMonitoringPage items={allNews} />
          </AdminLayout>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
