# Installation Note

Due to PowerShell execution policy restrictions, the `expo-image-picker` package needs to be installed manually.

## To install the package:

Run one of the following commands in your terminal:

```bash
# Option 1: Using npx
npx expo install expo-image-picker

# Option 2: Using npm
npm install expo-image-picker

# Option 3: Using yarn
yarn add expo-image-picker
```

After installation, the image picker functionality in the General settings screen will work properly.

## What's been implemented:

✅ Settings main screen with navigation to General, Account, and Sign out
✅ General settings screen with profile editing and image picker integration
✅ Account settings screen with passkey management
✅ Avatar in chat header is now clickable and navigates to Settings
✅ All back buttons navigate correctly
✅ Sign out navigates to login screen
✅ All routes registered in root layout

The app is ready to test once `expo-image-picker` is installed!
