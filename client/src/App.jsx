import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import AppRoutes from "./AppRoutes/AppRoutes";
import { AuthProvider } from "@/context/AuthContext";
import ErrorBoundary from "@/Components/General/ErrorBoundary";
import { GOOGLE_CLIENT_ID, GOOGLE_ENABLED } from "@/lib/googleAuth";

const App = () => {
  const app = (
    <AuthProvider>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </AuthProvider>
  );

  // Only mount the Google provider (which loads the GSI script) when a client
  // ID is configured — otherwise the library crashes the app once it loads.
  return GOOGLE_ENABLED ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{app}</GoogleOAuthProvider>
  ) : (
    app
  );
};

export default App;
