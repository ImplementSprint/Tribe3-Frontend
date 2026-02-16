function About() {
  return (
    <div className="about">
      <section className="hero">
        <h1>About HopeCard</h1>
        <p>
          Dignified aid distribution through technology — ensuring transparency,
          accountability, and efficiency for the most vulnerable communities.
        </p>
      </section>

      <section className="features">
        <h2>Our Mission</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="icon">🤝</div>
            <h3>Dignified Aid</h3>
            <p>
              Every beneficiary deserves to receive assistance with dignity.
              HopeCard replaces outdated paper-based systems with a secure digital
              platform.
            </p>
          </div>
          <div className="feature-card">
            <div className="icon">🔍</div>
            <h3>Transparency</h3>
            <p>
              Full visibility into how aid is distributed — from funding sources
              to the hands of those who need it most.
            </p>
          </div>
          <div className="feature-card">
            <div className="icon">📈</div>
            <h3>Accountability</h3>
            <p>
              Real-time tracking and reporting ensure that every resource reaches
              its intended recipient without leakage.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
