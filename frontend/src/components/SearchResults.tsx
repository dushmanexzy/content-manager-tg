import type { SearchResult } from '../types';
import './SearchResults.css';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  loading?: boolean;
  onResultClick: (result: SearchResult) => void;
}

/**
 * Отображение результатов поиска
 */
export function SearchResults({
  results,
  query,
  loading,
  onResultClick,
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className="search-results-loading">
        <span className="search-results-spinner">⏳</span>
        <span>Поиск...</span>
      </div>
    );
  }

  if (!query) {
    return null;
  }

  if (results.length === 0) {
    return (
      <div className="search-results-empty">
        <p>Ничего не найдено по запросу "{query}"</p>
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="search-results-header">
        Найдено: {results.length}
      </div>
      <div className="search-results-list">
        {results.map((result) => (
          <SearchResultCard
            key={`${result.type}-${result.id}`}
            result={result}
            onClick={() => onResultClick(result)}
          />
        ))}
      </div>
    </div>
  );
}

interface SearchResultCardProps {
  result: SearchResult;
  onClick: () => void;
}

function SearchResultCard({ result, onClick }: SearchResultCardProps) {
  const icon = result.type === 'section' ? '📁' : getItemIcon(result.itemType);
  const title = result.type === 'section'
    ? result.title
    : (result.title || result.fileName || result.sectionTitle);

  // Превью контента для items
  const preview = result.type === 'item' && result.content
    ? result.content.slice(0, 100)
    : null;

  return (
    <button className="search-result-card" onClick={onClick}>
      <span className="search-result-icon">{icon}</span>
      <div className="search-result-content">
        <span className="search-result-title">{title}</span>
        {result.path && result.path.length > 0 && (
          <span className="search-result-path">
            {result.path.join(' → ')}
          </span>
        )}
        {preview && (
          <span className="search-result-highlight">
            {preview}...
          </span>
        )}
      </div>
      <span className="search-result-arrow">›</span>
    </button>
  );
}

function getItemIcon(itemType?: string): string {
  switch (itemType) {
    case 'text': return '📝';
    case 'link': return '🔗';
    case 'file': return '📄';
    case 'image': return '🖼';
    default: return '📄';
  }
}
