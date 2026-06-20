import Api from "../js/api.js";
import Auth from "../js/auth.js";
import { escapeHtml } from "../js/utils.js";
import page from "https://unpkg.com/page@1.11.6/page.mjs";
import CommissionModal from "./commissionModal-view.js";

class ArtistDetailView {
  static artist = null;
  static activeTab = "portfolio";
  static portfolios = [];
  static services = [];
  static reviews = [];
  static commissions = [];
  static isOwner = false;
  static isFavorited = false;
  static currentId = null;

  static async render(artistId) {
    ArtistDetailView.activeTab = "portfolio";
    ArtistDetailView.artist = null;
    ArtistDetailView.portfolios = [];
    ArtistDetailView.services = [];
    ArtistDetailView.reviews = [];
    ArtistDetailView.commissions = [];
    ArtistDetailView.isOwner = false;
    ArtistDetailView.isFavorited = false;
    ArtistDetailView.currentId = artistId;
    const app = document.getElementById("app");
    app.innerHTML = `<div class="text-center py-5">Caricamento...</div>`;

    try {
      const [artist, portfolios, services, reviews] = await Promise.all([
        Api.get(`/users/artists/${artistId}`),
        Api.get(`/portfolios?artistId=${artistId}`),
        Api.get(`/services?artistId=${artistId}`),
        Api.get(`/reviews?artistId=${artistId}`),
      ]);

      ArtistDetailView.artist = artist;
      ArtistDetailView.portfolios = portfolios;
      ArtistDetailView.services = services;
      ArtistDetailView.reviews = reviews;

      // Owner = artista loggato sulla propria pagina
      ArtistDetailView.isOwner =
        Auth.isLogged() &&
        Auth.hasRole("artist") &&
        Number(Auth.user.id) === Number(artistId);

      if (ArtistDetailView.isOwner) {
        ArtistDetailView.commissions = await Api.get("/commissions").catch(
          () => [],
        );
      } else {
        ArtistDetailView.commissions = [];
        // Se tab commissioni era attivo da visita precedente, reset
        if (ArtistDetailView.activeTab === "commissions") {
          ArtistDetailView.activeTab = "portfolio";
        }
      }

      // Client verifica se questo artista è già nei preferiti
      if (Auth.hasRole("client")) {
        const favs = await Api.get("/favorites").catch(() => []);
        ArtistDetailView.isFavorited = favs.some(
          (f) => Number(f.id) === Number(artistId),
        );
      }

      app.innerHTML = ArtistDetailView.template();
      ArtistDetailView.attachEvents();
    } catch (err) {
      app.innerHTML = `<div class="text-center py-5">Artista non trovato</div>`;
    }
  }

  static template() {
    const a = ArtistDetailView.artist;
    const initial = a.displayName?.charAt(0).toUpperCase() || "?";
    const rating = a.avgRating
      ? `⭐ ${a.avgRating} (${a.reviewCount})`
      : "Nessuna recensione";

    const heart = Auth.hasRole("client")
      ? `<button class="fav-btn fav-btn-lg" id="favBtn" aria-label="Preferito">
           <i class="bi ${ArtistDetailView.isFavorited ? "bi-heart-fill text-danger" : "bi-heart"}"></i>
         </button>`
      : "";

    return `<section class="artist-header">
                <div class="container py-5 position-relative">
                    ${heart}
                    <div class="d-flex align-items-start gap-4">
                        ${
                          a.profileImage
                            ? `<img src="${escapeHtml(a.profileImage)}" alt="${escapeHtml(a.displayName)}" class="avatar-circle avatar-lg" />`
                            : `<div class="avatar-circle avatar-lg">${initial}</div>`
                        }
                        <div class="flex-grow-1">
                            <h1 class="mb-2">${escapeHtml(a.displayName)}</h1>
                            <p class="text-muted mb-2">
                                <i class="bi bi-geo-alt"></i> ${escapeHtml(a.city || "—")}
                                <span class="ms-3">${rating}</span>
                            </p>
                            <p>${escapeHtml(a.bio || "")}</p>
                        </div>
                    </div>
                </div>
            </section>

            <div class="container">
                <div class="artist-tabs">
                    ${ArtistDetailView.tabButton("portfolio", "Portfolio")}
                    ${ArtistDetailView.tabButton("services", "Servizi")}
                    ${ArtistDetailView.tabButton("reviews", "Recensioni")}
                    ${ArtistDetailView.isOwner ? ArtistDetailView.tabButton("commissions", "Le mie commissioni") : ""}
                </div>
            <div id="tabContent" class="tab-content py-4">
                ${ArtistDetailView.tabContent()}
            </div>
            </div>
        `;
  }

  static tabButton(tab, label) {
    const active = ArtistDetailView.activeTab === tab ? "active" : "";
    return `<button class="artist-tab ${active}" data-tab="${tab}">${label}</button>`;
  }

