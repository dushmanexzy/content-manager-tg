import { useState } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import './AddSectionModal.css';

interface AddSectionModalProps {
  parentId: number | null;
  onClose: () => void;
  onSubmit: (title: string) => void;
}

/**
 * Модальное окно создания раздела
 */
export function AddSectionModal({ parentId, onClose, onSubmit }: AddSectionModalProps) {
  const [title, setTitle] = useState('');
  const { webApp } = useTelegram();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      webApp?.showAlert?.('Введите название раздела');
      return;
    }

    onSubmit(title.trim());
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{parentId ? 'Новый подраздел' : 'Новый раздел'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть" />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Название</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название"
              autoFocus
            />
          </div>

          <button type="submit" className="submit-button">
            Создать
          </button>
        </form>
      </div>
    </div>
  );
}
