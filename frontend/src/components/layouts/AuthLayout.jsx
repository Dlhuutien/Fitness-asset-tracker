import React from "react";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-5xl grid grid-cols-2 gap-8 items-center">
        {children}
      </div>
    </div>
  );
}
