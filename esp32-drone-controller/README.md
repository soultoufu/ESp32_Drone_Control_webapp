# 🛸 ESP32 Drone Controller

A powerful web-based drone flight control system that combines visual programming with real-world execution. Build complex flight paths using Blockly, simulate them in a high-fidelity 3D environment, and deploy them directly to your ESP32-powered drone! 🚀

---

## ✨ Key Features

*   **🧱 Visual Programming**: Drag-and-drop Blockly interface to design flight sequences with ease.
*   **🎮 3D Simulator**: Test your programs in a physically-aware 3D simulator featuring realistic pitch, roll, and yaw tilt dynamics.
*   **🐍 MicroPython Generation**: Automatically translates blocks into clean MicroPython code ready for flight.
*   **⚡ Real-time Telemetry**: Monitor position, heading, and altitude within the simulation environment.
*   **📟 ESP32 Ready**: Designed to bridge the gap between web-based logic and embedded hardware execution.

---

## 🛠️ Tech Stack

*   **⚛️ React 19**: Modern frontend architecture for a snappy, responsive UI.
*   **🟦 TypeScript**: Type-safe development for robust drone physics and logic.
*   **📂 Blockly**: Industry-standard visual programming library.
*   **🧊 Three.js & React Three Fiber**: Immersive 3D simulation and visualization.
*   **⚡ Vite**: Lightning-fast build tool and development server.
*   **🎨 Vanilla CSS**: Custom, high-performance styling for a premium glassmorphic look.

---

## 🚀 Getting Started

Follow these steps to get your drone control station up and running locally:

### 📋 Prerequisites

*   **Node.js** (v18 or higher recommended)
*   **npm** or **yarn**

### ⚙️ Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/soultoufu/ESp32_Drone_Control_webapp.git
    cd esp32-drone-controller
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

### 🏃 Running Locally

1.  **Start the development server**:
    ```bash
    npm run dev
    ```
2.  **Open your browser**: Navigate to `http://localhost:5173` (or the port shown in your terminal).

---

## 🚁 Project Structure

*   `/src/components/Blockly`: Blockly workspace configuration and code generators.
*   `/src/components/Simulator`: 3D drone model, physics engine hooks, and rendering logic.
*   `/src/types`: TypeScript definitions for simulation commands and drone state.
*   `/src/SimulatorPage.tsx`: The main orchestration page for flight simulation.

---

## 🤝 Contributing

Contributions to improve the physics engine, add more blocks, or enhance the hardware integration are welcome! Feel free to open issues or submit pull requests.

Happy Flying! 🌤️🛸
