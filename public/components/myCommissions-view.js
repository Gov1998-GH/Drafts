import Api from "../js/api.js";
import Auth from "../js/auth.js";
import { escapeHtml } from "../js/utils.js";
import DeliveryModal from "./deliveryModal-view.js";

class MyCommissionsView {
  static commissions = [];

  // Mappa stato → colore badge (riuso convenzione di artistDetail)
  static statusColors = {
    pending: "warning",
    accepted: "info",
    in_progress: "primary",
    delivered: "success",
    reviewed: "secondary",
    rejected: "danger",
  };

  // Transizioni artista
  static artistTransitions = {
    pending: ["accepted", "rejected"],
    accepted: [],
    in_progress: ["delivered"],
    delivered: [],
    reviewed: [],
    rejected: [],
  };

  static async render() {
    MyCommissionsView.commissions = [];

    const app = document.getElementById("app");
    app.innerHTML = `<div class="text-center py-5">
        <div class="spinner-grow" role="status">
            <span class="visually-hidden">Caricamento...</span>
        </div>
    </div>`;

    try {
      const commissions = await Api.get("/commissions");
      MyCommissionsView.commissions = commissions;

      app.innerHTML = MyCommissionsView.template();
      MyCommissionsView.attachEvents();
    } catch (err) {
      app.innerHTML = `<div class="text-center py-5">Errore nel caricamento riprova più tardi</div>`;
    }
  }

  static template() {
    return `<div class="container py-4">
                <h2 class="mb-4">Le mie commissioni</h2>
                ${MyCommissionsView.gridTemplate()}
            </div>`;
  }

  static gridTemplate() {
    if (MyCommissionsView.commissions.length === 0)
      return `<div class="empty-state">Nessuna commissione</div>`;

    return `<div class="commissions-grid">
              ${MyCommissionsView.commissions.map((c) => MyCommissionsView.cardTemplate(c)).join("")}
            </div>`;
  }

  static cardTemplate(c) {
    const color = MyCommissionsView.statusColors[c.status] || "secondary";

    const counterpart = Auth.hasRole("artist")
      ? `Cliente: ${escapeHtml(c.clientUsername)}`
      : `Artista: ${escapeHtml(c.artistDisplayName)}`;

    const canDelete = c.status === "pending" && Auth.hasRole("client");
    const deleteBtn = canDelete
      ? `<button class="btn-close position-absolute top-0 end-0 m-2" data-delete-id="${c.id}" aria-label="Elimina"></button>`
      : "";

    return `
      <div class="commission-card">
        ${deleteBtn}
        <div class="commission-header">
          <h4>${escapeHtml(c.title)}</h4>
          <span class="badge badge-${color}">${escapeHtml(c.status)}</span>
        </div>
        <div class="commission-meta">
          <span><i class="bi bi-person"></i> ${counterpart}</span>
          <span class="commission-price">€${c.price}</span>
        </div>
        ${MyCommissionsView.statusDropdown(c)}
        ${MyCommissionsView.payBlock(c)}
        ${MyCommissionsView.deliveryForm(c)}
        ${MyCommissionsView.downloadBlock(c)}
        ${MyCommissionsView.reviewBlock(c)}
        ${MyCommissionsView.descTemplate(c)}
      </div>`;
  }

  static descTemplate(c) {
    const inline =
      Auth.hasRole("artist") ||
      c.status === "pending" ||
      c.status === "delivered";
    if (inline)
      return `<p class="commission-desc">${escapeHtml(c.description || "")}</p>`;
    return `<div class="commission-desc-overlay">${escapeHtml(c.description || "Nessuna descrizione")}</div>`;
  }

  static reviewBlock(c) {
    if (!Auth.hasRole("client") || c.status !== "delivered") return "";
    return `
      <form class="review-form mt-2" data-review-commission="${c.id}">
        <select class="form-select form-select-sm mb-2" data-review-rating required>
          <option value="">Voto...</option>
          <option value="5">⭐⭐⭐⭐⭐</option>
          <option value="4">⭐⭐⭐⭐</option>
          <option value="3">⭐⭐⭐</option>
          <option value="2">⭐⭐</option>
          <option value="1">⭐</option>
        </select>
        <textarea class="form-control form-control-sm mb-2" rows="2" placeholder="Scrivi una recensione" data-review-text></textarea>
        <button type="submit" class="btn btn-dark btn-sm">Invia recensione</button>
      </form>`;
  }

