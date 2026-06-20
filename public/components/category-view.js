import Api from "../js/api.js";
import { escapeHtml } from "../js/utils.js";
import page from "https://unpkg.com/page@1.11.6/page.mjs";

class CategoryView {
  static category = null;
  static artists = [];
  static portfolios = [];

  static async render(categoryId) {
    CategoryView.category = null;
    CategoryView.artists = [];
    CategoryView.portfolios = [];

    const app = document.getElementById("app");
    app.innerHTML = `<div class="text-center py-5">
        <div class="spinner-grow" role="status">
            <span class="visually-hidden">Caricamento...</span>
        </div>
    </div>`;

    try {
      const [category, artists, portfolios] = await Promise.all([
        Api.get(`/categories/${categoryId}`),
        Api.get(`/users/artists?categoryId=${categoryId}`),
        Api.get(`/portfolios?categoryId=${categoryId}`),
      ]);
      CategoryView.category = category;
      CategoryView.artists = artists;
      CategoryView.portfolios = portfolios;

      app.innerHTML = CategoryView.template();
    } catch (err) {
      app.innerHTML = `<div class="text-center py-5">Categoria non trovata</div>`;
    }
  }

  static template() {
    return `<div class="container py-4">
        <h1 class="mb-4">${escapeHtml(CategoryView.category.name)}</h1>

        <h3 class="mb-3">Artisti</h3>
        ${CategoryView.artistsTemplate()}

        <h3 class="mt-5 mb-3">Opere</h3>
        ${CategoryView.portfoliosTemplate()}
      </div>`;
  }

  static artistsTemplate() {
    if (CategoryView.artists.length === 0)
      return `<div class="empty-state">Nessun artista in questa categoria</div>`;

    return `<div class="row g-3">
      ${CategoryView.artists
        .map((a) => {
          const initial = a.displayName?.charAt(0).toUpperCase() || "?";
          const rating = a.avgRating
            ? `⭐ ${a.avgRating} (${a.reviewCount})`
            : "Nessuna recensione";
          return `
            <div class="col-md-4">
              <a href="/artists/${a.id}" class="text-decoration-none text-dark">
                <article class="card h-100 shadow-sm artist-card">
                  <div class="card-body">
                    <div class="avatar-circle mb-2">${initial}</div>
                    <h4 class="card-title">${escapeHtml(a.displayName)}</h4>
                    <p class="text-muted mb-1"><i class="bi bi-geo-alt"></i> ${escapeHtml(a.city || "—")}</p>
                    <p class="small mb-0">${rating}</p>
                  </div>
                </article>
              </a>
            </div>`;
        })
        .join("")}
    </div>`;
  }

  static portfoliosTemplate() {
    if (CategoryView.portfolios.length === 0)
      return `<div class="empty-state">Nessuna opera in questa categoria</div>`;

    return `<div class="portfolio-grid">
      ${CategoryView.portfolios
        .map(
          (p) => `
          <div class="portfolio-card">
            <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="portfolio-img" loading="lazy" />
            <div class="portfolio-overlay">
              <h4>${escapeHtml(p.name)}</h4>
              <p>${escapeHtml(p.description || "")}</p>
            </div>
          </div>`,
        )
        .join("")}
    </div>`;
  }
}

export default CategoryView;
