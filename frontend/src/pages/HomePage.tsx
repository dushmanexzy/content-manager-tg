import { useState } from 'react';
import { SectionList } from '../components/SectionList';
import { AddSectionModal } from '../components/AddSectionModal';
import { EditSectionModal } from '../components/EditSectionModal';
import { BottomActions } from '../components/BottomActions';
import { apiClient } from '../api/client';
import type { Section, Permissions, UpdateSectionDto, TelegramWebApp } from '../types';
import './HomePage.css';

interface HomePageProps {
  sections: Section[];
  permissions: Permissions | null;
  onSectionClick: (section: Section) => void;
  onRefresh: () => void;
  webApp: TelegramWebApp | null;
}

type ModalType = 'add' | 'edit' | null;

/**
 * Главная страница — корневые разделы
 */
export function HomePage({
  sections,
  permissions,
  onSectionClick,
  onRefresh,
  webApp,
}: HomePageProps) {
  const [showModal, setShowModal] = useState<ModalType>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  // Создание раздела
  async function handleCreateSection(title: string) {
    try {
      await apiClient.createSection({ title, parentId: null });
      webApp?.HapticFeedback?.notificationOccurred('success');
      setShowModal(null);
      onRefresh();
    } catch (err) {
      webApp?.showAlert?.(err instanceof Error ? err.message : 'Ошибка создания');
      webApp?.HapticFeedback?.notificationOccurred('error');
    }
  }

  // Редактирование раздела
  function handleEditSectionClick(section: Section) {
    setEditingSection(section);
    setShowModal('edit');
  }

  async function handleSaveSection(dto: UpdateSectionDto) {
    if (!editingSection) return;
    try {
      await apiClient.updateSection(editingSection.id, dto);
      webApp?.HapticFeedback?.notificationOccurred('success');
      setShowModal(null);
      setEditingSection(null);
      onRefresh();
    } catch (err) {
      webApp?.showAlert?.(err instanceof Error ? err.message : 'Ошибка сохранения');
      webApp?.HapticFeedback?.notificationOccurred('error');
    }
  }

  // Удаление раздела
  function handleDeleteSectionClick(section: Section) {
    const hasContent = (section._count?.children || 0) > 0 || (section._count?.items || 0) > 0;
    const message = hasContent
      ? 'Удалить раздел со всем содержимым?'
      : 'Удалить раздел?';

    webApp?.showConfirm?.(message, async (confirmed) => {
      if (!confirmed) return;
      try {
        await apiClient.deleteSection(section.id);
        webApp?.HapticFeedback?.notificationOccurred('success');
        onRefresh();
      } catch (err) {
        webApp?.showAlert?.(err instanceof Error ? err.message : 'Ошибка удаления');
        webApp?.HapticFeedback?.notificationOccurred('error');
      }
    });
  }

  function handleSectionClick(section: Section) {
    webApp?.HapticFeedback?.selectionChanged();
    onSectionClick(section);
  }

  return (
    <div className="home-page">
      <h1 className="home-title">Разделы</h1>

      {sections.length === 0 ? (
        <div className="home-empty">
          <div className="home-empty-icon">📁</div>
          <p>Пока нет разделов</p>
          {permissions?.canWrite && (
            <button
              className="home-empty-button"
              onClick={() => setShowModal('add')}
            >
              Создать первый раздел
            </button>
          )}
        </div>
      ) : (
        <div className="home-content">
          <SectionList
            sections={sections}
            onSectionClick={handleSectionClick}
            onEditSection={handleEditSectionClick}
            onDeleteSection={handleDeleteSectionClick}
            canManage={permissions?.canManage}
          />
        </div>
      )}

      {/* Нижние кнопки действий */}
      <BottomActions
        isHomePage={true}
        canWrite={permissions?.canWrite}
        onAddSection={() => setShowModal('add')}
      />

      {showModal === 'add' && (
        <AddSectionModal
          parentId={null}
          onClose={() => setShowModal(null)}
          onSubmit={handleCreateSection}
        />
      )}

      {showModal === 'edit' && editingSection && (
        <EditSectionModal
          section={editingSection}
          onClose={() => {
            setShowModal(null);
            setEditingSection(null);
          }}
          onSave={handleSaveSection}
        />
      )}
    </div>
  );
}
