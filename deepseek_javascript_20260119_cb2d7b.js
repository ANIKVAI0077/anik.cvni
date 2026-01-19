// Configuration
const CONFIG = {
    ADMIN_PASSWORD: "anik0077",
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png']
};

// Global Variables
let selectedFiles = [];
let currentPhotos = [];

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD7-4v0NZuFQz-kg3qidn_4HglfR3tXy84",
    authDomain: "shimu-digital-studio.firebaseapp.com",
    projectId: "shimu-digital-studio",
    storageBucket: "shimu-digital-studio.appspot.com",
    messagingSenderId: "852545253639",
    appId: "1:852545253639:web:5f06b13f22d09eaa072384"
};

// Initialize Firebase
let db, storage;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    storage = firebase.storage();
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error:", error);
    showToast("Firebase সংযোগ ব্যর্থ", "অফলাইন মোডে কাজ করছে", "warning");
}

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // Hide loading screen immediately
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        showToast("শিমু ডিজিটাল স্টুডিও", "স্বাগতম!", "success");
    }, 1000);
    
    // Initialize all event listeners
    initEventListeners();
    
    // Load initial data
    loadInitialData();
}

function initEventListeners() {
    // Theme Toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Search Functionality
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // Upload Functionality
    document.getElementById('browseBtn').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    
    document.getElementById('fileInput').addEventListener('change', handleFileSelection);
    
    // Drag and Drop
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#4a6cf7';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#ddd';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ddd';
        if (e.dataTransfer.files.length) {
            document.getElementById('fileInput').files = e.dataTransfer.files;
            handleFileSelection();
        }
    });
    
    // Password Toggle
    document.getElementById('togglePassword').addEventListener('click', () => {
        const passwordInput = document.getElementById('adminPassword');
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        document.getElementById('togglePassword').innerHTML = 
            type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
    
    // Form Submission
    document.getElementById('uploadForm').addEventListener('submit', handleUploadSubmit);
    document.getElementById('resetForm').addEventListener('click', resetUploadForm);
    
    // Gallery Login
    document.getElementById('galleryLoginBtn').addEventListener('click', handleGalleryLogin);
    document.getElementById('logoutGallery').addEventListener('click', handleGalleryLogout);
    document.getElementById('refreshGallery').addEventListener('click', loadGalleryPhotos);
    document.getElementById('gallerySearch').addEventListener('input', filterGallery);
    
    // Notice Board
    document.getElementById('addNoticeBtn').addEventListener('click', showNoticeEditor);
    document.getElementById('closeEditor').addEventListener('click', hideNoticeEditor);
    document.getElementById('cancelNotice').addEventListener('click', hideNoticeEditor);
    document.getElementById('noticeForm').addEventListener('submit', handleNoticeSubmit);
    
    // Services
    document.getElementById('manageServicesBtn').addEventListener('click', () => {
        const password = prompt("সার্ভিস ম্যানেজ করতে অ্যাডমিন পাসওয়ার্ড দিন:");
        if (password === CONFIG.ADMIN_PASSWORD) {
            alert("সার্ভিস ম্যানেজমেন্ট শীঘ্রই আসছে!");
        } else if (password) {
            showToast("ত্রুটি", "ভুল পাসওয়ার্ড", "error");
        }
    });
    
    // Modal
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('downloadBtn').addEventListener('click', downloadCurrentImage);
    document.getElementById('deleteBtn').addEventListener('click', deleteCurrentImage);
    
    // Load default services
    loadDefaultServices();
}

// Theme Function
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const icon = document.getElementById('themeToggle').querySelector('i');
    icon.className = document.body.classList.contains('dark-theme') ? 
        'fas fa-sun' : 'fas fa-moon';
}

// Tab Switching
function switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId + 'Tab').classList.add('active');
    
    // Activate button
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
    
    // Load data for tab
    if (tabId === 'notice') {
        loadNotices();
    } else if (tabId === 'gallery') {
        // Check if already logged in
        const isLoggedIn = localStorage.getItem('galleryLoggedIn') === 'true';
        if (!isLoggedIn) {
            document.getElementById('galleryAuth').style.display = 'block';
            document.getElementById('galleryContent').style.display = 'none';
        } else {
            document.getElementById('galleryAuth').style.display = 'none';
            document.getElementById('galleryContent').style.display = 'block';
            loadGalleryPhotos();
        }
    }
}

