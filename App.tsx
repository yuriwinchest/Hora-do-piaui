
import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import NewsFeedPage from './pages/NewsFeedPage';
import VideosPage from './pages/VideosPage';
import NewsDetailPage from './pages/NewsDetailPage';
import ContactPage from './pages/ContactPage';
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

import { AuthProvider } from './contexts/AuthContext';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);

    // Track site-wide visit
    void (async () => {
      try {
        const { supabase } = await import('./lib/supabase');
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
    <AuthProvider>
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

        <Route path="/fale-conosco" element={
          <>
            <Header />
            <ContactPage />
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
        
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard items={allNews} />} />
          <Route path="/admin/noticias" element={
              <AdminNewsPage
                items={allNews}
                onDelete={deleteNews}
                onPublish={publishNews}
                homeConfig={homeConfig}
                onUpdateHomeConfig={updateHomeConfig}
              />
          } />
          <Route path="/admin/noticia/nova" element={<AdminNewsEditor items={allNews} onSave={saveNews} />} />
          <Route path="/admin/configuracoes" element={<AdminSettingsPage />} />
          <Route path="/admin/noticia/:id" element={<AdminNewsEditor items={allNews} onSave={saveNews} />} />
          <Route path="/admin/videos" element={
              <AdminVideosPage
                items={videos}
                onDelete={deleteVideo}
              />
          } />
          <Route path="/admin/video/novo" element={<AdminVideoEditor items={videos} onSave={saveVideo} />} />
          <Route path="/admin/video/:id" element={<AdminVideoEditor items={videos} onSave={saveVideo} />} />
          <Route path="/admin/layout" element={
              <AdminLayoutPage
                items={allNews}
                config={homeConfig}
                onUpdate={updateHomeConfig}
                onSaveNews={saveNews}
              />
          } />
          <Route path="/admin/banner" element={<AdminBannerPage />} />
          <Route path="/admin/publicidade" element={<AdminAdsPage />} />
          <Route path="/admin/monitoramento" element={<AdminMonitoringPage items={allNews} />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
