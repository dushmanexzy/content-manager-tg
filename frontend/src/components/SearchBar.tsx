import { useState, useEffect, useRef } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * Поле поиска с debounce
 */
export function SearchBar({
  onSearch,
  onFocus,
  onBlur,
  placeholder = 'Поиск...',
  debounceMs = 300,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Очищаем предыдущий таймер
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Устанавливаем новый таймер
    debounceRef.current = setTimeout(() => {
      onSearch(query.trim());
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, debounceMs, onSearch]);

  function handleClear() {
    setQuery('');
    onSearch('');
  }

  return (
    <div className="search-bar">
      <span className="search-bar-icon">🔍</span>
      <input
        type="text"
        className="search-bar-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
      />
      {query && (
        <button className="search-bar-clear" onClick={handleClear}>
          ✕
        </button>
      )}
    </div>
  );
}
