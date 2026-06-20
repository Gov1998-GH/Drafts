import Api from "../js/api.js";
import Auth from "../js/auth.js";
import { escapeHtml } from "../js/utils.js";

class MyReviewsView {
  static reviews = [];

  static async render() {
    MyReviewsView.reviews = [];

    const app = document.getElementById("app");
    app.innerHTML = `<div class="text-center py-5">
        <div class="spinner-grow" role="status">
            <span class="visually-hidden">Caricamento...</span>
        </div>
    </div>`;

    try {
      // Recensioni scritte dal client loggato
      const reviews = await Api.get(`/reviews?clientId=${Auth.user.id}`);
      MyReviewsView.reviews = reviews;

      app.innerHTML = MyReviewsView.template();
      MyReviewsView.attachEvents();
    } catch (err) {
      app.innerHTML = `<div class="text-center py-5">Errore nel caricamento riprova più tardi</div>`;
    }
  }

  static template() {
    return `<div class="container py-4">
                <h2 class="mb-4">Le mie recensioni</h2>
                ${MyReviewsView.listTemplate()}
            </div>`;
  }

  static listTemplate() {
    if (MyReviewsView.reviews.length === 0)
      return `<div class="empty-state">Nessuna recensione scritta</div>`;

    return `<div class="reviews-list">
      ${MyReviewsView.reviews
        .map((r) => {
          const stars = "⭐".repeat(r.rating);
          const date = new Date(r.createdAt).toLocaleDateString("it-IT");
          return `
            <div class="review-card position-relative">
              <button class="btn-close position-absolute top-0 end-0 m-2" data-delete-id="${r.id}" aria-label="Elimina"></button>
              <div class="review-rating mb-1">${stars}</div>
              <p class="review-text">${escapeHtml(r.text || "")}</p>
              <small class="text-muted">Su: ${escapeHtml(r.commissionTitle)} · ${date}</small>
            </div>`;
        })
        .join("")}
    </div>`;
  }

  static attachEvents() {
    document.querySelectorAll("[data-delete-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.deleteId;
        if (!confirm("Eliminare questa recensione?")) return;
        try {
          await Api.delete(`/reviews/${id}`);
          MyReviewsView.render();
        } catch (err) {
          alert("Errore eliminazione recensione");
        }
      });
    });
  }
}

export default MyReviewsView;
