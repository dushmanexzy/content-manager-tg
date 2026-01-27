import type { Item } from '../types';
import { SwipeableCard } from './SwipeableCard';
import './ItemCard.css';

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

/**
 * Иконки для разных типов контента
 */
const typeIcons: Record<string, string> = {
  text: '📝',
  link: '🔗',
  file: '📄',
  image: '🖼',
};

/**
 * Карточка элемента контента
 * Отображение зависит от типа (text, link, file, image)
 * Поддерживает свайп влево для редактирования/удаления
 */
export function ItemCard({ item, onClick, onEdit, onDelete, canEdit, canDelete }: ItemCardProps) {
  const icon = typeIcons[item.type] || '📎';

  // Формируем превью контента
  const getPreview = () => {
    switch (item.type) {
      case 'text':
        return item.content?.slice(0, 100) || 'Пустая заметка';
      case 'link':
        return extractDomain(item.content || '');
      case 'file':
        return formatFileSize(item.fileSize || 0);
      case 'image':
        return item.fileName || 'Изображение';
      default:
        return '';
    }
  };

  // Заголовок или контент
  const getTitle = () => {
    if (item.title) return item.title;

    switch (item.type) {
      case 'text':
        return item.content?.split('\n')[0]?.slice(0, 50) || 'Заметка';
      case 'link':
        return item.content || 'Ссылка';
      case 'file':
      case 'image':
        return item.fileName || (item.type === 'image' ? 'Изображение' : 'Файл');
      default:
        return 'Элемент';
    }
  };

  const hasActions = canEdit || canDelete;

  return (
    <SwipeableCard
      onEdit={canEdit ? onEdit : undefined}
      onDelete={canDelete ? onDelete : undefined}
      disabled={!hasActions}
    >
      <div className="item-card" onClick={onClick}>
        <div className="item-icon">{icon}</div>
        <div className="item-info">
          <div className="item-title">{getTitle()}</div>
          <div className="item-preview">{getPreview()}</div>
        </div>
      </div>
    </SwipeableCard>
  );
}

/**
 * Извлечь домен из URL
 */
function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Форматировать размер файла
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '';
  const units = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
