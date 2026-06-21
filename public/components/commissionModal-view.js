import Api from "../js/api.js";
import Auth from "../js/auth.js";
import { escapeHtml } from "../js/utils.js";
import page from "https://unpkg.com/page@1.11.6/page.mjs";
import LoginView from "./login-view.js";
import SignupView from "./signup-view.js";

class CommissionModal {
  static service = null;
  static artistId = null;

  static open(service, artistId) {
    CommissionModal.service = service;
    CommissionModal.artistId = artistId;

    const existing = document.getElementById("commission-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "commission-overlay";
    overlay.className = "auth-overlay";
    overlay.innerHTML = "";

    let body;
    if (!Auth.isLogged()) body = CommissionModal.authPromptTemplate();
    else if (Auth.hasRole("artist"))
      body = CommissionModal.artistBlockTemplate();
    else body = CommissionModal.formTemplate();
    overlay.innerHTML = `<div class="auth-modal">${body}</div>`;

    document.body.appendChild(overlay);
    CommissionModal.attachEvents();
  }

  static close() {
    // rimuovi overlay dal DOM
    document.getElementById("commission-overlay")?.remove();
  }

  static authPromptTemplate() {
    return `
    <div class="p-4 text-center">
        <button class="auth-close" id="commissionClose" aria-label="Chiudi">
            <i class="bi bi-x-lg"></i>
        </button>
        <h4 class="mb-3"> Accedi per completare la commissione</h4>
        <p class="text-muted mb-4">Per inviare una richiesta devi essere registrato</p>
        <button class="btn btn-dark me-2" id="goLogin">Accedi</button>
        <button class="btn btn-outline-dark" id=goSignup>Registrati</button>
    </div>`;
  }

  static artistBlockTemplate() {
    return `
    <div class="p-4 text-center">
        <button class="auth-close" id="commissionClose" aria-label="Chiudi">
            <i class="bi bi-x-lg"></i>
        </button>
        <h4 class="mb-3">Azione non disponibile</h4>
        <p class="text-muted mb-0">Come artista non puoi richiedere commissioni ad altri artisti.</p>
    </div>`;
  }

  static formTemplate() {
    const s = CommissionModal.service;
    return `
    <form id="CommissionForm" class="p-4">
        <button type="button" class="auth-close" id="commissionClose" aria-label="Chiudi">
            <i class="bi bi-x-lg"></i>
        </button>
        
        <h4 class="mb-1">Commissiona: ${escapeHtml(s.name)}</h4>
        <p class="text-muted mb-3">Prezzo: </strong>€${s.price}</strong></p>
        
        <div class="mb-3">
            <label for="commissionTitle" class="form-label">Titolo</label>
            <input type="text" id="commissionTitle" class="form-control" required>
        </div>
        
        <div class="mb-3">
            <label for="commissionDesc" class="form-label">Descrizione</label>
            <textarea id="commissionDesc" class="form-control" rows="3"></textarea>
        </div>
        
        <button type="submit" class="btn btn-dark">Invia richiesta</button>
    </form>`;
  }

  static attachEvents() {
    document
      .getElementById("commissionClose")
      ?.addEventListener("click", CommissionModal.close);
    document
      .getElementById("commissionClose")
      ?.addEventListener("click", CommissionModal.close);
    document
      .getElementById("commission-overlay")
      ?.addEventListener("click", (e) => {
        if (e.target.id === "commission-overlay") CommissionModal.close();
      });

    document.getElementById("goLogin")?.addEventListener("click", () => {
      const returnTo = window.location.pathname;
      CommissionModal.close();
      LoginView.render(returnTo);
    });

    document.getElementById("goSignup")?.addEventListener("click", () => {
      const returnTo = window.location.pathname;
      CommissionModal.close();
      SignupView.render(returnTo);
    });

    document
      .getElementById("CommissionForm")
      ?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("commissionTitle").value.trim();
        if (!title) {
          alert("Il titolo è obbligatorio");
          return;
        }

        const data = {
          artistId: CommissionModal.artistId,
          serviceId: CommissionModal.service.id,
          title,
          description: document.getElementById("commissionDesc").value.trim(),
          price: CommissionModal.service.price,
        };

        try {
          await Api.post("/commissions", data);
          CommissionModal.close();
          page("/my-commissions");
        } catch (err) {
          alert("Error: " + (err.message || "creazione fallita"));
        }
      });
  }
}

export default CommissionModal;
