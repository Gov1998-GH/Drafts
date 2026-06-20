import Api from "../js/api.js";
import Auth from "../js/auth.js";
import { escapeHtml } from "../js/utils.js";
import page from "https://unpkg.com/page@1.11.6/page.mjs";

class NavBar {
  static notifications = [];
  static pollTimer = null;

  static async render() {
    // Ferma eventuale polling precedente (evita timer duplicati)
    if (NavBar.pollTimer) clearInterval(NavBar.pollTimer);

    const navbar = document.getElementById("navbar");
    const categories = await Api.get("/categories").catch(() => []);
    // Notifiche solo se loggato
    NavBar.notifications = Auth.isLogged()
      ? await Api.get("/notifications").catch(() => [])
      : [];
    navbar.innerHTML = NavBar.template(categories);
    NavBar.attachEvents();

    // Avvia polling notifiche ogni 15s (near-realtime)
    if (Auth.isLogged()) {
      NavBar.pollTimer = setInterval(NavBar.pollNotifications, 15000);
    }
  }

  // Ricontrolla le notifiche; se cambia il numero di non-lette, aggiorna la navbar
  static async pollNotifications() {
    if (!Auth.isLogged()) return;
    const notifs = await Api.get("/notifications").catch(() => null);
    if (!notifs) return;
    const newUnread = notifs.filter((n) => !n.isRead).length;
    const oldUnread = NavBar.notifications.filter((n) => !n.isRead).length;
    NavBar.notifications = notifs;
    if (newUnread !== oldUnread) NavBar.render();
  }

  static template(categories) {
    return `
            <nav class="main-nav fixed-top">

                <!-- ===== DESKTOP: 3 pillole ===== -->
                <div class="desktop-nav d-none d-lg-flex justify-content-between align-items-center pt-3 px-4 gap-2">

                    <!-- PILLOLA 1: Brand + Links -->
                    <div class="pill d-flex align-items-center gap-2 px-3 py-2">
                        <a class="brand" href="/">
                            <span class="brand-logo"><img src="/images/logo/logoD.png" alt="Drafts" /></span>
                            <span>Drafts</span>
                        </a>
                        <div class="links d-flex align-items-center gap-1">
                            ${NavBar.leftLinks(categories)}
                        </div>
                    </div>

                    <!-- PILLOLA 2: Search -->
                    <div class="pill d-flex align-items-center px-3 py-2 mx-auto">
                        <div class="search position-relative">
                            <i class="bi bi-search"></i>
                            <input type="search" id="navSearch" class="search-input" placeholder="Cerca artisti..." />
                            <div id="searchResults" class="search-results"></div>
                        </div>
                    </div>

                    <!-- PILLOLA 3: Auth / Avatar -->
                    <div class="pill auth-group d-flex align-items-center gap-2 px-3 py-2">
                        ${NavBar.notificationBell()}
                        ${NavBar.authLinks()}
                    </div>

                </div>


                <!-- ===== MOBILE: top bar stile mangadex ===== -->
                <div class="mobile-bar d-flex d-lg-none align-items-center justify-content-between px-3">
                    <button class="icon-btn" id="burgerBtn" aria-label="Menu">
                        <i class="bi bi-list"></i>
                    </button>
                    <a class="brand" href="/">
                        <span class="brand-logo"><img src="/images/logo/logoD.png" alt="Drafts" /></span>
                    </a>
                    <div class="d-flex align-items-center gap-2">
                        <button class="icon-btn" id="mobileSearchToggle" aria-label="Cerca">
                            <i class="bi bi-search"></i>
                        </button>
                        ${NavBar.mobileAuthIcon()}
                    </div>
                </div>


                <!-- ===== DRAWER mobile (slide da sinistra) ===== -->
                <div class="drawer" id="mobileDrawer">
                    <div class="drawer-header">
                        <button class="icon-btn" id="drawerClose" aria-label="Chiudi">
                            <i class="bi bi-x-lg"></i>
                        </button>
                        <span class="brand">
                            <span class="brand-logo"><img src="/images/logo/logoD.png" alt="Drafts" /></span>
                            Drafts
                        </span>
                    </div>

                    <div class="drawer-search">
                        <div class="search">
                            <i class="bi bi-search"></i>
                            <input type="search" id="navSearchMobile" class="search-input" placeholder="Cerca artisti..." />
                        </div>
                    </div>

                    <div class="drawer-section">
                        ${NavBar.leftLinks(categories)}
                    </div>

                    <hr>

                    <div class="drawer-section">
                        ${NavBar.authLinks()}
                    </div>
                </div>


                <!-- ===== OVERLAY scuro dietro drawer ===== -->
                <div class="drawer-overlay" id="drawerOverlay"></div>

            </nav>
        `;
  }

