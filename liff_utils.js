// liff_utils.js

/**
 * 初始化 LIFF 並獲取使用者個人資料。
 * @param {string} liffId - 你的 LIFF ID。
 * @param {HTMLElement} displayElement - 用於顯示使用者名稱的 DOM 元素。
 * @param {HTMLElement} inputElement - 用於自動填入使用者名稱的 input 元素。
 * @returns {Promise<Object>} - 成功則返回 Promise 包裹的 profile 物件，失敗則拒絕 Promise。
 */
async function initLiffAndGetProfile(liffId, displayElement, inputElement) {
    try {
        await liff.init({ liffId: liffId });

        if (!liff.isLoggedIn()) {
            liff.login();
            // LIFF Login 會導致頁面跳轉，所以這裡通常不需要額外的 return 或錯誤處理
            // 因為頁面會重新載入，並從頭執行 main()
            return Promise.reject("未登入，已導向 LIFF 登入頁面。"); 
        }

        const profile = await liff.getProfile();
        if (displayElement) {
            displayElement.textContent = `👤 目前登入者：${profile.displayName}`;
        }
        if (inputElement) {
            inputElement.value = profile.displayName;
        }
        return profile; // 返回 profile 物件供頁面使用

    } catch (err) {
        if (displayElement) {
            displayElement.textContent = "⚠️ 無法取得使用者資訊，請檢查 LIFF 設定或網路連線。";
        }
        console.error("LIFF 初始化或獲取資料錯誤:", err);
        return Promise.reject(err); // 拒絕 Promise 以傳遞錯誤
    }
}

/**
 * 顯示狀態訊息。
 * @param {HTMLElement} statusElement - 顯示訊息的 DOM 元素。
 * @param {string} message - 要顯示的訊息文字。
 * @param {string} type - 訊息類型 ('success' 或 'error')。
 * @param {boolean} [autoHide=true] - 訊息是否自動隱藏。
 * @param {number} [duration=3000] - 訊息自動隱藏的持續時間 (毫秒)。
 */
function showStatusMessage(statusElement, message, type, autoHide = true, duration = 3000) {
    statusElement.textContent = message;
    statusElement.className = `message ${type} show`; 
    
    if (autoHide) {
        setTimeout(() => {
            statusElement.classList.remove("show"); 
        }, duration);
    }
}

/**
 * 處理表單提交的核心邏輯。
 * @param {HTMLFormElement} formElement - 要處理的表單 DOM 元素。
 * @param {HTMLElement} submitButton - 提交按鈕 DOM 元素。
 * @param {HTMLElement} statusElement - 顯示狀態訊息的 DOM 元素。
 * @param {string} scriptURL - Google Apps Script 的部署 URL。
 * @param {Function} [onSuccessCallback] - 提交成功後執行的回呼函數 (可選)。
 * @param {Function} [onErrorCallback] - 提交失敗後執行的回呼函數 (可選)。
 */
async function handleFormSubmission(formElement, submitButton, statusElement, scriptURL, onSuccessCallback = () => {}, onErrorCallback = () => {}) {
    submitButton.disabled = true;
    submitButton.textContent = "資料送出中...";

    const formData = new FormData(formElement);

    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            body: formData 
        });

        if (response.ok) {
            showStatusMessage(statusElement, "✅ 資料已成功送出！", "success");
            onSuccessCallback(); // 執行成功回呼
        } else {
            const errorText = await response.text();
            showStatusMessage(statusElement, `❌ 送出失敗！錯誤: ${errorText}`, "error", false); 
            console.error("提交失敗的 HTTP 響應:", response.status, errorText);
            onErrorCallback(errorText); // 執行失敗回呼
        }
    } catch (err) {
        showStatusMessage(statusElement, "❌ 提交時發生錯誤，請檢查網路連線或服務。", "error", false); 
        console.error("Fetch 錯誤:", err);
        onErrorCallback(err.message); // 執行失敗回呼
    } finally {
        setTimeout(() => {
            submitButton.disabled = false;
            submitButton.textContent = "送出資料";
        }, 3000); 
    }
}