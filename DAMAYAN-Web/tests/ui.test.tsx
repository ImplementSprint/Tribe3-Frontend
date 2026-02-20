import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('DAMAYAN-Web', () => {
  it('renders application title', () => {
    render(<App />);
    expect(screen.getByText('DAMAYAN')).toBeInTheDocument();
  });
});
