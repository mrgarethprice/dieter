import React, { useCallback, useEffect, useRef, useState } from "react";
import "./ModeDial.css";

/** Angle in CSS orbit: 0° = 12 o'clock (top), clockwise positive. */
const SLOTS = [
  { id: "heat", label: "Heat", iconClass: "ri-fire-line", angleDeg: 0 },
  { id: "fan", label: "Fan", iconClass: "ri-windy-line", angleDeg: 72 },
  {
    id: "power",
    label: "Power",
    iconClass: "ri-shut-down-line",
    angleDeg: 144,
  },
  { id: "cool", label: "Cool", iconClass: "ri-snowflake-line", angleDeg: 216 },
  {
    id: "auto",
    label: "Auto",
    iconClass: "ri-arrow-up-down-line",
    angleDeg: 288,
  },
];

/** Pointer starts at top (0°). Rotate knob so pointer meets icon at `angleDeg`. */
function knobRotationForIcon(angleDeg) {
  return angleDeg;
}

/** Choose equivalent target so transition takes shortest arc from `current`. */
function shortestRotationTarget(current, target) {
  let delta = target - current;
  delta = ((delta + 540) % 360) - 180;
  return current + delta;
}

/**
 * Neumorphic HVAC-style mode dial. Lighting and softness are driven entirely by
 * CSS variables on `.mode-dial` (see ModeDial.css).
 */
export default function ModeDial({
  value: controlledValue,
  defaultValue = "cool",
  onChange,
  className = "",
}) {
  const initial = SLOTS.some((s) => s.id === controlledValue)
    ? controlledValue
    : SLOTS.some((s) => s.id === defaultValue)
      ? defaultValue
      : SLOTS[0].id;

  const isControlled = controlledValue !== undefined;
  const [internal, setInternal] = useState(initial);
  const value = isControlled ? controlledValue : internal;

  const selected = SLOTS.find((s) => s.id === value) || SLOTS[0];
  const [knobRotate, setKnobRotate] = useState(() =>
    knobRotationForIcon(selected.angleDeg),
  );
  const rotationRef = useRef(knobRotate);

  const select = useCallback(
    (slot) => {
      const target = knobRotationForIcon(slot.angleDeg);
      const next = shortestRotationTarget(rotationRef.current, target);
      rotationRef.current = next;
      setKnobRotate(next);

      if (!isControlled) setInternal(slot.id);
      onChange?.(slot.id, slot);
    },
    [isControlled, onChange],
  );

  useEffect(() => {
    if (!isControlled) return;
    const slot = SLOTS.find((s) => s.id === value);
    if (!slot) return;
    const target = knobRotationForIcon(slot.angleDeg);
    const next = shortestRotationTarget(rotationRef.current, target);
    rotationRef.current = next;
    setKnobRotate(next);
  }, [isControlled, value]);

  return (
    <div
      className={`mode-dial ${className}`.trim()}
      role="radiogroup"
      aria-label="Mode"
      style={{ "--md-knob-rotate": `${knobRotate}deg` }}
    >
      {SLOTS.map((slot) => (
        <button
          key={slot.id}
          type="button"
          className={`mode-dial__slot ${slot.id === value ? "mode-dial__slot--active" : ""}`}
          style={{ "--slot-angle": `${slot.angleDeg}deg` }}
          role="radio"
          aria-checked={slot.id === value}
          aria-label={slot.label}
          tabIndex={slot.id === value ? 0 : -1}
          onClick={() => select(slot)}
        >
          <i className={slot.iconClass} aria-hidden />
        </button>
      ))}

      <div className="mode-dial__knob-anchor">
        <div className="mode-dial__knob" aria-hidden />
        <div className="mode-dial__knob-pointer-layer" aria-hidden>
          <span className="mode-dial__pointer" />
        </div>
      </div>
    </div>
  );
}

export { SLOTS };
