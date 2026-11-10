import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store, persistor } from "./redux/store.js";
import { PersistGate } from "redux-persist/integration/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
// Keep the service worker URL stable so every installed app checks the same script.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js", {
      updateViaCache: "none",
    })
    .then((reg) => {
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      const checkForUpdate = () => reg.update().catch(() => {});
      checkForUpdate();
      setInterval(checkForUpdate, 60 * 60 * 1000);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdate();
      });

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed") {
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        }
      });
    })
    .catch((err) => {
      console.error("Service Worker registration failed:", err);
    });

  // Load the new HTML and bundle after an updated worker takes control.
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}


const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById("root")).render(

  <GoogleOAuthProvider clientId={clientId}>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <StrictMode>
          <App />
        </StrictMode>
      </PersistGate>
    </Provider>
  </GoogleOAuthProvider>,
);
