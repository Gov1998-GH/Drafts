import Api from "../js/api.js";
import page from "https://unpkg.com/page@1.11.6/page.mjs";

class HomeView {
  static carouselSlides = [];

  static carouselActive = 0;

  static async render() {
    const app = document.getElementById("app");

    app.innerHTML = `
<section class="hero">
  <h1>Trova il tuo artista</h1>
  <p>I migliori, recensiti dai clienti</p>
</section>


<section class="featured-carousel-section">
    <h2>Top artisti del mese</h2>
    <div class="carousel-slider" id="carouselSlider">
        <div class="carousel-list" id="carouselList"></div>
        <div class="carousel-circle" id="carouselCircle">TOP - ARTISTI - DEL - MESE</div>
        <div class="carousel-content">
            <div class="carousel-rating" id="carouselRating">⭐ -</div>
            <div class="carousel-name" id="carouselName">-</div>
            <button class="carousel-cta" id="carouselCta">Vedi profilo</button>
        </div>
        <button id="carouselPrev" class="carousel-arrow">‹</button>
        <button id="carouselNext" class="carousel-arrow">›</button>
    </div>
</section>`;

    await HomeView.loadCarousel();
  }

  // carosello
  static async loadCarousel() {
    try {
      const artists = await Api.get("/users/artists?minRating=4&maxRating=5");

      if (!artists.length) {
        document.getElementById("carouselSlider").innerHTML =
          `<p class="text-center py-5">Nessun Artista Top</p>`;
        return;
      }

      HomeView.carouselSlides = await Promise.all(
        artists.map(async (a) => {
          const portfolios = await Api.get(
            `/portfolios?artistId=${a.id}`,
          ).catch(() => []);
          return {
            artist: a,
            img:
              portfolios[0]?.image ||
              "https://placehold.co/600x800?text=No+image",
          };
        }),
      );

      HomeView.carouselActive = Math.min(1, HomeView.carouselSlides.length - 1);

      HomeView.renderCarouselItems();
      HomeView.attachCarouselEvents();
      HomeView.applyCircleText();
      HomeView.runCarousel();
    } catch (err) {
      console.error("Carousel error", err);
    }
  }

  static renderCarouselItems() {
    const list = document.getElementById("carouselList");
    list.innerHTML = HomeView.carouselSlides
      .map(
        (s, i) => `
          <div class="carousel-item ${i === HomeView.carouselActive ? "active" : ""}" data-idx="${i}">
            <img src="${s.img}" alt="${s.artist.displayName}">
          </div>
        `,
      )
      .join("");
  }

  static attachCarouselEvents() {
    document.getElementById("carouselNext").onclick = () => {
      if (HomeView.carouselActive < HomeView.carouselSlides.length - 1) {
        HomeView.carouselActive++;
        HomeView.runCarousel();
      }
    };

    document.getElementById("carouselPrev").onclick = () => {
      if (HomeView.carouselActive > 0) {
        HomeView.carouselActive--;
        HomeView.runCarousel();
      }
    };

    document.getElementById("carouselCta").onclick = () => {
      const a = HomeView.carouselSlides[HomeView.carouselActive].artist;
      page(`/artists/${a.id}`);
    };

    document.querySelectorAll(".carousel-item").forEach((el) => {
      el.onclick = () => {
        HomeView.carouselActive = Number(el.dataset.idx);
        HomeView.runCarousel();
      };
    });

    window.addEventListener("resize", () => HomeView.runCarousel());
  }

  static runCarousel() {
    const items = document.querySelectorAll(".carousel-item");
    if (!items.length) return;

    const list = document.getElementById("carouselList");
    const prev = document.getElementById("carouselPrev");
    const next = document.getElementById("carouselNext");

    prev.style.display = HomeView.carouselActive === 0 ? "none" : "flex";
    next.style.display =
      HomeView.carouselActive === HomeView.carouselSlides.length - 1
        ? "none"
        : "flex";

    items.forEach((el, i) =>
      el.classList.toggle("active", i === HomeView.carouselActive),
    );

    // Centra l'item attivo usando la sua posizione reale
    const activeEl = items[HomeView.carouselActive];
    const sliderWidth = list.parentElement.offsetWidth;
    const itemCenter = activeEl.offsetLeft + activeEl.offsetWidth / 2;
    const offset = sliderWidth / 2 - itemCenter;
    list.style.transform = `translateX(${offset}px)`;

    const s = HomeView.carouselSlides[HomeView.carouselActive];
    document.getElementById("carouselRating").textContent =
      `⭐ ${s.artist.avgRating || "-"} (${s.artist.reviewCount})`;
    document.getElementById("carouselName").textContent = s.artist.displayName;
  }

  static applyCircleText() {
    const circle = document.getElementById("carouselCircle");
    if (!circle) return;

    const text = circle.textContent;
    const chars = text.split("");
    circle.textContent = "";

    chars.forEach((c, i) => {
      const span = document.createElement("span");
      span.textContent = c;
      span.style.setProperty(
        "--rotate",
        `${(360 / chars.length) * (i + 1)}deg`,
      );
      circle.appendChild(span);
    });
  }
}

export default HomeView;
