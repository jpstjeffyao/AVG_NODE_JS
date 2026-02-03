/**
 * Script Editor 腳本編輯器邏輯
 * (V2.3 - Syntax Highlighting)
 *
 * 新增：語法高亮功能，讓指令、參數、註解等顯示不同顏色。
 */

// --- Autocomplete & Highlighting Data ---
const mainCommandRegex = /^(SAY|BG|CHARA|CHOICE|LABEL|GOTO|SPRITE|SPRITE_CLR|MV|BGM_PLAY|BGM_STOP|BGM_FADE_OUT|BGM_FADE_IN|SFX_PLAY|SET|CALL_SCRIPT|IF)/;
const audioCommandRegex = /^(\[)(BGM_PLAY|BGM_STOP|BGM_FADE_OUT|BGM_FADE_IN|SFX_PLAY)/;
const charAssets = ["Captain_angry", "Captain_happy", "Captain_neutral", "Captain_sad", "elizabeth_happy_L", "elizabeth_happy_R", "elizabeth_neutral_L", "elizabeth_neutral_R", "elizabeth_sad_L", "elizabeth_sad_R", "elizabeth_surprised_L", "elizabeth_surprised_R", "Goblin_neutral", "Goblin_surprised", "hero_happy", "hero", "kinght_full", "knight_helf"];
const mainCommands = ["SAY|", "BG|", "CHARA|", "CHOICE|", "LABEL|", "GOTO|", "SPRITE|", "SPRITE_CLR|", "MV|", "BGM_PLAY|", "BGM_STOP", "BGM_FADE_OUT|", "BGM_FADE_IN|", "SFX_PLAY|", "SET|", "CALL_SCRIPT|", "IF|"];
const charaSubCommands = ["SHOW|", "HIDE|", "CLEAR"];

/**
 * ScriptManager 模組 (維持原樣)
 */
const ScriptManager = (function () { /* ... (內容與之前相同，此處省略) ... */
    const STORAGE_KEY_LIST = 'scripteditor_scripts', STORAGE_KEY_PREFIX = 'scripteditor_script_';
    let scripts = [], currentScriptName = '', onListChangedCallback = null;
    function init() { const savedList = localStorage.getItem(STORAGE_KEY_LIST); if (savedList) { try { scripts = JSON.parse(savedList); } catch (e) { scripts = []; } } if (scripts.length === 0) { const defaultName = 'default'; scripts.push({ name: defaultName, isMain: true }); saveList(); if (!localStorage.getItem(STORAGE_KEY_PREFIX + defaultName)) localStorage.setItem(STORAGE_KEY_PREFIX + defaultName, ''); } const mainScript = scripts.find(s => s.isMain) || scripts[0]; currentScriptName = mainScript.name; }
    function saveList() { if (onListChangedCallback) onListChangedCallback(scripts); localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(scripts)); }
    function getScriptList() { return scripts; }
    function getScriptContent(name) { return localStorage.getItem(STORAGE_KEY_PREFIX + name) || ''; }
    function saveScript(name, content) { localStorage.setItem(STORAGE_KEY_PREFIX + name, content); if (!scripts.find(s => s.name === name)) addScript(name, content); }
    function addScript(name, content = '') { if (scripts.find(s => s.name === name)) return false; scripts.push({ name, isMain: false }); saveScript(name, content); saveList(); return true; }
    function deleteScript(name) { if (scripts.length <= 1) return false; const i = scripts.findIndex(s => s.name === name); if (i !== -1) { const wasMain = scripts[i].isMain; scripts.splice(i, 1); localStorage.removeItem(STORAGE_KEY_PREFIX + name); if (currentScriptName === name) currentScriptName = scripts[0].name; if (wasMain && scripts.length > 0) scripts[0].isMain = true; saveList(); return true; } return false; }
    function renameScript(oldName, newName) { if (scripts.find(s => s.name === newName)) return false; const script = scripts.find(s => s.name === oldName); if (script) { const content = getScriptContent(oldName); script.name = newName; localStorage.setItem(STORAGE_KEY_PREFIX + newName, content); localStorage.removeItem(STORAGE_KEY_PREFIX + oldName); if (currentScriptName === oldName) currentScriptName = newName; saveList(); return true; } return false; }
    function setMainScript(name) { scripts.forEach(s => { s.isMain = (s.name === name); }); saveList(); }
    function onScriptListChanged(callback) { onListChangedCallback = callback; }
    function getCurrentScriptName() { return currentScriptName; }
    function setCurrentScriptName(name) { currentScriptName = name; }
    function handleFileUpload(file, overwriteMain = false) { return new Promise((resolve, reject) => { if (!file.name.match(/\.(txt|md)$/)) return reject("僅支援 .txt 或 .md"); const reader = new FileReader(); reader.onload = (e) => { const content = e.target.result; if (overwriteMain) { const mainScript = scripts.find(s => s.isMain); if (mainScript) { saveScript(mainScript.name, content); resolve({ name: mainScript.name, content, action: 'overwrite' }); } else reject("找不到主腳本"); } else { let baseName = file.name.replace(/\.[^/.]+$/, ""), finalName = baseName, i = 1; while (scripts.find(s => s.name === finalName)) finalName = `${baseName}_${i++}`; addScript(finalName, content); resolve({ name: finalName, content, action: 'add' }); } }; reader.onerror = () => reject("檔案讀取失敗"); reader.readAsText(file); }); }
    init();
    return { getScriptList, getScriptContent, saveScript, addScript, deleteScript, renameScript, setMainScript, handleFileUpload, onScriptListChanged, getCurrentScriptName, setCurrentScriptName };
})();

