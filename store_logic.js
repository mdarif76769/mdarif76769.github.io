// ==========================================
// SECURITY & TERMINAL CONFIGURATION
// ==========================================
const ENCODED_TOKEN = "NDUzNQ==";
let attemptCount = 0;
let isTelegramTerminal = false;

const isAlreadyUnlocked = sessionStorage.getItem("terminal_session_active") === "true";

// টেলিগ্রাম ওয়েব অ্যাপ ও সেশন ভ্যালিডেশন লজিক
if(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData && window.Telegram.WebApp.initData !== "") {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
    isTelegramTerminal = true;
    document.getElementById("auth-gate-panel").style.display = "none";
    document.getElementById("protected-store-area").style.display = "block";
} else if (isAlreadyUnlocked) {
    document.getElementById("auth-gate-panel").style.display = "none";
    document.getElementById("protected-store-area").style.display = "block";
} else {
    document.getElementById("auth-gate-panel").style.display = "block";
    document.getElementById("protected-store-area").style.display = "none";
}

// তোর আসল ব্রুট-ফোর্স প্রোটেকশন ও আনলক মেথড
function unlockTerminalData() {
    const pinField = document.getElementById("gate-pin-field");
    const submitBtn = document.getElementById("gate-submit-btn");
    const titleText = document.getElementById("gate-title-text");
    const inputVal = pinField.value.trim();

    if(inputVal === atob(ENCODED_TOKEN)) {
        attemptCount = 0; 
        sessionStorage.setItem("terminal_session_active", "true");
        document.getElementById("auth-gate-panel").style.display = "none";
        document.getElementById("protected-store-area").style.display = "block";
    } else {
        attemptCount++;
        if (attemptCount >= 5) {
            let timeLeft = 60; 
            pinField.disabled = true;
            submitBtn.disabled = true;
            pinField.value = "";
            titleText.style.color = "var(--danger)";

            const countdownInterval = setInterval(() => {
                timeLeft--;
                titleText.innerText = `🛑 Too many attempts. Try again in ${timeLeft}s`;
                
                if (timeLeft <= 0) {
                    clearInterval(countdownInterval);
                    attemptCount = 0; 
                    pinField.disabled = false;
                    submitBtn.disabled = false;
                    titleText.innerText = "🔒 Terminal Crypt-Lock Enabled";
                    titleText.style.color = "var(--danger)";
                }
            }, 1000);

            alert("CRITICAL ERROR: Terminal Locked for 60 Seconds.");
        } else {
            alert(`ACCESS DENIED: Unauthorized Token. (${5 - attemptCount} attempts remaining)`);
            pinField.value = "";
        }
    }
}

// এন্টার প্রেসের মাধ্যমে আনলক করার সুবিধা (অপশনাল বাইন্ডিং)
document.getElementById("gate-pin-field").addEventListener("keypress", (e) => {
    if (e.key === "Enter") unlockTerminalData();
});

// ==========================================
// GITHUB REPOSITORY & STORE LOGIC
// ==========================================
const GITHUB_USER = "mdarif76769";
const GITHUB_REPO = "mdarif76769.github.io";
const DATA_FOLDER = "DATA";
const IMAGE_FOLDER = "IMAGE";

const API_URL = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${DATA_FOLDER}?nocache=${new Date().getTime()}`;
const RELEASES_API_URL = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases?nocache=${new Date().getTime()}`;
const RAW_CDN_BASE = `https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@main/`;

const COUNTER_API_BASE = "https://api.counterapi.dev/v1";
const NAMESPACE = `w8_store_${GITHUB_USER}`; 

let cachedFetchedApps = [];
let globalDownloadStats = JSON.parse(localStorage.getItem('w8_stats_backup')) || {};

function formatAppName(filename) {
    return filename.replace(/\.(apk|txt)$/i, '').replace(/[-_]/g, ' ');
}

function assignBadge(filename) {
    if (filename.toLowerCase().endsWith('.txt')) return 'list';
    if (filename.toLowerCase().includes('bomber')) return 'hot';
    if (filename.toLowerCase().includes('hack') || filename.toLowerCase().includes('brute')) return 'audit';
    return 'app';
}

async function fetchRealTimeStats(items) {
    for (let item of items) {
        const itemCleanKey = item.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 30);
        try {
            const res = await fetch(`${COUNTER_API_BASE}/${NAMESPACE}/${itemCleanKey}`);
            if (res.ok) {
                const json = await res.json();
                globalDownloadStats[item.name] = json.count || globalDownloadStats[item.name] || 0;
            }
        } catch(e) {
            console.log("Stats fetching delayed, using local backup.");
        }
    }
    localStorage.setItem('w8_stats_backup', JSON.stringify(globalDownloadStats));
    renderRankingDashboard();
    updateCardCounters();
}

