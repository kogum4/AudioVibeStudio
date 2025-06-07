import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders AudioVibe Studio heading', () => {
    render(<App />);
    const headings = screen.getAllByText('AudioVibe Studio');
    expect(headings.length).toBeGreaterThan(0);
    expect(headings[0]).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<App />);
    const description = screen.getByText('Create stunning audio-reactive videos');
    expect(description).toBeInTheDocument();
  });
});