// Search Function
async function performSearch() {
    const phone = document.getElementById('searchInput').value.trim();
    
    if (!phone || phone.length !== 11) {
        showToast("ত্রুটি", "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন", "error");
        return;
    }
    
    try {
        const resultsGrid = document.getElementById('resultsGrid');
        resultsGrid.innerHTML = `
            <div class="loading-results">
                <i class="fas fa-spinner fa-spin"></i>
                <p>খোঁজা হচ্ছে...</p>
            </div>
        `;
        
        // Try Firebase first
        let photos = [];
        try {
            if (db) {
                const snapshot = await db.collection('photos')
                    .where('customerNumber', '==', phone)
                    .orderBy('uploadedAt', 'desc')
                    .get();
                
                photos = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }
        } catch (error) {
            console.error("Firebase search error:", error);
        }
        
        // Fallback to local storage
        if (photos.length === 0) {
            const localPhotos = JSON.parse(localStorage.getItem('shimu_photos') || '[]');
            photos = localPhotos.filter(photo => photo.customerNumber === phone);
        }
        
        currentPhotos = photos;
        
        if (photos.length === 0) {
            resultsGrid.innerHTML = `
                <div class="empty-results">
                    <i class="fas fa-search"></i>
                    <p>এই নম্বর দিয়ে কোন ছবি নেই</p>
                    <p>${phone}</p>
                </div>
            `;
            document.getElementById('resultCount').textContent = "0 টি ছবি";
        } else {
            displaySearchResults(photos);
            document.getElementById('resultCount').textContent = `${photos.length} টি ছবি`;
            showToast("সফল", `${photos.length}টি ছবি পাওয়া গেছে`, "success");
        }
        
    } catch (error) {
        console.error("Search error:", error);
        showToast("ত্রুটি", "খোঁজার সময় সমস্যা হয়েছে", "error");
    }
}

function displaySearchResults(photos) {
    const resultsGrid = document.getElementById('resultsGrid');
    resultsGrid.innerHTML = '';
    
    photos.forEach((photo, index) => {
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        photoCard.innerHTML = `
            <img src="${photo.imageUrl}" 
                 alt="ছবি" 
                 onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
            <div class="photo-info">
                <h4 class="photo-title">ছবি ${index + 1}</h4>
                <div class="photo-details">
                    <p><i class="fas fa-phone"></i> ${photo.customerNumber}</p>
                    <p><i class="fas fa-calendar"></i> ${photo.uploadDate || 'তারিখ নেই'}</p>
                    <p><i class="fas fa-file"></i> ${photo.fileSize || 'সাইজ জানা নেই'}</p>
                </div>
                <div class="photo-actions">
                    <button class="btn-primary view-btn" data-index="${index}">
                        <i class="fas fa-eye"></i> দেখুন
                    </button>
                    <button class="btn-secondary download-btn" data-url="${photo.imageUrl}">
                        <i class="fas fa-download"></i> ডাউনলোড
                    </button>
                </div>
            </div>
        `;
        
        resultsGrid.appendChild(photoCard);
    });
    
    // Add event listeners
    resultsGrid.querySelectorAll('.view-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => viewPhoto(index));
    });
    
    resultsGrid.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const url = e.target.closest('.download-btn').dataset.url;
            downloadPhoto(url);
        });
    });
}

// Upload Functions
function handleFileSelection() {
    const files = Array.from(document.getElementById('fileInput').files);
    const validFiles = [];
    
    files.forEach(file => {
        // Check file type
        if (!CONFIG.ALLOWED_TYPES.includes(file.type)) {
            showToast("ত্রুটি", `${file.name}: শুধুমাত্র JPG, PNG ফাইল অনুমোদিত`, "error");
            return;
        }
        
        // Check file size
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            showToast("ত্রুটি", `${file.name}: ১০MB এর বেশি হবে না`, "error");
            return;
        }
        
        validFiles.push(file);
    });
    
    selectedFiles = [...selectedFiles, ...validFiles];
    updateSelectedFilesList();
}

function updateSelectedFilesList() {
    const filesList = document.getElementById('filesList');
    filesList.innerHTML = '';
    
    if (selectedFiles.length === 0) {
        filesList.innerHTML = '<p class="empty-files">কোন ফাইল নির্বাচন করা হয়নি</p>';
        return;
    }
    
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div>
                <strong>${file.name}</strong>
                <p>${formatFileSize(file.size)}</p>
            </div>
            <button class="remove-file" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        filesList.appendChild(fileItem);
    });
    
    // Add remove functionality
    filesList.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('.remove-file').dataset.index);
            selectedFiles.splice(index, 1);
            updateSelectedFilesList();
        });
    });
}

