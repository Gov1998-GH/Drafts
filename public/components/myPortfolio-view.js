import Api from "../js/api.js";
import Auth from "../js/auth.js";
import { escapeHtml } from "../js/utils.js";

class MyPortfolioView {
  static portfolios = [];
  static categories = [];
  static editingId = null;

  static async render() {
    MyPortfolioView.portfolios = [];
    MyPortfolioView.categories = [];
    MyPortfolioView.editingId = null;

    const app = document.getElementById("app");
    app.innerHTML = `<div class="text-center py-5">
        <div class="spinner-grow" role="status">
            <span class="visually-hidden">Caricamento...</span>
        </div>
    </div>`;

    try {
      // Portfolio dell'artista loggato + categorie
      const [portfolios, categories] = await Promise.all([
        Api.get(`/portfolios?artistId=${Auth.user.id}`),
        Api.get("/categories"),
      ]);
      MyPortfolioView.portfolios = portfolios;
      MyPortfolioView.categories = categories;

      app.innerHTML = MyPortfolioView.template();
      MyPortfolioView.attachEvents();
    } catch (err) {
      app.innerHTML = `<div class="text-center py-5">Errore nel caricamento riprova più tardi</div>`;
    }
  }

  static template() {
    return `<div class="container py-4">
                <h2 class="mb-4">Il mio portfolio</h2>
                ${MyPortfolioView.formTemplate()}
                ${MyPortfolioView.gridTemplate()}
            </div>`;
  }

  static formTemplate() {
    const editing = MyPortfolioView.editingId;
    return `
      <form id="portfolioForm" class="card p-4 mb-4">
        <h5 class="mb-3">${editing ? "Modifica opera" : "Nuova opera"}</h5>

        <div class="mb-3">
          <label for="pfName" class="form-label">Nome</label>
          <input type="text" id="pfName" class="form-control" required />
        </div>

        <div class="mb-3">
          <label for="pfImageFile" class="form-label">Immagine</label>
          <input type="file" id="pfImageFile" class="form-control" accept="image/*" />
          <small class="text-muted">${editing ? "Lascia vuoto per mantenere l'immagine attuale" : ""}</small>
        </div>

        <div class="mb-3">
          <label for="pfDesc" class="form-label">Descrizione</label>
          <textarea id="pfDesc" class="form-control" rows="3"></textarea>
        </div>

        <div class="mb-3">
          <label for="pfCategory" class="form-label">Categoria</label>
          <select id="pfCategory" class="form-select">
            <option value="">Nessuna</option>
            ${MyPortfolioView.categories
              .map(
                (c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`,
              )
              .join("")}
          </select>
        </div>

        <button type="submit" class="btn btn-dark">${editing ? "Salva" : "Crea"}</button>
      </form>`;
  }

  static gridTemplate() {
    if (MyPortfolioView.portfolios.length === 0)
      return `<p class="text-muted">Nessuna opera. Creane una.</p>`;

    return `<div class="portfolio-grid">
              ${MyPortfolioView.portfolios.map((p) => MyPortfolioView.cardTemplate(p)).join("")}
            </div>`;
  }

  static cardTemplate(p) {
    return `
      <div class="portfolio-card">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="portfolio-img" loading="lazy" />
        <button class="btn-close position-absolute top-0 end-0 m-2 bg-white" data-delete-id="${p.id}" aria-label="Elimina"></button>
        <div class="portfolio-overlay">
          <h4>${escapeHtml(p.name)}</h4>
          <p>${escapeHtml(p.description || "")}</p>
          <button class="btn btn-light btn-sm mt-2" data-edit-id="${p.id}">Modifica</button>
        </div>
      </div>`;
  }

  static attachEvents() {
    const form = document.getElementById("portfolioForm");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        let image;
        const fileInput = document.getElementById("pfImageFile");
        if (fileInput.files[0]) {
          const up = await Api.upload("/uploads", fileInput.files[0]);
          image = up.url;
        } else if (MyPortfolioView.editingId) {
          const cur = MyPortfolioView.portfolios.find(
            (p) => p.id === MyPortfolioView.editingId,
          );
          image = cur?.image;
        } else {
          alert("Immagine obbligatoria");
          return;
        }

        const data = {
          name: document.getElementById("pfName").value.trim(),
          image,
          description: document.getElementById("pfDesc").value.trim(),
          categoryId: document.getElementById("pfCategory").value || null,
        };

        if (MyPortfolioView.editingId)
          await Api.put(`/portfolios/${MyPortfolioView.editingId}`, data);
        else await Api.post("/portfolios", data);

        MyPortfolioView.render();
      } catch (err) {
        alert("Errore: " + (err.message || "operazione fallita"));
      }
    });

    // Elimina
    document.querySelectorAll("[data-delete-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.deleteId;
        if (!confirm("Eliminare questa opera?")) return;
        try {
          await Api.delete(`/portfolios/${id}`);
          MyPortfolioView.render();
        } catch (err) {
          alert("Errore eliminazione");
        }
      });
    });

    // Modifica: pre-compila form
    document.querySelectorAll("[data-edit-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.editId);
        const p = MyPortfolioView.portfolios.find((x) => x.id === id);
        if (!p) return;

        MyPortfolioView.editingId = id;
        document.getElementById("pfName").value = p.name;
        document.getElementById("pfDesc").value = p.description || "";
        document.getElementById("pfCategory").value = p.categoryId || "";

        document
          .getElementById("portfolioForm")
          .scrollIntoView({ behavior: "smooth" });

        document.querySelector("#portfolioForm h5").textContent =
          "Modifica opera";
        document.querySelector(
          "#portfolioForm button[type=submit]",
        ).textContent = "Salva";
      });
    });
  }
}

export default MyPortfolioView;
