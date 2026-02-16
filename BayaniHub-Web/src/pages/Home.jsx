function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero" id="home">
        <h1 className="hero__title">Welcome to BayaniHub</h1>
        <p className="hero__subtitle">
          Your community engagement platform for barangay civic participation.
          Connect with your neighbors, stay informed, and make a difference.
        </p>
        <button className="hero__cta">Get Started</button>
      </section>

      {/* Features Section */}
      <section className="features" id="services">
        <h2 className="features__title">What We Offer</h2>
        <div className="features__grid">
          <div className="feature-card">
            <div className="feature-card__icon">📋</div>
            <h3 className="feature-card__title">Community Board</h3>
            <p className="feature-card__description">
              Post and view announcements, updates, and important notices from
              your barangay officials and fellow community members.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-card__icon">🛠️</div>
            <h3 className="feature-card__title">Service Requests</h3>
            <p className="feature-card__description">
              Report issues, request repairs, and track the status of service
              requests in your neighborhood.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-card__icon">📅</div>
            <h3 className="feature-card__title">Events</h3>
            <p className="feature-card__description">
              Stay up-to-date with community events, meetings, clean-up drives,
              and other barangay activities through our events calendar.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="contact">
        <h2 className="cta-section__title">Ready to Join Your Community?</h2>
        <p className="cta-section__text">
          Be part of a more connected, informed, and engaged barangay.
        </p>
        <button className="cta-section__button">Join BayaniHub</button>
      </section>
    </>
  );
}

export default Home;
