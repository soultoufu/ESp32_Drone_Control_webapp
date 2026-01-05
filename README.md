# 🛸 ESP32 Drone Controller - Visual Programming Web App

A modern web-based visual programming interface for controlling ESP32-powered drones using Google Blockly. Design flight plans with drag-and-drop blocks, test them in a 3D simulator, and upload directly to your drone via USB.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-19.2-61DAFB)

## ✨ Features

### 🧩 Visual Block Programming
- **Google Blockly Integration**: Intuitive drag-and-drop interface for creating flight plans
- **Custom Drone Blocks**: Specialized blocks for drone operations:
  - **Basic Flight**: Takeoff, land, hover, move in all directions
  - **Advanced Maneuvers**: Flip, rotate, custom movements
  - **Control Flow**: Loops, delays, conditional logic
  - **Sensing**: Altitude, battery monitoring (blocks designed for future sensor integration)
- **Real-time Code Generation**: Instantly see your blocks converted to MicroPython

### 🎮 3D Virtual Simulator
- **Three.js-powered 3D Environment**: Test your flight plans before deploying to hardware
- **Real-time Physics Simulation**: Visualize drone movements in 3D space
- **Flight Path Visualization**: See the complete trajectory of your programmed flight
- **Safe Testing**: Validate complex maneuvers without risking your drone

### 🔌 Hardware Integration
- **WebSerial API**: Direct USB connection to ESP32 (no drivers needed on supported browsers)
- **One-Click Upload**: Deploy MicroPython code directly to your drone
- **Live Telemetry**: Real-time data streaming from your drone during flight
- **Connection Status**: Visual indicators for device connectivity

### 📊 Telemetry Dashboard
- **Live Data Stream**: Monitor your drone's status in real-time
- **Debug Console**: View logs and debugging information
- **Connection Health**: Track communication quality with your ESP32

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **ESP32-based drone** with MicroPython firmware
- **Modern browser** with WebSerial support (Chrome, Edge, Opera)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ESP32_Drone_Control_webapp.git
cd ESP32_Drone_Control_webapp

# Navigate to the app directory
cd esp32-drone-controller

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## 📖 Usage Guide

### 1️⃣ Connect Your Drone
1. Plug your ESP32 drone into your computer via USB
2. Click **"Connect ESP32 (USB)"** in the header
3. Select the correct serial port from the browser dialog
4. Wait for the green "Device Connected" status indicator

### 2️⃣ Build Your Flight Plan
1. Drag blocks from the toolbox on the left
2. Snap them together to create your program
3. Use the **Code Preview** tab to see the generated MicroPython
4. Use the **Simulator** to visualize your flight path in 3D

### 3️⃣ Test in Simulator
1. Click the **Simulator** tab in the right panel
2. Click **"Run Simulation"** to see your drone fly virtually
3. Adjust your blocks based on the simulation results
4. The 3D view shows real-time movement and flight path

### 4️⃣ Upload & Fly
1. Once satisfied with your program, click **"Upload & Run 🚀"**
2. Your code will be transferred to the ESP32
3. Monitor execution via the **Telemetry** tab
4. Watch your drone execute the flight plan!

## 🏗️ Project Structure

```
esp32-drone-controller/
├── src/
│   ├── components/
│   │   ├── Blockly/
│   │   │   ├── BlocklyComponent.tsx    # Main Blockly workspace
│   │   │   ├── customBlocks.ts         # Custom block definitions
│   │   │   ├── generator.ts            # MicroPython code generator
│   │   │   └── simGenerator.ts         # Simulator command generator
│   │   ├── Simulator/
│   │   │   ├── Scene.tsx               # 3D scene setup
│   │   │   ├── SimulatorPanel.tsx      # Simulator UI panel
│   │   │   ├── VirtualDrone.tsx        # 3D drone model
│   │   │   └── useDroneSimulator.ts    # Simulation logic hook
│   │   └── TelemetryPanel.tsx          # Live telemetry display
│   ├── types/
│   │   └── simulator.ts                # TypeScript type definitions
│   ├── utils/
│   │   └── SerialManager.ts            # WebSerial communication
│   ├── App.tsx                         # Main application component
│   ├── main.tsx                        # Entry point
│   └── index.css                       # Global styles
├── public/                              # Static assets
├── index.html                           # HTML template
└── package.json                         # Dependencies & scripts
```

## 🛠️ Technology Stack

### Frontend
- **React 19.2** - UI framework
- **TypeScript 5.9** - Type-safe development
- **Vite 7** - Fast build tool and dev server

### 3D Graphics
- **Three.js 0.182** - 3D rendering engine
- **React Three Fiber 9.5** - React renderer for Three.js
- **@react-three/drei 10.7** - Helpful Three.js utilities

### Visual Programming
- **Google Blockly 12.3** - Block-based programming library

### Hardware Communication
- **Web Serial API** - Browser-native USB serial communication

### Styling
- **Vanilla CSS** - Custom glassmorphism design system
- **CSS Grid & Flexbox** - Responsive layouts

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint code quality checks
```

### Browser Compatibility

WebSerial API requires:
- Chrome/Edge 89+
- Opera 75+
- Not supported: Firefox, Safari (use Chrome/Edge)

## 🎯 Roadmap

- [ ] Block library expansion (mapping, formation flight)
- [ ] Saved flight plan library
- [ ] Multi-drone swarm programming
- [ ] AR visualization mode
- [ ] Mobile app companion
- [ ] Block coding tutorials

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Google Blockly** team for the amazing visual programming library
- **Three.js** and **React Three Fiber** communities
- **Pmnd** for the incredible @react-three/drei toolkit

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Check existing documentation
- Review closed issues for solutions

---

**Built with ❤️ for drone enthusiasts and educators**
