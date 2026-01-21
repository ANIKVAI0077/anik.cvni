// Configuration
const CONFIG = {
    ADMIN_PASSWORD: "anik0077",
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
};

// Global Variables
let selectedFiles = [];
let currentPhotos = [];
let db = null;
let storage = null;
let isFirebaseInitialized = false;

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD7-4v0NZuFQz-kg3qidn_4HglfR3tXy84",
    authDomain: "shimu-digital-studio.firebaseapp.com",
    projectId: "shimu-digital-studio",
    storageBucket: "shimu-digital-studio.appspot.com",
    messagingSenderId: "852545253639",
    appId: "1:852545253639:web:5f06b13f22d09eaa072384"
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

async function initApp() {
    try {
        // Hide loading screen after 1.5 seconds
        setTimeout(() => {
            document.getElementById('loading').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loading').style.display = 'none';
            }, 500);
            showToast("শিমু ডিজিটাল স্টুডিও", "স্বাগতম!", "success");
        }, 1500);
        
        // Initialize Firebase
        await initializeFirebase();
        
        // Initialize all event listeners
        initEventListeners();
        
        // Load initial data
        loadInitialData();
        
    } catch (error) {
        console.error("App initialization error:", error);
        showToast("ত্রুটি", "অ্যাপ শুরু করতে সমস্যা হয়েছে", "error");
    }
}

async function initializeFirebase() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        db = firebase.firestore();
        storage = firebase.storage();
        isFirebaseInitialized = true;
        
        console.log("Firebase initialized successfully");
        showToast("সফল", "Firebase সংযোগ সফল", "success", 2000);
        
    } catch (error) {
        console.error("Firebase initialization error:", error);
        isFirebaseInitialized = false;
        showToast("সতর্কতা", "Firebase সংযোগ ব্যর্থ, অফলাইন মোডে কাজ করছে", "warning");
    }
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
        uploadArea.style.transform = 'scale(1.02)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.transform = 'scale(1)';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.transform = 'scale(1)';
        if (e.dataTransfer.files.length) {
            document.getElementById('fileInput').files = e.dataTransfer.files;
            handleFileSelection();
        }
    });
    
    // Password Toggle
    document.getElementById('togglePassword').addEventListener('click', togglePasswordVisibility);
    
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
    document.getElementById('manageServicesBtn').addEventListener('click', manageServices);
    
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
    if (document.body.classList.contains('dark-theme')) {
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

// Password Toggle Function
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('adminPassword');
    const toggleBtn = document.getElementById('togglePassword');
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    toggleBtn.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
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
    const tabElement = document.getElementById(tabId + 'Tab');
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Activate button
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Load data for tab
    if (tabId === 'notice') {
        loadNotices();
    } else if (tabId === 'gallery') {
        checkGalleryAuth();
    }
}

