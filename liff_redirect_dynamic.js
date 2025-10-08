// ===【設定區】===
const liffId = "2007824757-dzj7w1bM"; // ★ 你的 LIFF ID
const baseUrl = "http://220.133.248.150:81/WebCRM/Metec/"; // ★ ASP.NET 網站根路徑
const pageMap = {
  home: "Home.aspx",
  vocation: "VacationQuery.aspx",
  report: "Report.aspx",
  approval: "Approval.aspx",
};

// ★ 除錯開關（true = 顯示資訊但不跳轉）
const DEBUG_MODE = false;

// ===【主程式區】===
async function initLiffAndRedirect() {
  try {
    // 1️⃣ 初始化 LIFF
    await liff.init({ liffId });

    // 2️⃣ 檢查登入狀態
    if (!liff.isLoggedIn()) {
      const redirectUri = window.location.href; // 登入後回到原頁
      console.log("未登入 → 自動導回:", redirectUri);
      liff.login({ redirectUri });
      return;
    }

    // 3️⃣ 已登入 → 取得使用者資料
    const profile = await liff.getProfile();
    const userId = encodeURIComponent(profile.userId);
    const displayName = encodeURIComponent(profile.displayName);

    // 4️⃣ 取得 page 參數
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get("page")?.toLowerCase() || "home";

    // 5️⃣ 判斷目標頁面是否存在
    const targetPage = pageMap[page];
    if (!targetPage) {
      // ❌ 不存在的 page 參數
      console.warn(`未定義的頁面參數: ${page}`);
      document.body.innerHTML = `
        <h1 style="color:#FF6600;">此網頁施工中...</h1>
        <p>您要求的頁面（${page}）目前尚未開放。</p>
        <button onclick="goHome()">🔙 回首頁</button>
        <p style="color:#777;margin-top:15px;">請稍後再試或回主選單。</p>
      `;
      return;
    }

    // 6️⃣ 建立轉址 URL
    const targetUrl = `${baseUrl}${targetPage}?userId=${userId}&displayName=${displayName}`;

    // === 除錯模式處理 ===
    if (DEBUG_MODE) {
      document.getElementById("debugBox").style.display = "block";
      document.getElementById("debugUserId").textContent = decodeURIComponent(userId);
      document.getElementById("debugDisplayName").textContent = decodeURIComponent(displayName);
      document.getElementById("debugTarget").textContent = targetUrl;
      console.log("🧩 [DEBUG] 不執行跳轉，僅顯示資訊。");
      return;
    }

    // 7️⃣ 實際轉址
    console.log(`🔗 Redirecting to: ${targetUrl}`);
    window.location.href = targetUrl;

  } catch (err) {
    console.error("❌ LIFF 初始化錯誤:", err);
    document.body.innerHTML = `
      <h2 style="color:red;">載入失敗</h2>
      <p>無法初始化 LINE LIFF，請重新開啟。</p>
      <p style="color:#666;">錯誤訊息：${err.message}</p>
      <button onclick="goHome()">🔙 回首頁</button>
    `;
  }
}

// === 回首頁功能 ===
function goHome() {
  const homeUrl = `https://liff.line.me/${liffId}?page=home`;
  window.location.href = homeUrl;
}

// 🚀 執行主程式
initLiffAndRedirect();