async function incrementCloudCounter(filename) {
    const itemCleanKey = filename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 30);
    
    globalDownloadStats[filename] = (globalDownloadStats[filename] || 0) + 1;
    localStorage.setItem('w8_stats_backup', JSON.stringify(globalDownloadStats));
    renderRankingDashboard();
    updateCardCounters();

    try {
        const res = await fetch(`${COUNTER_API_BASE}/${NAMESPACE}/${itemCleanKey}/up`);
        if (res.ok) {
            const json = await res.json();
            globalDownloadStats[filename] = json.count || globalDownloadStats[filename];
            localStorage.setItem('w8_stats_backup', JSON.stringify(globalDownloadStats));
            renderRankingDashboard();
            updateCardCounters();
        }
    } catch(e) {
        console.error("Stats cloud server sync fail", e);
    }
}

function renderRankingDashboard() {
    const rankingContainer = document.getElementById("ranking-container");
    if (!rankingContainer) return;
    rankingContainer.innerHTML = "";

    const ranked = [...cachedFetchedApps].sort((a, b) => {
        const countA = globalDownloadStats[a.name] || 0;
        const countB = globalDownloadStats[b.name] || 0;
        return countB - countA;
    }).slice(0, 3);

    if (ranked.length === 0) {
        rankingContainer.innerHTML = `<div style="text-align: center; color: var(--cyan); font-size:11px; padding:10px;">Syncing download stats...</div>`;
        return;
    }

    ranked.forEach((item, index) => {
        const displayName = formatAppName(item.name);
        const count = globalDownloadStats[item.name] || 0;
        rankingContainer.innerHTML += `
            <div class="rank-item">
                <div class="meta">
                    <span class="rank-num top3">🏆 0${index + 1}</span>
                    <span class="rank-name">${displayName}</span>
                </div>
                <span class="rank-score">${count} Downloads</span>
            </div>
        `;
    });
}

function updateCardCounters() {
    cachedFetchedApps.forEach(item => {
        const count = globalDownloadStats[item.name] || 0;
        const element = document.getElementById(`count-label-${btoa(item.name).replace(/=/g, '')}`);
        if(element) {
            element.innerText = `${count} Downloads`;
        }
    });
}

// তোর আসল ইন-অ্যাপ সাইলেন্ট হাইব্রিড ডাউনলোডার মেথড
async function forceDownloadFile(buttonElement, filename, isRelease = false, releaseUrl = '') {
    if (buttonElement.classList.contains('downloading')) return;
    
    buttonElement.classList.add('downloading');
    const counterLabel = buttonElement.querySelector('.download-count');
    counterLabel.innerText = "Processing...";

    const fileUrl = isRelease ? releaseUrl : `${RAW_CDN_BASE}${DATA_FOLDER}/${encodeURIComponent(filename)}`;

    try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("CORS or Network issue.");
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const tempAnchor = document.createElement('a');
        tempAnchor.style.display = 'none';
        tempAnchor.href = blobUrl;
        tempAnchor.setAttribute('download', filename);
        
        document.body.appendChild(tempAnchor);
        tempAnchor.click();
        
        document.body.removeChild(tempAnchor);
        window.URL.revokeObjectURL(blobUrl);
        await incrementCloudCounter(filename);
    } catch (error) {
        console.log("Blob fetch blocked or failed. Activating secure iframe injection fallback...");
        
        let downloadFrame = document.getElementById('silent-download-frame');
        if (!downloadFrame) {
            downloadFrame = document.createElement('iframe');
            downloadFrame.id = 'silent-download-frame';
            downloadFrame.style.display = 'none';
            document.body.appendChild(downloadFrame);
        }
        downloadFrame.src = fileUrl;
        await incrementCloudCounter(filename);
    } finally {
        setTimeout(() => {
            buttonElement.classList.remove('downloading');
            updateCardCounters(); 
        }, 1500);
    }
}

