/**
 * Script Editor 腳本編輯器邏輯
 * 負責處理獨立視窗中的劇本編輯、本地儲存、即時語法預覽以及與遊戲主視窗的通訊 (postMessage)
 */

document.addEventListener('DOMContentLoaded', () => {
    const runButton = document.getElementById('run-button');
    const loadExampleBtn = document.getElementById('load-example-btn');
    const scriptEditor = document.getElementById('script-editor');
    const toggleSidebar = document.getElementById('toggle-sidebar');
    const editorContainer = document.getElementById('editor-container');
    const syntaxPreview = document.getElementById('syntax-preview');

    // 範例劇本內容
    const exampleScript = `# --- 場景 1：開闊的草原 ---
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
SAY|系統|實驗腳本執行結束。`;

    // 1. 初始化時載入上一次儲存的劇本 (從 LocalStorage 讀取)
    const savedScript = localStorage.getItem('savedScript');
    if (savedScript && scriptEditor) {
        scriptEditor.value = savedScript;
        updatePreview(savedScript); // 初始化時即同步更新語法預覽
    }

    // 2. 側邊欄收合與展開邏輯：增加編輯器的可用可視空間
    if (toggleSidebar && editorContainer) {
        toggleSidebar.addEventListener('click', () => {
            // 切換 CSS class 來觸發 transition 動畫
            editorContainer.classList.toggle('collapsed');
            // 根據目前狀態切換按鈕文字 (方向箭頭)
            toggleSidebar.textContent = editorContainer.classList.contains('collapsed') ? '▶' : '◀';
        });
    }

    // 3. 即時語法預覽：使用者輸入時立即觸發解析與顯示
    if (scriptEditor && syntaxPreview) {
        scriptEditor.addEventListener('input', (e) => {
            // 使用者每輸入一個字就更新下方預覽區塊
            updatePreview(e.target.value);
        });
    }

    /**
     * 更新語法預覽區塊：解析目前的腳本內容並顯示解析資訊
     * @param {string} text 當前編輯器內部的所有文字
     */
    function updatePreview(text) {
        if (!syntaxPreview) return;
        
        const lines = text.split('\n');
        // 取得使用者正在編輯的最後一行，提供即時指令分析回饋
        const currentLine = lines[lines.length - 1] || "";
        
        let analysis = `[行數: ${lines.length}] `;
        
        // 語法識別邏輯：根據指令關鍵字判斷功能
        if (currentLine.startsWith('SAY|')) {
            const parts = currentLine.split('|');
            // 解析對話指令：SAY|角色名稱|對話內容
            analysis += `對話指令 -> 角色: ${parts[1] || '?'}, 內容: ${parts[2] || '...'}`;
        } else if (currentLine.startsWith('BG|')) {
            // 解析背景切換：BG|場景名稱
            analysis += `背景切換 -> 場景 ID: ${currentLine.split('|')[1] || '?'}`;
        } else if (currentLine.startsWith('SPRITE|')) {
            // 解析立繪指令：SPRITE|角色Key|位置|圖像Key
            analysis += `立繪指令 -> 標籤: ${currentLine.split('|')[1] || '?'}`;
        } else if (currentLine.trim() === "") {
            analysis += `空行`;
        } else {
            // 未匹配到關鍵字時的提示
            analysis += `未知或處理中: ${currentLine}`;
        }

        // 將解析結果渲染到預覽視窗
        syntaxPreview.textContent = analysis;
    }

    // 4. 執行與儲存功能：點擊按鈕後儲存至本地並同步到遊戲主畫面
    if (runButton && scriptEditor) {
        runButton.addEventListener('click', () => {
            const scriptText = scriptEditor.value;
            
            // 將當前劇本儲存至 LocalStorage，方便下次開啟編輯器時自動回復
            localStorage.setItem('savedScript', scriptText);
            console.log(`[ScriptEditor] Script saved to LocalStorage.`);
            
            console.log(`[ScriptEditor] Sending script update to opener.`);
            
            // 核心通訊：使用 postMessage 將新劇本發送回開啟此編輯器的視窗 (GameKernel)
            if (window.opener) {
                window.opener.postMessage({
                    type: 'UPDATE_SCRIPT',
                    script: scriptText
                }, '*');
            } else {
                // 如果是獨立開啟而非從遊戲點開，則提示無法即時更新
                console.warn("[ScriptEditor] Cannot find opener window! Script saved but not sent.");
                alert("劇本已儲存至本地，但找不到主遊戲視窗，無法即時套用。");
            }
        });
    }

    // 5. 快速載入功能：載入預設的範本劇本供參考
    if (loadExampleBtn && scriptEditor) {
        loadExampleBtn.addEventListener('click', () => {
            // 將預先定義好的範本填入編輯器
            scriptEditor.value = exampleScript;
            // 載入範例後也需要立即更新語法預覽
            updatePreview(exampleScript);
            console.log("[ScriptEditor] Example script loaded.");
        });
    }

    console.log("Script Editor Initialized with UI Enhancements");
});
