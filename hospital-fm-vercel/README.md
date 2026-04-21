# 工務修復助手 PWA — Vercel 部署說明

## 檔案結構

```
hospital-fm-vercel/
├── api/
│   └── analyze.js        ← Serverless Function（AI 代理，Key 保存在這裡）
├── public/
│   ├── index.html        ← APP 主體
│   ├── manifest.json     ← PWA 設定
│   ├── sw.js             ← Service Worker（離線快取）
│   └── icons/            ← APP 圖示
└── vercel.json           ← Vercel 路由設定
```

---

## 部署步驟（10 分鐘完成）

### 第一步：註冊 Vercel
前往 https://vercel.com 免費註冊（建議用 GitHub 帳號登入）

### 第二步：上傳專案
1. 解壓縮這個 ZIP 檔
2. 在 Vercel 控制台點「Add New Project」
3. 選「Browse」上傳資料夾，或把資料夾拖曳進去

### 第三步：設定 API Key（關鍵步驟）
在 Vercel 部署前，必須設定環境變數：

1. 進入專案 → Settings → Environment Variables
2. 新增一筆：
   - **Name**：`ANTHROPIC_API_KEY`
   - **Value**：貼上你的 sk-ant-api03-xxxx 金鑰
   - Environment：勾選 Production、Preview、Development
3. 點 Save

### 第四步：Deploy
點「Deploy」，等待約 1 分鐘

### 第五步：取得網址
部署完成後會得到網址，例如：
`https://hospital-fm-xxxx.vercel.app`

---

## 同仁安裝方式

把網址做成 QR Code 發給同仁，掃碼後：

**iPhone（Safari）：**
分享按鈕 → 「加入主畫面」→ 確認

**Android（Chrome）：**
右上角 ⋮ → 「新增到主畫面」→ 確認

加入後桌面會出現「工務FM」圖示，與一般 APP 無異。

---

## 費用說明

| 項目 | 費用 |
|------|------|
| Vercel 主機 | 免費（每月 100GB 流量）|
| Anthropic API | 依使用量計費，約每次分析 NT$0.5~2 元 |

建議設定 Anthropic 帳號的用量上限，避免意外超支：
前往 console.anthropic.com → Settings → Limits → 設定 Monthly Budget

---

## 常見問題

**Q：同仁不需要任何帳號就能用？**
A：對，打開網址直接用，API Key 只有管理員知道。

**Q：圖片會被儲存嗎？**
A：不會，圖片只在分析當下傳給 AI，不儲存於任何伺服器。

**Q：如何更換 API Key？**
A：Vercel 控制台 → Settings → Environment Variables → 編輯 ANTHROPIC_API_KEY → Redeploy。
