import { useState } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import type { Section, UpdateSectionDto } from '../types';
import './AddSectionModal.css';

interface EditSectionModalProps {
  section: Section;
  onClose: () => void;
  onSave: (dto: UpdateSectionDto) => void;
}

/**
 * Модальное окно редактирования раздела
 */
export function EditSectionModal({ section, onClose, onSave }: EditSectionModalProps) {
  const [title, setTitle] = useState(section.title);
  const { webApp } = useTelegram();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      webApp?.showAlert?.('Введите название раздела');
      return;
    }

    // Если название не изменилось - просто закрываем
    if (trimmedTitle === section.title) {
      onClose();
      return;
    }

    onSave({ title: trimmedTitle });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Редактировать раздел</h3>
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
            Сохранить
          </button>
        </form>
      </div>
    </div>
  );
}
