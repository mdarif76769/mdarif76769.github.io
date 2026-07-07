// GitHub Configuration
const GITHUB_USER = "mdarif76769";
const GITHUB_REPO = "mdarif76769.github.io";
const BASE_CDN = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/DATA/`;
const API_URL = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/DATA`;
const COUNTER_API_BASE = "https://api.counterapi.dev/v1";
const NAMESPACE = `RS5_store_production_${GITHUB_USER}`;

let cachedFetchedApps = [];
let globalDownloadStats = JSON.parse(localStorage.getItem('RS5_stats_backup')) || {};

// ================= [ ব্রুট-ফোর্স প্রোটেকশন ও সিকিউরিটি কনফিগারেশন ] =================
const MAX_ATTEMPTS = 5;
const COOLDOWN_TIME = 60000; // ১ মিনিট (মিলিসেকেন্ডে)

// আপনার Base64 বা এনক্রিপ্টেড ভ্যালু এখানে বসাবেন (যেমন: "Y2hhbmdlbWU=")
const ENCRYPTED_VAULT = "NDUzNQ=="; 
let sessionAuthenticated = sessionStorage.getItem("RS5_auth_token") === "granted";

function verifyTerminalPasscode() {
    const inputField = document.getElementById("terminal-pass-input");
    const errField = document.getElementById("terminal-error-log");
    const loginBtn = document.getElementById("decrypt-btn");
    if (!inputField) return;

    // ব্লকড আছে কিনা চেক
    let attempts = parseInt(localStorage.getItem("login_attempts") || "0");
    let lastAttemptTime = parseInt(localStorage.getItem("last_attempt_time") || "0");
    const currentTime = Date.now();

    if (attempts >= MAX_ATTEMPTS && (currentTime - lastAttemptTime) < COOLDOWN_TIME) {
        return; // এখনো কোল্ডডাউন পিরিয়ডে আছে
    }

    const rawInput = inputField.value.trim();

    // পাসওয়ার্ড ভেরিফিকেশন (এখানে আপনি আপনার পছন্দমতো ভ্যালিডেশন লজিক বা ডিক্রিপশন মেলাতে পারবেন)
    // উদাহরণস্বরূপ: btoa(rawInput) === ENCRYPTED_VAULT অথবা সরাসরি rawInput ভেরিফিকেশন
    let isCorrect = false;
    try {
        // যদি Base64 ম্যাচিং করতে চান
        if (btoa(rawInput) === ENCRYPTED_VAULT || rawInput === ENCRYPTED_VAULT) {
            isCorrect = true;
        } else {
            // আপনার পূর্বের CryptoJS মেথড ফলব্যাক
            const decryptedBytes = CryptoJS.AES.decrypt(ENCRYPTED_VAULT, rawInput);
            const originalPayload = decryptedBytes.toString(CryptoJS.enc.Utf8);
            if (originalPayload && originalPayload.includes("ACCESS_GRANTED_VERIFIED")) {
                isCorrect = true;
            }
        }
    } catch (e) {
        isCorrect = false;
    }

    if (isCorrect) {
        // সফল লগইন
        sessionAuthenticated = true;
        sessionStorage.setItem("RS5_auth_token", "granted");
        localStorage.removeItem("login_attempts");
        localStorage.removeItem("last_attempt_time");

        document.getElementById("terminal-lock-panel").style.display = "none";
        document.getElementById("protected-store-area").style.display = "block";
        
        fetchRepositoryData();
    } else {
        // ভুল পাসওয়ার্ড ট্রাই
        attempts++;
        localStorage.setItem("login_attempts", attempts);
        localStorage.setItem("last_attempt_time", currentTime);

        if (attempts >= MAX_ATTEMPTS) {
            startCooldown(COOLDOWN_TIME);
        } else {
            if (errField) {
                errField.innerText = `❌ ACCESS DENIED. Attempts left: ${MAX_ATTEMPTS - attempts}`;
                errField.style.color = "var(--danger)";
                setTimeout(() => { errField.innerText = ""; }, 3000);
            }
            inputField.value = "";
        }
    }
}

function startCooldown(remainingTime) {
    const inputField = document.getElementById("terminal-pass-input");
    const errField = document.getElementById("terminal-error-log");
    const loginBtn = document.getElementById("decrypt-btn");
    
    if(inputField) inputField.disabled = true;
    if(loginBtn) loginBtn.disabled = true;

    let timeLeft = Math.ceil(remainingTime / 1000);

    const countdownInterval = setInterval(() => {
        timeLeft--;
        if (errField) {
            errField.innerText = `🚨 SYSTEM LOCKED! Try again in ${timeLeft}s`;
            errField.style.color = "var(--danger)";
        }

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            if(inputField) inputField.disabled = false;
            if(loginBtn) loginBtn.disabled = false;
            if(errField) errField.innerText = "";
            localStorage.removeItem("login_attempts");
            localStorage.removeItem("last_attempt_time");
        }
    }, 1000);
}

