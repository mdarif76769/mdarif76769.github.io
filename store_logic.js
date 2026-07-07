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

document.getElementById("gate-pin-field").addEventListener("keypress", (e) => {
    if (e.key === "Enter") unlockTerminalData();
});

// ==========================================
// GITHUB REPOSITORY & STORE CONFIG
// ==========================================
const GITHUB_USER = "mdarif76769";
const GITHUB_REPO = "mdarif76769.github.io";
const DATA_FOLDER = "DATA";
const IMAGE_FOLDER = "IMAGE";

const API_URL = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${DATA_FOLDER}`;
const RELEASES_API_URL = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases`;
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
    sortAndRenderApps(cachedFetchedApps);
    renderRankingDashboard();
}

async function incrementCloudCounter(filename) {
    const itemCleanKey = filename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 30);
    
    globalDownloadStats[filename] = (globalDownloadStats[filename] || 0) + 1;
    localStorage.setItem('w8_stats_backup', JSON.stringify(globalDownloadStats));

    try {
        const res = await fetch(`${COUNTER_API_BASE}/${NAMESPACE}/${itemCleanKey}/up`);
        if (res.ok) {
            const json = await res.json();
            globalDownloadStats[filename] = json.count || globalDownloadStats[filename];
            localStorage.setItem('w8_stats_backup', JSON.stringify(globalDownloadStats));
        }
    } catch(e) {
        console.error("Stats cloud server sync fail", e);
    }
    
    sortAndRenderApps(cachedFetchedApps);
    renderRankingDashboard();
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

// ========================================================
// কাস্টম ইন-উইন্ডো পপআপ এবং ডাউনলোড ইঞ্জিন
// ========================================================
function triggerDownloadPopup(filename, iconUrl, badgeType, isRelease, releaseUrl) {
    const modal = document.getElementById("download-modal");
    const modalTitle = document.getElementById("modal-app-title");
    const modalIcon = document.getElementById("modal-app-icon");
    const modalMeta = document.getElementById("modal-app-meta");
    const downloadBtn = document.getElementById("modal-download-btn");

    modalTitle.innerText = formatAppName(filename);
    modalIcon.src = iconUrl;
    modalMeta.innerText = `Type: [${badgeType.toUpperCase()}] • Ext: ${filename.split('.').pop().toUpperCase()}`;

    // আগের বাটন লিসেনার ক্লিয়ার করে নতুন করে শুধুমাত্র ১ বার এক্সিকিউশন নিশ্চিত করা হলো
    downloadBtn.onclick = null;
    downloadBtn.onclick = async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (downloadBtn.getAttribute("data-loading") === "true") return;
        downloadBtn.setAttribute("data-loading", "true");
        downloadBtn.disabled = true;
        
        const btnText = downloadBtn.querySelector('span');
        btnText.innerText = "Downloading...";
        
        // ডিরেক্ট পিউর স্যান্ডবক্স ইঞ্জিন কল (মেমোরি ক্র্যাশ ও ব্রাউজার জাম্প ফিক্সড)
        await executeSecureStorageDownload(filename, isRelease, releaseUrl, btnText);
        
        setTimeout(() => {
            downloadBtn.removeAttribute("data-loading");
            downloadBtn.disabled = false;
            btnText.innerText = "⚡ Secure Download";
            closeDownloadModal(null);
        }, 2000);
    };

    modal.style.display = "grid";
}

function closeDownloadModal(event) {
    if(!event || event.target === document.getElementById("download-modal") || event === null) {
        document.getElementById("download-modal").style.display = "none";
    }
}

