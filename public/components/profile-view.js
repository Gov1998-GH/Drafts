import Api from "../js/api.js";
import Auth from "../js/auth.js";
import { escapeHtml } from "../js/utils.js";
import page from "https://unpkg.com/page@1.11.6/page.mjs";

class ProfileView {
  static artistData = null; 

  static async render() {
    ProfileView.artistData = null;

    const app = document.getElementById("app");
    app.innerHTML = `<div class="text-center py-5">
        <div class="spinner-grow" role="status">
            <span class="visually-hidden">Caricamento...</span>
        </div>
    </div>`;

    try {
      if (Auth.hasRole("artist")) {
        ProfileView.artistData = await Api.get(
          `/users/artists/${Auth.user.id}`,
        );
      }

      app.innerHTML = ProfileView.template();
      ProfileView.attachEvents();
    } catch (err) {
      app.innerHTML = `<div class="text-center py-5">Errore nel caricamento riprova più tardi</div>`;
    }
  }

  static template() {
    const u = Auth.user;
    const a = ProfileView.artistData;

    const artistFields = Auth.hasRole("artist")
      ? `
        <div class="mb-3">
          <label for="prDisplayName" class="form-label">Nome d'arte</label>
          <input type="text" id="prDisplayName" class="form-control" value="${escapeHtml(a?.displayName || "")}" />
        </div>
        <div class="mb-3">
          <label for="prCity" class="form-label">Città</label>
          <input type="text" id="prCity" class="form-control" value="${escapeHtml(a?.city || "")}" />
        </div>
        <div class="mb-3">
          <label for="prBio" class="form-label">Bio</label>
          <textarea id="prBio" class="form-control" rows="3">${escapeHtml(a?.bio || "")}</textarea>
        </div>
        <div class="mb-3">
          <label for="prImageFile" class="form-label">Immagine profilo</label>
          ${a?.profileImage ? `<div class="mb-2"><img src="${escapeHtml(a.profileImage)}" alt="profilo" class="avatar-circle avatar-lg" /></div>` : ""}
          <input type="file" id="prImageFile" class="form-control" accept="image/*" />
          <small class="text-muted">Lascia vuoto per mantenere l'immagine attuale</small>
        </div>`
      : "";

    return `<div class="container py-4">
       <div class="row justify-content-center">
        <div class="col-lg-6">
        <h2 class="mb-4">Il mio profilo</h2>
        <form id="profileForm" class="card p-4">
          <div class="mb-3">
            <label for="prUsername" class="form-label">Username</label>
            <input type="text" id="prUsername" class="form-control" value="${escapeHtml(u.username)}" required />
          </div>
          <div class="mb-3">
            <label for="prEmail" class="form-label">Email</label>
            <input type="email" id="prEmail" class="form-control" value="${escapeHtml(u.email)}" required />
          </div>
          <div class="mb-3">
            <label for="prPassword" class="form-label">Nuova password (lascia vuoto per non cambiare)</label>
            <input type="password" id="prPassword" class="form-control" minlength="8" />
          </div>
          ${artistFields}
          <button type="submit" class="btn btn-dark">Salva modifiche</button>
        </form>
        </div>
       </div>
      </div>`;
  }

  static attachEvents() {
    const form = document.getElementById("profileForm");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const user = {
        id: Auth.user.id,
        role: Auth.user.role,
        username: document.getElementById("prUsername").value.trim(),
        email: document.getElementById("prEmail").value.trim(),
        password: document.getElementById("prPassword").value, // vuoto = non cambia
      };

      try {
        let artist = null;
        if (Auth.hasRole("artist")) {
          let profileImage = ProfileView.artistData?.profileImage || null;
          const fileInput = document.getElementById("prImageFile");
          if (fileInput.files[0]) {
            const up = await Api.upload("/uploads", fileInput.files[0]);
            profileImage = up.url;
          }
          artist = {
            displayName: document.getElementById("prDisplayName").value.trim(),
            city: document.getElementById("prCity").value.trim(),
            bio: document.getElementById("prBio").value.trim(),
            profileImage,
          };
        }

        await Api.put(`/users/${Auth.user.id}`, { user, artist });
        await Auth.checkSession();
        const { default: NavBar } = await import("./navbar.js");
        await NavBar.render();
        alert("Profilo aggiornato");
        page("/");
      } catch (err) {
        alert("Errore: " + (err.message || "aggiornamento fallito"));
      }
    });
  }
}

export default ProfileView;