// Check Gallery Authentication
function checkGalleryAuth() {
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

// Search Function
async function performSearch() {
    const phone = document.getElementById('searchInput').value.trim();
    
    if (!phone || phone.length !== 11 || !/^01[3-9]\d{8}$/.test(phone)) {
        showToast("ত্রুটি", "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (01XXXXXXXXX)", "error");
        return;
    }
    
    try {
        const resultsGrid = document.getElementById('resultsGrid');
        resultsGrid.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>খোঁজা হচ্ছে...</p>
            </div>
        `;
        
        let photos = [];
        
        // Try Firebase first
        if (isFirebaseInitialized && db) {
            try {
                const snapshot = await db.collection('photos')
                    .where('customerNumber', '==', phone)
                    .orderBy('uploadedAt', 'desc')
                    .get();
                
                photos = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log(`Found ${photos.length} photos from Firebase for ${phone}`);
            } catch (error) {
                console.error("Firebase search error:", error);
            }
        }
        
        // Fallback to local storage
        if (photos.length === 0) {
            const localPhotos = JSON.parse(localStorage.getItem('shimu_photos') || '[]');
            photos = localPhotos.filter(photo => photo.customerNumber === phone);
            console.log(`Found ${photos.length} photos from Local Storage for ${phone}`);
        }
        
        currentPhotos = photos;
        
        if (photos.length === 0) {
            resultsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>কোন ছবি পাওয়া যায়নি</h3>
                    <p>এই নম্বর দিয়ে কোন ছবি নেই: ${phone}</p>
                    <p class="help-text">অনুগ্রহ করে আবার চেষ্টা করুন বা স্টুডিওতে যোগাযোগ করুন</p>
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
        document.getElementById('resultsGrid').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>ত্রুটি হয়েছে</h3>
                <p>অনুগ্রহ করে আবার চেষ্টা করুন</p>
            </div>
        `;
    }
}

function displaySearchResults(photos) {
    const resultsGrid = document.getElementById('resultsGrid');
    resultsGrid.innerHTML = '';
    
    if (photos.length === 0) {
        resultsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>কোন ছবি নেই</h3>
                <p>এই নম্বর দিয়ে কোন ছবি পাওয়া যায়নি</p>
            </div>
        `;
        return;
    }
    
    photos.forEach((photo, index) => {
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        photoCard.innerHTML = `
            <img src="${photo.imageUrl}" 
                 alt="ছবি ${index + 1}"
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/400x300?text=Image+Not+Available'">
            <div class="photo-info">
                <h4 class="photo-title">ছবি ${index + 1}</h4>
                <div class="photo-details">
                    <p><i class="fas fa-phone"></i> ${photo.customerNumber || 'নম্বর নেই'}</p>
                    <p><i class="fas fa-calendar"></i> ${formatDate(photo.uploadDate) || 'তারিখ নেই'}</p>
                    <p><i class="fas fa-file"></i> ${photo.fileSize || 'সাইজ জানা নেই'}</p>
                </div>
                <div class="photo-actions">
                    <button class="btn-primary view-btn" data-index="${index}">
                        <i class="fas fa-eye"></i> দেখুন
                    </button>
                    <button class="btn-secondary download-btn" data-url="${photo.imageUrl}" data-filename="${photo.fileName || 'shimu_photo'}">
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
            const filename = e.target.closest('.download-btn').dataset.filename;
            downloadPhoto(url, filename);
        });
    });
}

// Upload Functions
function handleFileSelection() {
    const files = Array.from(document.getElementById('fileInput').files);
    const validFiles = [];
    
    if (files.length === 0) return;
    
    files.forEach(file => {
        // Check file type
        if (!CONFIG.ALLOWED_TYPES.includes(file.type)) {
            showToast("ত্রুটি", `${file.name}: শুধুমাত্র JPG, PNG, JPEG, WEBP ফাইল অনুমোদিত`, "error");
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
    
    if (validFiles.length > 0) {
        showToast("সফল", `${validFiles.length}টি ফাইল নির্বাচন করা হয়েছে`, "success");
    }
    
    // Reset file input
    document.getElementById('fileInput').value = '';
}

function updateSelectedFilesList() {
    const filesList = document.getElementById('filesList');
    
    if (selectedFiles.length === 0) {
        filesList.innerHTML = '<p class="empty-files">কোন ফাইল নির্বাচন করা হয়নি</p>';
        return;
    }
    
    filesList.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <strong>${file.name}</strong>
                <p>${formatFileSize(file.size)} • ${file.type.split('/')[1].toUpperCase()}</p>
            </div>
            <button class="remove-file" data-index="${index}" title="ফাইল সরান">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        filesList.appendChild(fileItem);
    });
    
    // Add remove functionality
    filesList.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('.remove-file').dataset.index);
            const removedFile = selectedFiles[index];
            selectedFiles.splice(index, 1);
            updateSelectedFilesList();
            showToast("সফল", `${removedFile.name} ফাইল সরানো হয়েছে`, "info");
        });
    });
}

