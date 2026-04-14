import React, { useState, useCallback } from 'react';
import './NeuSwitch.css';

export default function NeuSwitch({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  height = 40,
  className = '',
  'aria-label': ariaLabel,
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
      className={`neu-switch ${checked ? 'neu-switch--on' : ''} ${className}`.trim()}
      style={{ '--nsw-height': `${height}px` }}
      onClick={toggle}
    >
      <span className="neu-switch__track">
        <span className="neu-switch__symbol neu-switch__symbol--on" aria-hidden="true" />
        <span className="neu-switch__symbol neu-switch__symbol--off" aria-hidden="true" />
      </span>
      <span className="neu-switch__thumb" />
    </button>
  );
}
