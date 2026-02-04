---
description: test application before git pull
---

test application base on follow instractions and after all make a test report ,report file name like \testreports\yyyymmdd-report.md write in chinese,And mark pass function and fail function like Audio Volume Control :[x],Text & Display [O] 

# AVG Engine Test Plan
 

## 1. System Settings & Configuration

### 1.1 Audio Volume Control
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| SET-01 | Master Volume | 1. Open Settings Menu.<br>2. Play BGM.<br>3. Adjust Master Volume slider (0% - 100%). | Audio volume changes proportionally globally. At 0%, no sound is heard. |
| SET-02 | BGM Volume | 1. Open Settings Menu.<br>2. Play BGM.<br>3. Adjust BGM Volume slider. | Only background music volume changes. SFX volume remains unchanged. |
| SET-03 | SFX Volume | 1. Open Settings Menu.<br>2. Trigger SFX (e.g., button click).<br>3. Adjust SFX Volume slider. | Only sound effect volume changes. BGM volume remains unchanged. |
| SET-04 | Persistence | 1. Change volume settings.<br>2. Refresh the browser page.<br>3. Open Settings Menu. | Volume sliders retain their previously set values. |

### 1.2 Text & Display
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| SET-05 | Text Speed - Slow | 1. Set Text Speed to "Slow".<br>2. Start a dialogue. | Text characters appear slowly (approx. 80ms/char). |
| SET-06 | Text Speed - Fast | 1. Set Text Speed to "Fast".<br>2. Start a dialogue. | Text characters appear quickly (approx. 20ms/char). |
| SET-07 | Text Speed Persistence | 1. Change Text Speed.<br>2. Refresh page.<br>3. Check Settings. | Text Speed setting is preserved. |

### 1.3 Auto-Play (Auto-Skip)
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| AUTO-01 | Toggle On | 1. Click "Auto" button in-game. | Button turns green. Dialogue automatically advances after typing finishes. |
| AUTO-02 | Toggle Off | 1. Click "Auto" button again. | Button turns gray. Dialogue stops auto-advancing. |
| AUTO-03 | Manual Interruption | 1. Enable Auto.<br>2. During a line, click the screen manually. | The current auto-advance timer is cancelled for this line, but Auto mode remains active for the next line. |

---

## 2. Save & Load System

### 2.1 Saving
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| SAVE-01 | Create Save | 1. Progress to a specific line in the script.<br>2. Open Save Menu.<br>3. Click an empty slot. | "Game saved" alert appears. Slot updates with timestamp and summary. |
| SAVE-02 | Overwrite Save | 1. Save to an existing slot. | Old save data is replaced with new data. Timestamp updates. |

### 2.2 Loading
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| LOAD-01 | Load In-Game | 1. Play to a different point.<br>2. Load the previous save. | Game instantly reverts to the saved state (BG, Characters, Music, Text line). |
| LOAD-02 | Load from Title | 1. Refresh page (Title Screen).<br>2. Click "Load Game".<br>3. Select the save slot. | Game starts directly at the saved point. |
| LOAD-03 | Visual Restoration | 1. Load a save with specific Characters/BG. | Correct Background and Character Sprites (positions/expressions) are shown. |
| LOAD-04 | Audio Restoration | 1. Load a save with specific BGM. | Correct BGM plays at the correct volume. |

---

## 3. Script Engine Core

### 3.1 Command Execution
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| SCR-01 | Basic Commands | 1. Run script with `SAY`, `BG`, `CHARA`. | Dialog shows, Background changes, Characters appear correctly. |
| SCR-02 | Audio Commands | 1. Run `BGM_PLAY`, `SFX_PLAY`. | Audio plays correctly. |
| SCR-03 | New Audio Format | 1. Run `BGM_PLAY|file.mp3|1.0|true`. | Audio plays using new pipe `|` syntax. |

### 3.2 Logic Flow
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| LOG-01 | Variables (SET) | 1. Run `SET|flag|1`. | Variable is stored in StateManager. |
| LOG-02 | Conditionals (IF) | 1. Run `IF|flag|1|GOTO|label`. | Script jumps to `LABEL|label` if variable matches. |
| LOG-03 | Choices | 1. Run `CHOICE`. | Choice buttons appear. Clicking one executes the bound path. |

---

## 4. UI & Interaction

### 4.1 Menus
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| UI-01 | Title Screen | 1. Refresh page. | "New Game", "Load Game", "Settings" buttons work. |
| UI-02 | In-Game Menu | 1. Check top-right buttons. | "Save", "Load", "Auto" buttons are visible and functional. |

### 4.2 User Input
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| INP-01 | Click to Advance | 1. Click anywhere during dialogue. | If typing, text completes instantly. If finished, moves to next line. |
| INP-02 | Spacebar | 1. Press Spacebar. | Acts same as Click (Advance/Complete text). |