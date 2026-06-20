class Footer {
  static render() {
    const footer = document.getElementById("footer");
    if (!footer) return;
    footer.innerHTML = Footer.template();
  }

  static template() {
    const year = new Date().getFullYear();
    return `
      <div class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <span class="brand-name"><span class="brand-logo brand-logo-footer"><img src="/images/logo/Logo_V2.PNG" alt="Drafts" /></span> Drafts</span>
              <p class="footer-tagline">Trova il tuo artista, commissiona la tua opera.</p>
            </div>

            <nav class="footer-links" aria-label="Link rapidi">
              <h6>Esplora</h6>
              <a href="/artists">Artisti</a>
              <a href="/">Home</a>
            </nav>

            <div class="footer-info">
              <h6>Progetto</h6>
              <p>Esame MF0438 — Metodologie Web</p>
            </div>
          </div>

          <div class="footer-bottom">
            <span>© ${year} Drafts</span>
          </div>
        </div>
      </div>`;
  }
}

export default Footer;
