
# Smart Lift — Intelligent Three-Floor Elevator Control System

An IoT-based smart elevator prototype that combines an ESP32-based control system with an interactive web dashboard for monitoring and operating a three-floor lift.

**Live Demo:** https://smart-lift-bay.vercel.app/  
**GitHub Repository:** https://github.com/vaibhavkumar-h/smart-lift

---

## Overview

Smart Lift is a hardware–software integration project designed to demonstrate how embedded systems and a web-based interface can work together to control and monitor a miniature elevator.

The project combines a physical lift prototype with a modern dashboard that presents floor information, device connectivity, door status, travel progress, and elevator operation controls in one interface.

The objective is to make elevator operation more intuitive, improve visibility into the system's state, and demonstrate how IoT concepts can be applied to elevator automation.

## Problem Statement

Traditional elevator-control concepts can be difficult to monitor and demonstrate without a dedicated interface that brings together operational controls and device status.

A prototype also needs a clear way to represent its current floor, movement state, door status, and controller connectivity. Without a unified interface, operating and observing these functions can become less convenient.

Smart Lift addresses this problem through a connected elevator prototype and an interactive web dashboard.

## Proposed Solution

Smart Lift combines an ESP32-based controller with a web-based control interface.

The dashboard provides controls for selecting floors, moving the lift, operating the door, and returning to the ground floor. It also displays device connectivity, current floor information, travel progress, and system status.

The physical prototype demonstrates the hardware-control side of the project, while the web application provides a visual and interactive way to operate and observe the system.

## Key Features

### Interactive Elevator Dashboard

- Three-floor selection: F1, F2, and F3.
- Move Up and Move Down controls.
- Open Door control.
- Ground Floor control.
- Current-floor display.
- Travel-progress indicator.
- Door and system-status indicators.
- Device connection and disconnection interface.
- ESP32 IP-address configuration field.
- Pairing PIN field in the connection interface.
- Sound toggle for dashboard feedback.
- Device information panel showing controller and network details.

### Visual Interface

- Modern dark-themed dashboard.
- Interactive controls and status indicators.
- 3D visual element integrated into the landing interface.
- Dedicated device-connection panel.
- Responsive web layout designed to bring controls and monitoring information together.

### Hardware Integration

The project is designed around an ESP32-based elevator controller and a physical three-floor lift prototype. The controller interfaces with the lift's hardware components, while the dashboard provides the user-facing control and monitoring interface.

## Hardware Components

The following components are part of the prototype design. Confirm the exact modules and quantities against your physical build before reproducing the project.

| Component | Purpose |
|---|---|
| ESP32 development board | Embedded control and Wi-Fi connectivity |
| DC motor | Provides lift movement |
| Motor driver module | Interfaces the controller with the motor |
| Servo motor | Operates the lift door mechanism |
| Ultrasonic sensor | Supports distance or obstruction detection |
| OLED display (SSD1306) | Displays local system information, if enabled in the build |
| Power supply | Powers the lift electronics and motors |
| Connecting wires and mechanical structure | Physical assembly and electrical connections |

**Note:** The exact motor-driver model, controller count, wiring, and power ratings depend on the assembled hardware. Verify these details before replicating the circuit.

## Software Technologies

- **React** — component-based user interface.
- **TypeScript** — typed application code.
- **Vite** — frontend development server and build tooling.
- **CSS** — dashboard layout and visual styling.
- **Spline integration** — 3D visual component used by the interface.
- **ESP32 firmware** — embedded control and communication with the hardware.
- **Vercel** — hosting for the web dashboard.

## System Architecture

```text
        User
         |
         v
  Smart Lift Web Dashboard
  (React + TypeScript + Vite)
         |
         | Device communication
         v
     ESP32 Controller
         |
         v
  Motor Driver and Actuators
         |
         v
   Three-Floor Lift Prototype
         |
         +---- Door mechanism
         +---- Sensor inputs
         +---- Local display*
```

\*The local display and other peripherals depend on the configured hardware build.

The dashboard and ESP32 must be able to communicate over a compatible network connection for live device control. Hosting the frontend on Vercel does not, by itself, provide remote access to an ESP32 on a private Wi-Fi network.

## How It Works

1. **Connect the controller:** The dashboard provides an ESP32 connection panel for entering the device address and pairing information.
2. **View system status:** The interface presents the current floor, connection state, door status, and travel progress.
3. **Choose a floor:** The user selects one of the three floor controls.
4. **Send an operation:** The dashboard provides movement, door, and ground-floor controls.
5. **Operate the prototype:** The ESP32 firmware handles the hardware-side operation according to its implemented control logic.
6. **Observe the interface:** The dashboard presents available device and system information.

Actual movement, sensor feedback, and status synchronization depend on the deployed firmware, network connection, and hardware configuration.

## Getting Started

### Prerequisites

- Node.js and npm.
- Git.
- Visual Studio Code or another code editor.
- An ESP32 development environment if working with the embedded firmware.
- The hardware and network configuration required for physical operation.

### 1. Clone the repository

```bash
git clone https://github.com/vaibhavkumar-h/smart-lift.git
cd smart-lift
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

### 4. Create a production build

```bash
npm run build
```

### 5. Preview the production build

```bash
npm run preview
```

## ESP32 Configuration

The frontend currently contains an ESP32 API address configuration in `src/App.tsx`.

Before using the dashboard with your own hardware:

1. Identify the ESP32's current IP address.
2. Confirm that the computer or browser can reach the device.
3. Check the API endpoints and request formats expected by the firmware.
4. Verify that the dashboard and firmware use compatible communication settings.
5. Never expose Wi-Fi passwords, pairing PINs, private tokens, or other credentials in a public repository.

An IP address assigned by a phone hotspot or router may change after reconnection. A reliable remote-access solution requires additional network configuration and secure communication.

## Project Scope and Limitations

- The web dashboard is deployed and available through the live demo link.
- The repository contains the frontend source code for the dashboard.
- Physical operation depends on the compatible ESP32 firmware and assembled hardware.
- A public website does not automatically make a locally connected ESP32 accessible over the internet.
- Hardware safety, sensor behavior, and emergency-stop behavior must be validated on the actual prototype.
- This repository should not be treated as a certified or production-ready passenger-elevator controller.

## Future Scope

- Reliable device addressing and reconnection handling.
- Secure remote communication between the dashboard and ESP32.
- Live telemetry and clearer connection diagnostics.
- Improved sensor-based obstruction detection and fault reporting.
- Detailed floor-arrival and door-state feedback.
- Event history and operation logs.
- Expanded testing of hardware safety and recovery behavior.
- Further improvements to accessibility and mobile usability.

## Applications

- Embedded-systems and IoT education.
- Elevator automation demonstrations.
- Hardware–software integration projects.
- Interactive monitoring and control interfaces.
- Prototyping and experimentation with connected devices.

## Project Links

- **Live Dashboard:** https://smart-lift-bay.vercel.app/
- **Source Code:** https://github.com/vaibhavkumar-h/smart-lift

## Author

**Vaibhav Kumar**  
BE — Computer Science and Engineering

GitHub: https://github.com/vaibhavkumar-h

---

*Smart Lift is an educational and prototyping project. It is not intended to control a passenger-carrying elevator or replace certified elevator safety systems.*
