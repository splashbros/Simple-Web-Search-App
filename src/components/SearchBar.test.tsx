import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import axios from 'axios';
import SearchBar from './SearchBar';
import { act } from 'react-dom/test-utils';

jest.setTimeout(10000);  // At the top of the file

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Add this before your tests
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('SearchBar', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: { suggestions: ['test1', 'test2'] } });
  });

  test('renders search input correctly', () => {
    render(<SearchBar />);
    const inputElement = screen.getByPlaceholderText('Search...');
    expect(inputElement).toBeInTheDocument();
  });

  test('updates input value when typing', () => {
    render(<SearchBar />);
    const inputElement = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    fireEvent.change(inputElement, { target: { value: 'test query' } });
    expect(inputElement.value).toBe('test query');
  });

  test('shows suggestions when typing', async () => {
    render(<SearchBar />);
    const inputElement = screen.getByPlaceholderText('Search...');
    
    fireEvent.change(inputElement, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('test1')).toBeInTheDocument();
      expect(screen.getByText('test2')).toBeInTheDocument();
    });
  });

  test('hides suggestions when input is empty', async () => {
    render(<SearchBar />);
    const inputElement = screen.getByPlaceholderText('Search...');
    
    fireEvent.change(inputElement, { target: { value: 'test' } });
    await waitFor(() => {
      expect(screen.getByText('test1')).toBeInTheDocument();
    });

    fireEvent.change(inputElement, { target: { value: '' } });
    await waitFor(() => {
      expect(screen.queryByText('test1')).not.toBeInTheDocument();
    });
  });

  test('selects a suggestion when clicked', async () => {
    render(<SearchBar />);
    const inputElement = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    
    fireEvent.change(inputElement, { target: { value: 'test' } });

    await waitFor(() => {
      const suggestion = screen.getByText('test1');
      fireEvent.click(suggestion);
    });

    expect(inputElement.value).toBe('test1');
  });


  test('clears input when clear button is clicked', async () => {
    render(<SearchBar />);
    const inputElement = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    
    fireEvent.change(inputElement, { target: { value: 'test query' } });
    expect(inputElement.value).toBe('test query');

    const clearButton = await screen.findByRole('button', { name: /×/i });
    fireEvent.click(clearButton);

    expect(inputElement.value).toBe('');
  });

  test('doesn\'t show suggestions for very short queries', async () => {
    render(<SearchBar />);
    const inputElement = screen.getByPlaceholderText('Search...');
    
    fireEvent.change(inputElement, { target: { value: 't' } });

    await waitFor(() => {
      expect(screen.queryByText('test1')).not.toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));
    render(<SearchBar />);
    const inputElement = screen.getByPlaceholderText('Search...');
    
    fireEvent.change(inputElement, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.queryByText('test1')).not.toBeInTheDocument();
    });
  });

  test('shows suggestion dropdown when > 2 characters are typed', async () => {
    mockedAxios.get.mockResolvedValue({ data: { suggestions: ['test1', 'test2', 'test3', 'test4', 'test5', 'test6', 'test7'] } });
    render(<SearchBar />);
    const inputElement = screen.getByPlaceholderText('Search...');
    
    await userEvent.type(inputElement, 'tes');
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getAllByRole('option')).toHaveLength(6);
    });
  });

  test('limits suggestions to top 6 results', async () => {
    mockedAxios.get.mockResolvedValue({ data: { suggestions: ['test1', 'test2', 'test3', 'test4', 'test5', 'test6', 'test7'] } });
    render(<SearchBar />);
    const inputElement = screen.getByPlaceholderText('Search...');
    
    await userEvent.type(inputElement, 'test');
    
    await waitFor(() => {
      expect(screen.getAllByRole('option')).toHaveLength(6);
    });
  });

  test('selects suggestions using keyboard navigation', async () => {
    mockedAxios.get.mockResolvedValue({ data: { suggestions: ['test1', 'test2'] } });
    render(<SearchBar />);
    const inputElement = screen.getByPlaceholderText('Search...');
    
    await userEvent.type(inputElement, 'test');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    
    expect(inputElement).toHaveValue('test1');
  });

  test('shows X button when >= 1 character is typed', async () => {
    render(<SearchBar />);
    const inputElement = screen.getByPlaceholderText('Search...');
    
    await userEvent.type(inputElement, 't');
    
    expect(screen.getByRole('button', { name: /×/i })).toBeInTheDocument();
  });

  test('clears search bar and removes suggestions when X is clicked', async () => {
    mockedAxios.get.mockResolvedValue({ data: { suggestions: ['test1', 'test2'] } });
    render(<SearchBar />);
    const inputElement = screen.getByPlaceholderText('Search...');
    
    await userEvent.type(inputElement, 'test');
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    
    const clearButton = screen.getByRole('button', { name: /×/i });
    await userEvent.click(clearButton);
    
    expect(inputElement).toHaveValue('');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('fetches and displays search results when search button is clicked', async () => {
    const mockSearchResults = {
      ResultItems: [
        {
          DocumentTitle: { Text: "Choose a Child Care Centre" },
          DocumentExcerpt: { Text: "...as partners to optimise the child physical, intellectual, emotional and social development. Choosing a Child Care Centre for Your Child In choosing the appropriate child care arrangement, the age and personality of your child are important factors for consideration..." },
          DocumentURI: "https://www.ecda.gov.sg/Parents/Pages/ParentsChooseCCC.aspx"
        },
        {
          DocumentTitle: { Text: "Planning For A Child" },
          DocumentExcerpt: { Text: "...and flexibility when making a decision. Find out which Child Care Centre is most convenient for you here . Planning Your Child Education Education is a key pillar of your child life. By planning early, you will be well placed to decide on the best options to finance your child education. Having a..." },
          DocumentURI: "https://www.areyouready.gov.sg/YourLifeEvents/Pages/HavingKids-Planning-for-a-child.aspx"
        }
      ]
    };

    mockedAxios.get.mockResolvedValue({ data: mockSearchResults });

    render(<SearchBar />);

    const searchInput = screen.getByPlaceholderText('Search...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    await userEvent.type(searchInput, 'child care');
    await userEvent.click(searchButton);

    await waitFor(() => {
      // Check if the correct number of results is displayed
      expect(screen.getByText('Showing 1-2 of 2 results')).toBeInTheDocument();

      // Check for the presence of both result titles
      expect(screen.getByRole('heading', { name: /Choose a Child Care Centre/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Planning For A Child/i })).toBeInTheDocument();

      // Check for the presence of result URLs
      expect(screen.getByText('https://www.ecda.gov.sg/Parents/Pages/ParentsChooseCCC.aspx')).toBeInTheDocument();
      expect(screen.getByText('https://www.areyouready.gov.sg/YourLifeEvents/Pages/HavingKids-Planning-for-a-child.aspx')).toBeInTheDocument();

    });

    // Verify that the API was called with the correct URL
    expect(mockedAxios.get).toHaveBeenCalledWith('https://gist.githubusercontent.com/yuhong90/b5544baebde4bfe9fe2d12e8e5502cbf/raw/44deafab00fc808ed7fa0e59a8bc959d255b9785/queryResult.json');
  });
});
