// =======================================================================
// 🔒 1. SECURITY BLOCK & TERMINAL AUTHENTICATION GATEWAY (FIXED INTERFACE)
// =======================================================================
const ENCODED_TOKEN = "NDUzNQ=="; // তোর আসল ক্রিপ্ট-টোকেন
let attemptCount = 0;
let isTelegramTerminal = false;

// সেশন লক চেকিং মেকানিজম
const isAlreadyUnlocked = sessionStorage.getItem("terminal_session_active") === "true";

// ইন্টারফেস পুরোপুরি লক বা আনলক করার কন্ট্রোল ফাংশন
function applySecurityInterface(unlocked) {
    const authPanel = document.getElementById("auth-gate-panel");
    const storeArea = document.getElementById("protected-store-area");
    
    if (unlocked) {
        if (authPanel) authPanel.style.setProperty("display", "none", "important");
        if (storeArea) storeArea.style.setProperty("display", "block", "important");
    } else {
        if (authPanel) authPanel.style.setProperty("display", "block", "important");
        if (storeArea) storeArea.style.setProperty("display", "none", "important");
    }
}

// টেলিগ্রাম ওয়েব অ্যাপ এনভায়রনমেন্ট ও সেশন ভ্যালিডেশন লজিক
if(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData && window.Telegram.WebApp.initData !== "") {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
    isTelegramTerminal = true;
    applySecurityInterface(true); // টেলিগ্রামে ডিরেক্ট বাইপাস ও আনলক
} else if (isAlreadyUnlocked) {
    applySecurityInterface(true); // সেশন একটিভ থাকলে আনলক
} else {
    applySecurityInterface(false); // অন্য সব ক্ষেত্রে কঠোরভাবে সম্পূর্ণ স্টোর হাইড এবং লক
}

// তোর আসল ব্রুট-ফোর্স প্রোটেকশন ও সিকিউর আনলক মেথড
function unlockTerminalData() {
    const pinField = document.getElementById("gate-pin-field");
    const submitBtn = document.getElementById("gate-submit-btn");
    const titleText = document.getElementById("gate-title-text");
    const inputVal = pinField.value.trim();

    if(inputVal === atob(ENCODED_TOKEN)) {
        attemptCount = 0; 
        sessionStorage.setItem("terminal_session_active", "true");
        applySecurityInterface(true); // পিন মিললে তবেই নিচের সব ডেটা ভেসে উঠবে
    } else {
        attemptCount++;
        if (attemptCount >= 5) {
            let timeLeft = 60; 
            pinField.disabled = true;
            submitBtn.disabled = true;
            pinField.value = "";
            if (titleText) titleText.style.color = "var(--danger)";

            const countdownInterval = setInterval(() => {
                timeLeft--;
                if (titleText) titleText.innerText = `🛑 Too many attempts. Try again in ${timeLeft}s`;
                
                if (timeLeft <= 0) {
                    clearInterval(countdownInterval);
                    attemptCount = 0; 
                    pinField.disabled = false;
                    submitBtn.disabled = false;
                    if (titleText) {
                        titleText.innerText = "🔒 Terminal Crypt-Lock Enabled";
                        titleText.style.color = "var(--danger)";
                    }
                }
            }, 1000);

            alert("CRITICAL ERROR: Terminal Locked for 60 Seconds.");
        } else {
            alert(`ACCESS DENIED: Unauthorized Token. (${5 - attemptCount} attempts remaining)`);
            pinField.value = "";
        }
    }
}


// এন্টার প্রেস করলে যেন ডিরেক্ট আনলক হয়
document.getElementById("gate-pin-field").addEventListener("keypress", (e) => {
    if (e.key === "Enter") unlockTerminalData();
});


// =======================================================================
// 📂 2. GITHUB BACKEND REPOSITORY CONFIGURATION
// =======================================================================
const GITHUB_USER = "mdarif76769";
const GITHUB_REPO = "mdarif76769.github.io";
const DATA_FOLDER = "DATA";
const IMAGE_FOLDER = "IMAGE";

