import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

// Register service worker for offline support
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('App is ready for offline use.', registration.scope);
  },
  onUpdate: () => {
    // Simple reload when an update is available
    if (window.confirm('New version available! Reload to update?')) {
      window.location.reload();
    }
  },
});

// Create root and render the app
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
