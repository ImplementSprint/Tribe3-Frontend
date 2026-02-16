function Header() {
  return (
    <header className="header">
      <div className="header__inner">
        <div className="header__logo">BayaniHub</div>
        <nav className="header__nav">
          <a href="#home" className="header__link">Home</a>
          <a href="#services" className="header__link">Services</a>
          <a href="#about" className="header__link">About</a>
          <a href="#contact" className="header__link">Contact</a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
