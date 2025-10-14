/**
 * 初始化 LIFF 並獲取使用者個人資料。
 * @param {string} liffId - 你的 LIFF ID。
 * @param {HTMLElement} displayElement - 用於顯示使用者名稱的 DOM 元素。
 * @param {HTMLElement} inputElement - 用於自動填入使用者名稱的 input 元素。
 * @returns {Promise<Object>} - 成功則返回 Promise 包裹的 profile 物件，失敗則拒絕 Promise。
 */
async function initLiffAndGetProfile(liffId, displayElement, inputElement) {
    try {
        // 確保 liffId 是有效的字串
        if (!liffId || typeof liffId !== 'string' || liffId.trim() === '') {
            throw new Error("liffId is necessary for liff.init()");
        }
        
        await liff.init({ liffId: liffId });

        if (!liff.isLoggedIn()) {
            liff.login();
            return Promise.reject("未登入，已導向 LIFF 登入頁面。");
        }

        const profile = await liff.getProfile();
        const lineDisplayName = profile.displayName; // 取得 LINE 顯示名稱
        let displayUserName = lineDisplayName; // 預設顯示名稱為 LINE 顯示名稱

        // 從 GAS 查詢實際名字 (僅用於前端顯示)
        if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.gasScriptURL) {
            try {
                const response = await fetch(`${APP_CONFIG.gasScriptURL}?action=getActualNameByLineDisplayName&lineDisplayName=${encodeURIComponent(lineDisplayName)}`);
                const data = await response.json();

                if (data && data.actualName) {
                    displayUserName = data.actualName; // 如果找到實際名字，則前端顯示實際名字
                }
            } catch (fetchError) {
                console.warn("從 GAS 獲取實際名字失敗，將使用 LINE 顯示名稱:", fetchError);
            }
        } else {
            console.warn("APP_CONFIG.gasScriptURL 未定義，無法查詢實際名字。請確認 config.js 已正確載入並設定。");
        }

        // 【修正點】顯示在頁面頂部的名稱 (可以顯示實際名字)
        if (displayElement) {
            displayElement.textContent = `👤 目前登入者：${displayUserName}`;
        }
        // 【修正點】填入表單欄位的名稱 (必須是 LINE 顯示名稱，用於後端比對)
        if (inputElement) {
            inputElement.value = lineDisplayName; // 表單欄位填入 LINE 顯示名稱
        }
        return profile;

    } catch (err) {
        if (displayElement) {
            displayElement.textContent = "⚠️ 無法取得使用者資訊，請檢查 LIFF 設定或網路連線。";
        }
        console.error("LIFF 初始化或獲取資料錯誤:", err);
        return Promise.reject(err);
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
 * 獲取今天的日期，格式為 YYYY-MM-DD。
 * @returns {string} - 當前日期字串。
 */
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 處理表單提交的核心邏輯。
 * @param {HTMLFormElement} formElement - 要處理的表單 DOM 元素。
 * @param {HTMLElement} submitButton - 提交按鈕 DOM 元素。
 * @param {HTMLElement} statusElement - 顯示狀態訊息的 DOM 元素。
 * @param {string} scriptURL - Google Apps Script 的部署 URL。
 * @param {string} action - 要傳遞給 GAS 的動作名稱 (例如 'submitCustomerData')。
 * @param {Function} [onSuccessCallback] - 提交成功後執行的回呼函數 (可選)。
 * @param {Function} [onErrorCallback] - 提交失敗後執行的回呼函數 (可選)。
 */
async function handleFormSubmission(formElement, submitButton, statusElement, scriptURL, action, onSuccessCallback = () => {}, onErrorCallback = () => {}) {
    submitButton.disabled = true;
    submitButton.textContent = "資料送出中...";

    const formData = new FormData(formElement);
    formData.append('action', action); // 添加 action 參數

    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            body: formData 
        });

        if (response.ok) {
            showStatusMessage(statusElement, "✅ 資料已成功送出！", "success");
            onSuccessCallback();
        } else {
            const errorText = await response.text();
            showStatusMessage(statusElement, `❌ 送出失敗！錯誤: ${errorText}`, "error", false); 
            console.error("提交失敗的 HTTP 響應:", response.status, errorText);
            onErrorCallback(errorText);
        }
    } catch (err) {
        showStatusMessage(statusElement, "❌ 提交時發生錯誤，請檢查網路連線或服務。", "error", false); 
        console.error("Fetch 錯誤:", err);
        onErrorCallback(err.message);
    } finally {
        setTimeout(() => {
            submitButton.disabled = false;
            submitButton.textContent = "送出資料";
        }, 3000); 
    }
}
