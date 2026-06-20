import Api from "../js/api.js";
import { escapeHtml } from "../js/utils.js";
import page from "https://unpkg.com/page@1.11.6/page.mjs";

class ServicesView {
  static services = [];
  static categories = [];
  static filters = { categoryId: "", name: "" };

  static async render(ctx) {
    ServicesView.services = [];
    ServicesView.categories = [];
    ServicesView.filters = { categoryId: "", name: "" };

    const params = new URLSearchParams(ctx.querystring);
    ServicesView.filters.categoryId = params.get("categoryId") || "";
    ServicesView.filters.name = params.get("name") || "";

    const app = document.getElementById("app");
    app.innerHTML = `<div class="text-center py-5">
        <div class="spinner-grow" role="status">
            <span class="visually-hidden">Caricamento...</span>
        </div>
    </div>`;

    try {
      const query = ServicesView.buildQuery();
      const [services, categories] = await Promise.all([
        Api.get(`/services?${query}`),
        Api.get("/categories"),
      ]);
      ServicesView.services = services;
      ServicesView.categories = categories;

      app.innerHTML = ServicesView.template();
      ServicesView.attachEvents();
    } catch (err) {
      app.innerHTML = `<div class="text-center py-5">Errore nel caricamento riprova più tardi</div>`;
    }
  }

  // Costruisce la query string per l'API dai filtri attivi
  static buildQuery() {
    const f = ServicesView.filters;
    const qs = new URLSearchParams();
    if (f.categoryId) qs.set("categoryId", f.categoryId);
    if (f.name) qs.set("name", f.name);
    return qs.toString();
  }

  static template() {
    return `<div class="container py-4">
        <div class="row">
          <aside class="col-md-3 mb-4">
            ${ServicesView.sidebarTemplate()}
          </aside>
          <main class="col-md-9">
            ${ServicesView.gridTemplate()}
          </main>
        </div>
      </div>`;
  }

  static sidebarTemplate() {
    const f = ServicesView.filters;
    return `<div class="filter-section">
        <h5>Filtri</h5>

        <label class="form-label">Nome servizio</label>
        <input type="search" id="filterName" class="form-control mb-3" placeholder="Cerca servizio" value="${escapeHtml(f.name)}" />

        <label class="form-label">Categoria</label>
        <select id="filterCategory" class="form-select">
          <option value="">Tutte</option>
          ${ServicesView.categories
            .map(
              (c) =>
                `<option value="${c.id}" ${Number(f.categoryId) === c.id ? "selected" : ""}>${escapeHtml(c.name)}</option>`,
            )
            .join("")}
        </select>
      </div>`;
  }

  static gridTemplate() {
    if (ServicesView.services.length === 0)
      return `<div class="empty-state">Nessun servizio trovato</div>`;

    return `<div class="services-grid">
        ${ServicesView.services.map((s) => ServicesView.cardTemplate(s)).join("")}
      </div>`;
  }

  static cardTemplate(s) {
    return `
      <div class="service-card">
        <h3 class="service-name">${escapeHtml(s.name)}</h3>
        ${s.categoryName ? `<span class="badge badge-info mb-2">${escapeHtml(s.categoryName)}</span>` : ""}
        <p class="service-desc">${escapeHtml(s.description || "")}</p>
        <div class="service-meta">
          <span class="service-price">€${s.price}</span>
          <span class="service-delivery"><i class="bi bi-clock"></i> ${s.deliveryDays}gg</span>
        </div>
        <a href="/artists/${s.artistId}" class="btn-rounded btn-dark service-btn">
          ${escapeHtml(s.displayName)}
        </a>
      </div>`;
  }

  static attachEvents() {
    const name = document.getElementById("filterName");
    name?.addEventListener("change", () => {
      ServicesView.applyFilters({ name: name.value });
    });

    const category = document.getElementById("filterCategory");
    category?.addEventListener("change", () => {
      ServicesView.applyFilters({ categoryId: category.value });
    });
  }

  static applyFilters(data) {
    const merged = { ...ServicesView.filters, ...data };
    const qs = new URLSearchParams();
    if (merged.categoryId) qs.set("categoryId", merged.categoryId);
    if (merged.name) qs.set("name", merged.name);
    page(`/services?${qs.toString()}`);
  }
}

export default ServicesView;
