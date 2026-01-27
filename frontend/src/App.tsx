import { useState, useEffect, useCallback } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { useAuth } from './hooks/useAuth';
import { useNavigation } from './hooks/useNavigation';
import { apiClient } from './api/client';
import { HomePage } from './pages/HomePage';
import { SectionPage } from './pages/SectionPage';
import { Header } from './components/Header';
import { CollapsedBreadcrumbs } from './components/CollapsedBreadcrumbs';
import { SearchResults } from './components/SearchResults';
import type { Section, SearchResult } from './types';
import './App.css';

function App() {
  const { webApp, initData, isReady, colorScheme, deepLinkSectionId, isMock } = useTelegram();
  const { isAuthenticated, user, permissions, loading: authLoading, error: authError, login } = useAuth();
  const navigation = useNavigation(webApp);

  // Поиск
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Флаг: идёт процесс авторизации
  const [authAttempted, setAuthAttempted] = useState(false);

  // Аутентификация при готовности
  useEffect(() => {
    console.log('[Auth] Check:', { isReady, initData, isAuthenticated, authLoading, authAttempted, isMock });
    if (isReady && initData && !isAuthenticated && !authLoading && !authAttempted) {
      console.log('[Auth] Starting authentication...', { initData: initData.slice(0, 20), isMock });
      setAuthAttempted(true);
      login(initData).then(success => {
        console.log('[Auth] Result:', success);
      });
    }
  }, [isReady, initData, isAuthenticated, authLoading, authAttempted, login, isMock]);

  // Загрузка разделов после авторизации
  useEffect(() => {
    if (isAuthenticated) {
      if (deepLinkSectionId) {
        // Deep link — переход к конкретному разделу
        navigation.navigateTo(deepLinkSectionId);
      } else {
        // Обычная загрузка корневых разделов
        navigation.loadRootSections();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, deepLinkSectionId]);

  // Поиск
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearchMode(false);
      return;
    }

    setIsSearchMode(true);
    setSearchLoading(true);

    try {
      const results = await apiClient.search(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Клик по результату поиска
  function handleSearchResultClick(result: SearchResult) {
    webApp?.HapticFeedback?.selectionChanged();

    if (result.type === 'section') {
      navigation.navigateTo(result.id);
    } else {
      // Для item — переходим к его разделу
      if (result.sectionId) {
        navigation.navigateTo(result.sectionId);
      }
    }

    // Сбрасываем поиск
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchMode(false);
  }

  // Клик по разделу
  function handleSectionClick(section: Section) {
    navigation.navigateTo(section.id);
  }

  // Состояние загрузки (включая ожидание авторизации)
  const isLoading = authLoading || !isReady || (initData && !isAuthenticated && !authError);

  if (isLoading) {
    return (
      <div className={`app ${colorScheme}`}>
        <div className="app-loading">
          <div className="spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  // Ошибка авторизации
  if (authError) {
    return (
      <div className={`app ${colorScheme}`}>
        <div className="app-error">
          <h2>Ошибка авторизации</h2>
          <p>{authError}</p>
          <button onClick={() => { setAuthAttempted(false); }}>Повторить</button>
        </div>
      </div>
    );
  }

  // Не авторизован (только если нет initData — не в Telegram и не mock)
  if (!isAuthenticated) {
    return (
      <div className={`app ${colorScheme}`}>
        <div className="app-unauthorized">
          <p>Откройте приложение через Telegram</p>
        </div>
      </div>
    );
  }

  // Загрузка навигации
  if (navigation.loading) {
    return (
      <div className={`app ${colorScheme}`}>
        <div className="app-loading">
          <div className="spinner"></div>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  // Ошибка загрузки данных
  if (navigation.error) {
    return (
      <div className={`app ${colorScheme}`}>
        <div className="app-error">
          <h2>Ошибка загрузки</h2>
          <p>{navigation.error}</p>
          <button onClick={navigation.refresh}>Повторить</button>
        </div>
      </div>
    );
  }

  const isAtRoot = navigation.currentSection === null;

  return (
    <div className={`app ${colorScheme}`}>
      {/* Header с поиском и breadcrumbs */}
      <Header
        showSearch
        onSearch={handleSearch}
        showBreadcrumbs={!isAtRoot && !isSearchMode}
        breadcrumbs={
          !isAtRoot ? (
            <CollapsedBreadcrumbs
              path={navigation.breadcrumbs}
              onNavigate={navigation.navigateToBreadcrumb}
            />
          ) : null
        }
      />

      <main className="app-main">
        {isSearchMode ? (
          <SearchResults
            results={searchResults}
            query={searchQuery}
            loading={searchLoading}
            onResultClick={handleSearchResultClick}
          />
        ) : navigation.currentSection ? (
          <SectionPage
            section={navigation.currentSection}
            breadcrumbs={navigation.breadcrumbs}
            permissions={permissions}
            currentUserId={user?.id}
            onSectionClick={handleSectionClick}
            onBreadcrumbClick={navigation.navigateToBreadcrumb}
            onBack={navigation.goBack}
            onRefresh={navigation.refresh}
            webApp={webApp}
          />
        ) : (
          <HomePage
            sections={navigation.sections}
            permissions={permissions}
            onSectionClick={handleSectionClick}
            onRefresh={navigation.refresh}
            webApp={webApp}
          />
        )}
      </main>
    </div>
  );
}

export default App;
