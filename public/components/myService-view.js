import Api from "../js/api.js";
import Auth from "../js/auth.js";
import { escapeHtml } from "../js/utils.js";

class MyServicesView {
  static services = [];
  static categories = [];
  static editingId = null;

  static async render(ctx) {
    MyServicesView.services = [];
    MyServicesView.categories = [];
    MyServicesView.editingId = null;

    const app = document.getElementById("app");
    app.innerHTML = `<div class="text-center py-5">
            <div class="spinner-grow" role="status">
                <span class="visually-hidden">Caricamento...</span>
            </div>
        </div>`;

    try {
      const [services, categories] = await Promise.all([
        Api.get(`/services?artistId=${Auth.user.id}`),
        Api.get("/categories"),
      ]);
      MyServicesView.services = services;
      MyServicesView.categories = categories;

      app.innerHTML = MyServicesView.template();
      MyServicesView.attachEvents();
    } catch (err) {
      app.innerHTML = `<div class="text-center py-5">Errore nel caricamento riprova più tardi</div>`;
    }
  }

  static template() {
    return `<div class="container py-4">
                ${MyServicesView.formTemplate()}
                ${MyServicesView.gridTemplate()}
            </div>`;
  }

  static formTemplate() {
    return `
    <form id="serviceForm" class="card p-4 mb-4">
        <h5 class="mb-3">
            ${MyServicesView.editingId ? "Modifica servizio" : "Nuovo Servizio"}
        </h5>

    <div class="mb-3">
        <label for="svcName" class="form-label">Nome</label>
        <input type="text" id="svcName" class="form-control" required />
    </div>

    <div class="mb-3">
        <label for="svcDesc" class="form-label">Descrizione</label>
        <textarea id="svcDesc" class="form-control" rows="3"></textarea>
    </div>

    <div class="row">
        <div class="col-md-6 mb-3">
            <label for="svcPrice" class="form-label">Prezzo (€)</label>
            <input
                type="number"
                id="svcPrice"
                class="form-control"
                min="1"
                required
            >
    </div>
        <div class="col-md-6 mb-3">
            <label for="svcDays" class="form-label">Giorni di consegna</label>
            <input type="number" id="svcDays" class="form-control" min="1" required />
        </div>
    </div>

    <div class="mb-3">
        <label for="svcCategory" class="form-label">Categoria</label>
        <select id="svcCategory" class="form-select">
            <option value="">Nessuna</option>
            ${MyServicesView.categories
              .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
              .join("")}
        </select>
    </div>

    <button type="submit" class="btn btn-dark">
        ${MyServicesView.editingId ? "Salva" : "Crea"}
    </button>
  </form>`;
  }

  static gridTemplate() {
    if (MyServicesView.services.length === 0)
      return `<p class="text-muted">Nessun servizio. Creane uno</p>`;
    return `<div class="row g-3">
        ${MyServicesView.services.map((s) => MyServicesView.cardTemplate(s)).join("")}
    </div>`;
  }

  static cardTemplate(s) {
    return `
        <div class="col-md-4 mb-3">
            <div class="card h-100 shadow-sm position-relative">
                <button class="btn-close position-absolute top-0 end-0 m-2"
                        data-delete-id="${s.id}" aria-label="Elimina"></button>
                
                <div class="card-body">
                    <h5 class="card-title">${escapeHtml(s.name)}</h5>
                    ${s.categoryName ? `<span class="badge badge-info mb-2">${escapeHtml(s.categoryName)}</span>` : ""}
                    <p class="card-text">${escapeHtml(s.description || "")}</p>
                    <p class="mb-1"><strong>€${s.price}</strong></p>
                    <p class="text-muted small">Consegna: ${s.deliveryDays} giorni</p>
                    
                    <button class="btn btn-outline-dark btn-sm" data-edit-id="${s.id}">
                        Modifica
                    </button>
                </div>
            </div>
        </div>`;
  }

  static attachEvents() {
    const form = document.getElementById("serviceForm");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault(); //per bloccare il reload del form

      const data = {
        name: document.getElementById("svcName").value.trim(),
        description: document.getElementById("svcDesc").value.trim(),
        price: Number(document.getElementById("svcPrice").value),
        deliveryDays: Number(document.getElementById("svcDays").value),
        categoryId: document.getElementById("svcCategory").value || null,
      };

      try {
        if (MyServicesView.editingId)
            await Api.put(`/services/${MyServicesView.editingId}`, data);
        else await Api.post("/services", data);

        MyServicesView.render();
      } catch (err) {
        alert("Errore: " + (err.message || "operazione fallita"));
      }
    });

    document.querySelectorAll("[data-delete-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.deleteId;
        if (!confirm("Eliminare questo servizio?")) return;
        try {
          await Api.delete(`/services/${id}`);
          MyServicesView.render();
        } catch (err) {
          alert("Errore eliminazione");
        }
      });
    });

    document.querySelectorAll("[data-edit-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.editId);
        const service = MyServicesView.services.find((s) => s.id === id);
        if (!service) return;

        MyServicesView.editingId = id;

        document.getElementById("svcName").value = service.name;
        document.getElementById("svcDesc").value = service.description;
        document.getElementById("svcPrice").value = service.price;
        document.getElementById("svcDays").value = service.deliveryDays;
        document.getElementById("svcCategory").value = service.categoryId || "";

        document
          .getElementById("serviceForm")
          .scrollIntoView({ behavior: "smooth" });
      });
    });
  }
}

export default MyServicesView;
