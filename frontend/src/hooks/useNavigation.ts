import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { Section, SectionWithContent, Item, Breadcrumb, TelegramWebApp } from '../types';

interface NavigationState {
  // Текущий раздел (null = корень)
  currentSection: SectionWithContent | null;
  // Хлебные крошки
  breadcrumbs: Breadcrumb[];
  // Разделы для отображения (корневые или дочерние)
  sections: Section[];
  // Контент текущего раздела
  items: Item[];
  // Состояния загрузки
  loading: boolean;
  error: string | null;
}

/**
 * Хук для навигации по разделам
 * Управляет текущим разделом, хлебными крошками и BackButton
 */
export function useNavigation(webApp: TelegramWebApp | null) {
  const [state, setState] = useState<NavigationState>({
    currentSection: null,
    breadcrumbs: [],
    sections: [],
    items: [],
    loading: false,
    error: null,
  });

  // История навигации для кнопки "Назад"
  const [history, setHistory] = useState<number[]>([]);

  /**
   * Загрузить корневые разделы
   */
  const loadRootSections = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const sections = await apiClient.getSections();
      setState(prev => ({
        ...prev,
        currentSection: null,
        breadcrumbs: [],
        sections,
        items: [],
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки';
      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  /**
   * Перейти в раздел
   */
  const navigateTo = useCallback(async (sectionId: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const section = await apiClient.getSection(sectionId);

      // Добавляем текущий раздел в историю (если был)
      if (state.currentSection) {
        setHistory(prev => [...prev, state.currentSection!.id]);
      }

      setState(prev => ({
        ...prev,
        currentSection: section,
        breadcrumbs: section.path || [],
        sections: section.children || [],
        items: section.items || [],
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки раздела';
      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, [state.currentSection]);

  /**
   * Вернуться назад
   */
  const goBack = useCallback(async () => {
    if (history.length > 0) {
      // Переходим к предыдущему разделу из истории
      const newHistory = [...history];
      const prevSectionId = newHistory.pop();
      setHistory(newHistory);

      if (prevSectionId) {
        setState(prev => ({ ...prev, loading: true }));
        try {
          const section = await apiClient.getSection(prevSectionId);
          setState(prev => ({
            ...prev,
            currentSection: section,
            breadcrumbs: section.path || [],
            sections: section.children || [],
            items: section.items || [],
            loading: false,
          }));
        } catch {
          // При ошибке идём на корень
          await loadRootSections();
        }
      }
    } else {
      // Идём на корень
      await loadRootSections();
    }
  }, [history, loadRootSections]);

  /**
   * Перейти на корневой уровень
   */
  const goToRoot = useCallback(async () => {
    setHistory([]);
    await loadRootSections();
  }, [loadRootSections]);

  /**
   * Перейти по хлебной крошке
   */
  const navigateToBreadcrumb = useCallback(async (sectionId: number | null) => {
    if (sectionId === null) {
      await goToRoot();
    } else {
      // Очищаем историю до этого раздела
      setHistory([]);
      await navigateTo(sectionId);
    }
  }, [goToRoot, navigateTo]);

  /**
   * Обновить текущие данные (после создания/удаления)
   */
  const refresh = useCallback(async () => {
    if (state.currentSection) {
      await navigateTo(state.currentSection.id);
    } else {
      await loadRootSections();
    }
  }, [state.currentSection, navigateTo, loadRootSections]);

  // Управление BackButton
  useEffect(() => {
    if (!webApp?.BackButton) return;

    const isAtRoot = state.currentSection === null;

    if (isAtRoot) {
      webApp.BackButton.hide();
    } else {
      webApp.BackButton.show();
    }

    const handleBack = () => {
      goBack();
    };

    webApp.BackButton.onClick(handleBack);

    return () => {
      webApp.BackButton.offClick(handleBack);
    };
  }, [webApp, state.currentSection, goBack]);

  return {
    ...state,
    isAtRoot: state.currentSection === null,
    navigateTo,
    goBack,
    goToRoot,
    navigateToBreadcrumb,
    loadRootSections,
    refresh,
  };
}
