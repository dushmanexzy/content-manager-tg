import { useEffect, useState, useRef } from 'react';
import type { TelegramWebApp } from '../types';

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

// Проверка режима разработки
const isDev = import.meta.env.DEV;

/**
 * Создать mock WebApp для локальной разработки
 */
function createMockWebApp(): TelegramWebApp {
  let mainButtonCallback: (() => void) | null = null;
  let mainButtonVisible = false;

  const mockWebApp: TelegramWebApp = {
    // Mock initData - специальный токен для dev режима
    initData: 'mock_dev_mode',
    initDataUnsafe: {
      user: {
        id: 123456789,
        first_name: 'Dev',
        last_name: 'User',
        username: 'devuser',
        language_code: 'ru',
      },
      chat: {
        id: -1001234567890,
        type: 'supergroup',
        title: 'Test Group',
      },
      start_param: undefined,
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'mock_hash',
    },
    colorScheme: 'light',
    themeParams: {
      bg_color: '#ffffff',
      text_color: '#000000',
      hint_color: '#999999',
      link_color: '#3390ec',
      button_color: '#3390ec',
      button_text_color: '#ffffff',
      secondary_bg_color: '#f5f5f5',
    },
    isExpanded: true,
    viewportHeight: window.innerHeight,
    viewportStableHeight: window.innerHeight,
    MainButton: {
      text: '',
      color: '#3390ec',
      textColor: '#ffffff',
      isVisible: false,
      isActive: true,
      isProgressVisible: false,
      setText: (text: string) => {
        mockWebApp.MainButton.text = text;
        updateMockUI();
      },
      onClick: (callback: () => void) => {
        mainButtonCallback = callback;
      },
      offClick: () => {
        mainButtonCallback = null;
      },
      show: () => {
        mainButtonVisible = true;
        mockWebApp.MainButton.isVisible = true;
        updateMockUI();
      },
      hide: () => {
        mainButtonVisible = false;
        mockWebApp.MainButton.isVisible = false;
        updateMockUI();
      },
      enable: () => {
        mockWebApp.MainButton.isActive = true;
      },
      disable: () => {
        mockWebApp.MainButton.isActive = false;
      },
      showProgress: () => {
        mockWebApp.MainButton.isProgressVisible = true;
      },
      hideProgress: () => {
        mockWebApp.MainButton.isProgressVisible = false;
      },
    },
    BackButton: {
      isVisible: false,
      onClick: () => {
        // BackButton callback in mock mode
      },
      offClick: () => {
        // Remove BackButton callback
      },
      show: () => {
        mockWebApp.BackButton.isVisible = true;
        updateMockUI();
      },
      hide: () => {
        mockWebApp.BackButton.isVisible = false;
        updateMockUI();
      },
    },
    ready: () => {
      console.log('[Mock] WebApp ready');
    },
    expand: () => {
      console.log('[Mock] WebApp expanded');
    },
    close: () => {
      console.log('[Mock] WebApp close requested');
      alert('WebApp close() called - в реальном Telegram окно закроется');
    },
    showAlert: (message: string, callback?: () => void) => {
      alert(message);
      callback?.();
    },
    showConfirm: (message: string, callback?: (confirmed: boolean) => void) => {
      const result = confirm(message);
      callback?.(result);
    },
    showPopup: (params, callback) => {
      // Fallback для dev-режима: показываем опции через prompt
      const options = params.buttons
        .filter(b => b.type !== 'cancel')
        .map((b, i) => `${i + 1}. ${b.text}`)
        .join('\n');
      const message = `${params.title || ''}\n${params.message}\n\n${options}`;
      const input = prompt(message);
      if (input && callback) {
        const index = parseInt(input, 10) - 1;
        const selectedButton = params.buttons.filter(b => b.type !== 'cancel')[index];
        if (selectedButton) {
          callback(selectedButton.id);
        } else {
          callback('cancel');
        }
      } else if (callback) {
        callback('cancel');
      }
    },
    HapticFeedback: {
      impactOccurred: (style) => {
        console.log(`[Mock] Haptic impact: ${style}`);
      },
      notificationOccurred: (type) => {
        console.log(`[Mock] Haptic notification: ${type}`);
      },
      selectionChanged: () => {
        console.log('[Mock] Haptic selection changed');
      },
    },
  };

  // Создаём mock UI элементы
  function updateMockUI() {
    // MainButton
    let mainBtn = document.getElementById('mock-main-button');
    if (mainButtonVisible) {
      if (!mainBtn) {
        mainBtn = document.createElement('button');
        mainBtn.id = 'mock-main-button';
        mainBtn.style.cssText = `
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: ${mockWebApp.MainButton.color};
          color: ${mockWebApp.MainButton.textColor};
          border: none;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          z-index: 9999;
          font-family: inherit;
        `;
        mainBtn.onclick = () => mainButtonCallback?.();
        document.body.appendChild(mainBtn);
      }
      mainBtn.textContent = mockWebApp.MainButton.text;
      mainBtn.style.display = 'block';
    } else if (mainBtn) {
      mainBtn.style.display = 'none';
    }

    // BackButton - не рендерим в mock, кнопка назад встроена в Breadcrumbs
    // В реальном Telegram BackButton управляется системой
  }

  return mockWebApp;
}

/**
 * Хук для работы с Telegram WebApp API
 * В dev режиме без Telegram использует mock
 */
export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);
  const mockRef = useRef<TelegramWebApp | null>(null);

  // Инициализация WebApp выполняется один раз при монтировании
  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    // Проверяем есть ли реальный Telegram с валидным initData
    if (tg && tg.initData) {
      // Реальный Telegram WebApp с данными
      tg.ready();
      tg.expand();
      setWebApp(tg);
      setIsReady(true);
    } else if (isDev) {
      // Dev режим — создаём mock (даже если window.Telegram существует, но без initData)
      console.log('[Mock] Running in development mode without Telegram (or empty initData)');
      if (!mockRef.current) {
        mockRef.current = createMockWebApp();
      }
      setWebApp(mockRef.current);
      setIsReady(true);
    } else if (tg) {
      // Production без initData — всё равно инициализируем (покажет ошибку авторизации)
      tg.ready();
      tg.expand();
      setWebApp(tg);
      setIsReady(true);
    }
  }, []);

  const user = webApp?.initDataUnsafe?.user;
  const chat = webApp?.initDataUnsafe?.chat;
  const initData = webApp?.initData || '';
  const startParam = webApp?.initDataUnsafe?.start_param;
  const colorScheme = webApp?.colorScheme || 'light';
  const themeParams = webApp?.themeParams || {};

  // Парсим start_param для deep links
  // Форматы: chatId_section_sectionId или просто chatId
  const deepLinkSectionId = (() => {
    if (!startParam) return null;
    const match = startParam.match(/_section_(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  })();

  // Флаг mock режима
  const isMock = isDev && !window.Telegram?.WebApp;

  return {
    webApp,
    user,
    chat,
    initData,
    isReady,
    colorScheme,
    themeParams,
    startParam,
    deepLinkSectionId,
    isMock,
  };
}