  static leftLinks(categories) {
    const common = `
            <a class="nav-link" href="/artists">Artisti</a>
            <a class="nav-link" href="/services">Servizi</a>
            ${NavBar.categoriesDropdown(categories)}
        `;

    if (Auth.hasRole("client"))
      return (
        common +
        `
            <a class="nav-link" href="/my-commissions">Commissioni</a>
            <a class="nav-link" href="/my-reviews">Recensioni</a>
        `
      );

    if (Auth.hasRole("artist"))
      return (
        common +
        `
            <a class="nav-link" href="/my-commissions">Commissioni</a>
        `
      );

    if (Auth.hasRole("admin"))
      return (
        common +
        `
            <a class="nav-link" href="/admin/moderation">Moderazione</a>
        `
      );

    return common;
  }

  static categoriesDropdown(categories) {
    const items = categories
      .map(
        (c) =>
          `<a class="dropdown-item" href="/categories/${c.id}">${c.name}</a>`,
      )
      .join("");
    return `
            <div class="dropdown">
                <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#" role="button">Categorie</a>
                <div class="dropdown-menu dropdown-rounded">
                    ${items}
                </div>
            </div>
        `;
  }

  static notificationBell() {
    if (!Auth.isLogged()) return "";
    const unread = NavBar.notifications.filter((n) => !n.isRead).length;
    const badge =
      unread > 0 ? `<span class="notif-badge">${unread}</span>` : "";

    const items =
      NavBar.notifications.length === 0
        ? `<li><span class="dropdown-item text-muted">Nessuna notifica</span></li>`
        : NavBar.notifications
            .slice(0, 8)
            .map(
              (n) =>
                `<li class="notif-row">
                   <span class="notif-item ${n.isRead ? "" : "fw-semibold"}">${escapeHtml(n.message)}</span>
                   <button class="notif-del" data-notif-id="${n.id}" aria-label="Elimina">&times;</button>
                 </li>`,
            )
            .join("");

    const clearAll =
      NavBar.notifications.length > 0
        ? `<li><button class="dropdown-item text-center text-danger" id="notifClearAll">Cancella tutte</button></li>`
        : "";

    return `
      <div class="dropdown">
        <button class="icon-btn position-relative" id="notifBtn" data-bs-toggle="dropdown" aria-label="Notifiche">
          <i class="bi bi-bell"></i>
          ${badge}
        </button>
        <ul class="dropdown-menu dropdown-rounded dropdown-menu-end notif-menu">
          ${items}
          ${clearAll}
        </ul>
      </div>`;
  }

  static authLinks() {
    if (!Auth.isLogged()) {
      return `
                <a class="btn-rounded btn-ghost" href="/login">Login</a>
                <a class="btn-rounded btn-dark" href="/signup">Sign up</a>
            `;
    }

    const user = Auth.user;
    const initial = user.username?.charAt(0).toUpperCase() || "?";

    return `
            <div class="dropdown">
                <button class="avatar-btn" data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="avatar-circle">${initial}</span>
                </button>
                <ul class="dropdown-menu dropdown-rounded dropdown-menu-end">
                    <li class="user-header">
                        <strong>${user.username}</strong>
                        <small class="text-muted d-block">${user.role}</small>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="/profile"><i class="bi bi-person"></i> Profilo</a></li>
                    ${NavBar.dropdownExtra()}
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" id="logout-btn" href="#"><i class="bi bi-box-arrow-right"></i> Logout</a></li>
                </ul>
            </div>
        `;
  }

  static mobileAuthIcon() {
    if (!Auth.isLogged()) {
      return `<a class="icon-btn" href="/login" aria-label="Login"><i class="bi bi-person-circle"></i></a>`;
    }
    const initial = Auth.user.username?.charAt(0).toUpperCase() || "?";
    return `
            <div class="dropdown">
                <button class="avatar-btn" data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="avatar-circle avatar-sm">${initial}</span>
                </button>
                <ul class="dropdown-menu dropdown-rounded dropdown-menu-end">
                    <li class="user-header">
                        <strong>${Auth.user.username}</strong>
                        <small class="text-muted d-block">${Auth.user.role}</small>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="/profile"><i class="bi bi-person"></i> Profilo</a></li>
                    ${NavBar.dropdownExtra()}
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" id="logout-btn-mobile" href="#"><i class="bi bi-box-arrow-right"></i> Logout</a></li>
                </ul>
            </div>
        `;
  }

  static dropdownExtra() {
    if (Auth.hasRole("artist"))
      return `
            <li><a class="dropdown-item" href="/my-portfolio"><i class="bi bi-images"></i> Portfolio</a></li>
            <li><a class="dropdown-item" href="/my-services"><i class="bi bi-briefcase"></i> Servizi</a></li>
        `;
    if (Auth.hasRole("client"))
      return `
            <li><a class="dropdown-item" href="/favorites"><i class="bi bi-heart"></i> Preferiti</a></li>
        `;
    if (Auth.hasRole("admin"))
      return `
            <li><a class="dropdown-item" href="/admin/users"><i class="bi bi-people"></i> Utenti</a></li>
        `;
    return "";
  }

