import { useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { apiClient } from '../api/client';
import type { Item } from '../types';
import './AddSectionModal.css'; // базовые стили модала
import './ItemViewModal.css';

interface ItemViewModalProps {
  item: Item;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

/**
 * Модальное окно для просмотра контента
 * Поддерживает text, link, file, image
 */
export function ItemViewModal({ item, onClose, onEdit, onDelete, canEdit, canDelete }: ItemViewModalProps) {
  const { webApp } = useTelegram();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Загружаем URL файла из Telegram, если есть fileId
  useEffect(() => {
    if (!item.fileId) return;

    setLoadingFile(true);
    setFileError(null);

    apiClient.getFileUrl(item.fileId)
      .then((url) => {
        setFileUrl(url);
      })
      .catch((err) => {
        setFileError(err instanceof Error ? err.message : 'Ошибка загрузки');
      })
      .finally(() => {
        setLoadingFile(false);
      });
  }, [item.fileId]);

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      webApp?.HapticFeedback?.notificationOccurred('success');
      webApp?.showAlert?.('Скопировано!');
    }).catch(() => {
      webApp?.HapticFeedback?.notificationOccurred('error');
    });
  }

  function handleOpenLink() {
    if (item.content) {
      webApp?.HapticFeedback?.selectionChanged();
      window.open(item.content, '_blank');
    }
  }

  function handleDownload() {
    if (fileUrl) {
      webApp?.HapticFeedback?.selectionChanged();
      window.open(fileUrl, '_blank');
    }
  }

  function getIcon() {
    switch (item.type) {
      case 'text': return '📝';
      case 'link': return '🔗';
      case 'image': return '🖼️';
      case 'file': return '📎';
      default: return '📄';
    }
  }

  function getTitle() {
    if (item.title) return item.title;
    switch (item.type) {
      case 'text': return 'Заметка';
      case 'link': return 'Ссылка';
      case 'image': return item.fileName || 'Изображение';
      case 'file': return item.fileName || 'Файл';
      default: return 'Контент';
    }
  }

  function getDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content item-view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="item-view-header">
            <span className="item-view-icon">{getIcon()}</span>
            <h3>{getTitle()}</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть" />
        </div>

        <div className="item-view-content">
          {/* Текстовая заметка */}
          {item.type === 'text' && item.content && (
            <div className="item-view-text">
              <p>{item.content}</p>
              <button
                className="item-view-action secondary"
                onClick={() => handleCopy(item.content!)}
              >
                📋 Копировать текст
              </button>
            </div>
          )}

          {/* Ссылка */}
          {item.type === 'link' && item.content && (
            <div className="item-view-link">
              <div className="item-view-link-preview">
                <span className="item-view-link-domain">{getDomain(item.content)}</span>
                <span className="item-view-link-url">{item.content}</span>
              </div>
              <div className="item-view-actions">
                <button
                  className="item-view-action primary"
                  onClick={handleOpenLink}
                >
                  🌐 Открыть ссылку
                </button>
                <button
                  className="item-view-action secondary"
                  onClick={() => handleCopy(item.content!)}
                >
                  📋 Копировать
                </button>
              </div>
            </div>
          )}

          {/* Изображение */}
          {item.type === 'image' && (
            <div className="item-view-image">
              {loadingFile ? (
                <p className="item-view-loading">Загрузка изображения...</p>
              ) : fileError ? (
                <p className="item-view-placeholder">{fileError}</p>
              ) : fileUrl ? (
                <>
                  <img
                    src={fileUrl}
                    alt={item.title || 'Изображение'}
                    className="item-view-img"
                  />
                  <button
                    className="item-view-action primary"
                    onClick={handleDownload}
                  >
                    📥 Открыть оригинал
                  </button>
                </>
              ) : (
                <p className="item-view-placeholder">Изображение недоступно</p>
              )}
            </div>
          )}

          {/* Файл */}
          {item.type === 'file' && (
            <div className="item-view-file">
              <div className="item-view-file-info">
                <span className="item-view-file-icon">📎</span>
                <div className="item-view-file-details">
                  <span className="item-view-file-name">{item.fileName || 'Файл'}</span>
                  {item.mimeType && (
                    <span className="item-view-file-type">{item.mimeType}</span>
                  )}
                  {item.fileSize && (
                    <span className="item-view-file-size">{formatFileSize(item.fileSize)}</span>
                  )}
                </div>
              </div>
              {loadingFile ? (
                <p className="item-view-loading">Получение ссылки...</p>
              ) : fileError ? (
                <p className="item-view-placeholder">{fileError}</p>
              ) : fileUrl ? (
                <button
                  className="item-view-action primary"
                  onClick={handleDownload}
                >
                  📥 Скачать файл
                </button>
              ) : (
                <p className="item-view-placeholder">Файл недоступен</p>
              )}
            </div>
          )}
        </div>

        {/* Футер с кнопками редактирования/удаления */}
        {(canEdit || canDelete) && (
          <div className="item-view-footer">
            {canEdit && (
              <button
                className="item-view-footer-action edit"
                onClick={() => {
                  webApp?.HapticFeedback?.selectionChanged();
                  onEdit?.();
                }}
              >
                ✏️ Редактировать
              </button>
            )}
            {canDelete && (
              <button
                className="item-view-footer-action delete"
                onClick={() => {
                  webApp?.HapticFeedback?.selectionChanged();
                  onDelete?.();
                }}
              >
                🗑️ Удалить
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
