import { useState, useRef, useCallback, useEffect } from 'react';
import './SwipeableCard.css';

interface SwipeableCardProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

const ACTIONS_WIDTH = 92; // ширина контейнера с кнопками (44px * 2 + 4px gap)
const SWIPE_THRESHOLD = 35; // порог для срабатывания свайпа

/**
 * Обёртка с поддержкой свайпа влево для показа кнопок действий
 * Контент сужается вместо сдвига, чтобы оставаться видимым
 */
export function SwipeableCard({ children, onEdit, onDelete, disabled }: SwipeableCardProps) {
  const [revealWidth, setRevealWidth] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentWidth = useRef(0);
  const isDragging = useRef(false);
  const isScrolling = useRef<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике вне
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setRevealWidth(0);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    currentWidth.current = revealWidth;
    isDragging.current = true;
    isScrolling.current = null;
  }, [disabled, revealWidth]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || disabled) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;

    // Определяем направление жеста (горизонтальный или вертикальный)
    if (isScrolling.current === null) {
      isScrolling.current = Math.abs(deltaY) > Math.abs(deltaX);
    }

    // Если вертикальный скролл - не обрабатываем
    if (isScrolling.current) return;

    // Предотвращаем скролл страницы при горизонтальном свайпе
    e.preventDefault();

    // Свайп влево увеличивает ширину кнопок (deltaX отрицательный)
    let newWidth = currentWidth.current - deltaX;

    // Ограничиваем
    if (newWidth < 0) {
      newWidth = 0;
    } else if (newWidth > ACTIONS_WIDTH) {
      // Сопротивление при перетягивании дальше
      const overDrag = newWidth - ACTIONS_WIDTH;
      newWidth = ACTIONS_WIDTH + overDrag * 0.3;
    }

    setRevealWidth(newWidth);
  }, [disabled]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || disabled) return;

    isDragging.current = false;
    isScrolling.current = null;

    // Snap к позициям
    if (revealWidth > SWIPE_THRESHOLD) {
      setRevealWidth(ACTIONS_WIDTH);
      setIsOpen(true);
    } else {
      setRevealWidth(0);
      setIsOpen(false);
    }
  }, [disabled, revealWidth]);

  const handleEdit = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setRevealWidth(0);
    setIsOpen(false);
    onEdit?.();
  }, [onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setRevealWidth(0);
    setIsOpen(false);
    onDelete?.();
  }, [onDelete]);

  // Если нет действий - просто рендерим детей
  if (disabled || (!onEdit && !onDelete)) {
    return <>{children}</>;
  }

  return (
    <div className="swipeable-container" ref={containerRef}>
      <div
        className="swipeable-content"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
      <div
        className="swipeable-actions"
        style={{
          width: `${revealWidth}px`,
          transition: isDragging.current ? 'none' : 'width 0.2s ease-out',
        }}
      >
        {onEdit && (
          <button
            className="swipeable-action edit"
            onClick={handleEdit}
            aria-label="Редактировать"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            className="swipeable-action delete"
            onClick={handleDelete}
            aria-label="Удалить"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
