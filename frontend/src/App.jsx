import React, { useState, useEffect, useCallback } from "react";
import ModeDial from "./components/ModeDial";
import NeuSlider from "./components/NeuSlider";
import NeuSwitch from "./components/NeuSwitch";
import NeuPushButton from "./components/NeuPushButton";
import ActionButton from "./components/ActionButton";
import "./App.css";

const API = process.env.REACT_APP_API_URL || "";

const MODE_ICONS = {
  heat: "ri-fire-line",
  cool: "ri-snowflake-line",
  fan: "ri-windy-line",
  auto: "ri-arrow-up-down-line",
};

function api(path, opts = {}) {
  return fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    if (r.status === 204) return null;
    return r.json();
  });
}

const MOCK_SCHEDULES = [
  {
    id: 1,
    time: "05:30",
    temperature: 24,
    mode: "heat",
    action: "setpoint",
    enabled: true,
  },
  {
    id: 2,
    time: "08:30",
    temperature: null,
    mode: null,
    action: "off",
    enabled: true,
  },
  {
    id: 3,
    time: "16:00",
    temperature: 24,
    mode: "cool",
    action: "setpoint",
    enabled: true,
  },
  {
    id: 4,
    time: "23:00",
    temperature: 16,
    mode: "heat",
    action: "setpoint",
    enabled: true,
  },
];

function formatTime12(time24) {
  const [h, m] = time24.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")}${suffix}`;
}

function getNextSchedule(schedules) {
  if (!schedules.length) return null;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const upcoming = schedules
    .filter((s) => s.enabled)
    .map((s) => {
      const [h, m] = s.time.split(":").map(Number);
      return { ...s, mins: h * 60 + m };
    })
    .sort((a, b) => a.mins - b.mins);

  const next = upcoming.find((s) => s.mins > nowMins) || upcoming[0];
  return next || null;
}

function getModeIcon(mode) {
  return MODE_ICONS[mode] || "ri-fire-line";
}

// ── Home Screen ──────────────────────────────────────────────────────────────

function HomeScreen({
  status,
  setTemp,
  roomTemp,
  isOn,
  onTogglePower,
  onTempChange,
  nextSchedule,
  onOpenSchedule,
}) {
  return (
    <div className={`home screen-transition ${!isOn ? "home--off" : ""}`}>
      <button
        className={`home__next-schedule ${!isOn ? "home__next-schedule--off" : ""}`}
        onClick={onOpenSchedule}
      >
        <i className="ri-time-line" />
        {nextSchedule ? formatTime12(nextSchedule.time) : "No schedule"}
      </button>

      <div className="home__body">
        <div className="home__left">
          <div className="home__temp-display">
            <span className="home__temp-num">{setTemp ?? "—"}</span>
            <span className="home__temp-unit">°</span>
          </div>
          {roomTemp != null && (
            <div className="home__room-temp">Room {roomTemp}°</div>
          )}
        </div>

        <div className="home__right">
          <NeuSlider
            value={setTemp ?? 22}
            min={16}
            max={30}
            step={1}
            onChange={onTempChange}
            trackHeight={280}
            showButtons
            aria-label="Temperature"
          />
        </div>
      </div>

      <div className="home__footer">
        <NeuSwitch
          checked={isOn}
          onChange={onTogglePower}
          height={40}
          aria-label="Power"
        />
      </div>
    </div>
  );
}

// ── Schedule Screen ──────────────────────────────────────────────────────────

function ScheduleScreen({
  schedules,
  onDone,
  onEditItem,
  onAddItem,
  paused,
  onTogglePause,
}) {
  return (
    <div className="schedule-screen screen-transition">
      <div className="schedule-list">
        {schedules.map((s) => (
          <div
            key={s.id}
            className="schedule-item"
            onClick={() => onEditItem(s)}
          >
            <div className="schedule-item__left">
              <span className="schedule-item__icon">
                {s.action === "off" ? (
                  <i className="ri-shut-down-line" />
                ) : (
                  <i className={getModeIcon(s.mode)} />
                )}
              </span>
              <span className="schedule-item__time">
                {formatTime12(s.time)}
              </span>
            </div>
            {s.action === "setpoint" && s.temperature != null && (
              <span className="schedule-item__temp">{s.temperature}°</span>
            )}
          </div>
        ))}
        <ActionButton
          className="schedule-add"
          variant="primary"
          onClick={onAddItem}
        >
          <i className="ri-add-line" />
          Add
        </ActionButton>
      </div>

      <div className="schedule-bar">
        <div className="schedule-bar__left">
          <NeuPushButton
            checked={paused}
            onChange={onTogglePause}
            aria-label="Pause schedule"
          />
        </div>
        <ActionButton
          className="schedule-bar__done"
          variant="secondary"
          onClick={onDone}
        >
          Done
        </ActionButton>
      </div>
    </div>
  );
}

