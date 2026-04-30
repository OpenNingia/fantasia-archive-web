import { register } from 'register-service-worker';
import { Notify } from 'quasar';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1h

function notifyNewVersion () {
  Notify.create({
    type: 'info',
    message: 'A new version is available.',
    timeout: 0,
    position: 'bottom-right',
    actions: [
      {
        label: 'Reload',
        color: 'primary',
        noDismiss: true,
        handler: () => { window.location.reload(); },
      },
    ],
  });
}

register(process.env.SERVICE_WORKER_FILE, {
  // updateViaCache:'none' tells the browser to bypass HTTP cache when fetching
  // sw.js — without it, an aggressive Cache-Control on sw.js can pin the old
  // worker for up to 24h (or longer, in violation of spec).
  registrationOptions: { updateViaCache: 'none' },

  ready (registration) {
    // Poll for updates while the tab is open so users on long-lived sessions
    // still see "Nuova versione disponibile" without manually reloading.
    setInterval(() => { void registration.update(); }, UPDATE_CHECK_INTERVAL_MS);
  },

  updated () {
    notifyNewVersion();
  },
});
