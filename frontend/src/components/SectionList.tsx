import type { Section } from '../types';
import { SectionCard } from './SectionCard';
import './SectionList.css';

interface SectionListProps {
  sections: Section[];
  onSectionClick: (section: Section) => void;
  onEditSection?: (section: Section) => void;
  onDeleteSection?: (section: Section) => void;
  canManage?: boolean;
  emptyMessage?: string;
}

/**
 * Список разделов
 * Простой презентационный компонент — получает данные через props
 */
export function SectionList({
  sections,
  onSectionClick,
  onEditSection,
  onDeleteSection,
  canManage,
  emptyMessage
}: SectionListProps) {
  if (sections.length === 0) {
    return (
      <div className="section-list-empty">
        <p>{emptyMessage || 'Нет разделов'}</p>
      </div>
    );
  }

  return (
    <div className="section-list">
      {sections.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          onClick={() => onSectionClick(section)}
          onEdit={onEditSection ? () => onEditSection(section) : undefined}
          onDelete={onDeleteSection ? () => onDeleteSection(section) : undefined}
          canManage={canManage}
        />
      ))}
    </div>
  );
}
