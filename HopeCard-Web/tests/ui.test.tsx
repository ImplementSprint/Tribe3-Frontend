import { render, screen } from '@testing-library/react';
import App from '../src/App';
import Header from '../src/components/Header';
import Footer from '../src/components/Footer';
import Home from '../src/pages/Home';
import About from '../src/pages/About';
import NotFound from '../src/pages/NotFound';
import Page from '../src/app/page';
import RootLayout, { metadata } from '../src/app/layout';

describe('HopeCard-Web UI', () => {
  it('renders app shell with hero and footer', () => {
    render(<App />);

    expect(screen.getAllByText('HopeCard')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'HopeCard — Digital Aid, Real Impact' })).toBeInTheDocument();
    expect(screen.getByText(/transparent aid distribution/i)).toBeInTheDocument();
  });

  it('renders header navigation links', () => {
    render(<Header />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '#home');
    expect(screen.getByRole('link', { name: 'Programs' })).toHaveAttribute('href', '#programs');
    expect(screen.getByRole('link', { name: 'My Card' })).toHaveAttribute('href', '#my-card');
    expect(screen.getByRole('link', { name: 'Support' })).toHaveAttribute('href', '#support');
  });

  it('renders footer statement', () => {
    render(<Footer />);

    expect(screen.getByText(/HopeCard\. Empowering communities/i)).toBeInTheDocument();
  });

  it('renders home sections and stats', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { name: 'How It Works' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Program Enrollment' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Digital Card' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Track Benefits' })).toBeInTheDocument();
    expect(screen.getByText('10,000+')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check Your Eligibility' })).toBeInTheDocument();
  });

  it('renders about page values', () => {
    render(<About />);

    expect(screen.getByRole('heading', { name: 'About HopeCard' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Our Mission' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dignified Aid' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Transparency' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Accountability' })).toBeInTheDocument();
  });

  it('renders not found fallback with home link', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go Home' })).toHaveAttribute('href', '/');
  });

  it('renders app through next app page entrypoint', () => {
    render(<Page />);

    expect(screen.getByRole('heading', { name: 'HopeCard — Digital Aid, Real Impact' })).toBeInTheDocument();
  });

  it('defines next metadata and root layout structure', () => {
    expect(metadata.title).toBe('HopeCard');
    expect(metadata.description).toBe('HopeCard Web Platform');

    const child = <div>child-content</div>;
    const rootElement = RootLayout({ children: child });

    expect(rootElement.type).toBe('html');
    expect(rootElement.props.lang).toBe('en');
    expect(rootElement.props.children.type).toBe('body');
    expect(rootElement.props.children.props.children).toBe(child);
  });
});
