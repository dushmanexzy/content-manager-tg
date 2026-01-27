import { useState } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import type { Item, UpdateItemDto } from '../types';
import './AddSectionModal.css';
import './EditItemModal.css';

interface EditItemModalProps {
  item: Item;
  onClose: () => void;
  onSave: (dto: UpdateItemDto) => void;
}

/**
 * Модальное окно редактирования контента
 */
export function EditItemModal({ item, onClose, onSave }: EditItemModalProps) {
  const [title, setTitle] = useState(item.title || '');
  const [content, setContent] = useState(item.content || '');
  const { webApp } = useTelegram();

  // Можно ли редактировать контент (только для text и link)
  const canEditContent = item.type === 'text' || item.type === 'link';

  function getIcon() {
    switch (item.type) {
      case 'text': return '📝';
      case 'link': return '🔗';
      case 'image': return '🖼️';
      case 'file': return '📎';
      default: return '📄';
    }
  }

  function getTypeName() {
    switch (item.type) {
      case 'text': return 'заметку';
      case 'link': return 'ссылку';
      case 'image': return 'изображение';
      case 'file': return 'файл';
      default: return 'элемент';
    }
  }

  function validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedTitle = title.trim() || null;
    const trimmedContent = content.trim();

    // Валидация для text
    if (item.type === 'text' && !trimmedContent) {
      webApp?.showAlert?.('Введите текст заметки');
      return;
    }

    // Валидация для link
    if (item.type === 'link') {
      if (!trimmedContent) {
        webApp?.showAlert?.('Введите URL');
        return;
      }
      if (!validateUrl(trimmedContent)) {
        webApp?.showAlert?.('Введите корректный URL');
        return;
      }
    }

    // Проверяем, были ли изменения
    const titleChanged = trimmedTitle !== (item.title || null);
    const contentChanged = canEditContent && trimmedContent !== (item.content || '');

    if (!titleChanged && !contentChanged) {
      onClose();
      return;
    }

    const dto: UpdateItemDto = {};
    if (titleChanged) {
      dto.title = trimmedTitle;
    }
    if (contentChanged) {
      dto.content = trimmedContent || null;
    }

    onSave(dto);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-item-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <span className="edit-item-icon">{getIcon()}</span>
            Редактировать {getTypeName()}
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть" />
        </div>

        <form onSubmit={handleSubmit}>
          {/* Название (опционально для всех типов) */}
          <div className="form-group">
            <label htmlFor="title">Название (необязательно)</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название"
              autoFocus={!canEditContent}
            />
          </div>

          {/* Контент (только для text и link) */}
          {item.type === 'text' && (
            <div className="form-group">
              <label htmlFor="content">Текст</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Введите текст заметки"
                rows={5}
                autoFocus
              />
            </div>
          )}

          {item.type === 'link' && (
            <div className="form-group">
              <label htmlFor="content">URL</label>
              <input
                id="content"
                type="url"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="https://example.com"
                autoFocus
              />
            </div>
          )}

          {/* Информация для file/image - контент нельзя изменить */}
          {(item.type === 'file' || item.type === 'image') && (
            <div className="edit-item-file-info">
              <span className="edit-item-file-icon">
                {item.type === 'image' ? '🖼️' : '📎'}
              </span>
              <div className="edit-item-file-details">
                <span className="edit-item-file-name">{item.fileName || 'Файл'}</span>
                <span className="edit-item-file-hint">Файл нельзя заменить</span>
              </div>
            </div>
          )}

          <button type="submit" className="submit-button">
            Сохранить
          </button>
        </form>
      </div>
    </div>
  );
}
