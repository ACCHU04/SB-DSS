// Runtime config for frontend deployment.
// Update apiBaseUrl when frontend and backend are hosted separately.
// If running locally, keep the relative `/api` path so the local server handles requests.
// When hosted (Firebase hosting -> backend on Render), use the Render backend URL.
(function () {
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  const renderApi = 'https://sb-dss.onrender.com/api';
  window.SB_DSS_CONFIG = {
    apiBaseUrl: isLocal ? '/api' : renderApi
  };
})();
