import React from "react";

export default function Logo({ className }) {
  return (
    <img
      src="/logo.png" // Đặt file logo của bạn trong public/logo.png
      alt="Logo"
      className={className}
    />
  );
}
