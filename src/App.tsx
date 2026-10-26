import { useEffect, useRef, useState } from "react";
import { SplineScene } from "./components/ui/spline-scene";
import "./App.css";
import HeroOdyssey from "./components/HeroOdyssey";
import Dashboard from "./components/Dashboard";

const ESP32_API = "http://10.240.195.168";

type Activity = {
  id: number;
  message: string;
  time: string;
};

function App() {
  const [showHero, setShowHero] = useState(true);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [targetFloor, setTargetFloor] = useState(1);

  const [moving, setMoving] = useState(false);
  const [doorState, setDoorState] = useState<
    "CLOSED" | "OPENING" | "OPEN" | "CLOSING"
  >("CLOSED");

  const [emergency, setEmergency] = useState(false);
  const [powerAvailable, setPowerAvailable] = useState(true);
  const [wifiConnected, setWifiConnected] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);
  const [apiMessage, setApiMessage] = useState("API not connected");

  const [progress, setProgress] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 1,
      message: "System initialized",
      time: new Date().toLocaleTimeString(),
    },
  ]);

  const [mousePosition, setMousePosition] = useState({
    x: -300,
    y: -300,
  });

  const [smoothMouse, setSmoothMouse] = useState({
    x: -300,
    y: -300,
  });

  const activityId = useRef(2);
  const audioContext = useRef<AudioContext | null>(null);

  const apiRequest = async (path: string, options?: RequestInit) => {
    const response = await fetch(`${ESP32_API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`ESP32 returned ${response.status}`);
    }

    return response.json();
  };

  const connectToEsp32 = async () => {
    try {
      setApiMessage("Connecting...");
      const data = await apiRequest("/connect", {
        method: "POST",
        body: JSON.stringify({ pin: "1234" }),
      });

      if (data.success) {
        setApiConnected(true);
        setWifiConnected(true);
        setApiMessage("ESP32 connected");
        addActivity("ESP32 API connected");
        await syncEsp32Status();
      } else {
        setApiConnected(false);
        setApiMessage(data.message || "Connection failed");
      }
    } catch (error) {
      setApiConnected(false);
      setApiMessage("Cannot reach ESP32");
      addActivity("ESP32 API connection failed");
      console.error(error);
    }
  };

  const syncEsp32Status = async () => {
    try {
      const data = await apiRequest("/status");
      const nextCurrentFloor = Number(data.currentFloor) || 1;
      const nextTargetFloor = Number(data.targetFloor) || nextCurrentFloor;

      setCurrentFloor(nextCurrentFloor);
      setTargetFloor(nextTargetFloor);
      setMoving(nextCurrentFloor !== nextTargetFloor);
      setProgress(nextCurrentFloor === nextTargetFloor ? 100 : 50);

      setWifiConnected(Boolean(data.wifiConnected));
      setApiConnected(Boolean(data.deviceConnected));
      setPowerAvailable(Boolean(data.powerAvailable));
      setEmergency(Boolean(data.emergency));
      setDoorState(data.doorState || "CLOSED");
      setApiMessage("Status synced");
    } catch (error) {
      setApiConnected(false);
      setApiMessage("Status unavailable");
      console.error(error);
    }
  };

  const moveLiftUsingApi = async (floor: number) => {
    try {
      setTargetFloor(floor);
      setMoving(true);
      setProgress(0);
      setApiMessage(`Moving to floor ${floor}...`);

      const data = await apiRequest("/move", {
        method: "POST",
        body: JSON.stringify({ floor }),
      });

      if (!data.success) {
        throw new Error(data.message || "Move failed");
      }

      setTargetFloor(Number(data.targetFloor) || floor);
      setApiConnected(true);
      setApiMessage(`Lift moving to floor ${floor}`);
      addActivity(`ESP32 move command sent to floor ${floor}`);

      // The real current floor will update through /status
      await syncEsp32Status();
    } catch (error) {
      setMoving(false);
      setApiMessage("Move API failed");
      addActivity("ESP32 move request failed");
      console.error(error);
    }
  };

  const addActivity = (message: string) => {
    setActivities((previous) => [
      {
        id: activityId.current++,
        message,
        time: new Date().toLocaleTimeString(),
      },
      ...previous,
    ].slice(0, 6));
  };

  const playSound = (
    frequency = 650,
    duration = 0.12,
    type: OscillatorType = "sine"
  ) => {
    if (!soundEnabled) return;

    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContext.current) {
      audioContext.current = new AudioContextClass();
    }

    const context = audioContext.current;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.12,
      context.currentTime + 0.02
    );
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({
        x: event.clientX,
        y: event.clientY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    let animationFrame: number;

    const animateSpotlight = () => {
      setSmoothMouse((previous) => ({
        x: previous.x + (mousePosition.x - previous.x) * 0.12,
        y: previous.y + (mousePosition.y - previous.y) * 0.12,
      }));

      animationFrame = requestAnimationFrame(animateSpotlight);
    };

    animationFrame = requestAnimationFrame(animateSpotlight);

    return () => cancelAnimationFrame(animationFrame);
  }, [mousePosition]);

  useEffect(() => {
    void syncEsp32Status();

    const statusTimer = window.setInterval(() => {
      void syncEsp32Status();
    }, 700);

    return () => window.clearInterval(statusTimer);
  }, []);

  useEffect(() => {
    // When the real ESP32 API is connected, the ESP32 is the source of truth.
    if (
      apiConnected ||
      targetFloor === currentFloor ||
      emergency ||
      !powerAvailable ||
      moving
    ) {
      return;
    }

    setMoving(true);
    setProgress(0);
    setDoorState("CLOSED");

    if (apiConnected) {
      return;
    }

    addActivity(`Lift moving from floor ${currentFloor} to floor ${targetFloor}`);
    playSound(420, 0.15, "triangle");

    const startedAt = Date.now();
    const duration = 2200;

    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const percentage = Math.min((elapsed / duration) * 100, 100);

      setProgress(percentage);

      if (percentage >= 100) {
        window.clearInterval(progressTimer);
      }
    }, 40);

    const movementTimer = window.setTimeout(() => {
      setCurrentFloor(targetFloor);
      setMoving(false);
      setProgress(100);

      addActivity(`Arrived at floor ${targetFloor}`);
      playSound(880, 0.18, "sine");
    }, duration);

    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(movementTimer);
    };
  }, [
    targetFloor,
    currentFloor,
    emergency,
    powerAvailable,
    moving,
  ]);

  const selectFloor = (floor: number) => {
    if (
      emergency ||
      moving ||
      doorState !== "CLOSED" ||
      !powerAvailable ||
      floor === currentFloor
    ) {
      return;
    }

    setTargetFloor(floor);
    addActivity(`Floor ${floor} selected`);

    if (apiConnected) {
      setMoving(true);
      setProgress(0);
      void moveLiftUsingApi(floor);
    }
  };

  const moveUp = () => {
    if (
      !emergency &&
      !moving &&
      doorState === "CLOSED" &&
      powerAvailable &&
      currentFloor < 3
    ) {
      setTargetFloor(currentFloor + 1);
      if (apiConnected) {
        setMoving(true);
        setProgress(0);
        void moveLiftUsingApi(currentFloor + 1);
      }
    }
  };

  const moveDown = () => {
    if (
      !emergency &&
      !moving &&
      doorState === "CLOSED" &&
      powerAvailable &&
      currentFloor > 1
    ) {
      setTargetFloor(currentFloor - 1);
      if (apiConnected) {
        setMoving(true);
        setProgress(0);
        void moveLiftUsingApi(currentFloor - 1);
      }
    }
  };

  const toggleDoor = async () => {
    if (emergency || moving) return;

    const isOpening = doorState === "CLOSED";
    const nextDoorState = isOpening ? "OPEN" : "CLOSED";

    try {
      if (apiConnected) {
        const data = await apiRequest("/door", {
          method: "POST",
          body: JSON.stringify({ command: nextDoorState }),
        });

        if (!data.success) {
          throw new Error(data.message || "Door command failed");
        }
      }

      setDoorState(isOpening ? "OPENING" : "CLOSING");
      addActivity(isOpening ? "Door opening" : "Door closing");
      playSound(isOpening ? 560 : 460, 0.1);

      window.setTimeout(() => {
        setDoorState(nextDoorState);
        addActivity(isOpening ? "Door opened" : "Door closed");
      }, 650);

      setApiMessage(isOpening ? "Opening elevator door..." : "Closing elevator door...");
    } catch (error) {
      setApiMessage("Door API failed");
      addActivity("ESP32 door request failed");
      console.error(error);
    }
  };

  const togglePower = () => {
    const nextValue = !powerAvailable;

    setPowerAvailable(nextValue);

    if (!nextValue) {
      setMoving(false);
      setTargetFloor(currentFloor);
      setProgress(0);
      addActivity("Power shortage detected");
      playSound(180, 0.4, "sawtooth");
    } else {
      addActivity("Power restored");
      playSound(720, 0.15);
    }
  };

  const toggleWifi = () => {
    const nextValue = !wifiConnected;

    setWifiConnected(nextValue);
    addActivity(nextValue ? "Wi-Fi connected" : "Wi-Fi disconnected");
    playSound(nextValue ? 760 : 260, 0.15);
  };

  const toggleEmergency = async () => {
    const nextValue = !emergency;

    try {
      if (apiConnected) {
        const endpoint = nextValue ? "/emergency" : "/emergency/reset";

        const data = await apiRequest(endpoint, {
          method: "POST",
        });

        if (!data.success) {
          throw new Error(data.message || "Emergency command failed");
        }
      }

      setEmergency(nextValue);
      setMoving(false);
      setDoorState("CLOSED");
      setTargetFloor(currentFloor);
      setProgress(0);

      if (nextValue) {
        addActivity("Emergency stop activated");
        playSound(150, 0.6, "square");
        setApiMessage("Emergency stop activated");
      } else {
        addActivity("Emergency system reset");
        playSound(680, 0.15);
        setApiMessage("Emergency system reset");
      }
    } catch (error) {
      setApiMessage("Emergency API failed");
      addActivity("ESP32 emergency request failed");
      console.error(error);
    }
  };

  const doorLabel = {
    CLOSED: "CLOSED",
    OPENING: "OPENING",
    OPEN: "OPEN",
    CLOSING: "CLOSING",
  }[doorState];

  const systemStatus = emergency
    ? "STOPPED"
    : !powerAvailable
      ? "POWER OFF"
      : moving
        ? "MOVING"
        : "ONLINE";

  const systemStatusClass = emergency || !powerAvailable
    ? "status-danger"
    : moving
      ? "status-warning"
      : "status-good";

  const controlsDisabled =
    emergency || moving || !powerAvailable;

  return showHero ? (
    <HeroOdyssey onStart={() => setShowHero(false)} />
  ) : (
    <>
      <div
        className="cursor-spotlight"
        style={{
          transform: `translate3d(${smoothMouse.x - 210}px, ${
            smoothMouse.y - 210
          }px, 0)`,
        }}
      />

      <main className="page">
        <Dashboard />

        <div className="hero-card card">
          <div className="hero-content">
            <section className="lift-panel">
              <div className="lift-heading">
                <p className="eyebrow">SMART ELEVATOR SYSTEM</p>

                <h1>
                  Lift
                  <span>Control</span>
                </h1>

                <p className="description">
                  Intelligent three-floor elevator monitoring
                  and operational control system.
                </p>
              </div>

              <div className="status-display">
                <div className="floor-display">
                  <span className="status-label">CURRENT FLOOR</span>

                  <strong>{moving ? "--" : `F${currentFloor}`}</strong>

                  <small>
                    {moving ? `GOING TO F${targetFloor}` : "FLOOR"}
                  </small>
                </div>

                <div className="status-list">
                  <div className="status-row">
                    <span>POWER</span>

                    <button
                      className={`status-toggle ${
                        powerAvailable
                          ? "status-good"
                          : "status-danger"
                      }`}
                      onClick={togglePower}
                    >
                      {powerAvailable ? "AVAILABLE" : "SHORTAGE"}
                    </button>
                  </div>

                  <div className="status-row">
                    <span>WI-FI</span>

                    <button
                      className={`status-toggle ${
                        wifiConnected
                          ? "status-good"
                          : "status-warning"
                      }`}
                      onClick={toggleWifi}
                    >
                      {wifiConnected ? "CONNECTED" : "DISCONNECTED"}
                    </button>
                  </div>

                  <div className="status-row">
                    <span>DOOR</span>
                    <b>{doorLabel}</b>
                  </div>

                  <div className="status-row">
                    <span>SYSTEM</span>
                    <b className={systemStatusClass}>{systemStatus}</b>
                  </div>
                </div>
              </div>

              {(moving || progress > 0) && (
                <div className="movement-progress">
                  <div className="progress-top">
                    <span>TRAVEL PROGRESS</span>
                    <b>{Math.round(progress)}%</b>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="control-section">
                <p className="control-title">SELECT FLOOR</p>

                <div className="floor-grid">
                  {[1, 2, 3].map((floor) => (
                    <button
                      key={floor}
                      className={`floor-button ${
                        currentFloor === floor && !moving
                          ? "active-floor"
                          : ""
                      }`}
                      onClick={() => selectFloor(floor)}
                      disabled={
                        controlsDisabled ||
                        doorState !== "CLOSED"
                      }
                    >
                      F{floor}
                    </button>
                  ))}
                </div>
              </div>

              <div className="control-section">
                <p className="control-title">OPERATIONS</p>

                <div className="operation-grid">
                  <button
                    className="operation-button"
                    onClick={moveUp}
                    disabled={
                      controlsDisabled ||
                      doorState !== "CLOSED" ||
                      currentFloor === 3
                    }
                  >
                    <span className="operation-icon">↑</span>
                    Move Up
                  </button>

                  <button
                    className="operation-button"
                    onClick={moveDown}
                    disabled={
                      controlsDisabled ||
                      doorState !== "CLOSED" ||
                      currentFloor === 1
                    }
                  >
                    <span className="operation-icon">↓</span>
                    Move Down
                  </button>

                  <button
                    className="operation-button"
                    onClick={toggleDoor}
                    disabled={emergency || moving}
                  >
                    <span className="operation-icon">
                      {doorState === "OPEN" ? "⇤" : "⇥"}
                    </span>

                    {doorState === "OPEN"
                      ? "Close Door"
                      : doorState === "OPENING"
                        ? "Opening..."
                        : doorState === "CLOSING"
                          ? "Closing..."
                          : "Open Door"}
                  </button>

                  <button
                    className="operation-button"
                    onClick={() => selectFloor(1)}
                    disabled={
                      controlsDisabled ||
                      doorState !== "CLOSED" ||
                      currentFloor === 1
                    }
                  >
                    <span className="operation-icon">⌂</span>
                    Ground Floor
                  </button>
                </div>
              </div>

              <div className="controller-footer">
                <div
                  className={`live-message ${
                    emergency || !powerAvailable
                      ? "message-danger"
                      : moving
                        ? "message-warning"
                        : "message-normal"
                  }`}
                >
                  <span className="live-dot" />

                  {emergency
                    ? "Emergency stop activated"
                    : !powerAvailable
                      ? "Power shortage detected"
                      : !wifiConnected
                        ? "Wi-Fi connection lost"
                        : moving
                          ? `Lift moving to floor ${targetFloor}`
                          : "System online"}
                </div>

                <button
                  className="sound-button"
                  onClick={connectToEsp32}
                >
                  {apiConnected ? "✓ API Connected" : "Connect API"}
                </button>

                <span className="api-message">{apiMessage}</span>

                <button
                  className={`sound-button ${
                    soundEnabled ? "sound-active" : ""
                  }`}
                  onClick={() => setSoundEnabled((value) => !value)}
                >
                  {soundEnabled ? "🔊 Sound On" : "🔇 Sound Off"}
                </button>
              </div>

              <div className="activity-panel">
                <div className="activity-header">
                  <p className="control-title">ACTIVITY LOG</p>
                  <span>LIVE</span>
                </div>

                <div className="activity-list">
                  {activities.map((activity) => (
                    <div className="activity-item" key={activity.id}>
                      <span className="activity-dot" />
                      <span>{activity.message}</span>
                      <time>{activity.time}</time>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className={`emergency-button ${
                  emergency ? "emergency-active" : ""
                }`}
                onClick={toggleEmergency}
              >
                {emergency ? "RESET SYSTEM" : "EMERGENCY STOP"}
              </button>
            </section>

            <section className="hero-scene">
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="spline-canvas"
              />
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

export default App;