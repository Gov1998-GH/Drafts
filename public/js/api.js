/**
 * Classe per gestire le chiamate API verso il backend
 */

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

class Api {
  static BASE_URL = "/api";

  static async request(method, path, body = null) {
    const url = `${this.BASE_URL}${path}`;

    const options = {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };

    if (body && method !== "GET") options.body = JSON.stringify(body);

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(response.status, errorData.error || "Errore");
      }
      return response.status === 204 ? null : await response.json();
    } catch (err) {
      console.error(`[API ERROR]`, err);
      throw err;
    }
  }

  // Upload file (multipart).
  static async upload(path, file) {
    const fd = new FormData();
    fd.append("image", file);
    const response = await fetch(`${this.BASE_URL}${path}`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(response.status, errorData.error || "Errore upload");
    }
    return response.json();
  }

  static get(path) {
    return this.request("GET", path);
  }
  static post(path, body) {
    return this.request("POST", path, body);
  }
  static put(path, body) {
    return this.request("PUT", path, body);
  }
  static patch(path, body) {
    return this.request("PATCH", path, body);
  }
  static delete(path) {
    return this.request("DELETE", path);
  }
}

export { ApiError };
export default Api;
