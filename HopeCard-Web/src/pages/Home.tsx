function Home() {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero" id="home">
        <h1>HopeCard — Digital Aid, Real Impact</h1>
        <p>
          A transparent digital assistance card system that connects beneficiaries
          to government and NGO welfare programs — securely and efficiently.
        </p>
        <button className="cta-button">Get Started</button>
      </section>

      {/* Features Section */}
      <section className="features" id="programs">
        <h2>How It Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="icon">📋</div>
            <h3>Program Enrollment</h3>
            <p>Register for government and NGO assistance programs quickly and easily.</p>
          </div>
          <div className="feature-card">
            <div className="icon">💳</div>
            <h3>Digital Card</h3>
            <p>Receive your HopeCard — your key to claiming aid securely.</p>
          </div>
          <div className="feature-card">
            <div className="icon">📊</div>
            <h3>Track Benefits</h3>
            <p>Monitor your aid history and upcoming distributions in real time.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stats-grid">
          <div className="stat-item">
            <h3>10,000+</h3>
            <p>Beneficiaries</p>
          </div>
          <div className="stat-item">
            <h3>50+</h3>
            <p>Programs</p>
          </div>
          <div className="stat-item">
            <h3>100%</h3>
            <p>Transparent</p>
          </div>
        </div>
      </section>

      {/* Card Preview Section */}
      <section className="card-preview" id="my-card">
        <h2>Your Digital Assistance Card</h2>
        <div className="sample-card">
          <h3>HopeCard</h3>
          <p>Beneficiary Name</p>
          <p>ID: HOPE-XXXX-XXXX</p>
          <p>Status: Active</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Check Your Eligibility</h2>
        <p>Find out which assistance programs you qualify for today.</p>
        <button className="cta-button">Check Your Eligibility</button>
      </section>
    </div>
  );
}

export default Home;
