function Home() {
  return (
    <div id="home">
      {/* Alert Banner */}
      <div className="status-banner">
        Emergency Hotline: 911 | DAMAYAN Helpline: 1-800-DAMAYAN
      </div>

      {/* Hero Section */}
      <section className="hero">
        <h1>DAMAYAN &mdash; Mutual Aid Network</h1>
        <p>
          Connecting communities during emergencies and natural disasters.
          Together, we provide disaster relief, coordinate volunteers, and deliver
          resources to those who need it most.
        </p>
      </section>

      {/* Features Grid */}
      <section className="features">
        <div className="feature-card">
          <div className="icon">🚨</div>
          <h3>Report Emergency</h3>
          <p>
            Report disasters and request help in your area. Our network responds
            quickly to connect you with immediate assistance.
          </p>
        </div>
        <div className="feature-card">
          <div className="icon">🤝</div>
          <h3>Volunteer Hub</h3>
          <p>
            Sign up to help your community. Whether on the ground or remote, every
            hand makes a difference during times of crisis.
          </p>
        </div>
        <div className="feature-card">
          <div className="icon">📦</div>
          <h3>Resource Center</h3>
          <p>
            Find shelters, food banks, medical aid, and essential supplies near you.
            Access up-to-date information when it matters most.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stat">
          <h3>500+</h3>
          <p>Volunteers</p>
        </div>
        <div className="stat">
          <h3>50+</h3>
          <p>Communities</p>
        </div>
        <div className="stat">
          <h3>24/7</h3>
          <p>Response</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2>Need Help? Report Now</h2>
        <button className="cta-button">Report an Emergency</button>
      </section>
    </div>
  );
}

export default Home;
