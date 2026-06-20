import Api from "../js/api.js";
import Auth from "../js/auth.js";
import { escapeHtml } from "../js/utils.js";

class AdminView {
  static users = [];
  static categories = [];
  static reviews = [];

  static async render() {
    AdminView.users = [];
    AdminView.categories = [];
    AdminView.reviews = [];

    const app = document.getElementById("app");
    app.innerHTML = `<div class="text-center py-5">
        <div class="spinner-grow" role="status">
            <span class="visually-hidden">Caricamento...</span>
        </div>
    </div>`;

    try {
      const [users, categories, reviews] = await Promise.all([
        Api.get("/users"),
        Api.get("/categories"),
        Api.get("/reviews"),
      ]);
      AdminView.users = users;
      AdminView.categories = categories;
      AdminView.reviews = reviews;

      app.innerHTML = AdminView.template();
      AdminView.attachEvents();
    } catch (err) {
      app.innerHTML = `<div class="text-center py-5">Errore nel caricamento riprova più tardi</div>`;
    }
  }

  static template() {
    return `<div class="container py-4">
        <h2 class="mb-4">Pannello amministrazione</h2>

        <h3 class="mb-3">Categorie</h3>
        <form id="categoryForm" class="d-flex gap-2 mb-3">
          <input type="text" id="catName" class="form-control" placeholder="Nuova categoria" required />
          <button type="submit" class="btn btn-dark">Aggiungi</button>
        </form>
        ${AdminView.categoriesTemplate()}

        <h3 class="mt-5 mb-3">Utenti</h3>
        ${AdminView.usersTemplate()}

        <h3 class="mt-5 mb-3">Recensioni</h3>
        ${AdminView.reviewsTemplate()}
      </div>`;
  }

  static categoriesTemplate() {
    if (AdminView.categories.length === 0)
      return `<p class="text-muted">Nessuna categoria</p>`;
    return `<ul class="list-group mb-3">
      ${AdminView.categories
        .map(
          (c) => `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            ${escapeHtml(c.name)}
            <button class="btn btn-outline-danger btn-sm" data-cat-id="${c.id}">Elimina</button>
          </li>`,
        )
        .join("")}
    </ul>`;
  }

  static usersTemplate() {
    return `<ul class="list-group mb-3">
      ${AdminView.users
        .map(
          (u) => `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <span>${escapeHtml(u.username)} <small class="text-muted">(${escapeHtml(u.role)})</small></span>
            ${
              u.id === Auth.user.id
                ? `<span class="badge bg-secondary">tu</span>`
                : `<button class="btn btn-outline-danger btn-sm" data-user-id="${u.id}">Elimina</button>`
            }
          </li>`,
        )
        .join("")}
    </ul>`;
  }

  static reviewsTemplate() {
    if (AdminView.reviews.length === 0)
      return `<p class="text-muted">Nessuna recensione</p>`;
    return `<div class="reviews-list">
      ${AdminView.reviews
        .map((r) => {
          const stars = "⭐".repeat(r.rating);
          return `
            <div class="review-card position-relative">
              <button class="btn-close position-absolute top-0 end-0 m-2" data-review-id="${r.id}" aria-label="Elimina"></button>
              <div class="review-rating mb-1">${stars}</div>
              <p class="review-text">${escapeHtml(r.text || "")}</p>
              <small class="text-muted">${escapeHtml(r.clientUsername)} · su ${escapeHtml(r.commissionTitle)}</small>
            </div>`;
        })
        .join("")}
    </div>`;
  }

  static attachEvents() {
    // Crea categoria
    document
      .getElementById("categoryForm")
      ?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("catName").value.trim();
        if (!name) return;
        try {
          await Api.post("/categories", { name });
          AdminView.render();
        } catch (err) {
          alert("Errore creazione categoria");
        }
      });

    // Elimina categoria
    document.querySelectorAll("[data-cat-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Eliminare questa categoria?")) return;
        try {
          await Api.delete(`/categories/${btn.dataset.catId}`);
          AdminView.render();
        } catch (err) {
          alert("Errore eliminazione categoria");
        }
      });
    });

    // Elimina utente
    document.querySelectorAll("[data-user-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Eliminare questo utente?")) return;
        try {
          await Api.delete(`/users/${btn.dataset.userId}`);
          AdminView.render();
        } catch (err) {
          alert("Errore eliminazione utente");
        }
      });
    });

    // Elimina recensione
    document.querySelectorAll("[data-review-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Eliminare questa recensione?")) return;
        try {
          await Api.delete(`/reviews/${btn.dataset.reviewId}`);
          AdminView.render();
        } catch (err) {
          alert("Errore eliminazione recensione");
        }
      });
    });
  }
}

export default AdminView;
