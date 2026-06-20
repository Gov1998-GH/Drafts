import Api from "../js/api.js";
import Auth from "../js/auth.js";
import { escapeHtml } from "../js/utils.js";
import { ITALIAN_CITIES } from "../constants/cities.js";
import page from "https://unpkg.com/page@1.11.6/page.mjs";

class ArtistListView {
  static artists = [];
  static categories = [];
  static favoritedIds = new Set();
  static filters = { q: "", city: "", minRating: 0, categoryId: "" };

  static async render(ctx) {
    ArtistListView.artists = [];
    ArtistListView.categories = [];
    ArtistListView.filters = { q: "", city: "", minRating: 0, categoryId: "" };

    const params = new URLSearchParams(ctx.querystring);
    ArtistListView.filters.q = params.get("q") || "";
    ArtistListView.filters.city = params.get("city") || "";
    ArtistListView.filters.categoryId = params.get("categoryId") || "";
    ArtistListView.filters.minRating = Number(params.get("minRating")) || 0;

    const app = document.getElementById("app");
    app.innerHTML = `<div class="text-center py-5">
        <div class="spinner-grow" role="status">
            <span class="visually-hidden">Caricamento...</span>
        </div>
    </div>`;

    try {
      const query = ArtistListView.buildQuery();
      const [artists, categories] = await Promise.all([
        Api.get(`/users/artists?${query}`),
        Api.get(`/categories`),
      ]);

      ArtistListView.artists = artists;
      ArtistListView.categories = categories;

      // Solo client: carica i preferiti per sapere chi c'è
      ArtistListView.favoritedIds = new Set();
      if (Auth.hasRole("client")) {
        const favs = await Api.get("/favorites").catch(() => []);
        favs.forEach((f) => ArtistListView.favoritedIds.add(f.id));
      }

      app.innerHTML = ArtistListView.template();
      ArtistListView.attachEvents();
    } catch (err) {
      app.innerHTML = `<div class="text-center py-5">Errore nel caricamento riprova più tardi</div>`;
    }
  }

  static template() {
    return `<div class="container py-4">
                <div class="row">
                    <aside class="col-md-3">
                        ${ArtistListView.sidebarTemplate()}
                    </aside>
                    <main class="col-md-9">
                        ${ArtistListView.gridTemplate()}
                    </main>
                </div>
            </div>`;
  }

  static sidebarTemplate() {
    const f = ArtistListView.filters;
    return `<div class="filter-section">
                <h5>Filtri</h5>
                
                <label class="form-label">Città</label>
                <input list="cityList" id="filterCity" class="form-control mb-3"
                    placeholder="Cerca città" value="${escapeHtml(f.city)}">
                <datalist id="cityList">
                    ${ITALIAN_CITIES.map((c) => `<option value="${escapeHtml(c)}">`).join("")}
                </datalist>
                
                <label  class="form-label">Rating minimo: 
                    <span id="ratingValue">${f.minRating}</span>
                </label>
                <input type="range" id="filterRating" min="0" max="5" step="0.5"
                    value="${f.minRating}" class="form-range mb-3">

                <label class="form-label">Categoria</label>
                <select id="filterCategory" class="form-select">
                    <option value="">Tutte</option>
                    ${ArtistListView.categories
                      .map(
                        (c) => `
                        <option value="${c.id}" ${Number(f.categoryId) === c.id ? "selected" : ""}>
                            ${escapeHtml(c.name)}
                        </option>`,
                      )
                      .join("")}
                </select>
            </div>`;
  }

  static gridTemplate() {
    if (ArtistListView.artists.length === 0) return "";
    return `
        <div class="row g-3">
            ${ArtistListView.artists.map((a) => ArtistListView.cardTemplate(a)).join("")}
        </div>`;
  }

  static cardTemplate(a) {
    const initial = a.displayName?.charAt(0).toUpperCase() || "?";
    const bio = a.bio || "";
    const bioShort = bio.length > 100 ? bio.slice(0, 100) + "..." : bio;
    const rating = a.avgRating
      ? ` ⭐ ${a.avgRating} (${a.reviewCount})`
      : "Nessuna recensione";

    // Preferiti solo per client loggato. Pieno se già nei preferiti.
    const heart = Auth.hasRole("client")
      ? `<button class="fav-btn position-absolute top-0 end-0 m-2" data-fav-id="${a.id}" aria-label="Preferito">
           <i class="bi ${ArtistListView.favoritedIds.has(a.id) ? "bi-heart-fill text-danger" : "bi-heart"}"></i>
         </button>`
      : "";

    return `
    <div class="col-md-4">
        <a href="/artists/${a.id}" class="text-decoration-none text-dark">
            <article class="card h-100 shadow-sm artist-card position-relative">
              ${heart}
              <div class="card-body">
                <div class="avatar-circle mb-2">${initial}</div>
                <h4 class="card-title">${escapeHtml(a.displayName)}</h4>
                <p class="text-muted mb-1">
                    <i class="bi bi-geo-alt"></i>${escapeHtml(a.city || "-")}
                </p>
                <p class="small mb-2">${rating}</p>
                <p class="card-text">${escapeHtml(bioShort)}</p>
              </div>
            </article>
        </a>
    </div>
    `;
  }

  static attachEvents() {
    const city = document.getElementById("filterCity");
    city?.addEventListener("change", () => {
      ArtistListView.applyFilters({ city: city.value });
    });

    const rating = document.getElementById("filterRating");
    const ratingValue = document.getElementById("ratingValue");
    rating?.addEventListener("input", () => {
      ratingValue.textContent = rating.value;
    });
    rating?.addEventListener("change", () => {
      ArtistListView.applyFilters({ minRating: Number(rating.value) });
    });

    const category = document.getElementById("filterCategory");
    category?.addEventListener("change", () => {
      ArtistListView.applyFilters({ categoryId: category.value });
    });

    // Cuore preferito: toggle senza navigare alla pagina artista
    document.querySelectorAll("[data-fav-id]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const artistId = btn.dataset.favId;
        try {
          const res = await Api.post("/favorites", { artistId });
          const icon = btn.querySelector("i");
          if (res.status === "added") {
            icon.className = "bi bi-heart-fill text-danger";
            ArtistListView.favoritedIds.add(Number(artistId));
          } else {
            icon.className = "bi bi-heart";
            ArtistListView.favoritedIds.delete(Number(artistId));
          }
        } catch (err) {
          alert("Errore preferito");
        }
      });
    });
  }

  static applyFilters(data) {
    const merged = { ...ArtistListView.filters, ...data };
    const qs = new URLSearchParams();
    if (merged.q) qs.set("q", merged.q);
    if (merged.city) qs.set("city", merged.city);
    if (merged.minRating > 0) qs.set("minRating", merged.minRating);
    if (merged.categoryId) qs.set("categoryId", merged.categoryId);
    page(`/artists?${qs.toString()}`);
  }

  static buildQuery() {
    const f = ArtistListView.filters;
    const qs = new URLSearchParams();
    if (f.q) qs.set("displayName", f.q);
    if (f.city) qs.set("city", f.city);
    if (f.minRating) qs.set("minRating", f.minRating);
    if (f.categoryId > 0) qs.set("categoryId", f.categoryId);
    return qs.toString();
  }
}

export default ArtistListView;
