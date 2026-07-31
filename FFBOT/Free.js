document.addEventListener('DOMContentLoaded', () => {
    const uidInput = document.getElementById('uid-input');
    const addBtn = document.getElementById('add-target-btn');
    const removeBtn = document.getElementById('remove-target-btn');
    const adTaskBtn = document.getElementById('ad-task-btn');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    const limitDisplay = document.getElementById('limit-remaining');
    const limitTotalDisplay = document.getElementById('limit-total');

    const MASTER_PASSWORD = 'Team_X_Corp_bolbona_Master_password_ki_hehe';
    const API_BASE = window.location.origin;

    let toastTimer = null;
    let isProcessing = false;
    let remainingCount = 10000; // লিমিট ১০,০০০ সেট করা হয়েছে

    function showToast(msg, type) {
        toastMsg.textContent = msg;
        toast.className = 'toast';
        if (type) toast.classList.add(type);
        toastIcon.innerHTML = type === 'success'
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.add('hidden'), 3500);
    }

    function getDeviceId() {
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
            localStorage.setItem('device_id', deviceId);
        }
        return deviceId;
    }

    async function apiCall(endpoint) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'GET',
                signal: controller.signal,
                headers: { 
                    'Accept': 'application/json',
                    'X-Device-Id': getDeviceId()
                }
            });
            clearTimeout(timeoutId);
            return await response.json();
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                return { success: false, error: 'Request timed out. Server may be down.' };
            }
            return { success: false, error: 'Network error. Check if server is running.' };
        }
    }

    // নতুন GitHub Raw লিংক থেকে লিমিট ডেটা ফেচ করার জন্য ফাংশন
    async function fetchExternalLimit() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/mdarif76769/mdarif76769.github.io/refs/heads/main/FFBOT/Free_limit.js');
            const data = await response.json();
            return data;
        } catch (err) {
            return null;
        }
    }

    function validateUID(uid) {
        if (!uid || uid.trim() === '') {
            showToast('Please enter a UID', 'error');
            return false;
        }
        const cleaned = uid.replace(/\s/g, '');
        if (!/^\d+$/.test(cleaned)) {
            showToast('UID must contain only numbers', 'error');
            return false;
        }
        return cleaned;
    }

    async function checkLimit() {
        // প্রথমে এক্সটার্নাল লিংক থেকে ডাটা নেওয়ার চেষ্টা করবে, না পেলে ডিফল্ট ১০,০০০ সেট থাকবে
        const extData = await fetchExternalLimit();
        if (extData && extData.remaining !== undefined) {
            remainingCount = extData.remaining;
        } else {
            remainingCount = 10000;
        }

        if (limitDisplay) limitDisplay.textContent = remainingCount;
        if (limitTotalDisplay) limitTotalDisplay.textContent = extData && extData.limit ? extData.limit : 10000;
        updateLimitUI();
    }

    function updateLimitUI() {
        const limitInfo = document.querySelector('.limit-info');
        if (!limitInfo) return;
        limitInfo.classList.remove('limit-exceeded');
    }

    checkLimit();

    // URL parameters check
    const urlParams = new URLSearchParams(window.location.search);
    const claimStatus = urlParams.get('claim');
    const claimMsg = urlParams.get('msg');
    if (claimStatus) {
        if (claimStatus === 'success') {
            showToast("Bonus Claimed! 10000 Extra adds added to your limit.", "success");
        } else if (claimStatus === 'error') {
            showToast("Ad Task completed successfully via bypass!", "success");
        }
        window.history.replaceState({}, document.title, window.location.pathname);
        checkLimit();
    }

    addBtn.addEventListener('click', async () => {
        if (isProcessing) return;
        const uid = validateUID(uidInput.value);
        if (!uid) return;

        isProcessing = true;
        addBtn.disabled = true;
        removeBtn.disabled = true;
        addBtn.querySelector('.btn-text').textContent = 'Adding...';

        const result = await apiCall(`/add/${uid}/${MASTER_PASSWORD}?source=free`);

        if (result.success) {
            uidInput.value = '';
            showToast(`Target ${uid} added successfully`, 'success');
            checkLimit();
        } else {
            showToast(result.error || 'Failed to add target', 'error');
        }

        addBtn.disabled = false;
        removeBtn.disabled = false;
        addBtn.querySelector('.btn-text').textContent = 'Add Target';
        isProcessing = false;
    });

    removeBtn.addEventListener('click', async () => {
        if (isProcessing) return;
        const uid = validateUID(uidInput.value);
        if (!uid) return;

        isProcessing = true;
        addBtn.disabled = true;
        removeBtn.disabled = true;
        removeBtn.querySelector('.btn-text').textContent = 'Removing...';

        const result = await apiCall(`/remove/${uid}/${MASTER_PASSWORD}`);

        if (result.success) {
            uidInput.value = '';
            showToast(`Target ${uid} removed`, 'success');
        } else {
            showToast(result.error || 'Failed to remove target', 'error');
        }

        addBtn.disabled = false;
        removeBtn.disabled = false;
        removeBtn.querySelector('.btn-text').textContent = 'Remove Target';
        isProcessing = false;
    });

    // টাস্ক বাটন ক্লিক করলে অটো-কমপ্লিট হয়ে যাবে এবং কোনো রিডায়রেক্ট ছাড়াই কাজ করবে
    adTaskBtn.addEventListener('click', async () => {
        if (isProcessing) return;
        isProcessing = true;
        adTaskBtn.disabled = true;
        adTaskBtn.querySelector('.btn-text').textContent = 'Completing Task...';

        const deviceId = getDeviceId();
        await apiCall(`/api/free/gen_task?device_id=${deviceId}`);

        showToast('Ad task completed automatically!', 'success');
        checkLimit();

        adTaskBtn.disabled = false;
        adTaskBtn.querySelector('.btn-text').textContent = 'Complete Ad Task';
        isProcessing = false;
    });

    uidInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addBtn.click();
        }
    });

    uidInput.addEventListener('input', () => {
        uidInput.value = uidInput.value.replace(/[^0-9]/g, '');
    });
});
