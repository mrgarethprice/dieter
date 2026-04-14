import React, { useState, useCallback } from "react";
import "./NeuPushButton.css";

/**
 * Neumorphic push-button toggle.
 *
 * Renders a circular button that toggles between raised (off) and
 * depressed (on) states.  The `children` slot lets callers supply any
 * icon; when omitted a default pause-bar icon is rendered.
 */
export default function NeuPushButton({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  size = 80,
  className = "",
  children,
  "aria-label": ariaLabel,
}) {
  const isControlled = controlledChecked !== undefined;
  const [internal, setInternal] = useState(defaultChecked);
  const checked = isControlled ? controlledChecked : internal;

  const toggle = useCallback(() => {
    const next = !checked;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }, [checked, isControlled, onChange]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`neu-push-btn ${checked ? "neu-push-btn--on" : ""} ${className}`.trim()}
      onClick={toggle}
    >
      <span className="neu-push-btn__shadow" aria-hidden="true" />
      <span className="neu-push-btn__rim" aria-hidden="true" />
      <span className="neu-push-btn__face">
        <span className="neu-push-btn__icon">
          {children ?? (
            <>
              <span className="neu-push-btn__bar" />
              <span className="neu-push-btn__bar" />
            </>
          )}
        </span>
      </span>
    </button>
  );
}
