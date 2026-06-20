import Api from "../js/api.js";
import { escapeHtml } from "../js/utils.js";
import page from "https://unpkg.com/page@1.11.6/page.mjs";

class FavoritesView {
  static favorites = [];

  static async render() {
    FavoritesView.favorites = [];

    const app = document.getElementById("app");
    app.innerHTML = `<div class="text-center py-5">
        <div class="spinner-grow" role="status">
            <span class="visually-hidden">Caricamento...</span>
        </div>
    </div>`;

    try {
      const favorites = await Api.get("/favorites");
      FavoritesView.favorites = favorites;

      app.innerHTML = FavoritesView.template();
      FavoritesView.attachEvents();
    } catch (err) {
      app.innerHTML = `<div class="text-center py-5">Errore nel caricamento riprova più tardi</div>`;
    }
  }

  static template() {
    return `<div class="container py-4">
                <h2 class="mb-4">I miei preferiti</h2>
                ${FavoritesView.gridTemplate()}
            </div>`;
  }

  static gridTemplate() {
    if (FavoritesView.favorites.length === 0)
      return `<div class="empty-state">Nessun artista nei preferiti</div>`;

    return `<div class="row g-3">
              ${FavoritesView.favorites.map((f) => FavoritesView.cardTemplate(f)).join("")}
            </div>`;
  }

  static cardTemplate(f) {
    const initial = f.displayName?.charAt(0).toUpperCase() || "?";
    return `
      <div class="col-md-4">
        <article class="card h-100 shadow-sm artist-card position-relative">
          <button class="btn-close position-absolute top-0 end-0 m-2" data-remove-id="${f.id}" aria-label="Rimuovi"></button>
          <div class="card-body" data-go-id="${f.id}">
            <div class="avatar-circle mb-2">${initial}</div>
            <h4 class="card-title">${escapeHtml(f.displayName)}</h4>
            <p class="card-text">${escapeHtml(f.bio || "")}</p>
          </div>
        </article>
      </div>`;
  }

  static attachEvents() {
    document.querySelectorAll("[data-remove-id]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const artistId = btn.dataset.removeId;
        try {
          await Api.post("/favorites", { artistId });
          FavoritesView.render();
        } catch (err) {
          alert("Errore rimozione preferito");
        }
      });
    });

    document.querySelectorAll("[data-go-id]").forEach((el) => {
      el.addEventListener("click", () => {
        page(`/artists/${el.dataset.goId}`);
      });
    });
  }
}

export default FavoritesView;
