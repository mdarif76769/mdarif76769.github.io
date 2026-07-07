// GitHub Configuration
const GITHUB_USER = "mdarif76769";
const GITHUB_REPO = "mdarif76769.github.io";
const BASE_CDN = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/DATA/`;
const API_URL = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/DATA`;
const COUNTER_API_BASE = "https://api.counterapi.dev/v1";
const NAMESPACE = `w8_store_production_${GITHUB_USER}`;

let cachedFetchedApps = [];
let globalDownloadStats = JSON.parse(localStorage.getItem('w8_stats_backup')) || {};

// ইনজেক্টেড কাস্টম পপআপ এবং লক প্যানেল থিম (CSS)
const style = document.createElement('style');
style.innerHTML = `
    .w8-modal-overlay {
        position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center;
        z-index: 9999; opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
    }
    .w8-modal-overlay.active { opacity: 1; pointer-events: auto; }
    .w8-modal {
        background: rgba(3, 15, 12, 0.95); border: 2px solid var(--green);
        border-radius: 12px; width: min(340px, 90%); padding: 24px;
        box-shadow: 0 0 30px rgba(0, 255, 159, 0.4), inset 0 0 15px rgba(0, 255, 159, 0.1);
        text-align: center; transform: scale(0.85); transition: transform 0.3s ease;
        position: relative; font-family: 'Fira Code', monospace;
    }
    .w8-modal-overlay.active .w8-modal { transform: scale(1); }
    .w8-modal-title { color: var(--green); font-size: 18px; margin: 0 0 10px 0; text-shadow: 0 0 8px var(--green); font-weight: 700; }
    .w8-modal-stats { color: var(--cyan); font-size: 13px; margin-bottom: 20px; }
    .w8-btn-container { display: flex; flex-direction: column; gap: 12px; }
    .w8-download-btn {
        background: linear-gradient(135deg, #00ff9f, #00b36b); color: #010806;
        border: none; padding: 12px 20px; font-size: 14px; font-weight: 700;
        border-radius: 8px; cursor: pointer; text-transform: uppercase;
        font-family: inherit; box-shadow: 0 0 15px rgba(0, 255, 159, 0.4);
        transition: all 0.2s ease;
    }
    .w8-download-btn:active { transform: scale(0.98); box-shadow: 0 0 5px rgba(0, 255, 159, 0.2); }
    .w8-close-btn {
        background: transparent; color: var(--danger); border: 1px solid var(--danger);
        padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 6px;
        cursor: pointer; font-family: inherit; transition: all 0.2s ease;
    }
    .w8-close-btn:hover { background: rgba(255, 71, 112, 0.1); }
`;
document.head.appendChild(style);

// DOM-এ পপআপ স্ট্রাকচার তৈরি করা
const modalOverlay = document.createElement('div');
modalOverlay.className = 'w8-modal-overlay';
modalOverlay.id = 'w8ModalOverlay';
modalOverlay.innerHTML = `
    <div class="w8-modal">
        <div class="w8-modal-title" id="w8ModalTitle">App Name</div>
        <div class="w8-modal-stats" id="w8ModalStats">0 Downloads</div>
        <div class="w8-btn-container">
            <button class="w8-download-btn" id="w8ModalDownloadBtn">⚡ Start Download</button>
            <button class="w8-close-btn" onclick="closeW8Modal()">Cancel</button>
        </div>
    </div>
`;
document.body.appendChild(modalOverlay);

// ================= [ আপনার আসল ইনক্রিপ্টেড লক সিস্টেম ] =================
const ENCRYPTED_VAULT = "NDUzNQ=="; //
let sessionAuthenticated = sessionStorage.getItem("Rs5_auth_token") === "granted";

function verifyTerminalPasscode() {
    const inputField = document.getElementById("terminal-pass-input");
    const errField = document.getElementById("terminal-error-log");
    if (!inputField) return;
    
    const rawInput = inputField.value.trim();
    try {
        // CryptoJS এনক্রিপশন ম্যাপিং
        const decryptedBytes = CryptoJS.AES.decrypt(ENCRYPTED_VAULT, rawInput);
        const originalPayload = decryptedBytes.toString(CryptoJS.enc.Utf8);
        
        if (originalPayload && originalPayload.includes("ACCESS_GRANTED_VERIFIED")) {
            sessionAuthenticated = true;
            sessionStorage.setItem("w8_auth_token", "granted");
            
            const lockPanel = document.getElementById("terminal-lock-panel");
            const storeArea = document.getElementById("protected-store-area");
            if (lockPanel) lockPanel.style.display = "none";
            if (storeArea) storeArea.style.display = "block";
            
            fetchRepositoryData();
        } else {
            throw new Error();
        }
    } catch (e) {
        if (errField) {
            errField.innerText = "❌ CRITICAL ERROR: ACCESS DENIED. INVALID CREDENTIALS.";
            setTimeout(() => { errField.innerText = ""; }, 3000);
        }
        inputField.value = "";
    }
}

// এন্টার প্রেস করলে লক খোলার ট্রিকার
document.addEventListener("DOMContentLoaded", () => {
    const passInput = document.getElementById("terminal-pass-input");
    if (passInput) {
        passInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") verifyTerminalPasscode();
        });
    }

    // সেশন চেক করে স্ক্রিন দেখানো
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
                localStorage.setItem('w8_stats_backup', JSON.stringify(globalDownloadStats));
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

function forceDownloadFile(buttonElement, filename) {
    const displayName = formatAppName(filename);
    const currentDownloads = globalDownloadStats[filename] || 0;

    document.getElementById("w8ModalTitle").innerText = displayName;
    document.getElementById("w8ModalStats").innerText = `Total Downloads: ${currentDownloads}`;
    
    const downloadBtn = document.getElementById("w8ModalDownloadBtn");
    downloadBtn.onclick = function() {
        executeSilentDownload(filename);
        closeW8Modal();
    };

    document.getElementById("w8ModalOverlay").classList.add("active");
}

function closeW8Modal() {
    document.getElementById("w8ModalOverlay").classList.remove("active");
}

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
    if (!sessionAuthenticated) return; // লক না খুললে ডেটা ফেচ হবে না
    
    const backupData = localStorage.getItem('w8_apps_backup_list');
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
                localStorage.setItem('w8_apps_backup_list', JSON.stringify(filtered));
                const totalAppsEl = document.getElementById("total-apps");
                if(totalAppsEl) totalAppsEl.innerText = `${filtered.length} Items`;
                displayApps(filtered);
            }
        }
    } catch (error) {
        console.log("Using dynamic storage engine fallback.");
    }
    fetchRealTimeStats();
}

// সার্চ ইভেন্ট বাইন্ডিং
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
