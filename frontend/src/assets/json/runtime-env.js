(function (w) {
  w.__env = w.__env || {};
  w.__env.API_URL = "http://localhost:3000";   // placeholder overriden at runtime
  w.__env.GOOGLE_CLIENT_ID = "dev-client-id";
  w.__env.GOOGLE_CALLBACK_URL = "http://localhost:4200/auth/callback";
})(window);