// গিটহাব এপিআই রিকোয়েস্ট সোর্স ইউআরএল
const API_URL = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${DATA_FOLDER}`;
const RELEASES_API_URL = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases`;

// ⚡ ১০০% লোডিং ফিক্স: সরাসরি অফিশিয়াল গিটহাব র সোর্স (কোনো থার্ড-পার্টি সিডিএন জ্যাম নাই)
const RAW_CDN_BASE = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/`;

// লাইভ কাউন্টার কনফিগ
const COUNTER_API_BASE = "https://api.counterapi.dev/v1";
const NAMESPACE = `w8_store_${GITHUB_USER}`; 

let cachedFetchedApps = [];
let globalDownloadStats = JSON.parse(localStorage.getItem('w8_stats_backup')) || {};


// =======================================================================
// 🛠️ 3. STRING UTILS & BADGE GENERATOR
// =======================================================================
function formatAppName(filename) {
    return filename.replace(/\.(apk|txt)$/i, '').replace(/[-_]/g, ' ');
}

function assignBadge(filename) {
    if (filename.toLowerCase().endsWith('.txt')) return 'list';
    if (filename.toLowerCase().includes('bomber')) return 'hot';
    if (filename.toLowerCase().includes('hack') || filename.toLowerCase().includes('brute')) return 'audit';
    return 'app';
}


// =======================================================================
// 📊 4. REAL-TIME DOWNLOAD COUNTER & RANKING ENGINE (ANTI-BLINKING)
// =======================================================================
async function fetchRealTimeStats(items) {
    let hasUpdated = false;
    for (let item of items) {
        const itemCleanKey = item.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 30);
        try {
            const res = await fetch(`${COUNTER_API_BASE}/${NAMESPACE}/${itemCleanKey}`);
            if (res.ok) {
                const json = await res.json();
                if (json.count && json.count !== globalDownloadStats[item.name]) {
                    globalDownloadStats[item.name] = json.count;
                    hasUpdated = true;
                    
                    // 🚀 জাদুকরী ট্রিক: পুরো গ্রিড রিরেন্ডার না করে শুধুমাত্র নির্দিষ্ট টেক্সট টার্গেট করে চেঞ্জ করা হচ্ছে
                    const uniqueId = btoa(item.name).replace(/=/g, '');
                    const label = document.getElementById(`count-label-${uniqueId}`);
                    if (label) label.innerText = `${json.count} Downloads`;
                }
            }
        } catch(e) {
            console.log("Cloud counter data syncing delayed.");
        }
    }
    if (hasUpdated) {
        localStorage.setItem('w8_stats_backup', JSON.stringify(globalDownloadStats));
        renderRankingDashboard();
    }
}

async function incrementCloudCounter(filename) {
    const itemCleanKey = filename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 30);
    
    globalDownloadStats[filename] = (globalDownloadStats[filename] || 0) + 1;
    localStorage.setItem('w8_stats_backup', JSON.stringify(globalDownloadStats));

    const uniqueId = btoa(filename).replace(/=/g, '');
    const label = document.getElementById(`count-label-${uniqueId}`);
    if (label) label.innerText = `${globalDownloadStats[filename]} Downloads`;

    try {
        const res = await fetch(`${COUNTER_API_BASE}/${NAMESPACE}/${itemCleanKey}/up`);
        if (res.ok) {
            const json = await res.json();
            globalDownloadStats[filename] = json.count || globalDownloadStats[filename];
            localStorage.setItem('w8_stats_backup', JSON.stringify(globalDownloadStats));
            if (label) label.innerText = `${globalDownloadStats[filename]} Downloads`;
        }
    } catch(e) {
        console.error("Cloud counter server reporting failure", e);
    }
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


// =======================================================================
// 🛰️ 5. GOOGLE DRIVE INTERFACE MECHANISM & PROGRESS POPUP
// =======================================================================
function triggerDownloadPopup(filename, iconUrl, badgeType, isRelease, releaseUrl) {
    const modal = document.getElementById("download-modal");
    const modalTitle = document.getElementById("modal-app-title");
    const modalIcon = document.getElementById("modal-app-icon");
    const modalMeta = document.getElementById("modal-app-meta");
    const downloadBtn = document.getElementById("modal-download-btn");

    modalTitle.innerText = formatAppName(filename);
    modalIcon.src = iconUrl;
    modalMeta.innerText = `Type: [${badgeType.toUpperCase()}] • Ext: ${filename.split('.').pop().toUpperCase()}`;

    // রিয়েল-টাইম প্রোগ্রেস বার স্ট্রাকচার ইনজেকশন
    let progressWrapper = document.getElementById("modal-progress-wrapper");
    if (!progressWrapper) {
        progressWrapper = document.createElement("div");
        progressWrapper.id = "modal-progress-wrapper";
        progressWrapper.style.cssText = "width:100%; margin-top:15px; display:none; text-align:center;";
        progressWrapper.innerHTML = `
            <div style="width:100%; background:rgba(255,255,255,0.1); height:10px; border-radius:10px; overflow:hidden; border:1px solid rgba(0,255,242,0.3);">
                <div id="realtime-progress-bar" style="width:0%; background:linear-gradient(90deg, #00fff2, #0088ff); height:100%; transition:width 0.1s linear; border-radius:10px;"></div>
            </div>
            <div style="display:flex; justify-content:between; font-size:11px; color:#00fff2; margin-top:6px; font-family:monospace;">
                <span id="progress-percent" style="flex:1; text-align:left;">0%</span>
                <span id="progress-speed" style="flex:1; text-align:right;">Calculating...</span>
            </div>
        `;
        downloadBtn.parentNode.insertBefore(progressWrapper, downloadBtn);
    }

    // পপআপ ডিফল্ট ইনিশিয়াল স্টেট রিসেট
    progressWrapper.style.display = "none";
    downloadBtn.style.display = "block";
    downloadBtn.disabled = false;
    downloadBtn.querySelector('span').innerText = "⚡ Secure Download";

    downloadBtn.onclick = null;
    downloadBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();

        // গুগল ড্রাইভ গেটওয়ে ইমুলেশন: বাটন চেঞ্জ হয়ে ডিরেক্ট "Download Anyway" মোডে যাবে
        downloadBtn.querySelector('span').innerText = "⚠️ Download Anyway";
        
        downloadBtn.onclick = async function(ev) {
            ev.preventDefault();
            ev.stopPropagation();

            // অটো ব্যাক গ্রাউন্ড প্রসেস: বাটন হাইড হয়ে যাবে এবং ওখানেই প্রোগ্রেস বার চালু হবে
            downloadBtn.style.display = "none";
            progressWrapper.style.display = "block";

            // সাইলেন্ট স্ট্রিম ফায়ার
            await executeSecureStorageDownload(filename, isRelease, releaseUrl);
        };
    };

    modal.style.display = "grid";
}

function closeDownloadModal(event) {
    if(!event || event.target === document.getElementById("download-modal") || event === null) {
        document.getElementById("download-modal").style.display = "none";
    }
}

// =======================================================================
// 🚀 6. WebView CRASH-PROOF SILENT DOWNLOADER ENGINE (DIRECT BLOB STORAGE FIX)
// =======================================================================
async function executeSecureStorageDownload(filename, isRelease, releaseUrl) {
    const fileUrl = isRelease ? releaseUrl : `${RAW_CDN_BASE}${DATA_FOLDER}/${encodeURIComponent(filename)}`;
    
    const progressBar = document.getElementById("realtime-progress-bar");
    const progressPercent = document.getElementById("progress-percent");
    const progressSpeed = document.getElementById("progress-speed");

    progressBar.style.width = "0%";
    progressPercent.innerText = "⏳ Requesting...";
    progressSpeed.innerText = "Connecting...";

    // ডাটাবেজ বা ক্লাউড কাউন্টার আপডেট
    await incrementCloudCounter(filename);

    try {
        // প্রোগ্রেস বারের ফেক এনিমেশন শুরু করা
        let currentPercent = 0;
        const fakeSpeed = (Math.random() * 2 + 1.5).toFixed(2); 
        progressSpeed.innerText = `⚡ ${fakeSpeed} MB/s`;

        const animationInterval = setInterval(() => {
            currentPercent += Math.floor(Math.random() * 4) + 2; 
            if (currentPercent >= 95) {
                clearInterval(animationInterval); // আসল ডাউনলোড শেষ না হওয়া পর্যন্ত ৯৫% এ হোল্ড করবে
            } else {
                progressBar.style.width = `${currentPercent}%`;
                progressPercent.innerText = `📥 Downloading: ${currentPercent}%`;
            }
        }, 120);

        // 🔗 সরাসরি মেমরিতে ফাইলটি Blob (বাইনারি ডেটা) হিসেবে ডাউনলোড করা হচ্ছে
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("ফাইল ডাউনলোড রেসপন্স ব্যর্থ হয়েছে");
        const fileBlob = await response.blob();

        // ডাউনলোড সম্পন্ন হলে ১০০% করা
        progressBar.style.width = "100%";
        progressPercent.innerText = "✅ 100% Downloaded!";

        // 💾 টেলিগ্রামের ভেতরের লোকাল মেমরি থেকে সরাসরি স্টোরেজে ফাইল সেভ করার ট্রিগার
        const localBlobUrl = window.URL.createObjectURL(fileBlob);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.href = localBlobUrl;
        downloadAnchor.download = filename;
        
        // টেলিগ্রামের ইন-অ্যাপ ব্রাউজারে ট্র্যাকিং ফোর্স করার জন্য
        downloadAnchor.setAttribute('target', '_blank');
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();

        // ক্লিনআপ প্রসেস
        document.body.removeChild(downloadAnchor);
        window.URL.revokeObjectURL(localBlobUrl);

        // ডাউনলোড শেষ হলে পপআপ ক্লোজ করা
        setTimeout(() => {
            closeDownloadModal(null);
        }, 1000);

    } catch (error) {
        console.error("Direct storage download failed, falling back to direct link:", error);
        
        // ব্যাকআপ মেথড: যদি কোনো কারণে ফেচ ব্লক হয়, তবে ডিরেক্ট ক্লিক ট্রিগার করবে
        const fallbackAnchor = document.createElement('a');
        fallbackAnchor.href = fileUrl;
        fallbackAnchor.download = filename;
        fallbackAnchor.target = "_blank";
        document.body.appendChild(fallbackAnchor);
        fallbackAnchor.click();
        document.body.removeChild(fallbackAnchor);

        progressBar.style.width = "100%";
        progressPercent.innerText = "✅ Started!";
        setTimeout(() => {
            closeDownloadModal(null);
        }, 1000);
    }
}



// =======================================================================
// 🎨 7. SOLID APP GRAPHICS RENDERING INTERFACE (DIRECT RAW ENGINE)
// =======================================================================
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

        // 🎯 আলটিমেট সোর্স ফিক্স: একদম ডিরেক্ট র গিটহাব লিঙ্ক (কোনো ক্যাশ-বাস্টার ট্র্যাশ ছাড়া)
        const pngUrl = `${RAW_CDN_BASE}${DATA_FOLDER}/${IMAGE_FOLDER}/${safeImageName}.png`;
        const jpgUrl = `${RAW_CDN_BASE}${DATA_FOLDER}/${IMAGE_FOLDER}/${safeImageName}.jpg`;

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


// =======================================================================
// 🛰️ 8. BACKEND STORAGE VERIFICATION & CORE DATA SYNC LUNAR ENGINE
// =======================================================================
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
            console.log("Folder engine directory sync delayed.");
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
            console.log("Release assets compiler delayed.");
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
        console.error("Network infrastructure interface delayed:", error);
    }
}

// রিয়েল-টাইম সার্চ লিসেনার
document.getElementById("app-search").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = cachedFetchedApps.filter(item => 
        item.name.toLowerCase().includes(query)
    );
    sortAndRenderApps(filtered);
});

// ইনিশিয়াল লোডার ফায়ার
fetchRepositoryData();
