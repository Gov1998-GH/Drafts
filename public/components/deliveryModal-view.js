import Api from "../js/api.js";
import page from "https://unpkg.com/page@1.11.6/page.mjs";

class DeliveryModal {
  static commissionId = null;
  static onDone = null; //

  static open(commissionId, onDone) {
    DeliveryModal.commissionId = commissionId;
    DeliveryModal.onDone = onDone;

    const existing = document.getElementById("delivery-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "delivery-overlay";
    overlay.className = "auth-overlay";
    overlay.innerHTML = `
      <div class="delivery-modal">
        <button class="auth-close" id="delClose" aria-label="Chiudi"><i class="bi bi-x-lg"></i></button>
        <h4 class="mb-3">Consegna lavoro</h4>

        <div class="dropzone" id="dropzone">
          <i class="bi bi-cloud-upload dropzone-icon"></i>
          <p class="mb-1">Trascina qui l'immagine</p>
          <p class="text-muted small mb-2">oppure</p>
          <button type="button" class="btn btn-outline-dark btn-sm" id="browseBtn">Cerca sul dispositivo</button>
          <input type="file" id="delFile" accept="image/*" class="d-none" />
        </div>

        <p class="small mt-2 mb-1" id="delName"></p>
        <div class="progress d-none" id="delProgressWrap">
          <div class="progress-bar" id="delProgress" role="progressbar"></div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    DeliveryModal.attachEvents();
  }

  static close() {
    document.getElementById("delivery-overlay")?.remove();
  }

  static attachEvents() {
    const overlay = document.getElementById("delivery-overlay");
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("delFile");

    //X o click sullo sfondo
    document
      .getElementById("delClose")
      ?.addEventListener("click", DeliveryModal.close);
    overlay?.addEventListener("click", (e) => {
      if (e.target.id === "delivery-overlay") DeliveryModal.close();
    });

    // Cerca sul dispositivo
    document
      .getElementById("browseBtn")
      ?.addEventListener("click", () => fileInput.click());

    // Selezione file da input
    fileInput.addEventListener("change", () => {
      if (fileInput.files[0]) DeliveryModal.handleFile(fileInput.files[0]);
    });

    // Drag & drop
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });
    dropzone.addEventListener("dragleave", () =>
      dropzone.classList.remove("dragover"),
    );
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      const file = e.dataTransfer.files[0];
      if (file) DeliveryModal.handleFile(file);
    });
  }

  static handleFile(file) {
    if (!file.type.startsWith("image/")) {
      alert("Solo immagini");
      return;
    }
    document.getElementById("delName").textContent = file.name;

    const wrap = document.getElementById("delProgressWrap");
    const bar = document.getElementById("delProgress");
    wrap.classList.remove("d-none");
    bar.style.width = "0%";

    // Upload con XMLHttpRequest per avere la barra di progresso
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.withCredentials = true;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        bar.style.width = pct + "%";
      }
    };

    xhr.onload = async () => {
      if (xhr.status === 201) {
        const { url } = JSON.parse(xhr.responseText);
        try {
          await Api.patch(`/commissions/${DeliveryModal.commissionId}/status`, {
            status: "delivered",
            deliveryImage: url,
          });
          DeliveryModal.close();
          if (DeliveryModal.onDone) DeliveryModal.onDone();
        } catch (err) {
          alert("Errore: " + (err.message || "consegna fallita"));
        }
      } else {
        alert("Errore upload immagine");
      }
    };

    xhr.onerror = () => alert("Errore di rete durante l'upload");

    const fd = new FormData();
    fd.append("image", file);
    xhr.send(fd);
  }
}

export default DeliveryModal;