document.addEventListener('DOMContentLoaded', () => {
    // --- Global Variables ---
    let editor;
    let currentFileHandle = null;

    // --- DOM Elements ---
    const editorParent = document.getElementById('editor');
    const editorTitle = document.getElementById('editor-title');

    // --- CodeMirror Custom Mode Definition ---
    CodeMirror.defineMode("avg-script", function () {
        return {
            token: function (stream, state) {
                // Comments
                if (stream.sol() && stream.match(/^\s*#/)) {
                    stream.skipToEnd();
                    return "comment";
                }

                // Keywords at the start of the line
                if (stream.sol()) {
                    if (stream.match(mainCommandRegex)) return "keyword";
                    if (stream.match(audioCommandRegex)) return "keyword";
                }

                // Parameters after commands
                if (stream.peek() === '|') {
                    stream.next();
                    return "operator";
                }

                // Highlight labels and goto targets
                if (state.lastToken === "keyword" && (state.lastCommand === "LABEL" || state.lastCommand === "GOTO")) {
                    stream.eatWhile(/[\w_]/);
                    return "atom";
                }

                // Highlight character names in SAY
                if (state.lastToken === "operator" && state.lastCommand === "SAY") {
                    stream.eatWhile(/[^|]*/);
                    return "variable-2";
                }

                // Track last command for contextual coloring
                if (stream.current().trim()) {
                    const current = stream.current().toUpperCase().replace(/[\[|\]]/g, '');
                    if (mainCommands.map(c => c.replace(/[|\[:]/g, '')).includes(current)) {
                        state.lastCommand = current;
                    }
                }
                state.lastToken = stream.current();


                stream.next();
                return null;
            },
            startState: function () {
                return { lastToken: null, lastCommand: null };
            }
        };
    });


    // --- Hinting Logic ---
    CodeMirror.registerHelper('hint', 'avg', (cm) => {
        const cursor = cm.getCursor(), line = cm.getLine(cursor.line);
        const currentWord = line.slice(0, cursor.ch).match(/[\w\-\[\]]*$/)[0];
        const from = CodeMirror.Pos(cursor.line, cursor.ch - currentWord.length);
        const to = CodeMirror.Pos(cursor.line, cursor.ch);
        const parts = line.slice(0, from.ch).toUpperCase().split('|');
        let list = [];
        if (parts.length <= 1) list = mainCommands;
        else if (parts[0] === 'CHARA' && parts.length === 2) list = charaSubCommands;
        else if (parts[0] === 'CHARA' && parts[1] === 'SHOW' && parts.length === 3) list = charAssets;
        const filteredList = list.filter(item => item.toUpperCase().startsWith(currentWord.toUpperCase()));
        if (filteredList.length) return { list: filteredList, from, to };
    });

    // --- Editor Initialization ---
    function initEditor() {
        editor = CodeMirror(editorParent, {
            value: ScriptManager.getScriptContent(ScriptManager.getCurrentScriptName()),
            mode: 'avg-script',
            theme: 'darcula',
            lineNumbers: true,
            extraKeys: { "Ctrl-Space": "autocomplete" },
            hintOptions: { hint: CodeMirror.helpers.hint.avg }
        });
        updateEditorTitle(false);
        updatePreview(editor.getValue());
        updateVisualPreview(editor.getValue()); // Initial visual preview

        editor.on('change', (cm) => {
            const content = cm.getValue();
            updatePreview(content);
            updateVisualPreview(content); // Update visual on change

            const currentName = ScriptManager.getCurrentScriptName();
            if (!currentFileHandle) {
                ScriptManager.saveScript(currentName, content);
                updateEditorTitle(true);
            }
        });

        // Update visual preview on cursor movement to reflect context at that line
        editor.on('cursorActivity', (cm) => {
            updateVisualPreview(cm.getValue());
        });

        // 監聽輸入前動作，切換為「編輯中」
        editor.on('beforeChange', () => {
            if (!currentFileHandle) {
                updateEditorTitle(false);
            }
        });

        editor.on("inputRead", (cm, event) => {
            if (!cm.state.completionActive && /[\w|\[]/.test(event.text[0])) {
                cm.showHint({ completeSingle: false });
            }
        });
    }

    // --- Sidebar Toggle Logic ---
    const sidebar = document.getElementById('sidebar-list');
    const toggleBtn = document.getElementById('toggle-sidebar-btn');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // --- Visual Preview Logic ---
    function updateVisualPreview(fullText) {
        const cursor = editor.getCursor();
        const currentLineIndex = cursor.line;
        const lines = fullText.split('\n');

        // State to track
        let lastBG = null;
        const chars = { left: null, center: null, right: null };
        let activeDialog = null;

        // Scan backwards from current line to find states
        // Strategy: Scan entire script up to current line to simulate state accumulation
        // Limitation: Does not handle GOTO/IF logic, linear scan only.

        for (let i = 0; i <= currentLineIndex; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('#')) continue;

            const parts = line.split('|');
            const cmd = parts[0].toUpperCase();

            if (cmd === 'BG') {
                lastBG = parts[1];
            } else if (cmd === 'CHARA') {
                const subCmd = parts[1];
                if (subCmd === 'SHOW') {
                    // CHARA|SHOW|img|pos
                    const img = parts[2];
                    const pos = parts[3] ? parts[3].toLowerCase() : 'center';
                    if (['left', 'center', 'right'].includes(pos)) {
                        chars[pos] = img;
                    }
                } else if (subCmd === 'HIDE') {
                    const pos = parts[2] ? parts[2].toLowerCase() : 'center';
                    if (['left', 'center', 'right'].includes(pos)) chars[pos] = null;
                } else if (subCmd === 'CLEAR') {
                    chars.left = null; chars.center = null; chars.right = null;
                }
            } else if (cmd === 'SPRITE') {
                // Compatible with old SPRITE|img|pos|...
                const img = parts[1];
                const pos = parts[2] ? parts[2].toLowerCase() : 'center';
                if (['left', 'center', 'right'].includes(pos)) {
                    chars[pos] = img;
                }
            } else if (cmd === 'SPRITE_CLR') {
                const pos = parts[1] ? parts[1].toLowerCase() : 'center';
                if (['left', 'center', 'right'].includes(pos)) chars[pos] = null;
            }

            // Only show dialog if it's the CURRENT line
            if (i === currentLineIndex && cmd === 'SAY') {
                activeDialog = { name: parts[1], text: parts[2] };
            } else {
                activeDialog = null; // Reset dialog if moving past it
            }
        }

        // Apply to DOM
        const bgImg = document.getElementById('preview-bg');
        if (lastBG) {
            // Try explicit path or guess extension. Here assuming structure matches assets
            // Common convention in this project seems to be filenames without extension in script? 
            // Actually assets listing shows extensions. 
            // If script says "BG|bg_room", file is "bg_room.jpg". 
            // If script says "BG|bg_room.jpg", file is "bg_room.jpg".
            let src = lastBG.includes('/') ? lastBG : `assets/bg/${lastBG}`;
            if (!src.match(/\.(jpg|png|jpeg)$/i)) src += '.jpg'; // Default to jpg for BG

            // Allow png fallback? Browsers don't support "try urls" natively easily without JS check.
            // For now, assume jpg for BG as per project convention, or check if name has extension.
            if (lastBG.includes('.')) src = `assets/bg/${lastBG}`;

            if (bgImg.src !== window.location.origin + '/' + src) { // Avoid reload if same
                bgImg.style.display = 'block';
                bgImg.src = src;
                // Simple error handler to try png if jpg fails
                bgImg.onerror = function () {
                    if (this.src.endsWith('.jpg')) this.src = this.src.replace('.jpg', '.png');
                };
            }
        } else {
            bgImg.style.display = 'none';
        }

        ['left', 'center', 'right'].forEach(pos => {
            const imgEl = document.getElementById(`p-char-${pos}`);
            const charName = chars[pos];
            if (charName) {
                let src = `assets/char/${charName}`;
                if (!src.match(/\.(png|jpg)$/i)) src += '.png'; // Default to png for chars

                if (imgEl.src !== window.location.origin + '/' + src) {
                    imgEl.style.display = 'block';
                    imgEl.src = src;
                }
                imgEl.style.display = 'block'; // Ensure visible
            } else {
                imgEl.style.display = 'none';
            }
        });

        const msgBox = document.getElementById('preview-msg-box');
        if (activeDialog) {
            msgBox.style.display = 'block';
            document.getElementById('preview-msg-name').textContent = activeDialog.name;
            document.getElementById('preview-msg-text').textContent = activeDialog.text;
        } else {
            msgBox.style.display = 'none';
        }
    }

    // --- Script List UI Logic ---
    const scriptListEl = document.getElementById('script-list');
    const searchInput = document.getElementById('script-search');

    function renderScriptList() {
        scriptListEl.innerHTML = '';
        const scripts = ScriptManager.getScriptList();
        const filter = searchInput.value.toLowerCase();
        const currentName = ScriptManager.getCurrentScriptName();

        // Sort scripts alphabetically
        scripts.sort((a, b) => a.name.localeCompare(b.name));

        scripts.forEach(script => {
            if (script.name.toLowerCase().includes(filter)) {
                const li = document.createElement('li');
                li.className = 'script-item';
                if (script.name === currentName) li.classList.add('active');
                if (script.isMain) li.classList.add('is-main');

                const nameSpan = document.createElement('span');
                nameSpan.className = 'script-name';
                nameSpan.textContent = script.name;

                const mainBadge = document.createElement('span');
                mainBadge.className = 'main-badge';
                mainBadge.textContent = 'MAIN';

                li.appendChild(nameSpan);
                li.appendChild(mainBadge);

                li.addEventListener('click', () => {
                    if (ScriptManager.getCurrentScriptName() !== script.name) {
                        ScriptManager.setCurrentScriptName(script.name);
                        editor.setValue(ScriptManager.getScriptContent(script.name));
                        // Clear file handle when switching internal scripts
                        currentFileHandle = null;
                        updateEditorTitle();
                        renderScriptList();
                    }
                });

                // Context menu for "Set as Main"
                li.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    if (confirm(`將 "${script.name}" 設定為主劇本 (Main Script)?`)) {
                        ScriptManager.setMainScript(script.name);
                        renderScriptList();
                    }
                });

                scriptListEl.appendChild(li);
            }
        });
    }

    // Connect ScriptManager updates to UI
    ScriptManager.onScriptListChanged(renderScriptList);

    // Search Handler
    searchInput.addEventListener('input', renderScriptList);

    // Button Handlers
    document.getElementById('add-script-btn').addEventListener('click', () => {
        const name = prompt("請輸入新劇本名稱 (例如: Script01-01):");
        if (name) {
            if (ScriptManager.addScript(name)) {
                // Auto switch to new script
                ScriptManager.setCurrentScriptName(name);
                editor.setValue("");
                currentFileHandle = null;
                updateEditorTitle();
                renderScriptList();
            } else {
                alert("劇本名稱已存在或是無效。");
            }
        }
    });

    document.getElementById('rename-script-btn').addEventListener('click', () => {
        const currentName = ScriptManager.getCurrentScriptName();
        const newName = prompt(`請輸入 "${currentName}" 的新名稱:`, currentName);
        if (newName && newName !== currentName) {
            if (ScriptManager.renameScript(currentName, newName)) {
                updateEditorTitle(false);
                // renderScriptList called via callback
            } else {
                alert("重新命名失敗 (名稱可能已存在)。");
            }
        }
    });

    document.getElementById('set-main-btn').addEventListener('click', () => {
        const currentName = ScriptManager.getCurrentScriptName();
        if (confirm(`確認將 "${currentName}" 設定為遊戲啟動的主劇本 (Main Script)?`)) {
            ScriptManager.setMainScript(currentName);
            renderScriptList();
        }
    });

    document.getElementById('delete-script-btn').addEventListener('click', () => {
        const currentName = ScriptManager.getCurrentScriptName();
        if (confirm(`確定要刪除劇本 "${currentName}" 嗎? 此動作無法復原。`)) {
            if (ScriptManager.deleteScript(currentName)) {
                // Switch to the new current script (handled by deleteScript logic usually resetting current, but we need to sync editor)
                const newCurrent = ScriptManager.getCurrentScriptName();
                editor.setValue(ScriptManager.getScriptContent(newCurrent));
                currentFileHandle = null;
                updateEditorTitle();
                // renderScriptList called via callback
            } else {
                alert("無法刪除 (至少保留一個劇本)。");
            }
        }
    });

    // --- 檔案系統 API 邏輯與 UI ---
    async function openFile() { try { [currentFileHandle] = await window.showOpenFilePicker({ types: [{ description: 'Text Files', accept: { 'text/plain': ['.txt', '.md'] } }], multiple: false }); const file = await currentFileHandle.getFile(); const content = await file.text(); editor.setValue(content); ScriptManager.setCurrentScriptName(currentFileHandle.name); updateEditorTitle(); } catch (err) { if (err.name !== 'AbortError') console.error("開啟檔案失敗:", err); } }
    async function saveFile() { try { if (currentFileHandle) { const writable = await currentFileHandle.createWritable(); await writable.write(editor.getValue()); await writable.close(); alert(`檔案 "${currentFileHandle.name}" 已儲存。`); } else { const handle = await window.showSaveFilePicker({ types: [{ description: 'Text Files', accept: { 'text/plain': ['.txt', '.md'] } }] }); currentFileHandle = handle; await saveFile(); updateEditorTitle(); } } catch (err) { if (err.name !== 'AbortError') console.error("儲存檔案失敗:", err); } }

    function updateEditorTitle(isSaved = false) {
        const currentName = ScriptManager.getCurrentScriptName();
        if (currentFileHandle) {
            editorTitle.textContent = `編輯中 (檔案): ${currentFileHandle.name}`;
            editorTitle.style.color = "#007acc";
        } else {
            if (isSaved) {
                editorTitle.textContent = `已儲存 (本機): ${currentName}`;
                editorTitle.style.color = "#4ec9b0"; // 綠色表示儲存完成
            } else {
                editorTitle.textContent = `編輯中 (本機): ${currentName}`;
                editorTitle.style.color = "#007acc"; // 藍色表示編輯中
            }
        }
    }

    function updatePreview(text) { const syntaxPreview = document.getElementById('syntax-preview'); if (!syntaxPreview) return; const lines = text.split('\n'); const lastLine = lines[lines.length - 1] || ""; syntaxPreview.textContent = `[檔案: ${currentFileHandle ? currentFileHandle.name : ScriptManager.getCurrentScriptName()}] [行: ${lines.length}]`; }
    document.getElementById('open-file-btn').addEventListener('click', openFile);
    document.getElementById('save-file-btn').addEventListener('click', saveFile);
    document.getElementById('run-button').addEventListener('click', () => { const scriptText = editor.getValue(), scriptName = currentFileHandle ? currentFileHandle.name : ScriptManager.getCurrentScriptName(); if (window.opener) { window.opener.postMessage({ type: 'UPDATE_SCRIPT', script: scriptText, scriptName }, '*'); } else { alert(`劇本 "${scriptName}" 已儲存，但找不到主遊戲視窗。`); } });
    document.getElementById('load-example-btn').addEventListener('click', () => { editor.setValue(`BG|bg_room\nSAY|主角|...\n# 這是一行註解\nCHARA|SHOW|hero_happy|left`); currentFileHandle = null; updateEditorTitle(); });
    // Toggle sidebar logic removed for 3-column layout

    const fileUploader = document.getElementById('file-uploader'), uploadBtn = document.getElementById('upload-script-btn'), overwriteCheckbox = document.getElementById('overwrite-main-checkbox');
    if (uploadBtn && fileUploader) { uploadBtn.addEventListener('click', () => fileUploader.click()); fileUploader.addEventListener('change', async (event) => { const file = event.target.files[0]; if (!file) return; try { const result = await ScriptManager.handleFileUpload(file, overwriteCheckbox.checked); alert(`腳本 "${result.name}" 已透過舊版方式上傳。`); currentFileHandle = null; updateEditorTitle(); editor.setValue(ScriptManager.getScriptContent(result.name)); } catch (error) { alert(`錯誤: ${error}`); } }); }

    // --- Final Initialization ---
    initEditor();

    // Initial Render (Moved after initEditor)
    renderScriptList();

    window.ScriptManager = ScriptManager;
    console.log("Script Editor V2.3 (Syntax Highlighting) Initialized");
});
