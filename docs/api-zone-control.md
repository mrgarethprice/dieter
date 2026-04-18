# Daikin Airbase API: Zone Control

Research into what the BRP15B61 Airbase local API supports for zoning, and what would need to be built in this app to use it.

---

## Hardware requirements

Zone control is only available when a compatible Daikin wired zone controller (e.g. BRC24Z8A) is physically installed. Without one, `en_setzone` will be `0` and the zone endpoints have no effect. Zones control airflow dampers — they do not set per-zone temperatures, just which zones are open.

---

## Discovery endpoints

Three endpoints let the app detect whether zones are supported and what they are named before offering any zone UI.

| Endpoint | Key | Meaning |
|---|---|---|
| `GET /skyfi/common/basic_info` | `en_setzone` | `1` = zone controller present and supported |
| `GET /skyfi/aircon/get_model_info` | `en_zone` | Number of configured zones (1–8, set via field settings on the indoor unit) |
| `GET /skyfi/aircon/get_model_info` | `en_common_zone` | `1` = common zone enabled; allows all zones to be off. `0` = last active zone cannot be turned off (prevents pressure damage) |
| `GET /skyfi/aircon/get_zone_setting` | `zone_name` | Semicolon-delimited zone names (percent-encoded) |
| `GET /skyfi/aircon/get_zone_setting` | `zone_onoff` | Semicolon-delimited on/off state for all 8 zone slots (`1` or `0`) |

The response format follows the standard Daikin CSV key=value pattern:

```
ret=OK,zone_name=%44%6f%77%6e%73%74%61%69%72%73%3b%4d%61%69%6e%3b%42%65%64%72%6f%6f%6d%20%32%3b...,zone_onoff=1%3b1%3b1%3b0%3b0%3b0%3b0%3b0
```

Decoded, `zone_name` is `Downstairs;Main;Bedroom 2;Bedroom 3;Zone5;Zone6;Zone7;Zone8` and `zone_onoff` is `1;1;1;0;0;0;0;0`. All 8 slots are always present regardless of `en_zone` — slots beyond the configured count will typically be named `Zone5`, `Zone6`, etc. and can be ignored.

---

## Set zones endpoint

```
GET /skyfi/aircon/set_zone_setting?zone_name=<encoded>&zone_onoff=<encoded>
```

**All 8 zone names and all 8 on/off values must be sent in every call.** Sending a partial list causes the unit to return an error. The safest approach is to read `get_zone_setting`, flip the desired zone's on/off value, and send the full set back unchanged.

Zone names use non-standard percent-hex encoding — every character must be encoded, not just special ones. On/off values use standard URI encoding with `%3b` as the semicolon separator.

---

## Scheduled zone control

A "heat to 24°C at 7am only in zone 2" schedule would require two sequential API calls when the schedule fires:

1. `set_control_info` — power on, mode heat, temp 24°C
2. `set_zone_setting` — only zone 2 active (all others off)

This means zone state is always clobbered at schedule time, which is intentional for a scheduled scenario.

---

## What exists in this app today

| Layer | Status |
|---|---|
| `daikin.py` client | No `get_zone_setting` or `set_zone_setting` methods |
| Database schema | No zone columns on the `schedules` table |
| REST API | No zone endpoints |
| Scheduler | No zone logic in `_apply()` |
| Frontend | No zone UI |

Everything is absent. Zone support would be a meaningful addition across every layer of the stack.

---

## Suggested implementation approach

1. **Startup discovery** — query `basic_info` and `get_model_info` once on boot. If `en_setzone=0`, skip all zone logic. Cache `en_zone` (zone count), `en_common_zone`, and the zone names from `get_zone_setting`.
2. **New client methods** — `get_zone_setting() -> dict` and `set_zone_setting(zone_onoff: list[int]) -> dict` in `daikin.py`.
3. **New API endpoint** — `GET /api/zones` returns zone names, count, and current on/off state. `POST /api/zones` sets active zones.
4. **Schema change** — add a `zones` column (e.g. JSON array of zone indices) to the `schedules` table.
5. **Scheduler** — after applying `set_control_info`, call `set_zone_setting` if the schedule has a zones value.
6. **Frontend** — show zone toggles only when `en_setzone=1`. In the schedule editor, show checkboxes for each named zone.
