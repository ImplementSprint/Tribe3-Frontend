import { render, screen } from '@testing-library/react';
import App from '../src/App';
import Header from '../src/components/Header';
import Footer from '../src/components/Footer';
import Home from '../src/pages/Home';
import About from '../src/pages/About';
import NotFound from '../src/pages/NotFound';
import Page from '../src/app/page';
import RootLayout, { metadata } from '../src/app/layout';

describe('DAMAYAN-Web UI', () => {
  it('renders app shell with core sections', () => {
    render(<App />);

    expect(screen.getByText('DAMAYAN')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'DAMAYAN — Mutual Aid Network' })).toBeInTheDocument();
    expect(screen.getAllByText(/Emergency Hotline: 911/i)).toHaveLength(2);
  });

  it('renders header navigation links', () => {
    render(<Header />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '#home');
    expect(screen.getByRole('link', { name: 'Report Emergency' })).toHaveAttribute('href', '#report');
    expect(screen.getByRole('link', { name: 'Volunteer' })).toHaveAttribute('href', '#volunteer');
    expect(screen.getByRole('link', { name: 'Resources' })).toHaveAttribute('href', '#resources');
  });

  it('renders footer hotline details', () => {
    render(<Footer />);

    expect(screen.getByText(/bayanihan in action/i)).toBeInTheDocument();
    expect(screen.getByText(/DAMAYAN Helpline: 1-800-DAMAYAN/i)).toBeInTheDocument();
  });

  it('renders home feature cards, stats, and call to action', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { name: 'Report Emergency' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Volunteer Hub' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Resource Center' })).toBeInTheDocument();
    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('24/7')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Report an Emergency' })).toBeInTheDocument();
  });

  it('renders about page values', () => {
    render(<About />);

    expect(screen.getByRole('heading', { name: 'About DAMAYAN' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mutual Aid' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bayanihan Spirit' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Disaster Preparedness' })).toBeInTheDocument();
  });

  it('renders not found fallback with home link', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go Home' })).toHaveAttribute('href', '/');
  });

  it('renders app through next app page entrypoint', () => {
    render(<Page />);

    expect(screen.getByRole('heading', { name: 'DAMAYAN — Mutual Aid Network' })).toBeInTheDocument();
  });

  it('defines next metadata and root layout structure', () => {
    expect(metadata.title).toBe('DAMAYAN');
    expect(metadata.description).toBe('DAMAYAN Web Platform');

    const child = <div>child-content</div>;
    const rootElement = RootLayout({ children: child });

    expect(rootElement.type).toBe('html');
    expect(rootElement.props.lang).toBe('en');
    expect(rootElement.props.children.type).toBe('body');
    expect(rootElement.props.children.props.children).toBe(child);
  });
});
