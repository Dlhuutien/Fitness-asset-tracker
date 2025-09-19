import React from "react";

export function Input(props) {
  return (
    <input
      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      {...props}
    />
  );
}
