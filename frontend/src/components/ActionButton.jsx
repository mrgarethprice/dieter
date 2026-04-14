import React from "react";
import "./ActionButton.css";

export default function ActionButton({
  variant = "secondary",
  className = "",
  children,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`action-button action-button--${variant} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
