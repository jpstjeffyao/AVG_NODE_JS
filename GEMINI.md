# Project Overview

This is an experimental Adventure Game (AVG) engine core project developed using Node.js and TypeScript. Its main purpose is to provide a flexible and extensible framework for creating AVG games, focusing on core functionalities like game state management, script parsing, and UI rendering.

**Key Components:**
*   **GameKernel**: The singleton core controller managing module registration and lifecycle.
*   **StateManager**: Handles game states, variables, and flags.
*   **ScriptEngine**: Parses game scripts, supporting various commands including `SAY`, `SET`, `IF`, and now `MV` for video playback.
*   **UIModule**: Manages web interface rendering, user interactions, and now full-screen video playback.
*   **AssetManager**: Manages game assets like images, and potentially videos.
*   **AudioManager**: Manages background music and sound effects.
*   **CharacterModule**: Manages character sprites.

The project also includes a powerful web-based script editor (`script_editor.html`) that allows for real-time script management, editing, and previewing.

# Building and Running

## Prerequisites

Ensure you have Node.js and npm installed.

## Installation

To install the project dependencies, run:

```bash
npm install
```

## Running the Development Server

To start the development server using Vite, run:

```bash
npm run dev
```

After starting, open your browser and navigate to `http://localhost:5173` to see the game in action.

## Running Tests

### Unit Tests

To execute the unit tests:

```bash
npm test
```

### Test Coverage

To view the test coverage report:

```bash
npm run test:coverage
```

# Development Conventions

## Code Structure

*   **`src/core/`**: Contains core system components like `GameKernel`, `StateManager`, and interfaces (`IGameModule`).
*   **`src/modules/`**: Houses functional modules such as `AssetManager`, `AudioManager`, `CharacterModule`, `ScriptEngine`, and `UIModule`.
*   **`tests/`**: Contains Jest test cases for various modules.

## Script Format

The game scripts support a specific syntax for commands, including:

*   `SAY|Character Name|Dialogue Content`
*   `SET|Variable Name|Value`
*   `IF|Variable Name|Value|GOTO|Line Number`
*   **`MV|Video File Path|Volume (Optional)`**: Plays a full-screen video with optional volume control.
*   Other commands like `BG`, `SPRITE`, `CHARA`, `CHOICE`, `LABEL`, `GOTO`, audio commands (`[BGM_PLAY:]`, `[SFX_PLAY:]`).

For detailed script formatting, refer to `scriptFormat.md`.

## Interaction

In the web interface, clicking anywhere on the screen or within a dialog box will trigger the `ScriptEngine` to execute the next command in the script. During video playback, a click or key press will immediately skip the video. The menu screen now ignores clicks outside of specific buttons.

## Script Editor Usage

The `script_editor.html` provides comprehensive tools for script management:

*   **Multi-script Management**: Store and manage multiple script files in the browser.
*   **Main Script Toggle**: Designate a script as the "Main" script for default loading.
*   **CRUD Operations**: Create, rename, delete, and update script content.
*   **File Upload**: Directly import `.txt` or `.md` files.
*   **Real-time Syntax Preview**: Get instant syntax hints and script status, now including the `MV` command.
*   **Auto-save**: Edits are automatically saved to `LocalStorage`.
*   **Execution & Sync**: Use the "Run" button to execute scripts in the game window via `postMessage`.

Script data is persisted in `LocalStorage` under keys like `scripteditor_scripts` and `scripteditor_script_[NAME]`.
