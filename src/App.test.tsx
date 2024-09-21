import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App', () => {
  // Test if the GovTech logo is rendered
  test('renders the GovTech logo', () => {
    render(<App />);
    const logoElement = screen.getByAltText('GovTech Logo');
    expect(logoElement).toBeInTheDocument();
  });

  // Test if the "GovTech Search" title is rendered
  test('renders the "GovTech Search" title', () => {
    render(<App />);
    const titleElement = screen.getByText(/GovTech Search/i);
    expect(titleElement).toBeInTheDocument();
  });

  // Test if the SearchBar component is rendered
  test('renders the SearchBar component', () => {
    render(<App />);
    const searchInput = screen.getByPlaceholderText('Search...');
    expect(searchInput).toBeInTheDocument();
  });
});
