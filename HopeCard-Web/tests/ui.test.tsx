import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('HopeCard-Web', () => {
  it('renders application title', () => {
    render(<App />);
    expect(screen.getByText('HopeCard — Digital Aid, Real Impact')).toBeInTheDocument();
  });
});
