# 工務修復助手 PWA — Vercel 部署說明（Gemini 免費版）

## 檔案結構

```
（repo 根目錄）
├── api/
│   └── analyze.js     ← AI 代理（使用 Gemini 免費 API）
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── index.html
├── manifest.json
├── sw.js
├── vercel.json
└── README.md
```

---

## 第一步：取得 Gemini 免費 API Key

1. 前往 https://aistudio.google.com
2. 用 Google 帳號登入
3. 點左側「Get API Key」→「Create API Key」
4. 複製金鑰（格式：AIzaSy...）

免費額度：每天 1,500 次、每分鐘 15 次，醫院工務完全夠用。

---

## 第二步：上傳到 GitHub

1. 前往 github.com 建立新 repo（命名如 hospital-fm）
2. 解壓縮 ZIP，把所有檔案拖曳上傳到 repo 根目錄
3. Commit changes

---

## 第三步：部署到 Vercel

1. 前往 vercel.com → Add New Project
2. Import 剛才的 GitHub repo
3. Framework Preset 選「Other」
4. 直接按 Deploy

---

## 第四步：設定 Gemini API Key（關鍵）

1. 進入 Vercel 專案 → Settings → Environment Variables
2. 新增：
   - Name：  GEMINI_API_KEY
   - Value：  AIzaSy你的金鑰
   - 三個環境都勾選
3. 點 Save

---

## 第五步：Redeploy

Settings 設定完後，進入 Deployments → 最新一筆右邊 ... → Redeploy

---

## 同仁安裝

取得 Vercel 網址後產 QR Code 給同仁：
- iPhone：Safari 開啟 → 分享 → 加入主畫面
- Android：Chrome 開啟 → 右上角選單 → 新增到主畫面

---

## 費用

| 項目 | 費用 |
|------|------|
| Vercel 主機 | 免費 |
| Gemini API | 免費（每天 1,500 次）|
| 合計 | 完全免費 |
