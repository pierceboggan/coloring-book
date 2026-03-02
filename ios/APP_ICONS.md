# iOS App Icons

## Overview
The iOS app icons are located in `ColoringBook/ColoringBook/Assets.xcassets/AppIcon.appiconset/`.

## Icons Generated
All icons feature a modern, colorful design with:
- Coral (#FF6B6B), teal (#4ECDC4), and sunny yellow (#FFE66D) colors
- Crayon/paintbrush artistic theme
- Minimalistic design with subtle gradients
- Optimized for iOS App Store standards

### Icon Sizes
| File | Size | Use Case |
|------|------|----------|
| Icon-60@2x.png | 120x120 | iPhone @2x |
| Icon-60@3x.png | 180x180 | iPhone @3x |
| Icon-76.png | 76x76 | iPad @1x |
| Icon-76@2x.png | 152x152 | iPad @2x |
| Icon-83.5@2x.png | 167x167 | iPhone 6s/7/8 Plus @2x |
| Icon-1024.png | 1024x1024 | App Store Marketing |

## Regenerating Icons

To regenerate icons with a new design:

1. Generate a new 1024x1024 PNG icon
2. Replace `Icon-1024.png` in the AppIcon.appiconset folder
3. Use macOS sips to resize for other sizes:

```bash
cd ColoringBook/ColoringBook/Assets.xcassets/AppIcon.appiconset
sips -z 120 120 Icon-1024.png --out Icon-60@2x.png
sips -z 180 180 Icon-1024.png --out Icon-60@3x.png
sips -z 76 76 Icon-1024.png --out Icon-76.png
sips -z 152 152 Icon-1024.png --out Icon-76@2x.png
sips -z 167 167 Icon-1024.png --out Icon-83.5@2x.png
```

## Adding to Xcode Project

The Assets.xcassets folder should be added to your Xcode project. If not already included:

1. Open `ColoringBook.xcodeproj` in Xcode
2. Drag `Assets.xcassets` into the project navigator
3. Ensure "Copy items if needed" is checked
4. The app icon will be automatically recognized

## Design Guidelines

- Keep the design simple and recognizable at small sizes
- Use vibrant colors that stand out
- Ensure contrast on both light and dark backgrounds
- Avoid text - icons are universal
- Follow Apple's Human Interface Guidelines for app icons