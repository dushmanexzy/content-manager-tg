import { useState, useRef, useEffect } from 'react';
import './Header.css';

interface HeaderProps {
  /** Показывать ли кнопку поиска */
  showSearch?: boolean;
  /** Callback при изменении поискового запроса */
  onSearch?: (query: string) => void;
  /** Показывать ли хлебные крошки */
  showBreadcrumbs?: boolean;
  /** Компонент хлебных крошек */
  breadcrumbs?: React.ReactNode;
}

/**
 * Шапка приложения:
 * - Иконка поиска справа
 * - При клике плавно раздвигается input влево
 * - Хлебные крошки ниже (плавно скрываются при поиске)
 */
export function Header({
  showSearch = false,
  onSearch,
  showBreadcrumbs = false,
  breadcrumbs,
}: HeaderProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Фокус на input при раскрытии
  useEffect(() => {
    if (isSearchExpanded && inputRef.current) {
      // Небольшая задержка чтобы анимация началась
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isSearchExpanded]);

  function handleSearchIconClick() {
    setIsSearchExpanded(true);
  }

  function handleSearchClose() {
    setIsSearchExpanded(false);
    setSearchQuery('');
    onSearch?.('');
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    onSearch?.(value);
  }

  return (
    <div className="header">
      <div className="header-row">
        {/* Хлебные крошки слева */}
        {showBreadcrumbs && (
          <div className={`header-breadcrumbs ${isSearchExpanded ? 'search-open' : ''}`}>
            {breadcrumbs}
          </div>
        )}

        {/* Поиск справа */}
        {showSearch && (
          <div className={`header-search ${isSearchExpanded ? 'expanded' : 'collapsed'}`}>
            {/* Input — всегда в DOM, анимируется через CSS */}
            <input
              ref={inputRef}
              type="text"
              className="header-search-input"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Поиск..."
              tabIndex={isSearchExpanded ? 0 : -1}
            />

            {/* Кнопка закрытия */}
            <button
              className="header-search-close"
              onClick={handleSearchClose}
              aria-label="Закрыть поиск"
              tabIndex={isSearchExpanded ? 0 : -1}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Иконка поиска — поверх, исчезает при раскрытии */}
            <button
              className="header-search-icon"
              onClick={handleSearchIconClick}
              aria-label="Открыть поиск"
              tabIndex={isSearchExpanded ? -1 : 0}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="11"
                  cy="11"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M20 20L17 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
