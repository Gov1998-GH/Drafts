import Auth from "../js/auth.js";
import page from "https://unpkg.com/page@1.11.6/page.mjs";

class LoginView {
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
    LoginView.returnTo = returnTo;
    if (LoginView.sliderInterval) {
      clearInterval(LoginView.sliderInterval);
      LoginView.sliderInterval = null;
    }

    const existing = document.getElementById("auth-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "auth-overlay";
    overlay.className = "auth-overlay";
    overlay.innerHTML = LoginView.template();
    document.body.appendChild(overlay);
    const slide = LoginView.slides[LoginView.currentSlide];
    document.getElementById("authSide").style.backgroundImage =
      `url('${slide.img}')`;

    LoginView.attachEvents();
    LoginView.startSlider();
  }

  static template() {
    const slide = LoginView.slides[LoginView.currentSlide];
    const dots = LoginView.slides
      .map(
        (_, i) =>
          `<span class="slide-dot ${i === LoginView.currentSlide ? "active" : ""}"></span>`,
      )
      .join("");

    return ` <div class="auth-modal">
                <button class="auth-close" id="authClose" aria-label="Chiudi">
                    <i class="bi bi-x-lg"></i>
                </button>

                <div class="auth-grid">
                    <!-- Colonna sinistra: immagine + tagline -->
                    <div class="auth-side" id="authSide">
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
                        <h1>Bentornato</h1>
                        <p class="auth-subtitle">
                            Non hai un account?
                            <a href="/signup" class="auth-link">Registrati</a>
                        </p>

                        <form id="loginForm" class="auth-form">
                            <input type="email" name="email" placeholder="Email" required class="auth-input">
                            <div class="auth-password">
                                <input type="password" name="password" id="loginPwd" placeholder="Password" required class="auth-input" minlength="8">
                                <button type="button" class="auth-eye" id="toggleLoginPwd"><i class="bi bi-eye"></i></button>
                            </div>

                            <div id="loginError" class="auth-error d-none"></div>

                            <button type="submit" class="auth-btn-primary">Accedi</button>
                        </form>
                    </div>
                </div>
            </div>
          `;
  }

  static attachEvents() {
    const closeBtn = document.getElementById("authClose");
    closeBtn?.addEventListener("click", () => LoginView.close());

    document.addEventListener("keydown", LoginView.handleEsc);

    document.getElementById("auth-overlay")?.addEventListener("click", (e) => {
      if (e.target.id === "auth-overlay") LoginView.close();
    });

    const toggle = document.getElementById("toggleLoginPwd");
    toggle?.addEventListener("click", () => {
      const pwd = document.getElementById("loginPwd");
      const icon = toggle.querySelector("i");
      const isPwd = pwd.type === "password";
      pwd.type = isPwd ? "text" : "password";
      icon.className = isPwd ? "bi bi-eye-slash" : "bi bi-eye";
    });

    document
      .getElementById("loginForm")
      ?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        try {
          await Auth.login(data.email, data.password);
          LoginView.close();
          const { default: NavBar } = await import("./navbar.js");
          await NavBar.render();
        } catch (err) {
          const errBox = document.getElementById("loginError");
          errBox.textContent = err.message || "Errore Login";
          errBox.classList.remove("d-none");
        }
      });
  }

  static handleEsc(e) {
    if (e.key === "Escape") LoginView.close();
  }

  static close() {
    document.getElementById("auth-overlay")?.remove();
    document.removeEventListener("keydown", LoginView.handleEsc);
    if (LoginView.sliderInterval) clearInterval(LoginView.sliderInterval);
    page(LoginView.returnTo);
  }

  static startSlider() {
    LoginView.sliderInterval = setInterval(() => {
      LoginView.currentSlide =
        (LoginView.currentSlide + 1) % LoginView.slides.length;

      const overlay = document.getElementById("auth-overlay");
      if (!overlay) {
        clearInterval(LoginView.sliderInterval);
        return;
      }

      const slide = LoginView.slides[LoginView.currentSlide];
      const side = overlay.querySelector(".auth-side");
      side.style.backgroundImage = `url('${slide.img}')`;
      overlay.querySelector(".auth-side-footer h2").textContent = slide.text;
      overlay.querySelectorAll(".slide-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === LoginView.currentSlide);
      });
    }, 4000);
  }
}

export default LoginView;
