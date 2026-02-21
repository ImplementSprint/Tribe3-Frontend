import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('BayaniHub-Web', () => {
  it('renders application title', () => {
    render(<App />);
    expect(screen.getByText('BayaniHub')).toBeInTheDocument();
  });
});
