import { render, screen } from '@testing-library/react';
import App from '../src/App';
import Header from '../src/components/Header';
import Footer from '../src/components/Footer';
import Home from '../src/pages/Home';
import About from '../src/pages/About';
import NotFound from '../src/pages/NotFound';
import Page from '../src/app/page';
import RootLayout, { metadata } from '../src/app/layout';

describe('BayaniHub-Web UI', () => {
  it('renders app shell with header, home hero, and footer', () => {
    render(<App />);

    expect(screen.getByText('BayaniHub')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Welcome to BayaniHub' })).toBeInTheDocument();
    expect(screen.getByText('© 2026 BayaniHub. Empowering communities together.')).toBeInTheDocument();
  });

  it('renders header navigation links', () => {
    render(<Header />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '#home');
    expect(screen.getByRole('link', { name: 'Services' })).toHaveAttribute('href', '#services');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '#about');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '#contact');
  });

  it('renders footer quick links', () => {
    render(<Footer />);

    const footerHomeLinks = screen.getAllByRole('link', { name: 'Home' });
    expect(footerHomeLinks[0]).toHaveAttribute('href', '#home');
    expect(screen.getByRole('link', { name: 'Services' })).toHaveAttribute('href', '#services');
  });

  it('renders home sections and primary actions', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { name: 'What We Offer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Community Board' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Service Requests' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Events' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join BayaniHub' })).toBeInTheDocument();
  });

  it('renders about page mission copy', () => {
    render(<About />);

    expect(screen.getByRole('heading', { name: 'About BayaniHub' })).toBeInTheDocument();
    expect(screen.getByText(/community-driven platform/i)).toBeInTheDocument();
    expect(screen.getByText(/every Filipino deserves a voice/i)).toBeInTheDocument();
  });

  it('renders not found page message', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
    expect(screen.getByText('Sorry, the page you are looking for does not exist.')).toBeInTheDocument();
  });

  it('renders app through next app page entrypoint', () => {
    render(<Page />);

    expect(screen.getByRole('heading', { name: 'Welcome to BayaniHub' })).toBeInTheDocument();
  });

  it('defines next metadata and root layout structure', () => {
    expect(metadata.title).toBe('BayaniHub');
    expect(metadata.description).toBe('BayaniHub Web Platform');

    const child = <div>child-content</div>;
    const rootElement = RootLayout({ children: child });

    expect(rootElement.type).toBe('html');
    expect(rootElement.props.lang).toBe('en');
    expect(rootElement.props.children.type).toBe('body');
    expect(rootElement.props.children.props.children).toBe(child);
  });
});