async function handleUploadSubmit(e) {
    e.preventDefault();
    
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const adminPassword = document.getElementById('adminPassword').value;
    
    // Validation
    if (!customerPhone || customerPhone.length !== 11 || !/^01[3-9]\d{8}$/.test(customerPhone)) {
        showToast("ত্রুটি", "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (01XXXXXXXXX)", "error");
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
    
    // Disable form during upload
    const form = document.getElementById('uploadForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const resetBtn = document.getElementById('resetForm');
    submitBtn.disabled = true;
    resetBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> আপলোড হচ্ছে...';
    
    // Show progress
    const progress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const progressText = document.getElementById('progressText');
    const progressCount = document.getElementById('progressCount');
    
    progress.style.display = 'block';
    progressFill.style.width = '0%';
    progressPercent.textContent = '0%';
    progressText.textContent = 'প্রস্তুত হচ্ছে...';
    progressCount.textContent = `0/${selectedFiles.length}`;
    
    let successCount = 0;
    let errorCount = 0;
    const uploadedPhotos = [];
    
    try {
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            
            // Update progress
            const currentProgress = ((i + 1) / selectedFiles.length) * 100;
            progressFill.style.width = `${currentProgress}%`;
            progressPercent.textContent = `${Math.round(currentProgress)}%`;
            progressText.textContent = `আপলোড হচ্ছে: ${file.name}`;
            progressCount.textContent = `${i + 1}/${selectedFiles.length}`;
            
            try {
                console.log(`Uploading file ${i + 1}/${selectedFiles.length}: ${file.name}`);
                
                // Create unique filename
                const timestamp = Date.now();
                const randomString = Math.random().toString(36).substring(7);
                const fileName = `${customerPhone}_${timestamp}_${randomString}.${file.name.split('.').pop()}`;
                
                let imageUrl = '';
                
                // Upload to Firebase Storage if available
                if (isFirebaseInitialized && storage) {
                    try {
                        const storageRef = storage.ref(`photos/${fileName}`);
                        const uploadTask = storageRef.put(file);
                        
                        // Wait for upload to complete
                        await new Promise((resolve, reject) => {
                            uploadTask.on('state_changed',
                                (snapshot) => {
                                    // Progress tracking if needed
                                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                    console.log(`Upload progress: ${progress}%`);
                                },
                                (error) => {
                                    console.error('Upload error:', error);
                                    reject(error);
                                },
                                async () => {
                                    // Upload completed successfully
                                    try {
                                        imageUrl = await uploadTask.snapshot.ref.getDownloadURL();
                                        console.log('File available at:', imageUrl);
                                        resolve();
                                    } catch (urlError) {
                                        console.error('Get download URL error:', urlError);
                                        reject(urlError);
                                    }
                                }
                            );
                        });
                    } catch (storageError) {
                        console.error('Storage upload error:', storageError);
                        // Fallback to data URL
                        imageUrl = await convertFileToDataURL(file);
                    }
                } else {
                    // Fallback to data URL if Firebase is not available
                    imageUrl = await convertFileToDataURL(file);
                }
                
                // Create photo object
                const photoData = {
                    customerNumber: customerPhone,
                    fileName: file.name,
                    fileSize: formatFileSize(file.size),
                    fileType: file.type,
                    uploadDate: new Date().toISOString(),
                    imageUrl: imageUrl,
                    uploadedAt: new Date().toISOString(),
                    uploadedBy: 'admin',
                    storagePath: isFirebaseInitialized ? `photos/${fileName}` : null
                };
                
                // Save to Firebase Firestore
                if (isFirebaseInitialized && db) {
                    try {
                        await db.collection('photos').add(photoData);
                        console.log('Saved to Firestore');
                    } catch (firestoreError) {
                        console.error('Firestore save error:', firestoreError);
                    }
                }
                
                // Save to local storage
                saveToLocalStorage(photoData);
                uploadedPhotos.push(photoData);
                
                successCount++;
                console.log(`Successfully uploaded: ${file.name}`);
                
            } catch (fileError) {
                console.error(`Error uploading ${file.name}:`, fileError);
                errorCount++;
                showToast("ত্রুটি", `${file.name} আপলোড ব্যর্থ`, "error", 3000);
            }
        }
        
        // Complete
        progressText.textContent = 'আপলোড সম্পন্ন!';
        progressFill.style.width = '100%';
        progressPercent.textContent = '100%';
        
        if (errorCount === 0) {
            showToast("সফল", `${successCount}টি ছবি সফলভাবে আপলোড হয়েছে`, "success");
        } else {
            showToast("সতর্কতা", `${successCount}টি সফল, ${errorCount}টি ব্যর্থ`, "warning");
        }
        
        // Update stats
        updateStats();
        
        // Reset form after delay
        setTimeout(() => {
            resetUploadForm();
            progress.style.display = 'none';
            
            // Re-enable form
            submitBtn.disabled = false;
            resetBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-upload"></i> ছবি আপলোড করুন';
            
            // Switch to search tab with the phone number
            switchTab('search');
            document.getElementById('searchInput').value = customerPhone;
            
            // Perform search after a delay
            setTimeout(() => {
                if (uploadedPhotos.length > 0) {
                    currentPhotos = uploadedPhotos;
                    displaySearchResults(uploadedPhotos);
                    document.getElementById('resultCount').textContent = `${uploadedPhotos.length} টি ছবি`;
                } else {
                    performSearch();
                }
            }, 500);
            
        }, 2000);
        
    } catch (error) {
        console.error("Upload process error:", error);
        showToast("ত্রুটি", "আপলোড প্রক্রিয়া ব্যর্থ হয়েছে", "error");
        progress.style.display = 'none';
        
        // Re-enable form
        submitBtn.disabled = false;
        resetBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-upload"></i> ছবি আপলোড করুন';
    }
}

// Convert file to data URL for local storage
function convertFileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
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
        document.getElementById('galleryPassword').value = '';
        document.getElementById('galleryPassword').focus();
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
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>গ্যালারি লোড হচ্ছে...</p>
            </div>
        `;
        
        let photos = [];
        
        // Try Firebase
        if (isFirebaseInitialized && db) {
            try {
                const snapshot = await db.collection('photos')
                    .orderBy('uploadedAt', 'desc')
                    .limit(200)
                    .get();
                
                photos = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log(`Loaded ${photos.length} photos from Firebase for gallery`);
            } catch (error) {
                console.error("Firebase gallery error:", error);
            }
        }
        
        // Fallback to local storage
        if (photos.length === 0) {
            photos = JSON.parse(localStorage.getItem('shimu_photos') || '[]');
            photos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
            photos = photos.slice(0, 200); // Limit to 200 photos
            console.log(`Loaded ${photos.length} photos from Local Storage for gallery`);
        }
        
        displayGalleryPhotos(photos);
        
        // Update stats
        updateGalleryStats(photos);
        
    } catch (error) {
        console.error("Gallery load error:", error);
        document.getElementById('galleryGrid').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>গ্যালারি লোড করতে সমস্যা</h3>
                <p>অনুগ্রহ করে আবার চেষ্টা করুন</p>
            </div>
        `;
    }
}

