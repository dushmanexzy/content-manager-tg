import { useState } from 'react';
import { SectionList } from '../components/SectionList';
import { ItemList } from '../components/ItemList';
import { AddSectionModal } from '../components/AddSectionModal';
import { AddItemModal } from '../components/AddItemModal';
import { ItemViewModal } from '../components/ItemViewModal';
import { EditSectionModal } from '../components/EditSectionModal';
import { EditItemModal } from '../components/EditItemModal';
import { BottomActions } from '../components/BottomActions';
import { apiClient } from '../api/client';
import type { Section, SectionWithContent, Item, Permissions, CreateItemDto, UpdateSectionDto, UpdateItemDto, TelegramWebApp, Breadcrumb } from '../types';
import './SectionPage.css';

interface SectionPageProps {
  section: SectionWithContent;
  breadcrumbs?: Breadcrumb[];
  permissions: Permissions | null;
  currentUserId?: number;
  onSectionClick: (section: Section) => void;
  onBreadcrumbClick?: (sectionId: number | null) => void;
  onBack?: () => void;
  onRefresh: () => void;
  webApp: TelegramWebApp | null;
}

type ModalType = 'section' | 'item' | 'editSection' | 'editItem' | null;

/**
 * Страница раздела — подразделы + контент
 */
export function SectionPage({
  section,
  permissions,
  currentUserId,
  onSectionClick,
  onRefresh,
  webApp,
}: SectionPageProps) {
  const [showModal, setShowModal] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Создание подраздела
  async function handleCreateSection(title: string) {
    try {
      await apiClient.createSection({ title, parentId: section.id });
      webApp?.HapticFeedback?.notificationOccurred('success');
      setShowModal(null);
      onRefresh();
    } catch (err) {
      webApp?.showAlert?.(err instanceof Error ? err.message : 'Ошибка создания');
      webApp?.HapticFeedback?.notificationOccurred('error');
    }
  }

  // Создание контента
  async function handleCreateItem(dto: CreateItemDto) {
    try {
      await apiClient.createItem(section.id, dto);
      webApp?.HapticFeedback?.notificationOccurred('success');
      setShowModal(null);
      onRefresh();
    } catch (err) {
      webApp?.showAlert?.(err instanceof Error ? err.message : 'Ошибка создания');
      webApp?.HapticFeedback?.notificationOccurred('error');
    }
  }

  // Редактирование подраздела
  function handleEditSectionClick(s: Section) {
    setEditingSection(s);
    setShowModal('editSection');
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

  // Удаление подраздела
  function handleDeleteSectionClick(s: Section) {
    const hasContent = (s._count?.children || 0) > 0 || (s._count?.items || 0) > 0;
    const message = hasContent
      ? 'Удалить раздел со всем содержимым?'
      : 'Удалить раздел?';

    webApp?.showConfirm?.(message, async (confirmed) => {
      if (!confirmed) return;
      try {
        await apiClient.deleteSection(s.id);
        webApp?.HapticFeedback?.notificationOccurred('success');
        onRefresh();
      } catch (err) {
        webApp?.showAlert?.(err instanceof Error ? err.message : 'Ошибка удаления');
        webApp?.HapticFeedback?.notificationOccurred('error');
      }
    });
  }

  // Редактирование контента
  function handleEditItemClick(item: Item) {
    setEditingItem(item);
    setSelectedItem(null);
    setShowModal('editItem');
  }

  async function handleSaveItem(dto: UpdateItemDto) {
    if (!editingItem) return;
    try {
      await apiClient.updateItem(editingItem.id, dto);
      webApp?.HapticFeedback?.notificationOccurred('success');
      setShowModal(null);
      setEditingItem(null);
      onRefresh();
    } catch (err) {
      webApp?.showAlert?.(err instanceof Error ? err.message : 'Ошибка сохранения');
      webApp?.HapticFeedback?.notificationOccurred('error');
    }
  }

  // Удаление контента
  function handleDeleteItemClick(item: Item) {
    webApp?.showConfirm?.('Удалить элемент?', async (confirmed) => {
      if (!confirmed) return;
      try {
        await apiClient.deleteItem(item.id);
        webApp?.HapticFeedback?.notificationOccurred('success');
        setSelectedItem(null);
        onRefresh();
      } catch (err) {
        webApp?.showAlert?.(err instanceof Error ? err.message : 'Ошибка удаления');
        webApp?.HapticFeedback?.notificationOccurred('error');
      }
    });
  }

  // Вычисление прав для выбранного элемента
  function getItemPermissions(item: Item) {
    const isOwner = item.createdById === currentUserId;
    const canEdit = permissions?.canWrite && (isOwner || permissions?.canDeleteOthers);
    const canDelete = (permissions?.canDeleteOwn && isOwner) || permissions?.canDeleteOthers;
    return { canEdit: !!canEdit, canDelete: !!canDelete };
  }

  function handleSectionClick(s: Section) {
    webApp?.HapticFeedback?.selectionChanged();
    onSectionClick(s);
  }

  function handleItemClick(item: Item) {
    webApp?.HapticFeedback?.selectionChanged();
    setSelectedItem(item);
  }

  const hasChildren = section.children && section.children.length > 0;
  const hasItems = section.items && section.items.length > 0;
  const isEmpty = !hasChildren && !hasItems;

  return (
    <div className="section-page">
      <h1 className="section-page-title">{section.title}</h1>

      <div className="section-page-content">
        {isEmpty ? (
          <div className="section-page-empty-message">
            <p>Раздел пуст</p>
          </div>
        ) : (
          <>
            {/* Подразделы */}
            {hasChildren && (
              <div className="section-page-block">
                <h2 className="section-page-subtitle">Подразделы</h2>
                <SectionList
                  sections={section.children}
                  onSectionClick={handleSectionClick}
                  onEditSection={handleEditSectionClick}
                  onDeleteSection={handleDeleteSectionClick}
                  canManage={permissions?.canManage}
                />
              </div>
            )}

            {/* Контент */}
            {hasItems && (
              <div className="section-page-block">
                <h2 className="section-page-subtitle">Контент</h2>
                <ItemList
                  items={section.items}
                  onItemClick={handleItemClick}
                  onEditItem={handleEditItemClick}
                  onDeleteItem={handleDeleteItemClick}
                  currentUserId={currentUserId}
                  canWrite={permissions?.canWrite}
                  canDeleteOwn={permissions?.canDeleteOwn}
                  canDeleteOthers={permissions?.canDeleteOthers}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Нижние кнопки действий */}
      <BottomActions
        isHomePage={false}
        canWrite={permissions?.canWrite}
        onAddSection={() => setShowModal('section')}
        onAddItem={() => setShowModal('item')}
      />

      {/* Модалки */}
      {showModal === 'section' && (
        <AddSectionModal
          parentId={section.id}
          onClose={() => setShowModal(null)}
          onSubmit={handleCreateSection}
        />
      )}

      {showModal === 'item' && (
        <AddItemModal
          sectionId={section.id}
          onClose={() => setShowModal(null)}
          onSubmit={handleCreateItem}
          onFileUploaded={onRefresh}
        />
      )}

      {showModal === 'editSection' && editingSection && (
        <EditSectionModal
          section={editingSection}
          onClose={() => {
            setShowModal(null);
            setEditingSection(null);
          }}
          onSave={handleSaveSection}
        />
      )}

      {showModal === 'editItem' && editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => {
            setShowModal(null);
            setEditingItem(null);
          }}
          onSave={handleSaveItem}
        />
      )}

      {selectedItem && (() => {
        const { canEdit, canDelete } = getItemPermissions(selectedItem);
        return (
          <ItemViewModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onEdit={() => handleEditItemClick(selectedItem)}
            onDelete={() => handleDeleteItemClick(selectedItem)}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        );
      })()}
    </div>
  );
}
