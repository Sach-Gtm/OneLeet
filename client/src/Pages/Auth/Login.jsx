import React from "react";
import GoogleLoginPopup from "../../Components/Auth/GoogleLogin";

export default function Login() {
  return (
      <div className="min-h-screen w-full flex items-center justify-center bg-transparent relative overflow-hidden">

          {/* Transparent dark blur overlay */}
          <div className="fixed inset-0 bg-transparent backdrop-blur-md"></div>


          <div className="relative z-50 
        bg-black/40 
        backdrop-blur-xl 
        border border-white/10 
        shadow-2xl 
        rounded-2xl 
        p-10 
        max-w-sm 
        w-full 
        flex flex-col 
        items-center">

              <h2 className="text-white text-2xl font-semibold mb-6 text-center">
                  Login with Google
              </h2>

              <GoogleLoginPopup />
          </div>
      </div>

  );
}