  static statusDropdown(c) {
    if (!Auth.hasRole("artist")) return "";

    const next = (MyCommissionsView.artistTransitions[c.status] || []).filter(
      (s) => s !== "delivered",
    );
    if (next.length === 0) return "";

    const items = next
      .map(
        (s) =>
          `<li><a class="dropdown-item" href="#" data-status-id="${c.id}" data-status-target="${s}">${s}</a></li>`,
      )
      .join("");

    return `
      <div class="dropdown mt-2">
        <button class="btn btn-outline-dark btn-sm dropdown-toggle" data-bs-toggle="dropdown">
          Cambia stato
        </button>
        <ul class="dropdown-menu">${items}</ul>
      </div>`;
  }

  // Bottone paga: client + commissione accepted non ancora pagata.
  static payBlock(c) {
    if (
      !Auth.hasRole("client") ||
      c.status !== "accepted" ||
      c.paymentStatus === "paid"
    )
      return "";
    return `<button class="btn btn-primary btn-sm mt-2" data-pay-id="${c.id}">
              <i class="bi bi-credit-card"></i> Paga €${c.price}
            </button>`;
  }

  // Bottone consegna: artist + commissione in_progress. Apre il modal upload.
  static deliveryForm(c) {
    if (!Auth.hasRole("artist") || c.status !== "in_progress") return "";
    return `
      <button class="btn btn-dark btn-sm mt-2" data-deliver-id="${c.id}">
        <i class="bi bi-cloud-upload"></i> Consegna lavoro
      </button>`;
  }

  // Download lavoro consegnato: visibile a chi è coinvolto quando c'è l'immagine.
  static downloadBlock(c) {
    if (!c.deliveryImage) return "";
    return `<a class="btn btn-success btn-sm mt-2" href="${escapeHtml(c.deliveryImage)}" download>
              <i class="bi bi-download"></i> Scarica lavoro
            </a>`;
  }

  static attachEvents() {
    document.querySelectorAll("[data-delete-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.deleteId;
        if (!confirm("Eliminare questa commissione?")) return;
        try {
          await Api.delete(`/commissions/${id}`);
          MyCommissionsView.render();
        } catch (err) {
          alert("Errore: " + (err.message || "eliminazione fallita"));
        }
      });
    });

    document.querySelectorAll("[data-status-target]").forEach((item) => {
      item.addEventListener("click", async (e) => {
        e.preventDefault();
        const id = item.dataset.statusId;
        const status = item.dataset.statusTarget;
        try {
          await Api.patch(`/commissions/${id}/status`, { status });
          MyCommissionsView.render();
        } catch (err) {
          alert("Errore: " + (err.message || "cambio stato fallito"));
        }
      });
    });

    // Paga (client): crea sessione Stripe Checkout e reindirizza alla pagina di pagamento
    document.querySelectorAll("[data-pay-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          const res = await Api.post("/payments/checkout", {
            commissionId: btn.dataset.payId,
          });
          window.location.href = res.url; // redirect a Stripe
        } catch (err) {
          alert("Errore: " + (err.message || "pagamento fallito"));
        }
      });
    });

    // Consegna lavoro
    document.querySelectorAll("[data-deliver-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        DeliveryModal.open(btn.dataset.deliverId, () =>
          MyCommissionsView.render(),
        );
      });
    });

    // Invia recensione
    document.querySelectorAll("[data-review-commission]").forEach((form) => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const commissionId = form.dataset.reviewCommission;
        const rating = form.querySelector("[data-review-rating]").value;
        const text = form.querySelector("[data-review-text]").value.trim();
        if (!rating) {
          alert("Seleziona un voto");
          return;
        }
        try {
          await Api.post("/reviews", {
            commissionId,
            rating: Number(rating),
            text,
          });
          MyCommissionsView.render();
        } catch (err) {
          alert("Errore: " + (err.message || "recensione fallita"));
        }
      });
    });
  }
}

export default MyCommissionsView;
