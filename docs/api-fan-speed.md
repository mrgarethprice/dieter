# Daikin Airbase API: Fan Speed Control

Research into what the BRP15B61 Airbase local API supports for fan speed, and what would need to be built in this app to use it.

---

## Wire parameter

Fan speed is controlled via the `f_rate` parameter on `/skyfi/aircon/set_control_info` and is returned in `/skyfi/aircon/get_control_info`.

`f_rate` is already read by `daikin.py` and exposed in `status()` as the `fan` key. The `set_control_info` method also accepts an optional `fan` argument that maps directly to `f_rate`. Neither is surfaced through the REST API, scheduled events, or the UI.

---

## Available values

Fan speed values differ between ducted (Airbase) units and standard split-system units, and the number of steps a specific unit supports is hardware-dependent.

### Airbase ducted units

| `f_rate` value | Speed |
|---|---|
| `1` | Low |
| `3` | Mid |
| `5` | High |
| `A` | Auto |

### Standard Daikin split systems (for reference)

| `f_rate` value | Speed |
|---|---|
| `A` | Auto |
| `B` | Silence |
| `3` | Level 1 (lowest) |
| `4` | Level 2 |
| `5` | Level 3 |
| `6` | Level 4 |
| `7` | Level 5 (highest) |

**Values are not consistent across unit types.** A split system's `f_rate=3` is "Level 1 (lowest)" while an Airbase ducted unit's `f_rate=3` is "Mid". Do not hardcode a fixed set of values — use discovery (below).

---

## Discovery

`GET /skyfi/aircon/get_model_info` returns two relevant fields:

| Key | Meaning |
|---|---|
| `en_frate` | Number of discrete fan speed steps the unit supports (typically `2` or `3` for Airbase ducted units) |
| `en_frate_auto` | `1` = auto fan speed is supported |

A unit with `en_frate=2` only has Low and High — no Mid. A unit with `en_frate=3` has Low, Mid, and High. Auto availability is reported separately.

The practical approach is to query `get_model_info` at startup, then build the available fan speed list dynamically: if `en_frate=2` offer `["low", "high"]` plus `"auto"` if `en_frate_auto=1`; if `en_frate=3` also include `"mid"`.

---

## What exists in this app today

| Layer | Status |
|---|---|
| `daikin.py` client | `set_control_info(fan=...)` accepted, maps to `f_rate`. `status()` returns current `fan` value. |
| `GET /api/status` | Returns `fan` field (current `f_rate` value, e.g. `"A"`) |
| `POST /api/control` | `ControlIn` model has no `fan` field — not accepted |
| Database schema | No `fan` column on `schedules` table |
| Scheduler `_apply()` | Never passes `fan` to `set_control_info` |
| Frontend | No fan speed control |

The client layer already has the hardest part implemented. The gap is entirely in the REST API surface, persistence, scheduler, and UI.

---

## What would need to be built

1. **Discovery at startup** — query `get_model_info` once. Cache available fan speed options and expose them via a new `GET /api/capabilities` endpoint (alongside any zone discovery).
2. **REST API** — add `fan` to `ControlIn` with validation against discovered values. Validate at the API layer or accept raw `f_rate` strings.
3. **Schema change** — add a nullable `fan` column to the `schedules` table.
4. **`ScheduleIn` model** — add optional `fan` field.
5. **Scheduler** — pass `fan` to `set_control_info` in `_apply()` when present.
6. **Frontend** — add a fan speed selector to the manual control panel and the schedule editor. Populate options from `/api/capabilities`.

Fan speed is the lighter of the two feature additions (zones vs fan speed) — the client already does the work, and there are no complex encoding quirks or full-list-required constraints to handle.
