import Api from "./api.js";

class Auth {
  static user = null;

  static async checkSession() {
    try{
      const user = await Api.get('/sessions/current');
      Auth.user = user;
    } catch {
      Auth.user = null;
    }
  }

  static async login(email, password) {
    const user = await Api.post("/sessions", { email, password });
    Auth.user = user;
    return user;
  }

  static async signup(data) {
    const user = await Api.post("/users", data);
    Auth.user = user;
    return user;
  }

  static async logout() {
    await Api.delete("/sessions/current");
    Auth.user = null;
  }

  static isLogged() {
    return Auth.user != null;
  }

  static hasRole(role) {
    return Auth.user?.role === role;
  }
}

export default Auth;