async function handleUploadSubmit(e) {
    e.preventDefault();
    
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const adminPassword = document.getElementById('adminPassword').value;
    
    // Validation
    if (!customerPhone || customerPhone.length !== 11) {
        showToast("ত্রুটি", "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন", "error");
        return;
    }
    
    if (selectedFiles.length === 0) {
        showToast("ত্রুটি", "অন্তত একটি ছবি নির্বাচন করুন", "error");
        return;
    }
    
    if (adminPassword !== CONFIG.ADMIN_PASSWORD) {
        showToast("ত্রুটি", "ভুল অ্যাডমিন পাসওয়ার্ড", "error");
        return;
    }
    
    // Show progress
    const progress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const progressText = document.getElementById('progressText');
    const progressCount = document.getElementById('progressCount');
    
    progress.style.display = 'block';
    progressFill.style.width = '0%';
    progressPercent.textContent = '0%';
    
    let successCount = 0;
    
    try {
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            
            // Update progress
            const currentProgress = ((i + 1) / selectedFiles.length) * 100;
            progressFill.style.width = `${currentProgress}%`;
            progressPercent.textContent = `${Math.round(currentProgress)}%`;
            progressText.textContent = `আপলোড হচ্ছে: ${file.name}`;
            progressCount.textContent = `${i + 1}/${selectedFiles.length}`;
            
            // Simulate upload (replace with actual Firebase upload)
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Create photo object
            const photoData = {
                customerNumber: customerPhone,
                fileName: file.name,
                fileSize: formatFileSize(file.size),
                uploadDate: new Date().toLocaleString('bn-BD'),
                imageUrl: URL.createObjectURL(file), // In real app, this would be Firebase URL
                uploadedAt: new Date().toISOString(),
                uploadedBy: 'admin'
            };
            
            // Save to Firebase
            try {
                if (db) {
                    await db.collection('photos').add(photoData);
                }
            } catch (error) {
                console.error("Firebase save error:", error);
            }
            
            // Save to local storage as backup
            saveToLocalStorage(photoData);
            
            successCount++;
        }
        
        // Complete
        progressText.textContent = 'আপলোড সম্পন্ন!';
        progressFill.style.width = '100%';
        progressPercent.textContent = '100%';
        
        showToast("সফল", `${successCount}টি ছবি আপলোড হয়েছে`, "success");
        
        // Reset form after delay
        setTimeout(() => {
            resetUploadForm();
            progress.style.display = 'none';
            
            // Update stats
            updateStats();
            
            // Switch to search tab
            switchTab('search');
            document.getElementById('searchInput').value = customerPhone;
            setTimeout(() => performSearch(), 500);
        }, 2000);
        
    } catch (error) {
        console.error("Upload error:", error);
        showToast("ত্রুটি", "আপলোড ব্যর্থ হয়েছে", "error");
        progress.style.display = 'none';
    }
}

function resetUploadForm() {
    document.getElementById('uploadForm').reset();
    selectedFiles = [];
    updateSelectedFilesList();
    document.getElementById('uploadProgress').style.display = 'none';
}

// Gallery Functions
function handleGalleryLogin() {
    const password = document.getElementById('galleryPassword').value;
    
    if (password === CONFIG.ADMIN_PASSWORD) {
        localStorage.setItem('galleryLoggedIn', 'true');
        document.getElementById('galleryAuth').style.display = 'none';
        document.getElementById('galleryContent').style.display = 'block';
        loadGalleryPhotos();
        showToast("সফল", "অ্যাডমিন হিসাবে লগইন হয়েছে", "success");
    } else {
        showToast("ত্রুটি", "ভুল পাসওয়ার্ড", "error");
    }
}

function handleGalleryLogout() {
    localStorage.removeItem('galleryLoggedIn');
    document.getElementById('galleryAuth').style.display = 'block';
    document.getElementById('galleryContent').style.display = 'none';
    document.getElementById('galleryPassword').value = '';
    showToast("সফল", "লগআউট করা হয়েছে", "info");
}