  static attachEvents() {
    const handleLogout = async (e) => {
      e.preventDefault();
      try {
        await Auth.logout();
      } catch (err) {}
      window.location.href = "/";
    };
    document
      .getElementById("logout-btn")
      ?.addEventListener("click", handleLogout);
    document
      .getElementById("logout-btn-mobile")
      ?.addEventListener("click", handleLogout);

    // Campanella notifiche: all'apertura segna tutte come lette + togli badge
    document.getElementById("notifBtn")?.addEventListener("click", async () => {
      const badge = document.querySelector(".notif-badge");
      if (!badge) return; // niente da segnare
      try {
        await Api.put("/notifications/read");
        NavBar.notifications.forEach((n) => (n.isRead = true));
        badge.remove();
      } catch (err) {}
    });

    // Elimina singola notifica (X)
    document.querySelectorAll("[data-notif-id]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          await Api.delete(`/notifications/${btn.dataset.notifId}`);
          await NavBar.render();
        } catch (err) {}
      });
    });

    // Cancella tutte le notifiche
    document
      .getElementById("notifClearAll")
      ?.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          await Api.delete("/notifications");
          await NavBar.render();
        } catch (err) {}
      });

    let searchTimer = null;
    const results = document.getElementById("searchResults");
    const input = document.getElementById("navSearch");
    input.addEventListener("input", () => {
      const q = input.value.trim();

      if (q.length < 3) {
        results.innerHTML = "";
        results.classList.remove("open");
        return;
      }

      clearTimeout(searchTimer);
      searchTimer = setTimeout(async () => {
        try {
          const artists = await Api.get(
            `/users/artists?displayName=${encodeURIComponent(q)}`,
          );
          renderResults(artists, q);
        } catch (err) {
          results.innerHTML = "";
        }
      }, 300);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const q = input.value.trim();
        if (q) {
          results.classList.remove("open");
          results.innerHTML = "";
          page(`/artists?q=${encodeURIComponent(q)}`);
        }
      }
    });

    function renderResults(artists, q) {
      if (artists.length === 0) {
        results.innerHTML = `<div class="search-result-item">Nessun risultato</div>`;
        results.classList.add("open");
        return;
      }
      const visible = artists.slice(0, 4);
      let html = visible
        .map((a) => {
          const avatar = a.profileImage
            ? `<img src="${escapeHtml(a.profileImage)}" class="search-avatar">`
            : `<span class="avatar-circle avatar-sm">${a.displayName?.charAt(0).toUpperCase() || "?"}</span>`;
          return `<div class="search-result-item" data-id="${a.id}">
                  ${avatar}
                  <span>${escapeHtml(a.displayName)}</span>
                </div>`;
        })
        .join("");

      if (artists.length > 4)
        html += `<div class="search-result-all" data-q="${escapeHtml(q)}">Vedi tutti (${artists.length})</div>`;
      results.innerHTML = html;
      results.classList.add("open");

      results
        .querySelectorAll(".search-result-item[data-id]")
        .forEach((item) => {
          item.addEventListener("click", () => {
            results.classList.remove("open");
            input.value = "";
            page(`/artists/${item.dataset.id}`);
          });
        });

      const allBtn = results.querySelector(".search-result-all");
      allBtn?.addEventListener("click", () => {
        results.classList.remove("open");
        page(`/artists?q=${encodeURIComponent(allBtn.dataset.q)}`);
      });
    }

    // === Search mobile (dentro drawer) ===
    const searchMobile = document.getElementById("navSearchMobile");
    if (searchMobile) {
      searchMobile.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const q = searchMobile.value.trim();
          if (q) page(`/artists?q=${encodeURIComponent(q)}`);
          closeDrawer();
        }
      });
    }

    // Drawer mobile
    const burger = document.getElementById("burgerBtn");
    const drawer = document.getElementById("mobileDrawer");
    const overlay = document.getElementById("drawerOverlay");
    const drawerClose = document.getElementById("drawerClose");
    const searchToggle = document.getElementById("mobileSearchToggle");

    const openDrawer = () => {
      drawer?.classList.add("open");
      overlay?.classList.add("open");
    };

    const closeDrawer = () => {
      drawer?.classList.remove("open");
      overlay?.classList.remove("open");
    };

    burger?.addEventListener("click", openDrawer);
    drawerClose?.addEventListener("click", closeDrawer);
    overlay?.addEventListener("click", closeDrawer);

    searchToggle?.addEventListener("click", () => {
      openDrawer();
      setTimeout(() => searchMobile?.focus(), 300);
    });

    drawer
      ?.querySelectorAll(".nav-link, .btn-rounded, .dropdown-item")
      .forEach((el) => {
        el.addEventListener("click", closeDrawer);
      });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 992) closeDrawer();
    });

    document.addEventListener("click", (e) => {
      if (input && !input.contains(e.target)) {
        results.classList.remove("open");
      }
      if (searchMobile && drawer && !drawer.contains(e.target))
        searchMobile.value = "";
    });
  }
}

export default NavBar;
