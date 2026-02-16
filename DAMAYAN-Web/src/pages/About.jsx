function About() {
  return (
    <div className="about">
      <section className="hero">
        <h1>About DAMAYAN</h1>
        <p>
          Rooted in the Filipino spirit of bayanihan — the tradition of communal
          unity and cooperation — DAMAYAN is a mutual aid network dedicated to
          disaster preparedness, relief, and recovery.
        </p>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="icon">💛</div>
          <h3>Mutual Aid</h3>
          <p>
            We believe in communities helping communities. DAMAYAN facilitates
            mutual aid by connecting those who need help with those who can give it,
            ensuring no one faces disaster alone.
          </p>
        </div>
        <div className="feature-card">
          <div className="icon">🇵🇭</div>
          <h3>Bayanihan Spirit</h3>
          <p>
            Inspired by the Filipino value of bayanihan, we carry forward the
            tradition of neighbors coming together to lift each other up in times
            of need.
          </p>
        </div>
        <div className="feature-card">
          <div className="icon">🛡️</div>
          <h3>Disaster Preparedness</h3>
          <p>
            Beyond relief, DAMAYAN empowers communities with resources, training,
            and planning tools to prepare for emergencies before they happen.
          </p>
        </div>
      </section>
    </div>
  );
}

export default About;