function displayGalleryPhotos(photos) {
    const galleryGrid = document.getElementById('galleryGrid');
    
    if (photos.length === 0) {
        galleryGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images"></i>
                <h3>কোন ছবি নেই</h3>
                <p>আপলোড ট্যাবে গিয়ে নতুন ছবি আপলোড করুন</p>
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
                 alt="ছবি ${index + 1}"
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/400x300?text=Image+Not+Available'">
            <div class="photo-info">
                <h4 class="photo-title">${photo.customerNumber || 'নম্বর নেই'}</h4>
                <div class="photo-details">
                    <p><i class="fas fa-calendar"></i> ${formatDate(photo.uploadDate) || 'তারিখ নেই'}</p>
                    <p><i class="fas fa-file"></i> ${photo.fileSize || 'সাইজ নেই'}</p>
                    <p><i class="fas fa-user"></i> ${photo.uploadedBy || 'অ্যাডমিন'}</p>
                </div>
                <div class="photo-actions">
                    <button class="btn-primary view-btn" data-index="${index}">
                        <i class="fas fa-eye"></i> দেখুন
                    </button>
                    <button class="btn-danger delete-btn" data-id="${photo.id}" data-firebase-id="${photo.id}">
                        <i class="fas fa-trash"></i> ডিলিট
                    </button>
                </div>
            </div>
        `;
        
        galleryGrid.appendChild(photoCard);
    });
    
    // Add event listeners
    galleryGrid.querySelectorAll('.view-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const photos = getGalleryPhotos();
            if (photos && photos[index]) {
                currentPhotos = photos;
                viewPhoto(index);
            }
        });
    });
    
    galleryGrid.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const photoId = e.target.closest('.delete-btn').dataset.id;
            const firebaseId = e.target.closest('.delete-btn').dataset.firebaseId;
            
            if (confirm('আপনি কি নিশ্চিত এই ছবি ডিলিট করতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।')) {
                await deletePhoto(photoId, firebaseId);
            }
        });
    });
}

function getGalleryPhotos() {
    // This function should return the current photos array
    // For now, we'll get it from localStorage
    return JSON.parse(localStorage.getItem('shimu_photos') || '[]');
}

function filterGallery() {
    const searchTerm = document.getElementById('gallerySearch').value.toLowerCase();
    const photoCards = document.querySelectorAll('#galleryGrid .photo-card');
    let visibleCount = 0;
    
    photoCards.forEach(card => {
        const customerNumber = card.querySelector('.photo-title').textContent.toLowerCase();
        if (customerNumber.includes(searchTerm)) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Update stats
    document.getElementById('galleryTotal').textContent = visibleCount;
}

async function deletePhoto(photoId, firebaseId = null) {
    try {
        showToast("প্রক্রিয়া চলছে", "ছবি ডিলিট করা হচ্ছে...", "info");
        
        // Delete from Firebase if available
        if (isFirebaseInitialized && db && firebaseId) {
            try {
                await db.collection('photos').doc(firebaseId).delete();
                console.log(`Deleted from Firebase: ${firebaseId}`);
            } catch (firebaseError) {
                console.error('Firebase delete error:', firebaseError);
            }
        }
        
        // Delete from local storage
        const localPhotos = JSON.parse(localStorage.getItem('shimu_photos') || '[]');
        const updatedPhotos = localPhotos.filter(photo => photo.id !== photoId);
        localStorage.setItem('shimu_photos', JSON.stringify(updatedPhotos));
        
        // Reload gallery
        await loadGalleryPhotos();
        
        // Update stats
        updateStats();
        
        showToast("সফল", "ছবি ডিলিট করা হয়েছে", "success");
        
    } catch (error) {
        console.error("Delete photo error:", error);
        showToast("ত্রুটি", "ছবি ডিলিট করতে সমস্যা", "error");
    }
}

// Notice Board Functions
async function loadNotices() {
    try {
        const container = document.getElementById('noticesContainer');
        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>নোটিশ লোড হচ্ছে...</p>
            </div>
        `;
        
        let notices = [];
        
        // Try Firebase
        if (isFirebaseInitialized && db) {
            try {
                const snapshot = await db.collection('notices')
                    .orderBy('createdAt', 'desc')
                    .limit(20)
                    .get();
                
                notices = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } catch (error) {
                console.error("Firebase notices error:", error);
            }
        }
        
        // Fallback to local storage
        if (notices.length === 0) {
            notices = JSON.parse(localStorage.getItem('shimu_notices') || '[]');
            notices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        displayNotices(notices);
        
    } catch (error) {
        console.error("Load notices error:", error);
        document.getElementById('noticesContainer').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>নোটিশ লোড করতে সমস্যা</h3>
                <p>অনুগ্রহ করে আবার চেষ্টা করুন</p>
            </div>
        `;
    }
}

function displayNotices(notices) {
    const container = document.getElementById('noticesContainer');
    
    if (notices.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bullhorn"></i>
                <h3>কোন নোটিশ নেই</h3>
                <p>প্রথম নোটিশ লিখে শুরু করুন</p>
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
            <span class="notice-date">${formatDate(notice.createdAt)}</span>
            <p class="notice-content">${notice.content}</p>
            <p class="notice-author">- ${notice.createdBy || 'শিমু ডিজিটাল স্টুডিও'}</p>
        `;
        
        container.appendChild(noticeCard);
    });
}

