import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import AppRoutes from "./AppRoutes/AppRoutes";
import { AuthProvider } from "@/context/AuthContext";
import ErrorBoundary from "@/Components/General/ErrorBoundary";

const App = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
