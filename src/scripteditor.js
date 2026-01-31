/**
 * Script Editor 腳本編輯器邏輯
 * (V2.3 - Syntax Highlighting)
 *
 * 新增：語法高亮功能，讓指令、參數、註解等顯示不同顏色。
 */

// --- Autocomplete & Highlighting Data ---
const mainCommandRegex = /^(SAY|BG|CHARA|CHOICE|LABEL|GOTO|SPRITE|SPRITE_CLR)/;
const audioCommandRegex = /^(\[)(BGM_PLAY|BGM_STOP|BGM_FADE_OUT|BGM_FADE_IN|SFX_PLAY)/;
const charAssets = ["Captain_angry", "Captain_happy", "Captain_neutral", "Captain_sad", "elizabeth_happy_L", "elizabeth_happy_R", "elizabeth_neutral_L", "elizabeth_neutral_R", "elizabeth_sad_L", "elizabeth_sad_R", "elizabeth_surprised_L", "elizabeth_surprised_R", "Goblin_neutral", "Goblin_surprised", "hero_happy", "hero", "kinght_full", "knight_helf"];
const mainCommands = ["SAY|", "BG|", "CHARA|", "CHOICE|", "LABEL|", "GOTO|", "[BGM_PLAY:", "[SFX_PLAY:"];
const charaSubCommands = ["SHOW|", "HIDE|", "CLEAR"];

/**
 * ScriptManager 模組 (維持原樣)
 */
const ScriptManager = (function() { /* ... (內容與之前相同，此處省略) ... */
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
    return { getScriptList, getScriptContent, saveScript, addScript, deleteScript, renameScript, setMainScript, handleFileUpload, onListChangedCallback, getCurrentScriptName, setCurrentScriptName };
})();

document.addEventListener('DOMContentLoaded', () => {
    // --- Global Variables ---
    let editor;
    let currentFileHandle = null;

    // --- DOM Elements ---
    const editorParent = document.getElementById('editor');
    const editorTitle = document.getElementById('editor-title');

    // --- CodeMirror Custom Mode Definition ---
    CodeMirror.defineMode("avg-script", function() {
        return {
            token: function(stream, state) {
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
            startState: function() {
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
            mode: 'avg-script', // <-- USE THE CUSTOM MODE
            theme: 'darcula',
            lineNumbers: true,
            extraKeys: { "Ctrl-Space": "autocomplete" },
            hintOptions: { hint: CodeMirror.helpers.hint.avg }
        });
        updateEditorTitle();
        updatePreview(editor.getValue());
        editor.on('change', (cm) => {
            const content = cm.getValue();
            updatePreview(content);
            ScriptManager.saveScript(ScriptManager.getCurrentScriptName(), content);
        });
        editor.on("inputRead", (cm, event) => {
            if (!cm.state.completionActive && /[\w|\[]/.test(event.text[0])) {
                cm.showHint({ completeSingle: false });
            }
        });
    }

    // --- File System API Logic & UI (Same as before) ---
    async function openFile() { try { [currentFileHandle] = await window.showOpenFilePicker({ types: [{ description: 'Text Files', accept: { 'text/plain': ['.txt', '.md'] } }], multiple: false }); const file = await currentFileHandle.getFile(); const content = await file.text(); editor.setValue(content); ScriptManager.setCurrentScriptName(currentFileHandle.name); updateEditorTitle(); } catch (err) { if (err.name !== 'AbortError') console.error("開啟檔案失敗:", err); } }
    async function saveFile() { try { if (currentFileHandle) { const writable = await currentFileHandle.createWritable(); await writable.write(editor.getValue()); await writable.close(); alert(`檔案 "${currentFileHandle.name}" 已儲存。`); } else { const handle = await window.showSaveFilePicker({ types: [{ description: 'Text Files', accept: { 'text/plain': ['.txt', '.md'] } }] }); currentFileHandle = handle; await saveFile(); updateEditorTitle(); } } catch (err) { if (err.name !== 'AbortError') console.error("儲存檔案失敗:", err); } }
    function updateEditorTitle() { if (currentFileHandle) { editorTitle.textContent = `編輯中: ${currentFileHandle.name}`; } else { editorTitle.textContent = 'AVG Script Editor'; } }
    function updatePreview(text) { const syntaxPreview = document.getElementById('syntax-preview'); if (!syntaxPreview) return; const lines = text.split('\n'); const lastLine = lines[lines.length - 1] || ""; syntaxPreview.textContent = `[檔案: ${currentFileHandle ? currentFileHandle.name : ScriptManager.getCurrentScriptName()}] [行: ${lines.length}]`; }
    document.getElementById('open-file-btn').addEventListener('click', openFile);
    document.getElementById('save-file-btn').addEventListener('click', saveFile);
    document.getElementById('run-button').addEventListener('click', () => { const scriptText = editor.getValue(), scriptName = currentFileHandle ? currentFileHandle.name : ScriptManager.getCurrentScriptName(); if (window.opener) { window.opener.postMessage({ type: 'UPDATE_SCRIPT', script: scriptText, scriptName }, '*'); } else { alert(`劇本 "${scriptName}" 已儲存，但找不到主遊戲視窗。`); } });
    document.getElementById('load-example-btn').addEventListener('click', () => { editor.setValue(`BG|bg_room\nSAY|主角|...\n# 這是一行註解\nCHARA|SHOW|hero_happy|left`); currentFileHandle = null; updateEditorTitle(); });
    document.getElementById('toggle-sidebar').addEventListener('click', (e) => { const container = document.getElementById('editor-container'); container.classList.toggle('collapsed'); e.currentTarget.textContent = container.classList.contains('collapsed') ? '▶' : '◀'; });
    const fileUploader = document.getElementById('file-uploader'), uploadBtn = document.getElementById('upload-script-btn'), overwriteCheckbox = document.getElementById('overwrite-main-checkbox');
    if (uploadBtn && fileUploader) { uploadBtn.addEventListener('click', () => fileUploader.click()); fileUploader.addEventListener('change', async (event) => { const file = event.target.files[0]; if (!file) return; try { const result = await ScriptManager.handleFileUpload(file, overwriteCheckbox.checked); alert(`腳本 "${result.name}" 已透過舊版方式上傳。`); currentFileHandle = null; updateEditorTitle(); editor.setValue(ScriptManager.getScriptContent(result.name)); } catch (error) { alert(`錯誤: ${error}`); } }); }

    // --- Final Initialization ---
    initEditor();
    window.ScriptManager = ScriptManager;
    console.log("Script Editor V2.3 (Syntax Highlighting) Initialized");
});
