import { defineConfig } from "vite";

/**
 * Vite 專案配置設定檔
 */
export default defineConfig({
  // 指定靜態資源目錄為 "assets"，確保圖片、音效等資源能被正確讀取
  publicDir: "assets",
});
