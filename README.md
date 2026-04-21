# 工務修復助手 PWA — Vercel 部署說明

## 正確的檔案結構（重要！）

上傳到 GitHub 時，結構必須長這樣：

```
（repo 根目錄）
├── api/
│   └── analyze.js     ← AI 代理 Function
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── index.html         ← APP 主體
├── manifest.json      ← PWA 設定
├── sw.js              ← Service Worker
└── vercel.json        ← Vercel 設定
```

⚠️ index.html 必須在根目錄，不能在 public/ 子資料夾裡。

---

## 部署步驟

### 第一步：上傳到 GitHub
1. 前往 github.com 建立新 repo
2. 解壓縮 ZIP 後，把**裡面所有檔案**拖曳上傳
3. Commit changes

### 第二步：連結 Vercel
1. 前往 vercel.com → Add New Project
2. Import 剛才的 GitHub repo
3. **Framework Preset 選「Other」**
4. 不要更改任何設定，直接按 Deploy

### 第三步：設定 API Key
部署後進入：Project → Settings → Environment Variables

新增：
- Name：`ANTHROPIC_API_KEY`
- Value：`sk-ant-api03-你的金鑰`
- 三個環境都勾選（Production / Preview / Development）

### 第四步：Redeploy
設定完 Key 後，進入 Deployments → 點最新一筆右邊的 `...` → Redeploy

---

## 同仁使用方式

取得 Vercel 網址後產出 QR Code 發給同仁：

**iPhone：** Safari 開啟 → 分享 → 加入主畫面
**Android：** Chrome 開啟 → 右上角選單 → 新增到主畫面

---

## 費用
- Vercel：免費
- Anthropic API：每次分析約 NT$0.5～2 元
- 建議在 console.anthropic.com 設定每月用量上限
