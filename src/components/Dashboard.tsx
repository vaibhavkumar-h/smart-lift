import { useState } from "react";
import "./Dashboard.css";

function Dashboard() {
  const [esp32Ip, setEsp32Ip] = useState("");
  const [pin, setPin] = useState("");
  const [connected, setConnected] = useState(false);

  const handleConnect = () => {
    if (!esp32Ip.trim() || !pin.trim()) {
      alert("Please enter ESP32 IP address and pairing PIN.");
      return;
    }

    setConnected(true);
  };

  const handleDisconnect = () => {
    setConnected(false);
  };

  return (
    <section className="dashboard">
      <div className="dashboard-header">
        <div>
          <p className="dashboard-label">SMART LIFT SYSTEM</p>
          <h2>Device Dashboard</h2>
          <p className="dashboard-description">
            Connect and manage your Smart Lift controller.
          </p>
        </div>

        <div className={`device-status ${connected ? "online" : "offline"}`}>
          <span className="status-dot"></span>
          {connected ? "Connected" : "Disconnected"}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card connection-card">
          <h3>ESP32 Connection</h3>

          <label htmlFor="esp32-ip">ESP32 IP Address</label>
          <input
            id="esp32-ip"
            type="text"
            placeholder="192.168.1.100"
            value={esp32Ip}
            onChange={(event) => setEsp32Ip(event.target.value)}
          />

          <label htmlFor="pairing-pin">Pairing PIN</label>
          <input
            id="pairing-pin"
            type="password"
            placeholder="Enter pairing PIN"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
          />

          {!connected ? (
            <button className="connect-button" onClick={handleConnect}>
              Connect Device
            </button>
          ) : (
            <button className="disconnect-button" onClick={handleDisconnect}>
              Disconnect Device
            </button>
          )}
        </div>

        <div className="dashboard-card">
          <h3>Device Information</h3>

          <div className="info-row">
            <span>Device</span>
            <strong>Smart Lift ESP32</strong>
          </div>

          <div className="info-row">
            <span>Firmware</span>
            <strong>v1.0.0</strong>
          </div>

          <div className="info-row">
            <span>Network</span>
            <strong>{connected ? esp32Ip : "Not connected"}</strong>
          </div>

          <div className="info-row">
            <span>Controller</span>
            <strong>{connected ? "Ready" : "Offline"}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;