function displayApps(items) {
    const container = document.getElementById("apps-container");
    container.innerHTML = "";
    
    if(items.length === 0) {
        container.innerHTML = `<p style="grid-column: span 2; text-align: center; color: var(--danger);">No items verified.</p>`;
        return;
    }

    const cacheBuster = new Date().getTime();

    items.forEach((item, index) => {
        const displayName = formatAppName(item.name);
        const itemBadge = assignBadge(item.name);
        const uniqueId = btoa(item.name).replace(/=/g, '');
        
        const cleanNameWithoutExt = item.name.replace(/\.(apk|txt)$/i, '');
        const safeImageName = encodeURIComponent(cleanNameWithoutExt);

        const isTextFile = item.name.toLowerCase().endsWith('.txt');
        const fallbackIcon = isTextFile 
            ? "https://i.postimg.cc/85zXpD7m/text-icon.png" 
            : "https://i.postimg.cc/mD3fzq4Y/apk-icon.png";

        const pngUrl = `${RAW_CDN_BASE}${DATA_FOLDER}/${IMAGE_FOLDER}/${safeImageName}.png?v=${cacheBuster}`;
        const jpgUrl = `${RAW_CDN_BASE}${DATA_FOLDER}/${IMAGE_FOLDER}/${safeImageName}.jpg?v=${cacheBuster}`;

        const count = globalDownloadStats[item.name] || 0;
        const isRelease = item.isRelease ? true : false;
        const downloadUrl = item.downloadUrl || '';

        const cardHtml = `
            <button class="card" type="button" onclick="forceDownloadFile(this, '${item.name.replace(/'/g, "\\'")}', ${isRelease}, '${downloadUrl}')">
                <div class="badge-chip">${itemBadge}</div>
                <div class="rank-badge">#${index + 1}</div>
                <div class="icon">
                    <img loading="lazy" width="62" height="62" 
                         src="${pngUrl}" 
                         onerror="this.onerror=null; this.src='${jpgUrl}'; this.onerror=function(){this.src='${fallbackIcon}';};" 
                         alt="${displayName}">
                </div>
                <p class="app-name">${displayName}</p>
                <div class="download-count" id="count-label-${uniqueId}">${count} Downloads</div>
            </button>
        `;
        container.innerHTML += cardHtml;
    });
}

async function fetchRepositoryData() {
    const localBackupApps = localStorage.getItem('w8_apps_list_backup');
    if (localBackupApps) {
        cachedFetchedApps = JSON.parse(localBackupApps);
        document.getElementById("total-apps").innerText = `${cachedFetchedApps.length} Items`;
        displayApps(cachedFetchedApps);
        renderRankingDashboard();
    }

    try {
        const response = await fetch(API_URL);
        let folderFiles = [];
        if(response.ok) {
            const files = await response.json();
            folderFiles = files.filter(file => {
                if (file.type !== "file") return false;
                const nameLower = file.name.toLowerCase();
                return nameLower.endsWith('.apk') || nameLower.endsWith('.txt');
            }).map(file => ({ name: file.name, isRelease: false }));
        }
        
        let releaseFiles = [];
        try {
            const relResponse = await fetch(RELEASES_API_URL);
            if(relResponse.ok) {
                const releases = await relResponse.json();
                releases.forEach(rel => {
                    if(rel.assets && rel.assets.length > 0) {
                        rel.assets.forEach(asset => {
                            const nameLower = asset.name.toLowerCase();
                            if(nameLower.endsWith('.apk') || nameLower.endsWith('.txt')) {
                                releaseFiles.push({
                                    name: asset.name,
                                    isRelease: true,
                                    downloadUrl: asset.browser_download_url
                                });
                            }
                        });
                    }
                });
            }
        } catch(e) {
            console.log("Release data fetch bypass.");
        }

        if (folderFiles.length > 0 || releaseFiles.length > 0) {
            cachedFetchedApps = [...folderFiles, ...releaseFiles];
            localStorage.setItem('w8_apps_list_backup', JSON.stringify(cachedFetchedApps));
            
            document.getElementById("total-apps").innerText = `${cachedFetchedApps.length} Items`;
            displayApps(cachedFetchedApps);
            renderRankingDashboard();
        }

        await fetchRealTimeStats(cachedFetchedApps);

    } catch (error) {
        console.error("Network interface connection delayed:", error);
        if (!localBackupApps) {
            document.getElementById("apps-container").innerHTML = `
                <p style="grid-column: span 2; text-align: center; color: var(--danger);">
                    Synchronization Error.<br>Please verify repo access structures.
                </p>`;
        }
    }
}

document.getElementById("app-search").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = cachedFetchedApps.filter(item => 
        item.name.toLowerCase().includes(query)
    );
    displayApps(filtered);
    updateCardCounters();
});

// ইনিশিয়াল এক্সিকিউশন
fetchRepositoryData();