async function loadGalleryPhotos() {
    if (localStorage.getItem('galleryLoggedIn') !== 'true') return;
    
    try {
        const galleryGrid = document.getElementById('galleryGrid');
        galleryGrid.innerHTML = `
            <div class="loading-gallery">
                <i class="fas fa-spinner fa-spin"></i>
                <p>গ্যালারি লোড হচ্ছে...</p>
            </div>
        `;
        
        let photos = [];
        
        // Try Firebase
        try {
            if (db) {
                const snapshot = await db.collection('photos')
                    .orderBy('uploadedAt', 'desc')
                    .limit(100)
                    .get();
                
                photos = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }
        } catch (error) {
            console.error("Firebase gallery error:", error);
        }
        
        // Fallback to local storage
        if (photos.length === 0) {
            photos = JSON.parse(localStorage.getItem('shimu_photos') || '[]');
        }
        
        displayGalleryPhotos(photos);
        
        // Update stats
        updateGalleryStats(photos);
        
    } catch (error) {
        console.error("Gallery load error:", error);
        document.getElementById('galleryGrid').innerHTML = `
            <div class="error-gallery">
                <i class="fas fa-exclamation-triangle"></i>
                <p>গ্যালারি লোড করতে সমস্যা</p>
            </div>
        `;
    }
}

function displayGalleryPhotos(photos) {
    const galleryGrid = document.getElementById('galleryGrid');
    
    if (photos.length === 0) {
        galleryGrid.innerHTML = `
            <div class="empty-gallery">
                <i class="fas fa-images"></i>
                <p>কোন ছবি নেই</p>
                <p>ছবি আপলোড করে শুরু করুন</p>
            </div>
        `;
        return;
    }
    
    galleryGrid.innerHTML = '';
    
    photos.forEach((photo, index) => {
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        photoCard.innerHTML = `
            <img src="${photo.imageUrl}" 
                 alt="ছবি"
                 onerror="this.src='https://via.placeholder.com/300x200?text=Image+Error'">
            <div class="photo-info">
                <h4 class="photo-title">${photo.customerNumber}</h4>
                <div class="photo-details">
                    <p><i class="fas fa-calendar"></i> ${photo.uploadDate || 'তারিখ নেই'}</p>
                    <p><i class="fas fa-file"></i> ${photo.fileSize || 'সাইজ নেই'}</p>
                </div>
                <div class="photo-actions">
                    <button class="btn-primary view-btn" data-index="${index}">
                        <i class="fas fa-eye"></i> দেখুন
                    </button>
                    <button class="btn-danger delete-btn" data-id="${photo.id}">
                        <i class="fas fa-trash"></i> ডিলিট
                    </button>
                </div>
            </div>
        `;
        
        galleryGrid.appendChild(photoCard);
    });
    
    // Add event listeners
    galleryGrid.querySelectorAll('.view-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => viewPhoto(index));
    });
    
    galleryGrid.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const photoId = e.target.closest('.delete-btn').dataset.id;
            if (confirm('আপনি কি নিশ্চিত এই ছবি ডিলিট করতে চান?')) {
                await deletePhoto(photoId);
            }
        });
    });
}