  static tabContent() {
    switch (ArtistDetailView.activeTab) {
      case "portfolio":
        return ArtistDetailView.renderPortfolio();
      case "services":
        return ArtistDetailView.renderServices();
      case "reviews":
        return ArtistDetailView.renderReviews();
      case "commissions":
        return ArtistDetailView.renderCommissions();
      default:
        return "";
    }
  }

  static renderCommissions() {
    if (!ArtistDetailView.isOwner) return "";
    if (ArtistDetailView.commissions.length === 0) {
      return `<div class="empty-state">Nessuna commissione</div>`;
    }
    const statusColors = {
      pending: "warning",
      accepted: "info",
      in_progress: "primary",
      delivered: "success",
      reviewed: "secondary",
      rejected: "danger",
    };
    return `
      <div class="commissions-grid">
        ${ArtistDetailView.commissions
          .map((c) => {
            const color = statusColors[c.status] || "secondary";
            return `
              <div class="commission-card">
                <div class="commission-header">
                  <h4>${escapeHtml(c.title)}</h4>
                  <span class="badge badge-${color}">${c.status}</span>
                </div>
                <p class="commission-desc">${escapeHtml(c.description || "")}</p>
                <div class="commission-meta">
                  <span><i class="bi bi-person"></i> ${escapeHtml(c.clientUsername)}</span>
                  <span class="commission-price">€${c.price}</span>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  static renderPortfolio() {
    if (ArtistDetailView.portfolios.length === 0) {
      return `<div class="empty-state">Nessuna opera nel portfolio</div>`;
    }
    return `
      <div class="portfolio-grid">
        ${ArtistDetailView.portfolios
          .map(
            (p) => `
          <div class="portfolio-card">
            <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="portfolio-img" loading="lazy">
            <div class="portfolio-overlay">
              <h4>${escapeHtml(p.name)}</h4>
              <p>${escapeHtml(p.description || "")}</p>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  static renderServices() {
    if (ArtistDetailView.services.length === 0) {
      return `<div class="empty-state">Nessun servizio disponibile</div>`;
    }
    return `
      <div class="services-grid">
        ${ArtistDetailView.services
          .map(
            (s) => `
          <div class="service-card">
            <h3 class="service-name">${escapeHtml(s.name)}</h3>
            <p class="service-desc">${escapeHtml(s.description || "")}</p>
            <div class="service-meta">
              <span class="service-price">€${s.price}</span>
              <span class="service-delivery"><i class="bi bi-clock"></i> ${s.deliveryDays}gg</span>
            </div>
            <button class="btn-rounded btn-dark service-btn" data-service-id="${s.id}">Commissiona</button>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  static renderReviews() {
    if (ArtistDetailView.reviews.length === 0) {
      return `<div class="empty-state">Nessuna recensione</div>`;
    }
    return `
      <div class="reviews-list">
        ${ArtistDetailView.reviews
          .map((r) => {
            const stars = "⭐".repeat(r.rating);
            const initial = r.clientUsername?.charAt(0).toUpperCase() || "?";
            const date = new Date(r.createdAt).toLocaleDateString("it-IT");
            return `
              <div class="review-card">
                <div class="review-header">
                  <div class="avatar-circle avatar-sm">${initial}</div>
                  <div class="review-meta">
                    <strong>${escapeHtml(r.clientUsername)}</strong>
                    <small class="text-muted">${date}</small>
                  </div>
                  <div class="review-rating">${stars}</div>
                </div>
                <p class="review-text">${escapeHtml(r.text || "")}</p>
                <small class="text-muted">Su: ${escapeHtml(r.commissionTitle)}</small>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  static attachEvents() {
    document.querySelectorAll(".artist-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        ArtistDetailView.activeTab = btn.dataset.tab;

        document
          .querySelectorAll(".artist-tab")
          .forEach((b) =>
            b.classList.toggle(
              "active",
              b.dataset.tab === ArtistDetailView.activeTab,
            ),
          );
        document.getElementById("tabContent").innerHTML =
          ArtistDetailView.tabContent();
      });
    });
    const tabContent = document.getElementById("tabContent");
    tabContent?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-service-id]");
      if (!btn) return;
      const serviceId = Number(btn.dataset.serviceId);
      const service = ArtistDetailView.services.find((s) => s.id === serviceId);
      if (service) CommissionModal.open(service, ArtistDetailView.artist.id);
    });

    const favBtn = document.getElementById("favBtn");
    favBtn?.addEventListener("click", async () => {
      try {
        const res = await Api.post("/favorites", {
          artistId: ArtistDetailView.currentId,
        });
        const icon = favBtn.querySelector("i");
        icon.className =
          res.status === "added"
            ? "bi bi-heart-fill text-danger"
            : "bi bi-heart";
      } catch (err) {
        alert("Errore preferito");
      }
    });
  }
}

export default ArtistDetailView;