// পেজ লোড হওয়ার সময় সিকিউরিটি ও সেশন চেক
document.addEventListener("DOMContentLoaded", () => {
    const passInput = document.getElementById("terminal-pass-input");
    if (passInput) {
        passInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") verifyTerminalPasscode();
        });
    }

    let attempts = parseInt(localStorage.getItem("login_attempts") || "0");
    let lastAttemptTime = parseInt(localStorage.getItem("last_attempt_time") || "0");
    const currentTime = Date.now();

    if (attempts >= MAX_ATTEMPTS && (currentTime - lastAttemptTime) < COOLDOWN_TIME) {
        startCooldown(COOLDOWN_TIME - (currentTime - lastAttemptTime));
    }

    const lockPanel = document.getElementById("terminal-lock-panel");
    const storeArea = document.getElementById("protected-store-area");
    
    if (sessionAuthenticated) {
        if (lockPanel) lockPanel.style.display = "none";
        if (storeArea) storeArea.style.display = "block";
        fetchRepositoryData();
    } else {
        if (lockPanel) lockPanel.style.display = "grid";
        if (storeArea) storeArea.style.display = "none";
    }
});
// ========================================================================

// ইমেজ হ্যান্ডলিং
const mainLogo = document.getElementById("main-logo");
if(mainLogo) {
    mainLogo.src = `${BASE_CDN}IMAGE/image.png`;
    mainLogo.onerror = function() { this.src = "https://i.postimg.cc/mD3fzq4Y/apk-icon.png"; };
}

function formatAppName(filename) {
    return filename.replace(/\.(apk|txt)$/i, '').replace(/[-_]/g, ' ');
}

function assignBadge(filename) {
    if (filename.toLowerCase().endsWith('.txt')) return 'list';
    if (filename.toLowerCase().includes('bomber')) return 'hot';
    if (filename.toLowerCase().includes('hack') || filename.toLowerCase().includes('brute')) return 'audit';
    return 'app';
}

async function fetchRealTimeStats() {
    cachedFetchedApps.forEach(async (item) => {
        const itemCleanKey = item.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 30);
        try {
            const res = await fetch(`${COUNTER_API_BASE}/${NAMESPACE}/${itemCleanKey}`);
            if (res.ok) {
                const json = await res.json();
                globalDownloadStats[item.name] = json.count || 0;
                localStorage.setItem('RS5_stats_backup', JSON.stringify(globalDownloadStats));
                updateSingleCounter(item.name);
            }
        } catch(e) {}
    });
    setTimeout(renderRankingDashboard, 1000);
}

async function incrementCloudCounter(filename) {
    const itemCleanKey = filename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 30);
    globalDownloadStats[filename] = (globalDownloadStats[filename] || 0) + 1;
    localStorage.setItem('w8_stats_backup', JSON.stringify(globalDownloadStats));
    updateSingleCounter(filename);
    renderRankingDashboard();

    try {
        await fetch(`${COUNTER_API_BASE}/${NAMESPACE}/${itemCleanKey}/up`);
    } catch(e) {}
}

function updateSingleCounter(filename) {
    const uniqueId = btoa(filename).replace(/=/g, '');
    const element = document.getElementById(`count-label-${uniqueId}`);
    if(element) {
        element.innerText = `${globalDownloadStats[filename] || 0} Downloads`;
    }
}

function renderRankingDashboard() {
    const rankingContainer = document.getElementById("ranking-container");
    if (!rankingContainer) return;
    
    const ranked = [...cachedFetchedApps].sort((a, b) => {
        return (globalDownloadStats[b.name] || 0) - (globalDownloadStats[a.name] || 0);
    }).slice(0, 3);

    rankingContainer.innerHTML = "";
    if (ranked.length === 0) {
        rankingContainer.innerHTML = `<div style="text-align:center;color:var(--cyan);font-size:11px;">No stats available.</div>`;
        return;
    }

    ranked.forEach((item, index) => {
        rankingContainer.innerHTML += `
            <div class="rank-item">
                <div class="meta">
                    <span class="rank-num top3">🏆 0${index + 1}</span>
                    <span class="rank-name">${formatAppName(item.name)}</span>
                </div>
                <span class="rank-score">${globalDownloadStats[item.name] || 0} Downloads</span>
            </div>`;
    });
}

