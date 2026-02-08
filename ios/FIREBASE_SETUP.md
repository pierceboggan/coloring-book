# Firebase Setup Guide for ColoringBook iOS

## Prerequisites
- Firebase account
- Xcode 15.0+
- ColoringBook iOS project

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: "ColoringBook" (or your preference)
4. Enable/disable Google Analytics as desired
5. Click "Create project"

## Step 2: Add iOS App

1. In Firebase Console, click "Add app" → iOS
2. Enter iOS bundle ID: `com.coloringbook.app`
3. Enter app nickname: "ColoringBook iOS"
4. Download `GoogleService-Info.plist`
5. Add the file to your Xcode project:
   - Drag `GoogleService-Info.plist` into the ColoringBook folder
   - Ensure "Copy items if needed" is checked
   - Select ColoringBook target

## Step 3: Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable "Email/Password" sign-in method
4. (Optional) Enable "Apple" sign-in for Apple Sign In support

## Step 4: Create Firestore Database

1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" (we'll add security rules next)
4. Select your preferred location
5. Click "Enable"

### Firestore Collections

Create these collections with the following structure:

**users** collection:
```javascript
{
  id: string,
  email: string,
  display_name: string (optional),
  photo_url: string (optional),
  created_at: timestamp,
  is_kid_mode_enabled: boolean
}
```

**images** collection:
```javascript
{
  id: string (auto),
  user_id: string,
  original_url: string,
  coloring_page_url: string (optional),
  name: string,
  status: string (uploading|processing|completed|error),
  created_at: timestamp,
  updated_at: timestamp,
  error_message: string (optional)
}
```

**colored_artworks** collection:
```javascript
{
  id: string (auto),
  image_id: string,
  user_id: string,
  artwork_url: string,
  thumbnail_url: string (optional),
  created_at: timestamp,
  updated_at: timestamp
}
```

**family_albums** collection:
```javascript
{
  id: string (auto),
  name: string,
  share_code: string,
  image_ids: array,
  created_by: string,
  created_at: timestamp
}
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can read/write their own images
    match /images/{imageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                     (resource == null || resource.data.user_id == request.auth.uid);
      allow delete: if request.auth != null && resource.data.user_id == request.auth.uid;
    }

    // Users can read/write their own colored artworks
    match /colored_artworks/{artworkId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                     (resource == null || resource.data.user_id == request.auth.uid);
    }

    // Anyone can read family albums with share code
    match /family_albums/{albumId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
                              resource.data.created_by == request.auth.uid;
    }
  }
}
```

## Step 5: Configure Storage

1. Go to "Storage"
2. Click "Get started"
3. Start in production mode
4. Click "Next" and "Done"

### Storage Structure
```
images/
  {uuid}-{filename}.jpg   # Original uploaded photos
  coloring-{filename}.jpg # Generated coloring pages
artworks/
  {uuid}.png              # User's colored artwork
```

### Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Images bucket - anyone can read, authenticated users can write
    match /images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Artworks bucket - authenticated users only
    match /artworks/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Step 6: Enable Analytics (Optional)

1. Go to "Analytics"
2. Click "Enable Google Analytics"
3. Follow the setup wizard

## Step 7: Configure App in Xcode

### Set Environment Variables

1. In Xcode, select the ColoringBook scheme
2. Edit Scheme → Run → Arguments → Environment Variables
3. Add:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `FIREBASE_DEBUG`: `true` (optional, for debugging)

### Update Info.plist

Ensure these keys are in your `Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>We need access to your camera to take photos for coloring pages</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photo library to create coloring pages from your photos</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>We need permission to save your colored artwork to your photo library</string>
```

## Step 8: Test Firebase Connection

1. Build and run the app in Xcode
2. Check Xcode console for Firebase initialization logs
3. Try signing up with a test email
4. Verify user document is created in Firestore

## Troubleshooting

### Common Issues

**Firebase not initializing:**
- Verify `GoogleService-Info.plist` is in the project
- Check bundle ID matches Firebase app configuration
- Clean build folder and rebuild

**Authentication errors:**
- Ensure Email/Password is enabled in Firebase Console
- Check network connectivity
- Review Firebase Console logs

**Firestore permission denied:**
- Review security rules
- Ensure user is authenticated
- Check user ID matches document owner

**Storage upload fails:**
- Verify storage rules allow writes
- Check file size limits
- Ensure user is authenticated

## Testing Checklist

- [ ] Firebase initializes successfully
- [ ] User can sign up
- [ ] User can sign in
- [ ] Images upload to Storage
- [ ] Firestore documents are created
- [ ] Real-time updates work
- [ ] Offline persistence works
- [ ] Analytics events are logged (if enabled)

## Production Deployment

Before deploying to production:

1. **Review Security Rules**: Tighten rules for production
2. **Set Up Monitoring**: Enable Crashlytics and Performance Monitoring
3. **Configure Quotas**: Set appropriate quotas for Storage and Firestore
4. **Backup Strategy**: Set up regular Firestore backups
5. **Cost Monitoring**: Set up billing alerts

## Additional Resources

- [Firebase iOS SDK Documentation](https://firebase.google.com/docs/ios/setup)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