function showNoticeEditor() {
    const password = prompt("নোটিশ লিখতে অ্যাডমিন পাসওয়ার্ড দিন:");
    
    if (password === CONFIG.ADMIN_PASSWORD) {
        document.getElementById('noticeEditor').style.display = 'block';
        document.getElementById('noticeEditor').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        document.getElementById('noticeTitle').focus();
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
            createdBy: 'শিমু ডিজিটাল স্টুডিও',
            createdAt: new Date().toISOString()
        };
        
        // Save to Firebase
        if (isFirebaseInitialized && db) {
            try {
                await db.collection('notices').add({
                    ...noticeData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (error) {
                console.error("Firebase notice save error:", error);
            }
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
            description: "বিয়ে ও ওয়ালিমার সম্পূর্ণ ফটোগ্রাফি ও ভিডিওগ্রাফি সেবা, প্রফেশনাল ফটোগ্রাফার দিয়ে",
            price: "১০,০০০ - ৫০,০০০ টাকা",
            icon: "fas fa-heart"
        },
        {
            title: "পাসপোর্ট সাইজ ফটো",
            description: "ভিসা, পাসপোর্ট, সরকারি ও বেসরকারি কাজের জন্য ফটো, ৩০ মিনিটে তৈরি",
            price: "১০০ - ৫০০ টাকা",
            icon: "fas fa-id-card"
        },
        {
            title: "স্টুডিও ফটোশুট",
            description: "পারিবারিক, ব্যক্তিগত, পেশাদার ও পণ্যের ফটোশুট, মডেল সহ",
            price: "১,০০০ - ১০,০০০ টাকা",
            icon: "fas fa-camera"
        },
        {
            title: "ভিডিও এডিটিং",
            description: "প্রফেশনাল ভিডিও এডিটিং, মন্টাজ, কালার গ্রেডিং ও সাউন্ড এডিটিং",
            price: "২,০০০ - ২০,০০০ টাকা",
            icon: "fas fa-video"
        },
        {
            title: "ফটো প্রিন্টিং",
            description: "উচ্চ রেজুলেশনে ফটো প্রিন্টিং, বিভিন্ন সাইজে, অ্যালবাম কভার সহ",
            price: "২০ - ৫০০ টাকা",
            icon: "fas fa-print"
        },
        {
            title: "অ্যালবাম তৈরি",
            description: "ডিজিটাল ও হার্ডকপি অ্যালবাম তৈরি, কাস্টম ডিজাইন, প্রিমিয়াম কাগজে",
            price: "৫০০ - ৫,০০০ টাকা",
            icon: "fas fa-images"
        }
    ];
    
    const servicesGrid = document.getElementById('servicesGrid');
    servicesGrid.innerHTML = '';
    
    services.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        serviceCard.innerHTML = `
            <i class="${service.icon}"></i>
            <h3>${service.title}</h3>
            <p>${service.description}</p>
            <div class="service-price">${service.price}</div>
        `;
        
        servicesGrid.appendChild(serviceCard);
    });
    
    // Update service count
    document.getElementById('totalServices').textContent = services.length;
}

