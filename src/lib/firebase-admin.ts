import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let app: App;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccount) {
    try {
      const parsed = JSON.parse(serviceAccount);
      app = initializeApp({
        credential: cert(parsed),
        projectId: projectId || parsed.project_id,
      });
    } catch {
      // FIREBASE_SERVICE_ACCOUNT is not valid JSON — fall through
      app = initializeApp({ projectId });
    }
  } else {
    // Falls back to GOOGLE_APPLICATION_CREDENTIALS env var
    app = initializeApp({ projectId });
  }

  return app;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