// =======================================================================
// ওয়ান-ক্লিক ডিরেক্ট ডাউনলোড ইঞ্জিন (মেমোরি ক্র্যাশ ও ব্রাউজার রিডাইরেক্ট ফিক্স)
// =======================================================================
async function executeSecureStorageDownload(filename, isRelease, releaseUrl, btnTextField) {
    const fileUrl = isRelease ? releaseUrl : `${RAW_CDN_BASE}${DATA_FOLDER}/${encodeURIComponent(filename)}`;
    
    // ইউজার কি অ্যান্ড্রয়েড অ্যাপের (WebView) ভেতর আছে কিনা তা চেক
    const isWebView = /Android.*wv/.test(navigator.userAgent) || (!window.chrome && /Android/.test(navigator.userAgent));

    if (isWebView) {
        // ১. অ্যাপের জন্য লজিক: মেমোরি ক্র্যাশ এড়াতে আইফ্রেমের মাধ্যমে ডিরেক্ট স্টোরেজ রিকোয়েস্ট পুশ
        try {
            let sandboxFrame = document.getElementById('silent-download-frame');
            if (!sandboxFrame) {
                sandboxFrame = document.createElement('iframe');
                sandboxFrame.id = 'silent-download-frame';
                sandboxFrame.style.setProperty('display', 'none', 'important');
                document.body.appendChild(sandboxFrame);
            }
            sandboxFrame.src = fileUrl; // অ্যাপের ভেতর থেকেই সিস্টেম ডাউনলোডার টানবে, ব্রাউজারে যাবে না
            
            await incrementCloudCounter(filename);
            return;
        } catch (err) {
            console.log("App interface error, bypassing to layout anchor...");
        }
    }

    // ২. সাধারণ ব্রাউজারের (Chrome/Safari) জন্য ওয়ান-ক্লিক ডিরেক্ট মেথড
    try {
        const directAnchor = document.createElement('a');
        directAnchor.style.setProperty('display', 'none', 'important');
        directAnchor.href = fileUrl;
        directAnchor.download = filename;
        
        // কোনো নতুন উইন্ডো বা ব্লব মেমোরি ছাড়াই সরাসরি ব্রাউজার ডাউনলোডারকে পুশ করা হচ্ছে
        document.body.appendChild(directAnchor);
        directAnchor.click();
        document.body.removeChild(directAnchor);
        
        await incrementCloudCounter(filename);

    } catch (error) {
        console.error("Direct download blocked, running iframe fall-through...", error);
        let storageFrame = document.getElementById('silent-download-frame');
        if (!storageFrame) {
            storageFrame = document.createElement('iframe');
            storageFrame.id = 'silent-download-frame';
            storageFrame.style.setProperty('display', 'none', 'important');
            document.body.appendChild(storageFrame);
        }
        storageFrame.src = fileUrl;
        await incrementCloudCounter(filename);
    }
}

// ========================================================
// র‍্যাংকিং লজিক: বেশি ডাউনলোড হওয়া অ্যাপ সবার আগে যাবে
// ========================================================
function sortAndRenderApps(items) {
    const sortedItems = [...items].sort((a, b) => {
        const downloadsA = globalDownloadStats[a.name] || 0;
        const downloadsB = globalDownloadStats[b.name] || 0;
        return downloadsB - downloadsA; 
    });

    displayApps(sortedItems);
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
            <button class="card" type="button" onclick="triggerDownloadPopup('${item.name.replace(/'/g, "\\'")}', '${pngUrl}', '${itemBadge}', ${isRelease}, '${downloadUrl}')">
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

// ========================================================
// গিটহাব ডাটা এবং রিলিজ (Releases) যাচাইকরণ লজিক
// ========================================================
async function fetchRepositoryData() {
    const localBackupApps = localStorage.getItem('w8_apps_list_backup');
    if (localBackupApps) {
        cachedFetchedApps = JSON.parse(localBackupApps);
        document.getElementById("total-apps").innerText = `${cachedFetchedApps.length} Items`;
        sortAndRenderApps(cachedFetchedApps);
        renderRankingDashboard();
    }

    try {
        const cacheBuster = `?nocache=${new Date().getTime()}`;
        
        let folderFiles = [];
        try {
            const response = await fetch(`${API_URL}${cacheBuster}`);
            if(response.ok) {
                const files = await response.json();
                folderFiles = files.filter(file => {
                    if (file.type !== "file") return false;
                    const nameLower = file.name.toLowerCase();
                    return nameLower.endsWith('.apk') || nameLower.endsWith('.txt');
                }).map(file => ({ name: file.name, isRelease: false }));
            }
        } catch (e) {
            console.log("Folder engine sync delayed.");
        }
        
        let releaseFiles = [];
        try {
            const relResponse = await fetch(`${RELEASES_API_URL}${cacheBuster}`);
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
            console.log("Release engine sync delayed.");
        }

        if (folderFiles.length > 0 || releaseFiles.length > 0) {
            const uniqueAppsMap = new Map();
            
            folderFiles.forEach(app => uniqueAppsMap.set(app.name, app));
            releaseFiles.forEach(app => uniqueAppsMap.set(app.name, app)); 
            
            cachedFetchedApps = Array.from(uniqueAppsMap.values());
            localStorage.setItem('w8_apps_list_backup', JSON.stringify(cachedFetchedApps));
            
            document.getElementById("total-apps").innerText = `${cachedFetchedApps.length} Items`;
            sortAndRenderApps(cachedFetchedApps);
            renderRankingDashboard();
        }

        await fetchRealTimeStats(cachedFetchedApps);

    } catch (error) {
        console.error("Network interface connection delayed:", error);
    }
}

document.getElementById("app-search").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = cachedFetchedApps.filter(item => 
        item.name.toLowerCase().includes(query)
    );
    sortAndRenderApps(filtered);
});

// ইনিশিয়াল এক্সিকিউশন
fetchRepositoryData();