function manageServices() {
    const password = prompt("সার্ভিস ম্যানেজ করতে অ্যাডমিন পাসওয়ার্ড দিন:");
    if (password === CONFIG.ADMIN_PASSWORD) {
        showToast("সফল", "সার্ভিস ম্যানেজমেন্ট প্যানেল খোলা হচ্ছে...", "success");
        setTimeout(() => {
            alert("সার্ভিস ম্যানেজমেন্ট প্যানেল শীঘ্রই আসছে!");
        }, 500);
    } else if (password) {
        showToast("ত্রুটি", "ভুল পাসওয়ার্ড", "error");
    }
}

// Modal Functions
let currentModalPhoto = null;

function viewPhoto(index) {
    if (!currentPhotos || !currentPhotos[index]) {
        showToast("ত্রুটি", "ছবি লোড করতে সমস্যা", "error");
        return;
    }
    
    const photo = currentPhotos[index];
    currentModalPhoto = photo;
    
    const modalImage = document.getElementById('modalImage');
    modalImage.src = '';
    
    // Set a placeholder first
    modalImage.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f0f0f0"/><text x="200" y="150" text-anchor="middle" fill="%23999" font-family="Arial" font-size="16">লোড হচ্ছে...</text></svg>';
    
    // Load the actual image
    const img = new Image();
    img.onload = () => {
        modalImage.src = photo.imageUrl;
        document.getElementById('imageModal').style.display = 'flex';
        
        // Show delete button only in gallery mode for admin
        const isGallery = document.getElementById('galleryContent').style.display === 'block';
        const isAdmin = localStorage.getItem('galleryLoggedIn') === 'true';
        document.getElementById('deleteBtn').style.display = isGallery && isAdmin ? 'inline-flex' : 'none';
    };
    img.onerror = () => {
        modalImage.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
        document.getElementById('imageModal').style.display = 'flex';
    };
    img.src = photo.imageUrl;
}