function filterGallery() {
    const searchTerm = document.getElementById('gallerySearch').value.toLowerCase();
    const photoCards = document.querySelectorAll('#galleryGrid .photo-card');
    
    photoCards.forEach(card => {
        const customerNumber = card.querySelector('.photo-title').textContent;
        if (customerNumber.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Notice Board Functions
async function loadNotices() {
    try {
        const container = document.getElementById('noticesContainer');
        container.innerHTML = `
            <div class="loading-notices">
                <i class="fas fa-spinner fa-spin"></i>
                <p>নোটিশ লোড হচ্ছে...</p>
            </div>
        `;
        
        let notices = [];
        
        // Try Firebase
        try {
            if (db) {
                const snapshot = await db.collection('notices')
                    .orderBy('createdAt', 'desc')
                    .limit(20)
                    .get();
                
                notices = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }
        } catch (error) {
            console.error("Firebase notices error:", error);
        }
        
        // Fallback to local storage
        if (notices.length === 0) {
            notices = JSON.parse(localStorage.getItem('shimu_notices') || '[]');
        }
        
        displayNotices(notices);
        
    } catch (error) {
        console.error("Load notices error:", error);
        document.getElementById('noticesContainer').innerHTML = `
            <div class="error-notices">
                <i class="fas fa-exclamation-triangle"></i>
                <p>নোটিশ লোড করতে সমস্যা</p>
            </div>
        `;
    }
}

function displayNotices(notices) {
    const container = document.getElementById('noticesContainer');
    
    if (notices.length === 0) {
        container.innerHTML = `
            <div class="empty-notices">
                <i class="fas fa-bullhorn"></i>
                <p>কোন নোটিশ নেই</p>
                <p>প্রথম নোটিশ লিখুন</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    notices.forEach(notice => {
        const noticeCard = document.createElement('div');
        noticeCard.className = 'notice-card';
        noticeCard.innerHTML = `
            <h4>${notice.title}</h4>
            <p class="notice-date">${new Date(notice.createdAt?.seconds * 1000 || notice.createdAt).toLocaleString('bn-BD')}</p>
            <p class="notice-content">${notice.content}</p>
            <p class="notice-author">- ${notice.createdBy || 'অ্যাডমিন'}</p>
        `;
        
        container.appendChild(noticeCard);
    });
}

function showNoticeEditor() {
    const password = prompt("নোটিশ লিখতে অ্যাডমিন পাসওয়ার্ড দিন:");
    
    if (password === CONFIG.ADMIN_PASSWORD) {
        document.getElementById('noticeEditor').style.display = 'block';
        document.getElementById('noticeEditor').scrollIntoView({ behavior: 'smooth' });
    } else if (password) {
        showToast("ত্রুটি", "ভুল পাসওয়ার্ড", "error");
    }
}

function hideNoticeEditor() {
    document.getElementById('noticeEditor').style.display = 'none';
    document.getElementById('noticeForm').reset();
}

async function handleNoticeSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('noticeTitle').value.trim();
    const content = document.getElementById('noticeContent').value.trim();
    const password = document.getElementById('noticePassword').value;
    
    if (!title || !content) {
        showToast("ত্রুটি", "শিরোনাম ও বিবরণ লিখুন", "error");
        return;
    }
    
    if (password !== CONFIG.ADMIN_PASSWORD) {
        showToast("ত্রুটি", "ভুল পাসওয়ার্ড", "error");
        return;
    }
    
    try {
        const noticeData = {
            title: title,
            content: content,
            createdBy: 'admin',
            createdAt: new Date().toISOString()
        };
        
        // Save to Firebase
        try {
            if (db) {
                await db.collection('notices').add({
                    ...noticeData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Firebase notice save error:", error);
        }
        
        // Save to local storage
        saveNoticeToLocalStorage(noticeData);
        
        // Hide editor and reload notices
        hideNoticeEditor();
        loadNotices();
        
        showToast("সফল", "নোটিশ প্রকাশিত হয়েছে", "success");
        
    } catch (error) {
        console.error("Notice save error:", error);
        showToast("ত্রুটি", "নোটিশ প্রকাশ করতে সমস্যা", "error");
    }
}

// Services Functions
function loadDefaultServices() {
    const services = [
        {
            title: "ওয়েডিং ফটোগ্রাফি",
            description: "বিয়ে ও ওয়ালিমার সম্পূর্ণ ফটোগ্রাফি ও ভিডিওগ্রাফি সেবা",
            price: "১০,০০০ - ৫০,০০০ টাকা"
        },
        {
            title: "পাসপোর্ট সাইজ ফটো",
            description: "ভিসা, পাসপোর্ট ও সরকারি কাজের জন্য ফটো",
            price: "১০০ - ৫০০ টাকা"
        },
        {
            title: "স্টুডিও ফটোশুট",
            description: "পারিবারিক, ব্যক্তিগত ও পেশাদার ফটোশুট",
            price: "১,০০০ - ১০,০০০ টাকা"
        },
        {
            title: "ভিডিও এডিটিং",
            description: "প্রফেশনাল ভিডিও এডিটিং ও মন্টাজ",
            price: "২,০০০ - ২০,০০০ টাকা"
        },
        {
            title: "ফটো প্রিন্টিং",
            description: "উচ্চ রেজুলেশনে ফটো প্রিন্টিং সেবা",
            price: "২০ - ৫০০ টাকা"
        },
        {
            title: "অ্যালবাম তৈরি",
            description: "ডিজিটাল ও হার্ডকপি অ্যালবাম তৈরি",
            price: "৫০০ - ৫,০০০ টাকা"
        }
    ];
    
    const servicesGrid = document.getElementById('servicesGrid');
    servicesGrid.innerHTML = '';
    
    services.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        serviceCard.innerHTML = `
            <i class="fas fa-camera"></i>
            <h3>${service.title}</h3>
            <p>${service.description}</p>
            <div class="service-price">${service.price}</div>
        `;
        
        servicesGrid.appendChild(serviceCard);
    });
}

// Modal Functions
let currentModalPhoto = null;

function viewPhoto(index) {
    const photo = currentPhotos[index];
    if (!photo) return;
    
    currentModalPhoto = photo;
    
    document.getElementById('modalImage').src = photo.imageUrl;
    document.getElementById('imageModal').style.display = 'flex';
    
    // Show delete button only in gallery mode for admin
    const isGallery = document.getElementById('galleryContent').style.display === 'block';
    const isAdmin = localStorage.getItem('galleryLoggedIn') === 'true';
    document.getElementById('deleteBtn').style.display = isGallery && isAdmin ? 'block' : 'none';
}

function closeModal() {
    document.getElementById('imageModal').style.display = 'none';
    currentModalPhoto = null;
}

function downloadCurrentImage() {
    if (!currentModalPhoto?.imageUrl) return;
    
    const link = document.createElement('a');
    link.href = currentModalPhoto.imageUrl;
    link.download = `shimu_${currentModalPhoto.customerNumber}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("সফল", "ছবি ডাউনলোড শুরু হয়েছে", "success");
}

async function deletePhoto(photoId) {
    try {
        // Delete from Firebase
        if (db) {
            await db.collection('photos').doc(photoId).delete();
        }
        
        // Delete from local storage
        const localPhotos = JSON.parse(localStorage.getItem('shimu_photos') || '[]');
        const updatedPhotos = localPhotos.filter(photo => photo.id !== photoId);
        localStorage.setItem('shimu_photos', JSON.stringify(updatedPhotos));
        
        // Reload gallery
        loadGalleryPhotos();
        
        showToast("সফল", "ছবি ডিলিট করা হয়েছে", "success");
        
    } catch (error) {
        console.error("Delete photo error:", error);
        showToast("ত্রুটি", "ছবি ডিলিট করতে সমস্যা", "error");
    }
}

async function deleteCurrentImage() {
    if (!currentModalPhoto?.id) return;
    
    if (confirm('আপনি কি নিশ্চিত এই ছবি ডিলিট করতে চান?')) {
        await deletePhoto(currentModalPhoto.id);
        closeModal();
    }
}

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function saveToLocalStorage(photoData) {
    const photos = JSON.parse(localStorage.getItem('shimu_photos') || '[]');
    photos.push({
        ...photoData,
        id: Date.now().toString()
    });
    localStorage.setItem('shimu_photos', JSON.stringify(photos));
}

function saveNoticeToLocalStorage(noticeData) {
    const notices = JSON.parse(localStorage.getItem('shimu_notices') || '[]');
    notices.push({
        ...noticeData,
        id: Date.now().toString()
    });
    localStorage.setItem('shimu_notices', JSON.stringify(notices));
}

function updateStats() {
    // Get photos from localStorage
    const photos = JSON.parse(localStorage.getItem('shimu_photos') || '[]');
    const totalPhotos = photos.length;
    
    // Count unique customers
    const customers = new Set(photos.map(p => p.customerNumber));
    const totalCustomers = customers.size;
    
    // Count today's uploads
    const today = new Date().toDateString();
    const todayUploads = photos.filter(p => 
        new Date(p.uploadedAt).toDateString() === today
    ).length;
    
    // Update UI
    document.getElementById('totalPhotos').textContent = totalPhotos;
    document.getElementById('totalCustomers').textContent = totalCustomers;
    document.getElementById('todayUploads').textContent = todayUploads;
}

function updateGalleryStats(photos) {
    // This function would update gallery-specific stats
    // For now, just update total count
    document.getElementById('galleryTotal').textContent = photos.length;
}

function loadInitialData() {
    // Initialize localStorage if empty
    if (!localStorage.getItem('shimu_photos')) {
        localStorage.setItem('shimu_photos', JSON.stringify([]));
    }
    if (!localStorage.getItem('shimu_notices')) {
        localStorage.setItem('shimu_notices', JSON.stringify([]));
    }
    
    // Update stats
    updateStats();
    
    // Load notices
    loadNotices();
}

// Toast Notification
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div>
            <strong>${title}</strong>
            <p>${message}</p>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Add close button functionality
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// Photo download function
function downloadPhoto(url) {
    const link = document.createElement('a');
    link.href = url;
    link.download = `shimu_photo_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("সফল", "ছবি ডাউনলোড শুরু হয়েছে", "success");
}