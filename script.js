// 🚀 替換成你的 LIFF ID
const LIFF_ID = "2007824757-dzj7w1bM";
let lineProfile = null;

window.onload = async () => {
  const loadingOverlay = document.getElementById("loadingOverlay");
  const mainContent = document.getElementById("mainContent");

  try {
    await liff.init({ liffId: LIFF_ID });

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    // 取得使用者 LINE Profile
    lineProfile = await liff.getProfile();
    console.log("✅ LINE Profile:", lineProfile);

    // 顯示主畫面
    loadingOverlay.style.display = "none";
    mainContent.classList.remove("opacity-0", "pointer-events-none");
    mainContent.classList.add("opacity-100");

    // 綁定頁籤事件
    document.querySelectorAll("button[id^='tab']").forEach(btn => {
      btn.addEventListener("click", () => switchTab(btn.id));
    });

  } catch (err) {
    console.error("❌ LIFF 初始化錯誤:", err);
    loadingOverlay.innerHTML = `
      <p class="text-red-400 text-xl font-bold">無法載入 LIFF，請重新開啟。</p>
      <p class="mt-2 text-sm text-gray-300">${err.message}</p>
    `;
  }
};

// 📑 頁籤切換控制
function switchTab(tabId) {
  document.querySelectorAll("button[id^='tab']").forEach(btn => {
    if (btn.id === tabId) {
      btn.classList.add("border-blue-500", "font-bold");
      btn.classList.remove("text-gray-500");
    } else {
      btn.classList.remove("border-blue-500", "font-bold");
      btn.classList.add("text-gray-500");
    }
  });

  const target = tabId.replace("tab", "page");
  document.querySelectorAll("#content > div").forEach(div => div.classList.add("hidden"));
  document.getElementById(target).classList.remove("hidden");
}

// 🚪 按鈕點擊 → 轉址帶 LINE ID
function redirectWithLineInfo(targetUrl) {
  if (!lineProfile) {
    alert("正在載入使用者資料，請稍候再試。");
    return;
  }

  const userId = encodeURIComponent(lineProfile.userId);
  const displayName = encodeURIComponent(lineProfile.displayName);
  const redirectUrl = `${targetUrl}?userId=${userId}&displayName=${displayName}`;

  console.log("🔗 Redirect to:", redirectUrl);

  if (liff.isInClient()) {
    liff.openWindow({ url: redirectUrl, external: false });
  } else {
    window.location.href = redirectUrl;
  }
}
