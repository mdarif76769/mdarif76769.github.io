Document.addEventListener('DOMContentLoaded', () => {
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
    const MAX_LIMIT = 115; // মোট দৈনিক লিমিট

    let toastTimer = null;
    let isProcessing = false;

    // টোস্ট মেসেজ দেখানোর ফাংশন
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

    // লোকাল স্টোরেজ থেকে বর্তমান লিমিট চেক করার ফাংশন (সার্ভার ছাড়া)
    function checkLimit() {
        let today = new Date().toDateString();
        let savedDate = localStorage.getItem('limit_date');
        let remaining = localStorage.getItem('remaining_limit');

        // যদি দিন পরিবর্তন হয় বা প্রথমবার হয়, তবে লিমিট রিসেট হবে
        if (savedDate !== today || remaining === null) {
            localStorage.setItem('limit_date', today);
            localStorage.setItem('remaining_limit', MAX_LIMIT);
            remaining = MAX_LIMIT;
        } else {
            remaining = parseInt(remaining, 10);
        }

        if (limitDisplay) limitDisplay.textContent = remaining;
        if (limitTotalDisplay) limitTotalDisplay.textContent = MAX_LIMIT;
        updateLimitUI(remaining);
        return remaining;
    }

    // ইউআই আপডেট ও লিমিট চেক
    function updateLimitUI(remaining) {
        const limitInfo = document.querySelector('.limit-info');
        if (!limitInfo) return;
        if (remaining <= 0) {
            addBtn.disabled = true;
            addBtn.querySelector('.btn-text').textContent = 'Daily Limit Reached';
            limitInfo.classList.add('limit-exceeded');
        } else {
            limitInfo.classList.remove('limit-exceeded');
            addBtn.disabled = false;
            addBtn.querySelector('.btn-text').textContent = 'Add Target';
        }
    }

    // UID ভ্যালিডেশন
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

    checkLimit();

    // টার্গেট যোগ করার বাটন ইভেন্ট (লোকাল লজিক)
    addBtn.addEventListener('click', () => {
        if (isProcessing) return;
        let currentRemaining = checkLimit();

        if (currentRemaining <= 0) {
            showToast('Daily limit reached! Try again tomorrow.', 'error');
            return;
        }

        const uid = validateUID(uidInput.value);
        if (!uid) return;

        isProcessing = true;
        addBtn.disabled = true;
        removeBtn.disabled = true;
        addBtn.querySelector('.btn-text').textContent = 'Adding...';

        // লোকাল স্টোরেজে সফলভাবে যোগ করার সিমুলেশন
        setTimeout(() => {
            currentRemaining -= 1;
            localStorage.setItem('remaining_limit', currentRemaining);

            uidInput.value = '';
            showToast(`Target ${uid} added successfully`, 'success');
            checkLimit();

            addBtn.disabled = false;
            removeBtn.disabled = false;
            addBtn.querySelector('.btn-text').textContent = 'Add Target';
            isProcessing = false;
        }, 500);
    });

    // টার্গেট রিমুভ করার বাটন ইভেন্ট
    removeBtn.addEventListener('click', () => {
        if (isProcessing) return;
        const uid = validateUID(uidInput.value);
        if (!uid) return;

        isProcessing = true;
        addBtn.disabled = true;
        removeBtn.disabled = true;
        removeBtn.querySelector('.btn-text').textContent = 'Removing...';

        setTimeout(() => {
            uidInput.value = '';
            showToast(`Target ${uid} removed`, 'success');

            addBtn.disabled = false;
            removeBtn.disabled = false;
            removeBtn.querySelector('.btn-text').textContent = 'Remove Target';
            isProcessing = false;
        }, 500);
    });

    // অ্যাড টাস্ক বাটন (সার্ভার ছাড়া লোকাল বোনাস যুক্ত করার ব্যবস্থা)
    adTaskBtn.addEventListener('click', () => {
        if (isProcessing) return;
        isProcessing = true;
        adTaskBtn.disabled = true;
        adTaskBtn.querySelector('.btn-text').textContent = 'Processing Task...';

        setTimeout(() => {
            let currentRemaining = checkLimit();
            currentRemaining += 5; // বোনাস ৫টি এড যোগ হলো
            localStorage.setItem('remaining_limit', currentRemaining);

            showToast('Bonus Claimed! 5 Extra adds added to your limit.', 'success');
            checkLimit();

            adTaskBtn.disabled = false;
            adTaskBtn.querySelector('.btn-text').textContent = 'Complete Ad Task';
            isProcessing = false;
        }, 1000);
    });

    // ইন্টার বাটন হ্যান্ডেল
    uidInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addBtn.click();
        }
    });

    // শুধুমাত্র সংখ্যা ইনপুট নিশ্চিত করা
    uidInput.addEventListener('input', () => {
        uidInput.value = uidInput.value.replace(/[^0-9]/g, '');
    });
});