function closeModal() {
    document.getElementById('imageModal').style.display = 'none';
    currentModalPhoto = null;
}

function downloadCurrentImage() {
    if (!currentModalPhoto?.imageUrl) {
        showToast("ত্রুটি", "ডাউনলোড করতে সমস্যা", "error");
        return;
    }
    
    const link = document.createElement('a');
    link.href = currentModalPhoto.imageUrl;
    link.download = `shimu_${currentModalPhoto.customerNumber || 'photo'}_${Date.now()}.jpg`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("সফল", "ছবি ডাউনলোড শুরু হয়েছে", "success");
}

async function deleteCurrentImage() {
    if (!currentModalPhoto?.id) {
        showToast("ত্রুটি", "ডিলিট করতে সমস্যা", "error");
        return;
    }
    
    if (confirm('আপনি কি নিশ্চিত এই ছবি ডিলিট করতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।')) {
        await deletePhoto(currentModalPhoto.id, currentModalPhoto.id);
        closeModal();
    }
}

// Utility Functions
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    if (!dateString) return 'তারিখ নেই';
    
    try {
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return dateString;
        }
        
        return date.toLocaleString('bn-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error("Date formatting error:", error);
        return dateString;
    }
}

function saveToLocalStorage(photoData) {
    try {
        const photos = JSON.parse(localStorage.getItem('shimu_photos') || '[]');
        const photoWithId = {
            ...photoData,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        };
        photos.push(photoWithId);
        localStorage.setItem('shimu_photos', JSON.stringify(photos));
        console.log('Saved to local storage:', photoWithId.id);
        return photoWithId.id;
    } catch (error) {
        console.error('Error saving to local storage:', error);
        return null;
    }
}

