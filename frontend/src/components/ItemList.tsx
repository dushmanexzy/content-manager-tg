import type { Item } from '../types';
import { ItemCard } from './ItemCard';
import './ItemList.css';

interface ItemListProps {
  items: Item[];
  onItemClick: (item: Item) => void;
  onEditItem?: (item: Item) => void;
  onDeleteItem?: (item: Item) => void;
  currentUserId?: number;
  canWrite?: boolean;
  canDeleteOwn?: boolean;
  canDeleteOthers?: boolean;
  emptyMessage?: string;
}

/**
 * Список элементов контента
 */
export function ItemList({
  items,
  onItemClick,
  onEditItem,
  onDeleteItem,
  currentUserId,
  canWrite,
  canDeleteOwn,
  canDeleteOthers,
  emptyMessage
}: ItemListProps) {
  if (items.length === 0) {
    return (
      <div className="item-list-empty">
        <p>{emptyMessage || 'Нет элементов'}</p>
      </div>
    );
  }

  // Вычисляем права для каждого элемента
  const getItemPermissions = (item: Item) => {
    const isOwner = item.createdById === currentUserId;
    const canEdit = canWrite && (isOwner || canDeleteOthers);
    const canDelete = (canDeleteOwn && isOwner) || canDeleteOthers;
    return { canEdit, canDelete };
  };

  return (
    <div className="item-list">
      {items.map((item) => {
        const { canEdit, canDelete } = getItemPermissions(item);
        return (
          <ItemCard
            key={item.id}
            item={item}
            onClick={() => onItemClick(item)}
            onEdit={onEditItem ? () => onEditItem(item) : undefined}
            onDelete={onDeleteItem ? () => onDeleteItem(item) : undefined}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        );
      })}
    </div>
  );
}
