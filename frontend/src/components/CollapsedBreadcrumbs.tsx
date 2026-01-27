import { useState, useRef, useEffect } from 'react';
import type { Breadcrumb } from '../types';
import './CollapsedBreadcrumbs.css';

interface CollapsedBreadcrumbsProps {
  path: Breadcrumb[];
  onNavigate: (sectionId: number | null) => void;
}

interface DropdownPosition {
  top: number;
  left: number;
}

/**
 * Collapsed breadcrumbs:
 * 🏠 Root > [...] > Current Section
 *
 * При клике на [...] показывается выпадающее меню с промежуточными уровнями
 */
export function CollapsedBreadcrumbs({ path, onNavigate }: CollapsedBreadcrumbsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Закрытие dropdown при клике вне
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Закрытие по Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isDropdownOpen]);

  // Если путь пустой или только 1 элемент, показываем просто
  if (path.length === 0) {
    return (
      <div className="collapsed-breadcrumbs">
        <button
          className="breadcrumb-item breadcrumb-home"
          onClick={() => onNavigate(null)}
          aria-label="На главную"
        >
          <HomeIcon />
        </button>
      </div>
    );
  }

  if (path.length === 1) {
    return (
      <div className="collapsed-breadcrumbs">
        <button
          className="breadcrumb-item breadcrumb-home"
          onClick={() => onNavigate(null)}
          aria-label="На главную"
        >
          <HomeIcon />
        </button>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-item breadcrumb-current">
          {path[0].title}
        </span>
      </div>
    );
  }

  // Collapsed вид: Root > [...] > Last
  const lastItem = path[path.length - 1];
  const middleItems = path.slice(0, -1);

  function handleMiddleClick() {
    if (!isDropdownOpen && buttonRef.current) {
      // Вычисляем позицию dropdown относительно viewport
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
    setIsDropdownOpen(!isDropdownOpen);
  }

  function handleDropdownItemClick(sectionId: number) {
    setIsDropdownOpen(false);
    onNavigate(sectionId);
  }

  return (
    <div className="collapsed-breadcrumbs">
      <button
        className="breadcrumb-item breadcrumb-home"
        onClick={() => onNavigate(null)}
        aria-label="На главную"
      >
        <HomeIcon />
      </button>

      <span className="breadcrumb-separator">›</span>

      <div className="breadcrumb-dropdown-container">
        <button
          ref={buttonRef}
          className={`breadcrumb-item breadcrumb-collapsed ${isDropdownOpen ? 'active' : ''}`}
          onClick={handleMiddleClick}
          aria-label="Показать промежуточные разделы"
          aria-expanded={isDropdownOpen}
        >
          •••
        </button>

        {/* Dropdown меню — position: fixed для выхода из stacking context header */}
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className="breadcrumb-dropdown"
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
            }}
          >
            <div className="breadcrumb-dropdown-title">Перейти к разделу</div>
            {middleItems.map((item, index) => (
              <button
                key={item.id}
                className="breadcrumb-dropdown-item"
                onClick={() => handleDropdownItemClick(item.id)}
                style={{ paddingLeft: `${16 + index * 12}px` }}
              >
                <span className="breadcrumb-dropdown-icon">📁</span>
                <span className="breadcrumb-dropdown-text">{item.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <span className="breadcrumb-separator">›</span>

      <span className="breadcrumb-item breadcrumb-current">
        {lastItem.title}
      </span>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 22V12H15V22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
