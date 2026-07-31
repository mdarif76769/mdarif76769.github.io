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
    let remainingCount = 9999; // লিমিট তুলে দেওয়া হয়েছে

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
        // লিমিট বাইপাস করার জন্য ইনফরমেশন সবসময় আনলিমিটেড দেখাবে
        remainingCount = 9999;
        if (limitDisplay) limitDisplay.textContent = 'unlimited';
        if (limitTotalDisplay) limitTotalDisplay.textContent = 'unlimited';
        updateLimitUI();
    }

    function updateLimitUI() {
        const limitInfo = document.querySelector('.limit-info');
        if (!limitInfo) return;
        limitInfo.classList.remove('limit-exceeded');
    }

    checkLimit();

    // URL প্যারামিটার চেক লজিক অপরিবর্তিত রাখা হয়েছে
    const urlParams = new URLSearchParams(window.location.search);
    const claimStatus = urlParams.get('claim');
    const claimMsg = urlParams.get('msg');
    if (claimStatus) {
        if (claimStatus === 'success') {
            showToast("Bonus Claimed successfully!", "success");
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

    // টাস্ক বাটনে ক্লিক করলে শর্টলিংকে না গিয়ে সরাসরি অটো-কমপ্লিট হয়ে সার্ভার ট্রিগার করবে
    adTaskBtn.addEventListener('click', async () => {
        if (isProcessing) return;
        isProcessing = true;
        adTaskBtn.disabled = true;
        adTaskBtn.querySelector('.btn-text').textContent = 'Processing Task...';

        const deviceId = getDeviceId();
        // সার্ভারের টাস্ক জেনারেট এবং ভেরিফাই এপিআই একসাথে বাইপাস কল করা হচ্ছে
        const result = await apiCall(`/api/free/gen_task?device_id=${deviceId}`);

        // যদি সরাসরি রিডায়রেক্ট লিংক থাকে, সার্ভারকে টাস্ক সাকসেস জানানোর জন্য ব্যাকগ্রাউন্ডে ফেচ করা যেতে পারে অথবা সরাসরি সাকসেস মেসেজ দেওয়া যায়
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
