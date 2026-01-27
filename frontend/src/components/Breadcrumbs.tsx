import type { Breadcrumb } from '../types';
import './Breadcrumbs.css';

interface BreadcrumbsProps {
  path: Breadcrumb[];
  onNavigate: (sectionId: number | null) => void;
  onBack?: () => void;
}

/**
 * Хлебные крошки для навигации
 * Показывает путь от корня до текущего раздела
 */
export function Breadcrumbs({ path, onNavigate, onBack }: BreadcrumbsProps) {
  return (
    <div className="breadcrumbs">
      {/* Кнопка назад */}
      <button
        className="breadcrumb-back"
        onClick={onBack || (() => onNavigate(null))}
        aria-label="Назад"
      />

      <button
        className="breadcrumb-item breadcrumb-home"
        onClick={() => onNavigate(null)}
      >
        🏠
      </button>

      {path.map((item, index) => (
        <span key={item.id} className="breadcrumb-wrapper">
          <span className="breadcrumb-separator">›</span>
          {index === path.length - 1 ? (
            <span className="breadcrumb-item breadcrumb-current">
              {item.title}
            </span>
          ) : (
            <button
              className="breadcrumb-item breadcrumb-link"
              onClick={() => onNavigate(item.id)}
            >
              {item.title}
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