// ── Edit / Add Modal ─────────────────────────────────────────────────────────

function EditModal({ item, onSave, onCancel }) {
  const [time, setTime] = useState(item?.time || "16:00");
  const [temp, setTemp] = useState(item?.temperature ?? 22);
  const [mode, setMode] = useState(item?.mode || "cool");

  const handleSave = () => {
    onSave({
      ...(item || {}),
      time,
      temperature: temp,
      mode,
      action: "setpoint",
      enabled: true,
    });
  };

  return (
    <div className="edit-overlay">
      <div className="edit-overlay__backdrop" onClick={onCancel} />
      <div className="edit-sheet">
        <div className="edit-sheet__header">
          <div className="time-input-wrapper">
            <span className="edit-sheet__time">{formatTime12(time)}</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <span className="edit-sheet__temp">{temp}°</span>
        </div>

        <div className="edit-sheet__body">
          <ModeDial value={mode} onChange={(id) => setMode(id)} />
          <NeuSlider
            value={temp}
            min={16}
            max={30}
            step={1}
            onChange={setTemp}
            trackHeight={200}
            showButtons
            aria-label="Temperature"
          />
        </div>

        <div className="edit-sheet__footer">
          <ActionButton
            className="edit-sheet__cancel"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </ActionButton>
          <ActionButton
            className="edit-sheet__save"
            variant="primary"
            onClick={handleSave}
          >
            Done
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [status, setStatus] = useState(null);
  const [schedules, setSchedules] = useState(MOCK_SCHEDULES);
  const [screen, setScreen] = useState("home"); // "home" | "schedule"
  const [editItem, setEditItem] = useState(null); // null | schedule object | "new"
  const [paused, setPaused] = useState(false);

  const [localTemp, setLocalTemp] = useState(24);
  const [localPower, setLocalPower] = useState(true);

  const loadStatus = useCallback(async () => {
    try {
      const s = await api("/api/status");
      setStatus(s);
      if (s.set_temp != null) setLocalTemp(s.set_temp);
      if (s.power != null) setLocalPower(s.power);
    } catch {
      setStatus(null);
    }
  }, []);

  const loadSchedules = useCallback(async () => {
    try {
      const data = await api("/api/schedules");
      if (data?.length) setSchedules(data);
    } catch {
      // keep mock data
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadSchedules();
    const t = setInterval(loadStatus, 30_000);
    return () => clearInterval(t);
  }, [loadStatus, loadSchedules]);

  const togglePower = async (next) => {
    setLocalPower(next);
    try {
      await api("/api/control", {
        method: "POST",
        body: JSON.stringify({ power: next ? "1" : "0" }),
      });
      await loadStatus();
    } catch {
      // keep local state
    }
  };

  const changeTemperature = async (temperature) => {
    setLocalTemp(temperature);
    try {
      const body = localPower ? { temperature } : { power: "1", temperature };
      await api("/api/control", {
        method: "POST",
        body: JSON.stringify(body),
      });
      await loadStatus();
    } catch {
      // keep local state
    }
  };

  const saveScheduleItem = async (form) => {
    if (form.id) {
      setSchedules((prev) =>
        prev.map((s) => (s.id === form.id ? { ...s, ...form } : s)),
      );
      try {
        await api(`/api/schedules/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
        await loadSchedules();
      } catch {
        // keep local
      }
    } else {
      const newItem = { ...form, id: Date.now() };
      setSchedules((prev) => [...prev, newItem]);
      try {
        await api("/api/schedules", {
          method: "POST",
          body: JSON.stringify(form),
        });
        await loadSchedules();
      } catch {
        // keep local
      }
    }
    setEditItem(null);
  };

  const nextSchedule = getNextSchedule(schedules);
  const roomTemp = status?.indoor_temp ?? 23;
  const setTemp = status?.set_temp ?? localTemp;
  const isOn = status?.power ?? localPower;

  return (
    <div className="app">
      {screen === "home" && (
        <HomeScreen
          status={status}
          setTemp={setTemp}
          roomTemp={roomTemp}
          isOn={isOn}
          onTogglePower={togglePower}
          onTempChange={changeTemperature}
          nextSchedule={nextSchedule}
          onOpenSchedule={() => setScreen("schedule")}
        />
      )}

      {screen === "schedule" && (
        <ScheduleScreen
          schedules={schedules}
          onDone={() => setScreen("home")}
          onEditItem={(item) => setEditItem(item)}
          onAddItem={() => setEditItem("new")}
          paused={paused}
          onTogglePause={setPaused}
        />
      )}

      {editItem && (
        <EditModal
          item={editItem === "new" ? null : editItem}
          onSave={saveScheduleItem}
          onCancel={() => setEditItem(null)}
        />
      )}
    </div>
  );
}
