//Import di page.js da CDN come modulo ESM
import page from "https://unpkg.com/page@1.11.6/page.mjs";
import Auth from "./auth.js";
import Api from "./api.js";
import NavBar from "../components/navbar.js";
import Footer from "../components/footer.js";
import SignupView from "../components/signup-view.js";
import LoginView from "../components/login-view.js";
import HomeView from "../components/home-view.js";
import ArtistDetailView from "../components/artistDetail-view.js";
import ArtistListView from "../components/artistList-view.js";
import MyServicesView from "../components/myService-view.js";
import CommissionModal from "../components/commissionModal-view.js";
import MyCommissionsView from "../components/myCommissions-view.js";
import MyPortfolioView from "../components/myPortfolio-view.js";
import FavoritesView from "../components/favorites-view.js";
import ProfileView from "../components/profile-view.js";
import CategoryView from "../components/category-view.js";
import ServicesView from "../components/services-view.js";
import MyReviewsView from "../components/myReviews-view.js";
import AdminView from "../components/admin-view.js";

async function init() {
  await Auth.checkSession();
  await NavBar.render();
  Footer.render();

  page("/signup", () => SignupView.render());
  page("/login", () => LoginView.render());
  page("/", () => HomeView.render());
  page("/artists/:id", (ctx) => ArtistDetailView.render(ctx.params.id));
  page("/artists", (ctx) => ArtistListView.render(ctx));
  page("/services", (ctx) => ServicesView.render(ctx));
  page("/categories/:id", (ctx) => CategoryView.render(ctx.params.id));
  page("/my-services", (ctx) => {
    if (!Auth.hasRole("artist")) return page.redirect("/");
    MyServicesView.render(ctx);
  });
  page("/my-commissions", () => {
    if (!Auth.isLogged()) return page.redirect("/");
    MyCommissionsView.render();
  });
  // Ritorno da Stripe Checkout: conferma il pagamento poi torna alle commissioni
  page("/payment-success", async (ctx) => {
    const params = new URLSearchParams(ctx.querystring);
    const app = document.getElementById("app");
    app.innerHTML = `<div class="text-center py-5">Conferma pagamento in corso...</div>`;
    try {
      await Api.post("/payments/confirm", {
        sessionId: params.get("session_id"),
        commissionId: params.get("cid"),
      });
      alert("Pagamento completato!");
    } catch (err) {
      alert("Errore nella conferma del pagamento");
    }
    page.redirect("/my-commissions");
  });

  page("/my-portfolio", () => {
    if (!Auth.hasRole("artist")) return page.redirect("/");
    MyPortfolioView.render();
  });

  page("/favorites", () => {
    if (!Auth.hasRole("client")) return page.redirect("/");
    FavoritesView.render();
  });

  page("/profile", () => {
    if (!Auth.isLogged()) return page.redirect("/");
    ProfileView.render();
  });

  page("/my-reviews", () => {
    if (!Auth.hasRole("client")) return page.redirect("/");
    MyReviewsView.render();
  });

  page("/admin/users", () => {
    if (!Auth.hasRole("admin")) return page.redirect("/");
    AdminView.render();
  });

  page("/admin/moderation", () => {
    if (!Auth.hasRole("admin")) return page.redirect("/");
    AdminView.render();
  });

  //Errore 404
  page("*", () => {
    document.getElementById("app").innerHTML =
      "<h1>404 - Pagina non trovata</h1>";
  });

  //Avvio del router
  page();
}

init();
