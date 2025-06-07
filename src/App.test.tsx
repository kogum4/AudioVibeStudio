import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders AudioVibe Studio heading', () => {
    render(<App />);
    const heading = screen.getByText('AudioVibe Studio');
    expect(heading).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<App />);
    const description = screen.getByText('Audio-reactive video generation tool');
    expect(description).toBeInTheDocument();
  });
});