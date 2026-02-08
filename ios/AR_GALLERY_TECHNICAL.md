# AR Gallery Feature - Technical Summary

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Flow                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Dashboard → ColoringImageDetailView → [View in AR Button]      │
│                                                ↓                  │
│                                         ARGalleryView             │
│                                         (Full Screen)             │
│                                                ↓                  │
│                                      ARGalleryViewModel           │
│                                      (AR Session Manager)         │
│                                                ↓                  │
│                                           ARKit                   │
│                                     (Apple Framework)             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. ARGalleryView (SwiftUI View)
**File**: `ios/ColoringBook/ColoringBook/Views/ARGalleryView.swift`

**Responsibilities**:
- Renders full-screen AR camera view
- Displays UI overlays (instructions, controls, status)
- Handles user interactions (button taps)
- Presents ARViewContainer (UIKit bridge)

**Key Features**:
- Top bar with close and help buttons
- Instructions overlay (dismissible)
- Bottom control panel (reset, screenshot, size)
- Status message toasts
- Color scheme matches app design (pastel colors)

**UI Components**:
```
┌──────────────────────────────────────────┐
│  [X]  AR Gallery            [?]          │  ← Top Bar
├──────────────────────────────────────────┤
│                                           │
│          AR Camera View                   │
│     (Live camera + 3D overlay)           │
│                                           │
│    ┌─────────────────────────┐          │
│    │  Instructions Overlay    │          │  ← Dismissible
│    │  - Tap to place          │          │
│    │  - Pinch to resize       │          │
│    │  - Drag to move          │          │
│    └─────────────────────────┘          │
│                                           │
├──────────────────────────────────────────┤
│   [Reset]  [Camera]  [+ Size -]          │  ← Bottom Controls
└──────────────────────────────────────────┘
```

### 2. ARGalleryViewModel (Business Logic)
**File**: `ios/ColoringBook/ColoringBook/ViewModels/ARGalleryViewModel.swift`

**Responsibilities**:
- Manages ARKit session lifecycle
- Handles surface detection
- Processes gesture interactions
- Loads images from Supabase URLs
- Controls image placement and scaling
- Manages screenshot capture

**Key Properties**:
```swift
@Published var statusMessage: String?        // UI feedback
@Published var isARSupported: Bool          // Device capability check
private var arView: ARSCNView?              // SceneKit AR view
private var currentImageNode: SCNNode?      // 3D node for image
private var currentScale: Float             // Current image size
private var imageTexture: UIImage?          // Loaded coloring page
```

**AR Configuration**:
```swift
let configuration = ARWorldTrackingConfiguration()
configuration.planeDetection = [.horizontal, .vertical]
configuration.environmentTexturing = .automatic
```

### 3. Gesture Handling

#### Tap Gesture
**Purpose**: Place artwork on detected surfaces
**Implementation**:
1. Perform hit test on tap location
2. Find nearest detected plane (ARPlaneAnchor)
3. Create SCNPlane geometry with image texture
4. Position node at hit test location
5. Orient based on surface type (horizontal/vertical)
6. Add to scene

#### Pinch Gesture
**Purpose**: Resize placed artwork
**Implementation**:
1. Track pinch scale during gesture
2. Apply scale transform to node
3. On gesture end, update base scale
4. Recalculate geometry dimensions
5. Maintain aspect ratio

#### Pan Gesture
**Purpose**: Reposition artwork
**Implementation**:
1. Perform hit test on new location
2. Update node position to new surface
3. Smooth animation during drag

### 4. Image Loading Pipeline

```
Coloring Image URL (Supabase)
         ↓
  URLSession.data(from:)
         ↓
    UIImage(data:)
         ↓
   SCNMaterial.diffuse.contents
         ↓
   Applied to SCNPlane
         ↓
  Rendered in AR scene
```

### 5. Integration Points

#### From ColoringImageDetailView
```swift
@State private var showingARGallery = false

Button {
    showingARGallery = true
} label: {
    ManagementRow(
        icon: "arkit", 
        title: "View in AR", 
        subtitle: "See this page in augmented reality"
    )
}

.fullScreenCover(isPresented: $showingARGallery) {
    ARGalleryView(image: image)
}
```