// কাস্টম ডাউনলোড পপআপ মডাল ওপেন
function forceDownloadFile(buttonElement, filename) {
    const displayName = formatAppName(filename);
    const currentDownloads = globalDownloadStats[filename] || 0;

    document.getElementById("RS5ModalTitle").innerText = displayName;
    document.getElementById("RS5ModalStats").innerText = `Total Downloads: ${currentDownloads}`;
    
    const downloadBtn = document.getElementById("RS5ModalDownloadBtn");
    downloadBtn.onclick = function() {
        executeSilentDownload(filename);
        closeW8Modal();
    };

    document.getElementById("RS5ModalOverlay").classList.add("active");
}

function closeW8Modal() {
    document.getElementById("RS6ModalOverlay").classList.remove("active");
}

// সেম-ট্যাব সাইলেন্ট ডাউনলোডার
function executeSilentDownload(filename) {
    const targetUrl = `${BASE_CDN}${encodeURIComponent(filename)}`;
    incrementCloudCounter(filename);

    let silentFrame = document.getElementById('silent-download-frame');
    if (!silentFrame) {
        silentFrame = document.createElement('iframe');
        silentFrame.id = 'silent-download-frame';
        silentFrame.style.display = 'none';
        document.body.appendChild(silentFrame);
    }
    silentFrame.src = targetUrl;

    setTimeout(() => {
        try {
            if (!silentFrame.contentWindow || silentFrame.contentWindow.location.href === 'about:blank') {
                window.location.assign(targetUrl);
            }
        } catch (e) {
            window.location.href = targetUrl;
        }
    }, 300);
}

function displayApps(items) {
    const container = document.getElementById("apps-container");
    if(!container) return;
    container.innerHTML = "";
    
    if(items.length === 0) {
        container.innerHTML = `<p style="grid-column: span 2; text-align: center; color: var(--danger);">No items verified.</p>`;
        return;
    }

    items.forEach((item, index) => {
        const displayName = formatAppName(item.name);
        const itemBadge = assignBadge(item.name);
        const uniqueId = btoa(item.name).replace(/=/g, '');
        const safeImageName = encodeURIComponent(item.name.replace(/\.(apk|txt)$/i, ''));
        const fallbackIcon = item.name.toLowerCase().endsWith('.txt') 
            ? "https://i.postimg.cc/85zXpD7m/text-icon.png" 
            : "https://i.postimg.cc/mD3fzq4Y/apk-icon.png";

        const mainImageUrl = `${BASE_CDN}IMAGE/${safeImageName}`;
        const count = globalDownloadStats[item.name] || 0;

        container.innerHTML += `
            <button class="card" type="button" onclick="forceDownloadFile(this, '${item.name.replace(/'/g, "\\'")}')">
                <div class="badge-chip">${itemBadge}</div>
                <div class="rank-badge">#${index + 1}</div>
                <div class="icon">
                    <img loading="lazy" width="62" height="62" 
                         src="${mainImageUrl}.png" 
                         onerror="this.onerror=null; this.src='${mainImageUrl}.jpg'; this.onerror=function(){this.src='${fallbackIcon}';};" 
                         alt="${displayName}">
                </div>
                <p class="app-name">${displayName}</p>
                <div class="download-count" id="count-label-${uniqueId}">${count} Downloads</div>
            </button>`;
    });
}

async function fetchRepositoryData() {
    if (!sessionAuthenticated) return;
    
    const backupData = localStorage.getItem('RS5_apps_backup_list');
    if(backupData) {
        cachedFetchedApps = JSON.parse(backupData);
        const totalAppsEl = document.getElementById("total-apps");
        if(totalAppsEl) totalAppsEl.innerText = `${cachedFetchedApps.length} Items`;
        displayApps(cachedFetchedApps);
        renderRankingDashboard();
    }

    try {
        const response = await fetch(API_URL);
        if(response.ok) {
            const files = await response.json();
            const filtered = files.filter(f => f.type === "file" && (f.name.endsWith('.apk') || f.name.endsWith('.txt')));
            
            if(filtered.length > 0) {
                cachedFetchedApps = filtered;
                localStorage.setItem('RS5_apps_backup_list', JSON.stringify(filtered));
                const totalAppsEl = document.getElementById("total-apps");
                if(totalAppsEl) totalAppsEl.innerText = `${filtered.length} Items`;
                displayApps(filtered);
            }
        }
    } catch (error) {
        console.log("Using fallback storage.");
    }
    fetchRealTimeStats();
}

// সার্চ ফিল্টার
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("app-search");
    if(searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtered = cachedFetchedApps.filter(item => item.name.toLowerCase().includes(query));
            displayApps(filtered);
        });
    }
});
