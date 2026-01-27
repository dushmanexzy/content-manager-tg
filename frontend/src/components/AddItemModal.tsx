import { useState, useRef } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { apiClient } from '../api/client';
import type { ItemType, CreateItemDto } from '../types';
import './AddSectionModal.css'; // общие стили модалов
import './AddItemModal.css';

interface AddItemModalProps {
  sectionId: number;
  onClose: () => void;
  onSubmit: (dto: CreateItemDto) => void;
  onFileUploaded?: () => void; // Вызывается после успешной загрузки файла
}

const itemTypes: { value: ItemType; label: string; icon: string }[] = [
  { value: 'text', label: 'Заметка', icon: '📝' },
  { value: 'link', label: 'Ссылка', icon: '🔗' },
  { value: 'image', label: 'Фото', icon: '🖼️' },
  { value: 'file', label: 'Файл', icon: '📎' },
];

/**
 * Модальное окно добавления контента
 * Поддерживаем text, link, image, file
 */
export function AddItemModal({ sectionId, onClose, onSubmit, onFileUploaded }: AddItemModalProps) {
  const [type, setType] = useState<ItemType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { webApp } = useTelegram();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Для файлов - загружаем через upload endpoint
    if ((type === 'file' || type === 'image') && file) {
      setUploading(true);
      try {
        await apiClient.uploadItem(sectionId, file, title.trim() || undefined);
        webApp?.HapticFeedback?.notificationOccurred('success');
        onFileUploaded?.();
        onClose();
      } catch (err) {
        webApp?.showAlert?.(err instanceof Error ? err.message : 'Ошибка загрузки');
        webApp?.HapticFeedback?.notificationOccurred('error');
      } finally {
        setUploading(false);
      }
      return;
    }

    // Для текста и ссылок
    if (!content.trim()) {
      webApp?.showAlert?.(type === 'link' ? 'Введите URL' : 'Введите текст');
      return;
    }

    // Валидация URL для ссылок
    if (type === 'link') {
      try {
        new URL(content.trim());
      } catch {
        webApp?.showAlert?.('Введите корректный URL (например, https://example.com)');
        return;
      }
    }

    onSubmit({
      type,
      title: title.trim() || null,
      content: content.trim(),
    });
  }

  function handleTypeSelect(newType: ItemType) {
    setType(newType);
    setContent('');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    webApp?.HapticFeedback?.selectionChanged();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        // Авто-заполнение названия из имени файла
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt);
      }
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  const isFileType = type === 'file' || type === 'image';
  const canSubmit = isFileType ? !!file : !!content.trim();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Добавить</h3>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть" />
        </div>

        <form onSubmit={handleSubmit}>
          {/* Выбор типа */}
          <div className="form-group">
            <label>Тип</label>
            <div className="type-selector">
              {itemTypes.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`type-option ${type === item.value ? 'selected' : ''}`}
                  onClick={() => handleTypeSelect(item.value)}
                >
                  <span className="type-icon">{item.icon}</span>
                  <span className="type-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Название (опционально) */}
          <div className="form-group">
            <label htmlFor="item-title">Название (необязательно)</label>
            <input
              id="item-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название"
            />
          </div>

          {/* Контент - для text и link */}
          {!isFileType && (
            <div className="form-group">
              <label htmlFor="item-content">
                {type === 'link' ? 'URL' : 'Текст'}
              </label>
              {type === 'text' ? (
                <textarea
                  id="item-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Введите текст заметки"
                  autoFocus
                />
              ) : (
                <input
                  id="item-content"
                  type="url"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="https://example.com"
                  autoFocus
                />
              )}
            </div>
          )}

          {/* Выбор файла - для file и image */}
          {isFileType && (
            <div className="form-group">
              <label>{type === 'image' ? 'Выберите изображение' : 'Выберите файл'}</label>
              <input
                ref={fileInputRef}
                type="file"
                accept={type === 'image' ? 'image/*' : '*/*'}
                onChange={handleFileChange}
                className="file-input"
              />
              {file && (
                <div className="file-preview">
                  <span className="file-preview-icon">{type === 'image' ? '🖼️' : '📎'}</span>
                  <div className="file-preview-info">
                    <span className="file-preview-name">{file.name}</span>
                    <span className="file-preview-size">{formatFileSize(file.size)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={!canSubmit || uploading}
          >
            {uploading ? 'Загрузка...' : 'Добавить'}
          </button>
        </form>
      </div>
    </div>
  );
}