function saveNoticeToLocalStorage(noticeData) {
    try {
        const notices = JSON.parse(localStorage.getItem('shimu_notices') || '[]');
        notices.push({
            ...noticeData,
            id: Date.now().toString()
        });
        localStorage.setItem('shimu_notices', JSON.stringify(notices));
    } catch (error) {
        console.error('Error saving notice to local storage:', error);
    }
}

function updateStats() {
    try {
        // Get photos from localStorage
        const photos = JSON.parse(localStorage.getItem('shimu_photos') || '[]');
        const totalPhotos = photos.length;
        
        // Count unique customers
        const customers = new Set();
        photos.forEach(photo => {
            if (photo.customerNumber) {
                customers.add(photo.customerNumber);
            }
        });
        const totalCustomers = customers.size;
        
        // Count today's uploads
        const today = new Date().toDateString();
        const todayUploads = photos.filter(p => {
            try {
                if (!p.uploadedAt) return false;
                const uploadDate = new Date(p.uploadedAt);
                return uploadDate.toDateString() === today;
            } catch {
                return false;
            }
        }).length;
        
        // Update UI
        document.getElementById('totalPhotos').textContent = totalPhotos;
        document.getElementById('totalCustomers').textContent = totalCustomers;
        document.getElementById('todayUploads').textContent = todayUploads;
        
    } catch (error) {
        console.error("Update stats error:", error);
    }
}

function updateGalleryStats(photos) {
    document.getElementById('galleryTotal').textContent = photos.length;
}

function loadInitialData() {
    try {
        // Initialize localStorage if empty
        if (!localStorage.getItem('shimu_photos')) {
            localStorage.setItem('shimu_photos', JSON.stringify([]));
        }
        if (!localStorage.getItem('shimu_notices')) {
            localStorage.setItem('shimu_notices', JSON.stringify([]));
        }
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            const icon = document.getElementById('themeToggle').querySelector('i');
            icon.className = 'fas fa-sun';
        }
        
        // Update stats
        updateStats();
        
        // Load notices
        loadNotices();
        
    } catch (error) {
        console.error("Load initial data error:", error);
    }
}

// Toast Notification
function showToast(title, message, type = 'info', duration = 5000) {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
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
        toast.style.animation = 'toastSlideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    });
    
    // Add animation style if not exists
    if (!document.querySelector('#toastAnimationStyle')) {
        const style = document.createElement('style');
        style.id = 'toastAnimationStyle';
        style.textContent = `
            @keyframes toastSlideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'toastSlideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, duration);
}

// Photo download function
function downloadPhoto(url, filename = 'shimu_photo') {
    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}_${Date.now()}.jpg`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast("সফল", "ছবি ডাউনলোড শুরু হয়েছে", "success");
    } catch (error) {
        console.error("Download error:", error);
        showToast("ত্রুটি", "ডাউনলোড করতে সমস্যা", "error");
    }
}

// Keyboard shortcuts and additional utilities
document.addEventListener('keydown', (e) => {
    // Escape to close modal
    if (e.key === 'Escape' && document.getElementById('imageModal').style.display === 'flex') {
        closeModal();
    }
    
    // Ctrl+F to focus search
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
});

// Prevent form submission on Enter in search fields
document.getElementById('gallerySearch').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
    }
});

// Add offline/online detection
window.addEventListener('online', () => {
    showToast("সফল", "ইন্টারনেট সংযোগ পুনরুদ্ধার হয়েছে", "success");
    if (isFirebaseInitialized === false) {
        initializeFirebase();
    }
});

window.addEventListener('offline', () => {
    showToast("সতর্কতা", "ইন্টারনেট সংযোগ হারিয়ে গেছে, অফলাইন মোডে কাজ করছে", "warning");
});

// Initialize with saved theme
window.addEventListener('load', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const icon = document.getElementById('themeToggle').querySelector('i');
        icon.className = 'fas fa-sun';
    }
});