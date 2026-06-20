import Auth from "../js/auth.js";
import page from "https://unpkg.com/page@1.11.6/page.mjs";

class SignupView {
  static slides = [
    {
      img: "/images/background/background.jpg",
      text: "Capturing Moments, Creating Memories",
    },
    {
      img: "/images/background/background2.jpg",
      text: "Find Your Artist, Tell Your Story",
    },
    {
      img: "/images/background/background3.jpg",
      text: "Where Art Meets Imagination",
    },
  ];
  static currentSlide = 0;
  static returnTo = "/";

  static render(returnTo = "/") {
    SignupView.returnTo = returnTo;
    if (SignupView.sliderInterval) {
      clearInterval(SignupView.sliderInterval);
      SignupView.sliderInterval = null;
    }

    const existing = document.getElementById("auth-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "auth-overlay";
    overlay.className = "auth-overlay";
    overlay.innerHTML = SignupView.template();
    document.body.appendChild(overlay);
    const slide = SignupView.slides[SignupView.currentSlide];
    document.getElementById("signupAuthSide").style.backgroundImage =
      `url('${slide.img}')`;

    SignupView.attachEvents();
    SignupView.startSlider();
  }

  static template() {
    const slide = SignupView.slides[SignupView.currentSlide];
    const dots = SignupView.slides
      .map(
        (_, i) =>
          `<span class="slide-dot ${i === SignupView.currentSlide ? "active" : ""}"></span>`,
      )
      .join("");

    return `
            <div class="auth-modal">
                <button class="auth-close" id="authClose" aria-label="Chiudi">
                    <i class="bi bi-x-lg"></i>
                </button>

                <div class="auth-grid">
                    <!-- Colonna sinistra: immagine + tagline -->
                    <div class="auth-side" id="signupAuthSide">
                        <div class="auth-side-header">
                            <span class="auth-logo">Drafts</span>
                            <a class="auth-back" href="/">Torna al sito →</a>
                        </div>
                        <div class="auth-side-footer">
                            <h2>${slide.text}</h2>
                            <div class="slide-dots">${dots}</div>
                        </div>
                    </div>

                    <!-- Colonna destra: form -->
                    <div class="auth-form-side">
                        <h1>Crea un account</h1>
                        <p class="auth-subtitle">
                            Hai già un account?
                            <a href="/login" class="auth-link">Accedi</a>
                        </p>

                        <form id="signupForm" class="auth-form">
                            <div class="auth-row">
                                <input type="text" name="username" placeholder="Username" required class="auth-input">
                            </div>
                            <input type="email" name="email" placeholder="Email" required class="auth-input">
                            <div class="auth-password">
                                <input type="password" name="password" id="signupPwd" placeholder="Password" required class="auth-input" minlength="8">
                                <button type="button" class="auth-eye" id="togglePwd"><i class="bi bi-eye"></i></button>
                            </div>

                            <select name="role" required class="auth-input">
                                <option value="">Sei un cliente o un artista?</option>
                                <option value="client">Cliente</option>
                                <option value="artist">Artista</option>
                            </select>

                            <!-- Campi artista (nascosti default) -->
                            <div id="artistFields" class="d-none">
                                <input type="text" name="displayName" placeholder="Nome d'arte" class="auth-input">
                                <input type="text" name="city" placeholder="Città" class="auth-input">
                                <textarea name="bio" placeholder="Bio (max 500)" class="auth-input" rows="3"></textarea>
                            </div>

                            <div id="signupError" class="auth-error d-none"></div>

                            <button type="submit" class="auth-btn-primary">Crea account</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
  }

  static attachEvents() {
    // Chiusura
    const closeBtn = document.getElementById("authClose");
    closeBtn?.addEventListener("click", () => SignupView.close());

    // ESC chiude
    document.addEventListener("keydown", SignupView.handleEsc);

    // Click overlay chiude
    document.getElementById("auth-overlay")?.addEventListener("click", (e) => {
      if (e.target.id === "auth-overlay") SignupView.close();
    });

    // Toggle password
    const toggle = document.getElementById("togglePwd");
    toggle?.addEventListener("click", () => {
      const pwd = document.getElementById("signupPwd");
      const icon = toggle.querySelector("i");
      const isPwd = pwd.type === "password";
      pwd.type = isPwd ? "text" : "password";
      icon.className = isPwd ? "bi bi-eye-slash" : "bi bi-eye";
    });

    // Mostra campi artista
    const roleSelect = document.querySelector('select[name="role"]');
    roleSelect?.addEventListener("change", (e) => {
      const artistFields = document.getElementById("artistFields");
      artistFields.classList.toggle("d-none", e.target.value !== "artist");
    });

    // Submit
    document
      .getElementById("signupForm")
      ?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        try {
          await Auth.signup(data);
          SignupView.close();
          // re-render navbar
          const { default: NavBar } = await import("./navbar.js");
          await NavBar.render();
        } catch (err) {
          const errBox = document.getElementById("signupError");
          errBox.textContent = err.message || "Errore signup";
          errBox.classList.remove("d-none");
        }
      });
  }

  static handleEsc(e) {
    if (e.key === "Escape") SignupView.close();
  }

  static close() {
    document.getElementById("auth-overlay")?.remove();
    document.removeEventListener("keydown", SignupView.handleEsc);
    if (SignupView.sliderInterval) clearInterval(SignupView.sliderInterval);
    page(SignupView.returnTo);
  }

  static startSlider() {
    SignupView.sliderInterval = setInterval(() => {
      SignupView.currentSlide =
        (SignupView.currentSlide + 1) % SignupView.slides.length;

      const overlay = document.getElementById("auth-overlay");
      if (!overlay) {
        clearInterval(SignupView.sliderInterval);
        return;
      }
      const slide = SignupView.slides[SignupView.currentSlide];
      const side = overlay.querySelector(".auth-side");
      side.style.backgroundImage = `url('${slide.img}')`;
      overlay.querySelector(".auth-side-footer h2").textContent = slide.text;
      overlay.querySelectorAll(".slide-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === SignupView.currentSlide);
      });
    }, 4000);
  }
}

export default SignupView;
