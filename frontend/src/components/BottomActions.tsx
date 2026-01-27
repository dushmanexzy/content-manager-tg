import './BottomActions.css';

interface BottomActionsProps {
  /** На главной странице? (показывать одну кнопку) */
  isHomePage?: boolean;
  /** Есть ли права на запись */
  canWrite?: boolean;
  /** Callback при клике на "Добавить раздел" */
  onAddSection?: () => void;
  /** Callback при клике на "Добавить элемент" */
  onAddItem?: () => void;
}

/**
 * Нижние кнопки действий:
 * - На главной: одна кнопка "Добавить раздел" (на всю ширину)
 * - В разделе: две кнопки "Раздел" и "Элемент" (50/50)
 */
export function BottomActions({
  isHomePage = false,
  canWrite = false,
  onAddSection,
  onAddItem,
}: BottomActionsProps) {
  if (!canWrite) {
    return null;
  }

  if (isHomePage) {
    return (
      <div className="bottom-actions">
        <button
          className="bottom-action-btn bottom-action-full"
          onClick={onAddSection}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Добавить раздел</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bottom-actions bottom-actions-split">
      <button
        className="bottom-action-btn"
        onClick={onAddSection}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M22 19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21H4C3.46957 21 2.96086 20.7893 2.58579 20.4142C2.21071 20.0391 2 19.5304 2 19V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H9L11 6H20C20.5304 6 21.0391 6.21071 21.4142 6.58579C21.7893 6.96086 22 7.46957 22 8V19Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 11V17M9 14H15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Раздел</span>
      </button>

      <button
        className="bottom-action-btn"
        onClick={onAddItem}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 2V8H20M12 11V17M9 14H15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Элемент</span>
      </button>
    </div>
  );
}
