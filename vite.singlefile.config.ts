import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// 모든 JS/CSS를 index.html 한 파일로 인라인 → file:// 로 더블클릭 실행 가능
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { outDir: "dist-single", cssCodeSplit: false, assetsInlineLimit: 100000000 },
});
