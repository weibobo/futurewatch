# FutureWatch

A real-time futures checking application built with Tauri + Vue 3.

## Project Setup

The project dependencies are already installed.

## Debugging

### 1. Web Preview (Frontend Only)
Use this mode to quickly check UI changes and logic without the desktop wrapper.
```bash
npm run dev
```
Open the URL shown (usually `http://localhost:1420`) in your browser.
*Note: Tauri-specific features (TitleBar dragging, System Tray) will not work in the browser.*

### 2. Desktop Application (Full App)
**Prerequisite:** You must have [Rust](https://www.rust-lang.org/tools/install) installed.
*Your system currently appears to be missing Rust (`cargo` command not found).*

Once Rust is installed:
```bash
npm run tauri dev
```
This will compile the Rust backend and launch the actual floating window application.

## Build

To build the production application:
```bash
# Frontend only
npm run build

# Web Application
npm run tauri build
```
