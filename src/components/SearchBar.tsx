import React, { useState, useEffect, KeyboardEvent as ReactKeyboardEvent, useRef } from 'react';
import axios from 'axios';
import './SearchBar.css';

// Interfaces for API responses and search result items
interface SuggestionResponse {
  suggestions: string[];
}

interface SearchResponse {
  ResultItems: ResultItem[];
}

interface ResultItem {
  DocumentTitle: { Text: string };
  DocumentExcerpt: { Text: string };
  DocumentURI: string;
}

// Function to fetch search suggestions from the API
export const fetchSuggestionsAPI = async (): Promise<string[]> => {
  const response = await axios.get<SuggestionResponse>('https://gist.githubusercontent.com/yuhong90/b5544baebde4bfe9fe2d12e8e5502cbf/raw/e026dab444155edf2f52122aefbb80347c68de86/suggestion.json');
  return response.data.suggestions;
};

const SearchBar: React.FC = () => {
  // State variables for managing search functionality
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [tempQuery, setTempQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ResultItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length > 2) {
        try {
          const fetchedSuggestions = await fetchSuggestionsAPI();
          const filteredSuggestions = fetchedSuggestions.filter(suggestion =>
            suggestion.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 6);  // Add this line to limit to 6 suggestions
          setSuggestions(filteredSuggestions);
          setShowSuggestions(filteredSuggestions.length > 0);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [query]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setTempQuery(newQuery);
    setQuery(newQuery);
    setSelectedIndex(-1);
    setShowSuggestions(newQuery.length >= 2);
  };

  const handleClear = () => {
    setQuery('');
    setTempQuery('');
    setSelectedIndex(-1);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus(); // Keep focus on the input after clearing
    }

  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setTempQuery(suggestion);
    handleSearch(suggestion);  // Pass the suggestion directly to handleSearch
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
    if (!showSuggestions) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex(prevIndex => 
        prevIndex < suggestions.length - 1 ? prevIndex + 1 : prevIndex
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : -1));
    } else if (event.key === 'Enter') {
      if (selectedIndex >= 0) {
        handleSuggestionClick(suggestions[selectedIndex]);
      } else {
        handleSearch();
      }
    }
  };

  const handleSearch = async (searchQuery?: string) => {
    setShowSuggestions(false);
    setHasSearched(true);
    if (inputRef.current) {
      inputRef.current.blur();
    }
    try {
      const response = await axios.get<SearchResponse>('https://gist.githubusercontent.com/yuhong90/b5544baebde4bfe9fe2d12e8e5502cbf/raw/44deafab00fc808ed7fa0e59a8bc959d255b9785/queryResult.json');
      
      const searchPhrase = (searchQuery || query).toLowerCase();
      
      const filteredResults = response.data.ResultItems?.filter((item: ResultItem) => {
        const titleLower = item.DocumentTitle.Text.toLowerCase();
        const excerptLower = item.DocumentExcerpt.Text.toLowerCase();
        
        return titleLower.includes(searchPhrase) || excerptLower.includes(searchPhrase);
      }) || [];
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error fetching search results:', error);
      setSearchResults([]);
    }
  };

  const handleInputFocus = () => {
    if (tempQuery.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Use setTimeout to allow click events on suggestions to fire before hiding
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const highlightMatches = (text: string, query: string) => {
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  const calculateSuggestionsPosition = () => {
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
      const rect = searchBar.getBoundingClientRect();
      return {
        width: `${rect.width}px`,
      };
    }
    return {};
  };


  return (
    <div className="search-container">
      <div className="search-wrapper">
        <div className="search-bar">
          <input
            ref={inputRef}
            type="text"
            value={tempQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Search..."
          />
          {tempQuery && (
            <button onClick={handleClear} className="clear-button">
              ×
            </button>
          )}
        </div>
        <button 
          onClick={() => handleSearch()} 
          className="search-button"
          aria-label="Search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </button>
        {showSuggestions && suggestions.length > 0 && (
          <ul className="suggestions" role="listbox" style={calculateSuggestionsPosition()}>
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                role="option"
                onClick={() => handleSuggestionClick(suggestion)}
                className={index === selectedIndex ? 'selected' : ''}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
      {hasSearched && (
        searchResults.length > 0 ? (
          <div className="search-results">
            <p className="results-count" style={{ fontSize: '0.65em' }}>Showing 1-{searchResults.length} of {searchResults.length} results</p>
            {searchResults.map((result, index) => (
              <div key={index} className="search-result">
                <h3 dangerouslySetInnerHTML={{ __html: highlightMatches(result.DocumentTitle.Text, query) }}></h3>
                <p className="result-date">1 Sep 2021 — <span dangerouslySetInnerHTML={{ __html: highlightMatches(result.DocumentExcerpt.Text, query) }}></span></p>
                <a href={result.DocumentURI} className="result-link">{result.DocumentURI}</a>
              </div>
            ))}
          </div>
        ) : (
          <div className="search-results">
            <p className="results-count" style={{ fontSize: '0.8em' }}>No results</p>
          </div>
        )
      )}
    </div>
  );
};

export default SearchBar;
