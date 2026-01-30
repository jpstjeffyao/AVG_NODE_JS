/**
 * Script Editor 腳本編輯器邏輯
 * 負責處理獨立視窗中的劇本編輯、本地儲存、即時語法預覽以及與遊戲主視窗的通訊 (postMessage)
 * 
 * 實作多腳本管理功能 (2026-01-30)
 */

/**
 * ScriptManager 負責管理 LocalStorage 中的多個腳本
 */
/**
 * ScriptManager 模組 (立即執行函式)
 * 封裝了所有關於腳本資料的儲存、索引與管理邏輯。
 * 透過 LocalStorage 實現持久化，支援多腳本並存、主腳本標記。
 */
const ScriptManager = (function() {
    // LocalStorage 使用的 Key 常數
    const STORAGE_KEY_LIST = 'scripteditor_scripts'; // 儲存腳本索引清單的 Key
    const STORAGE_KEY_PREFIX = 'scripteditor_script_'; // 儲存個別腳本內容的前綴，後接腳本名稱
    
    // 內部私有狀態
    let scripts = []; // 腳本索引陣列，格式為 { name: string, isMain: boolean }
    let currentScriptName = ''; // 當前正在編輯器中編輯的腳本名稱
    let onListChangedCallback = null; // 當腳本清單變動時的回呼函式

    /**
     * 初始化 ScriptManager
     * 1. 從 LocalStorage 載入現有腳本索引
     * 2. 若無腳本，則建立一個名為 'default' 的預設主腳本
     * 3. 自動設定當前編輯腳本為「主腳本」或清單中的第一個腳本
     */
    function init() {
        const savedList = localStorage.getItem(STORAGE_KEY_LIST);
        if (savedList) {
            try {
                scripts = JSON.parse(savedList);
            } catch (e) {
                console.error("解析腳本清單失敗:", e);
                scripts = [];
            }
        }

        // 如果清單為空，建立預設腳本
        if (scripts.length === 0) {
            const defaultName = 'default';
            scripts.push({ name: defaultName, isMain: true });
            saveList();
            // 儲存初始內容 (如果原本沒內容的話)
            if (!localStorage.getItem(STORAGE_KEY_PREFIX + defaultName)) {
                localStorage.setItem(STORAGE_KEY_PREFIX + defaultName, '');
            }
        }

        // 尋找主腳本作為預設載入對象
        const mainScript = scripts.find(s => s.isMain) || scripts[0];
        currentScriptName = mainScript.name;
    }

    /**
     * 儲存腳本清單索引到 LocalStorage
     * 此函式只更新索引清單，不涉及腳本內容。
     * 執行後會觸發 onListChangedCallback 以通知 UI 更新。
     */
    function saveList() {
        localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(scripts));
        // 若有註冊回呼函式，則執行它，將最新的腳本清單傳遞出去
        if (onListChangedCallback) {
            onListChangedCallback(scripts);
        }
    }

    /**
     * 取得目前所有的腳本索引清單
     * @returns {Array<{name: string, isMain: boolean}>} 腳本物件陣列
     */
    function getScriptList() {
        return scripts;
    }

    /**
     * 從 LocalStorage 取得特定名稱的腳本內文
     * @param {string} name 腳本名稱
     * @returns {string} 腳本內容文字，若無則回傳空字串
     */
    function getScriptContent(name) {
        return localStorage.getItem(STORAGE_KEY_PREFIX + name) || '';
    }

    /**
     * 將腳本內容儲存至 LocalStorage
     * @param {string} name 腳本名稱
     * @param {string} content 要儲存的文字內容
     */
    function saveScript(name, content) {
        localStorage.setItem(STORAGE_KEY_PREFIX + name, content);
        
        // 安全檢查：如果這個名稱不在索引清單中，則自動新增到清單
        if (!scripts.find(s => s.name === name)) {
            addScript(name, content);
        }
    }

    /**
     * 新增一個新的腳本到清單中
     * @param {string} name 腳本名稱
     * @param {string} content 初始內容 (可選)
     * @returns {boolean} 是否新增成功 (名稱重複會失敗)
     */
    function addScript(name, content = '') {
        if (scripts.find(s => s.name === name)) {
            console.warn(`腳本 ${name} 已存在`);
            return false;
        }
        scripts.push({ name, isMain: false });
        saveScript(name, content);
        saveList();
        return true;
    }

    /**
     * 刪除指定名稱的腳本
     * 同時會刪除 LocalStorage 中的內容與索引清單中的記錄。
     * 特殊邏輯：
     * 1. 不允許刪除最後一個腳本。
     * 2. 若刪除的是當前編輯中的腳本，會自動切換至另一個。
     * 3. 若刪除的是主腳本，會自動指派另一個腳本為主腳本。
     * @param {string} name 要刪除的腳本名稱
     * @returns {boolean} 是否刪除成功
     */
    function deleteScript(name) {
        // 不允許刪除最後一個腳本，確保系統中至少有一個腳本存在
        if (scripts.length <= 1) {
            console.error("無法刪除最後一個腳本。");
            return false;
        }
        
        const index = scripts.findIndex(s => s.name === name);
        if (index !== -1) {
            const wasMain = scripts[index].isMain;
            scripts.splice(index, 1);
            localStorage.removeItem(STORAGE_KEY_PREFIX + name);
            
            // 如果刪除的是當前正在編輯的腳本，需要切換當前編輯名稱
            if (currentScriptName === name) {
                currentScriptName = scripts[0].name;
            }

            // 如果刪除的是主腳本，需自動切換其他腳本為主腳本
            // 如果刪除的是主腳本，且清單中還有其他腳本，則自動將第一個設為新的主腳本
            if (wasMain && scripts.length > 0) {
                scripts[0].isMain = true;
                console.log(`主腳本已刪除，自動將 "${scripts[0].name}" 設為主腳本。`);
            }
            
            saveList();
            return true;
        }
        return false;
    }

    /**
     * 重新命名現有的腳本
     * 會同步更新 LocalStorage 的 Key 以及索引清單中的名稱。
     * @param {string} oldName 原始名稱
     * @param {string} newName 欲修改的新名稱
     * @returns {boolean} 是否重新命名成功 (新名稱若已存在則失敗)
     */
    function renameScript(oldName, newName) {
        // 防止名稱衝突
        if (scripts.find(s => s.name === newName)) return false;
        
        const script = scripts.find(s => s.name === oldName);
        if (script) {
            const content = getScriptContent(oldName);
            script.name = newName;
            // 遷移內容至新 Key 並移除舊 Key
            localStorage.setItem(STORAGE_KEY_PREFIX + newName, content);
            localStorage.removeItem(STORAGE_KEY_PREFIX + oldName);
            
            // 若正在編輯該腳本，同步更新當前編輯名稱狀態
            if (currentScriptName === oldName) {
                currentScriptName = newName;
            }
            
            saveList();
            return true;
        }
        return false;
    }

    /**
     * 設定特定腳本為「主腳本」
     * 主腳本通常作為遊戲啟動時載入的預設劇本。
     * 同一時間只能有一個主腳本，此操作會自動取消其他腳本的主腳本標記。
     * @param {string} name 要設為主腳本的名稱
     */
    function setMainScript(name) {
        scripts.forEach(s => {
            s.isMain = (s.name === name);
        });
        saveList();
    }

    /**
     * 註冊腳本清單變動的回呼函式
     * 當新增、刪除、重新命名或設定主腳本後，會自動觸發此回呼。
     * @param {Function} callback 接收最新腳本陣列作為參數的函式
     */
    function onScriptListChanged(callback) {
        onListChangedCallback = callback;
    }

    /**
     * 獲取編輯器目前正顯示/編輯中的腳本名稱
     * @returns {string} 當前腳本名稱
     */
    function getCurrentScriptName() {
        return currentScriptName;
    }

    /**
     * 手動設定編輯器當前編輯的腳本對象名稱 (主要用於切換邏輯)
     * @param {string} name 腳本名稱
     */
    function setCurrentScriptName(name) {
        currentScriptName = name;
    }

    /**
     * 快捷操作：直接更新「主腳本」的內容
     * @param {string} content 新的劇本內文
     * @returns {boolean} 是否更新成功
     */
    function updateMainScriptContent(content) {
        const mainScript = scripts.find(s => s.isMain);
        if (mainScript) {
            saveScript(mainScript.name, content);
            return true;
        }
        return false;
    }

    /**
     * 處理外部檔案上傳與導入
     * 支援將上傳的檔案內容儲存為新腳本，或是直接覆蓋現有的主腳本。
     *
     * @param {File} file 使用者選擇的檔案物件 (來自 <input type="file">)
     * @param {boolean} overwriteMain 若為 true 則直接更新主腳本，若為 false 則新增為新腳本
     * @returns {Promise<{name: string, content: string, action: 'overwrite'|'add'}>} 異步傳回處理結果
     */
    function handleFileUpload(file, overwriteMain = false) {
        return new Promise((resolve, reject) => {
            // 檢查檔案格式
            const fileName = file.name;
            const extension = fileName.split('.').pop().toLowerCase();
            if (extension !== 'txt' && extension !== 'md') {
                reject("僅支援 .txt 或 .md 檔案格式。");
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                if (overwriteMain) {
                    // 模式 A：直接覆蓋當前的主腳本
                    const mainScript = scripts.find(s => s.isMain);
                    if (mainScript) {
                        saveScript(mainScript.name, content);
                        resolve({ name: mainScript.name, content, action: 'overwrite' });
                    } else {
                        reject("找不到主腳本。");
                    }
                } else {
                    // 模式 B：作為新腳本新增
                    // 名稱取檔案名 (移除副檔名部分)
                    const baseName = fileName.replace(/\.[^/.]+$/, "");
                    let finalName = baseName;
                    let counter = 1;
                    
                    // 迴圈檢查以避免名稱重複，若重複則自動加上序號 (例如: script_1, script_2)
                    while (scripts.find(s => s.name === finalName)) {
                        finalName = `${baseName}_${counter++}`;
                    }
                    
                    addScript(finalName, content);
                    resolve({ name: finalName, content, action: 'add' });
                }
            };
            reader.onerror = () => reject("檔案讀取失敗。");
            reader.readAsText(file);
        });
    }

    // 初始化
    init();

    return {
        getScriptList,
        getScriptContent,
        saveScript,
        addScript,
        deleteScript,
        renameScript,
        setMainScript,
        updateMainScriptContent,
        handleFileUpload,
        onScriptListChanged,
        getCurrentScriptName,
        setCurrentScriptName
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    const runButton = document.getElementById('run-button');
    const loadExampleBtn = document.getElementById('load-example-btn');
    const scriptEditor = document.getElementById('script-editor');
    const toggleSidebar = document.getElementById('toggle-sidebar');
    const editorContainer = document.getElementById('editor-container');
    const syntaxPreview = document.getElementById('syntax-preview');

    // 範例劇本內容
    const exampleScript = `
    # 故事開始，播放輕柔的背景音樂
    [BGM_PLAY: assets/music/FairyTale.mp3, 0.7, true]
    旁白：在一個遙遠的王國，寧靜的夜晚悄然降臨。

    # 播放夜晚的蟲鳴聲，增加氣氛
    [SFX_PLAY: assets/sound/comedic-silence-90574.mp3, 0.5]
    公主：你聽... 是夏夜的協奏曲。

    # 劇情轉折，音樂淡出
    旁白：突然，一陣強光劃破天際，音樂也隨之靜默。
    [BGM_FADE_OUT: 5]
    旁白：......

    # 新的BGM淡入
    [BGM_FADE_IN: 3, assets/music/FairyTale.mp3, 0.6, true]
    騎士：別擔心，殿下，有我在此。

    # --- 場景 1：開闊的草原 ---
    BG|bg_room01
    CHARA|SHOW|hero|happy|left
    SAY|公主|看啊！這片草原多麼開闊，真想永遠待在這裡。

    # 騎士進入畫面，同時顯示兩個人
    CHARA|SHOW|kinght|full|right
    SAY|騎士|公主殿下，屬下必須提醒您，邊境最近並不平靜。

    # 角色表情改變 (公主驚訝)
    CHARA|SHOW|hero|suprised|left
    SAY|公主|咦？難道父王又收到了什麼奇怪的情報嗎？

    # 角色表情改變 (公主生氣)
    CHARA|SHOW|hero|angery|left
    SAY|公主|每次我想出來透透氣，你總是拿這些理由來煩我！

    # 騎士回應 (注意：此時左側公主會自動變暗)
    SAY|騎士|屬下只是擔心您的安危。天色將晚，請您決定下一步。

    # --- 分支測試 ---
    CHOICE|留在草原看夕陽:stay_path|前往夜晚的廣場:plaza_path

    # --- 分支 A：留在草原 ---
    LABEL|stay_path
    SAY|公主|我決定了，我要看完夕陽再走。
    SAY|騎士|既然如此，屬下會誓死守護您的安全。
    GOTO|ending

    # --- 分支 B：前往廣場 ---
    LABEL|plaza_path
    SAY|公主|好吧，那我們去廣場看看燈火吧。

    # 背景切換至晚上的廣場
    BG|bg_room02
    CHARA|SHOW|hero|happy|left
    SAY|公主|哇！晚上的廣場果然很熱鬧，幸好有聽你的建議。
    GOTO|ending

    # --- 結局 ---
    LABEL|ending
    CHARA|CLEAR
    SAY|系統|實驗腳本執行結束。

    `;

    /**
     * 初始化編輯器界面內容
     * 從 ScriptManager 讀取當前設定的腳本並填入 textarea。
     */
    function initEditor() {
        const currentName = ScriptManager.getCurrentScriptName();
        const content = ScriptManager.getScriptContent(currentName);
        if (scriptEditor) {
            scriptEditor.value = content;
            updatePreview(content);
        }
    }

    /**
     * 切換編輯中的腳本邏輯
     * 包含三個核心步驟：
     * 1. 自動儲存舊腳本當前的編輯內容，避免資料流失。
     * 2. 更新 ScriptManager 的內部狀態為新腳本名稱。
     * 3. 讀取新腳本內容並重新渲染編輯器界面與語法預覽。
     *
     * @param {string} newName 欲切換到的新腳本名稱
     */
    function switchScript(newName) {
        if (!scriptEditor) return;
        
        // 1. 自動儲存當前舊腳本的內容
        const oldName = ScriptManager.getCurrentScriptName();
        ScriptManager.saveScript(oldName, scriptEditor.value);
        
        // 2. 更新當前編輯腳本名稱並載入新腳本內容
        ScriptManager.setCurrentScriptName(newName);
        const newContent = ScriptManager.getScriptContent(newName);
        scriptEditor.value = newContent;
        
        // 3. 更新界面預覽
        updatePreview(newContent);
        
        console.log(`[ScriptEditor] Switched to script: ${newName}`);
    }

    // 側邊欄收合與展開邏輯
    if (toggleSidebar && editorContainer) {
        toggleSidebar.addEventListener('click', () => {
            // 切換 CSS class 來縮放側邊欄
            editorContainer.classList.toggle('collapsed');
            // 根據狀態改變箭頭方向
            toggleSidebar.textContent = editorContainer.classList.contains('collapsed') ? '▶' : '◀';
        });
    }

    // 即時語法預覽與自動儲存
    if (scriptEditor && syntaxPreview) {
        scriptEditor.addEventListener('input', (e) => {
            // 更新下方即時語法預覽區塊
            updatePreview(e.target.value);
            
            // 策略：每次輸入時皆即時儲存當前內容至 LocalStorage
            // 這能確保分頁關閉或重新整理後進度不遺失
            ScriptManager.saveScript(ScriptManager.getCurrentScriptName(), e.target.value);
        });
    }

    /**
     * 更新語法即時分析預覽區塊
     * 抓取編輯器最後一行的內容進行簡易語法剖析，並顯示狀態資訊。
     * @param {string} text 編輯器目前的完整內容
     */
    function updatePreview(text) {
        if (!syntaxPreview) return;
        
        const lines = text.split('\n');
        const currentLine = lines[lines.length - 1] || ""; // 取出最後一行來分析 (模擬當前輸入行)
        
        // 顯示基本狀態：腳本名稱與總行數
        let analysis = `[當前腳本: ${ScriptManager.getCurrentScriptName()}] [行數: ${lines.length}] `;
        
        // 簡易正則/字串比對，識別常用指令並顯示提示
        if (currentLine.startsWith('SAY|')) {
            const parts = currentLine.split('|');
            analysis += `對話指令 -> 角色: ${parts[1] || '?'}, 內容: ${parts[2] || '...'}`;
        } else if (currentLine.startsWith('BG|')) {
            analysis += `背景切換 -> 場景 ID: ${currentLine.split('|')[1] || '?'}`;
        } else if (currentLine.startsWith('SPRITE|')) {
            analysis += `立繪指令 -> 標籤: ${currentLine.split('|')[1] || '?'}`;
        } else if (currentLine.startsWith('CHARA|SHOW|')) {
            // --- 修改區塊：CHARA|SHOW 指令解析邏輯優化 ---
            // 邏輯：將 CHARA|SHOW|角色|表情|方位 合併為 角色_表情_方位首字母(大寫)
            // 例如：CHARA|SHOW|hero|suprised|left -> CHARA|SHOW|hero_suprised_L|left
            const parts = currentLine.split('|');
            if (parts.length >= 5) {
                const charName = parts[2];
                const expression = parts[3];
                const position = parts[4];
                const posSuffix = position.charAt(0).toUpperCase();
                const combinedFileName = `${charName}_${expression}_${posSuffix}`;
                
                analysis += `角色顯示 -> 原始: ${charName}, 合併後檔名: ${combinedFileName} (位置: ${position})`;
            } else {
                analysis += `角色顯示 -> 指令格式不完整`;
            }
            // --- 修改結束 ---
        } else if (currentLine.trim() === "") {
            analysis += `空行`;
        } else {
            analysis += `未知或處理中: ${currentLine}`;
        }

        syntaxPreview.textContent = analysis;
    }

    /**
     * 「執行腳本 (Run)」按鈕邏輯
     * 1. 將當前內容手動存檔
     * 2. 透過 postMessage 將劇本內容傳送回遊戲主視窗
     * 3. 觸發遊戲引擎重新載入或執行該劇本
     */
    if (runButton && scriptEditor) {
        runButton.addEventListener('click', () => {
            let scriptText = scriptEditor.value;

            // --- 修改區塊：執行前自動轉換 CHARA|SHOW 指令內容 ---
            // 邏輯：遍歷每一行，若是 CHARA|SHOW 指令則執行合併轉換
            const lines = scriptText.split('\n');
            const processedLines = lines.map(line => {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('CHARA|SHOW|')) {
                    const parts = trimmedLine.split('|');
                    if (parts.length >= 5) {
                        const charName = parts[2];
                        const expression = parts[3];
                        const position = parts[4];
                        const posSuffix = position.charAt(0).toUpperCase();
                        const combinedFileName = `${charName}_${expression}_${posSuffix}`;
                        
                        // 替換為合併後的格式：CHARA|SHOW|合併檔名|方位
                        // 注意：這裡根據需求將原本的角色與表情欄位合併為一個，並保留最後的方位欄位
                        return `CHARA|SHOW|${combinedFileName}|${position}`;
                    }
                }
                return line;
            });
            scriptText = processedLines.join('\n');
            // --- 修改結束 ---

            const currentName = ScriptManager.getCurrentScriptName();
            
            // 強制儲存目前內容至本地
            ScriptManager.saveScript(currentName, scriptText);
            console.log(`[ScriptEditor] Script "${currentName}" saved.`);
            
            // 跨視窗通訊：發送內容至父視窗 (Game Kernel)
            if (window.opener) {
                window.opener.postMessage({
                    type: 'UPDATE_SCRIPT',
                    script: scriptText,
                    scriptName: currentName
                }, '*');
            } else {
                // 若找不到開啟者 (例如直接開網址而非從遊戲點開)，則提示無法同步
                console.warn("[ScriptEditor] Cannot find opener window!");
                alert(`劇本 "${currentName}" 已儲存至本地，但找不到主遊戲視窗（無法即時執行）。`);
            }
        });
    }

    /**
     * 「載入範例」按鈕邏輯
     * 將預設的教學範例文字直接填入當前編輯器，並同步儲存。
     */
    if (loadExampleBtn && scriptEditor) {
        loadExampleBtn.addEventListener('click', () => {
            scriptEditor.value = exampleScript;
            updatePreview(exampleScript);
            ScriptManager.saveScript(ScriptManager.getCurrentScriptName(), exampleScript);
            console.log("[ScriptEditor] Example script loaded into current script.");
        });
    }

    // 檔案上傳按鈕邏輯
    const fileUploader = document.getElementById('file-uploader');
    const uploadBtn = document.getElementById('upload-script-btn');
    const overwriteCheckbox = document.getElementById('overwrite-main-checkbox');

    if (uploadBtn && fileUploader && overwriteCheckbox) {
        uploadBtn.addEventListener('click', () => fileUploader.click());
        fileUploader.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const overwrite = overwriteCheckbox.checked;
            try {
                const result = await ScriptManager.handleFileUpload(file, overwrite);
                alert(`腳本 "${result.name}" 已成功${result.action === 'add' ? '新增' : '覆蓋'}。`);
                // 切換到新腳本或刷新當前腳本
                switchScript(result.action === 'add' ? result.name : ScriptManager.getCurrentScriptName());
            } catch (error) {
                alert(`錯誤: ${error}`);
            }
        });
    }
    
    // 初始化編輯器內容
    initEditor();

    // 暴露 ScriptManager 到全域（如果 UI 部分需要調用）
    window.ScriptManager = ScriptManager;
    // 暴露切換功能以便 UI 操作
    window.switchScript = switchScript;

    console.log("Script Editor Multi-Script Management Initialized");
});