### 6. Permissions Required

**Camera Permission**:
- Key: `NSCameraUsageDescription`
- Value: "We need camera access to take photos for coloring pages and to display them in augmented reality"
- Location: `project.yml` Info.plist properties

**Photo Library Permission** (for screenshots):
- Key: `NSPhotoLibraryAddUsageDescription`
- Value: "We need permission to save your colored artwork to your photo library"
- Location: `project.yml` Info.plist properties

## Data Flow

### Initialization Flow
```
User taps "View in AR"
    ↓
ARGalleryView initialized with ColoringImage
    ↓
ARGalleryViewModel created with image reference
    ↓
loadImage() fetches image from Supabase URL
    ↓
setupARView() configures ARSCNView
    ↓
startARSession() begins AR tracking
    ↓
Plane detection activated
```

### Placement Flow
```
User moves device → Planes detected
    ↓
ARKit triggers delegate: renderer(_:didAdd:for:)
    ↓
Show "Surface detected!" message
    ↓
User taps screen → handleTap(_:)
    ↓
Hit test finds surface
    ↓
Create SCNPlane with image texture
    ↓
Position at hit location
    ↓
Add to scene
    ↓
Show "Artwork placed!" message
```

### Screenshot Flow
```
User taps camera button → takeScreenshot()
    ↓
arView.snapshot() captures frame
    ↓
Request photo library permission
    ↓
UIImageWriteToSavedPhotosAlbum()
    ↓
Show success message
```

## Performance Considerations

1. **Image Loading**: Async loading prevents UI blocking
2. **Gesture Recognition**: Multiple recognizers don't conflict
3. **Scene Complexity**: Single node per image keeps rendering fast
4. **Memory**: Image textures loaded once, reused for geometry updates
5. **Battery**: AR session paused when view disappears

## Future Enhancement Ideas

- [ ] Multiple image placement support
- [ ] Gallery templates (grid layouts)
- [ ] Image rotation gestures
- [ ] Lighting adjustment controls
- [ ] AR scene persistence (save/load)
- [ ] Share AR scenes as videos
- [ ] Occlusion support (iOS 13+)
- [ ] People occlusion (iOS 14+)
- [ ] LiDAR scanner support (iOS 14+)
- [ ] Collaborative AR (multiple users)

## Testing Considerations

**Simulator Limitations**:
- AR features don't work in iOS Simulator
- Must test on physical device
- ARKit simulation is very limited

**Device Requirements**:
- iPhone 6s or newer
- iPad Pro (all models)
- iPad (5th gen or newer)
- iOS 16.0+

**Testing Checklist**:
- [ ] Surface detection works on various surfaces
- [ ] Image loads correctly from Supabase
- [ ] Tap placement is accurate
- [ ] Pinch scaling maintains aspect ratio
- [ ] Pan repositioning is smooth
- [ ] Size controls work correctly
- [ ] Screenshot saves to Photos
- [ ] Reset clears scene properly
- [ ] Instructions overlay shows/hides
- [ ] Status messages display correctly
- [ ] Permissions are requested properly
- [ ] AR session handles interruptions
- [ ] Battery usage is acceptable
- [ ] Works in various lighting conditions

## Known Issues & Limitations

1. **AR Not Supported**: Gracefully handles devices without ARKit
2. **Surface Detection**: Requires good lighting and texture
3. **Image Size**: Very large images may impact performance
4. **Orientation**: Best experience in landscape on iPad
5. **Occlusion**: Objects don't hide behind real-world objects (yet)
6. **Persistence**: AR scene is not saved between sessions

## Related Files

- `ARGalleryView.swift` - UI implementation
- `ARGalleryViewModel.swift` - Business logic
- `ColoringImageDetailView.swift` - Integration point
- `project.yml` - Permissions and configuration
- `AR_GALLERY_README.md` - User documentation
- `AGENTS.md` - Developer documentation
