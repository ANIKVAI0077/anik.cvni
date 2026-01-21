rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Photos collection - Read for all, Write for authenticated
    match /photos/{photo} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Notices collection - Read for all, Write for authenticated
    match /notices/{notice} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}

service firebase.storage {
  match /b/{bucket}/o {
    // Photos folder - Read for all, Write for authenticated
    match /photos/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
