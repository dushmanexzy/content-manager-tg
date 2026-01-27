import type { Section } from '../types';
import { SwipeableCard } from './SwipeableCard';
import './SectionCard.css';

interface SectionCardProps {
  section: Section;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canManage?: boolean;
}

/**
 * Карточка раздела
 * Показывает название и счётчики подразделов/контента
 * Поддерживает свайп влево для редактирования/удаления
 */
export function SectionCard({ section, onClick, onEdit, onDelete, canManage }: SectionCardProps) {
  const childrenCount = section._count?.children || 0;
  const itemsCount = section._count?.items || 0;

  // Формируем подпись со счётчиками
  const getSubtitle = () => {
    const parts: string[] = [];
    if (childrenCount > 0) {
      parts.push(`${childrenCount} ${pluralize(childrenCount, 'раздел', 'раздела', 'разделов')}`);
    }
    if (itemsCount > 0) {
      parts.push(`${itemsCount} ${pluralize(itemsCount, 'элемент', 'элемента', 'элементов')}`);
    }
    return parts.join(', ') || 'Пусто';
  };

  return (
    <SwipeableCard
      onEdit={canManage ? onEdit : undefined}
      onDelete={canManage ? onDelete : undefined}
      disabled={!canManage}
    >
      <div className="section-card" onClick={onClick}>
        <div className="section-icon">📁</div>
        <div className="section-info">
          <h3 className="section-title">{section.title}</h3>
          <span className="section-subtitle">{getSubtitle()}</span>
        </div>
        <div className="section-arrow">›</div>
      </div>
    </SwipeableCard>
  );
}

/**
 * Склонение слов
 */
function pluralize(count: number, one: string, few: string, many: string): string {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return many;
  if (n1 > 1 && n1 < 5) return few;
  if (n1 === 1) return one;
  return many;
}
