//
//  ColoringCanvasView.swift
//  ColoringBook
//
//  Digital coloring pad - the primary mobile experience
//  Optimized for touch and Apple Pencil on iPad
//

import SwiftUI
import PencilKit

struct ColoringCanvasView: View {
    let image: ColoringImage
    private let galleryImages: [ColoringImage]

    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = ColoringCanvasViewModel()
    @State private var currentPageIndex: Int

    init(image: ColoringImage, galleryImages: [ColoringImage]? = nil, initialIndex: Int = 0) {
        self.image = image

        let resolvedImages: [ColoringImage]
        if let galleryImages, !galleryImages.isEmpty {
            resolvedImages = galleryImages
        } else {
            resolvedImages = [image]
        }

        self.galleryImages = resolvedImages

        let boundedIndex = min(max(0, initialIndex), resolvedImages.count - 1)
        _currentPageIndex = State(initialValue: boundedIndex)
    }

    private var displayedImage: ColoringImage {
        galleryImages[currentPageIndex]
    }

    private var canGoPrevious: Bool {
        currentPageIndex > 0
    }

    private var canGoNext: Bool {
        currentPageIndex < galleryImages.count - 1
    }

    var body: some View {
        ZStack {
            // Background
            Color(hex: "E0F7FA")
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                ColoringCanvasHeader(
                    imageName: displayedImage.name,
                    onClose: { dismiss() },
                    onUndo: { viewModel.undo() },
                    onRedo: { viewModel.redo() },
                    onClear: { viewModel.clearCanvas() },
                    onSave: { await viewModel.saveArtwork(imageId: displayedImage.id ?? "") },
                    canUndo: viewModel.canUndo,
                    canRedo: viewModel.canRedo
                )

                if galleryImages.count > 1 {
                    HStack(spacing: 10) {
                        Button {
                            guard canGoPrevious else { return }
                            currentPageIndex -= 1
                        } label: {
                            Image(systemName: "chevron.left.circle.fill")
                                .font(.title3)
                        }
                        .disabled(!canGoPrevious)
                        .opacity(canGoPrevious ? 1 : 0.35)

                        Text("Page \(currentPageIndex + 1) of \(galleryImages.count)")
                            .font(.caption.bold())
                            .foregroundColor(Color(hex: "594144"))

                        Button {
                            guard canGoNext else { return }
                            currentPageIndex += 1
                        } label: {
                            Image(systemName: "chevron.right.circle.fill")
                                .font(.title3)
                        }
                        .disabled(!canGoNext)
                        .opacity(canGoNext ? 1 : 0.35)
                    }
                    .foregroundColor(Color(hex: "FF6F91"))
                    .padding(.vertical, 8)
                    .padding(.horizontal, 14)
                    .background(Color.white.opacity(0.85))
                    .clipShape(Capsule())
                    .padding(.top, 8)
                }

                // Canvas area
                GeometryReader { geometry in
                    ZStack {
                        // Background image (coloring page)
                        AsyncImage(url: URL(string: displayedImage.coloringPageUrl ?? displayedImage.originalUrl)) { phase in
                            switch phase {
                            case .success(let img):
                                img
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                            case .failure:
                                Text("Failed to load image")
                            case .empty:
                                ProgressView()
                            @unknown default:
                                EmptyView()
                            }
                        }
                        .frame(width: geometry.size.width, height: geometry.size.height)

                        // Drawing canvas overlay
                        CanvasView(
                            canvasView: $viewModel.canvasView,
                            tool: viewModel.selectedTool,
                            color: viewModel.selectedColor,
                            strokeWidth: viewModel.strokeWidth
                        )
                        .frame(width: geometry.size.width, height: geometry.size.height)
                    }
                }
                .padding()
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color(hex: "A0E7E5"), lineWidth: 4)
                )
                .padding()

                // Tool palette
                ColoringToolPalette(
                    selectedColor: $viewModel.selectedColor,
                    strokeWidth: $viewModel.strokeWidth,
                    selectedTool: $viewModel.selectedTool
                )
                .padding(.horizontal)
                .padding(.bottom)
            }

            // Save success overlay
            if viewModel.showSaveSuccess {
                SaveSuccessOverlay()
                    .transition(.scale.combined(with: .opacity))
            }
        }
        .navigationBarHidden(true)
        .onChange(of: currentPageIndex) { _ in
            viewModel.resetCanvasForNewPage()
        }
    }
}

// MARK: - Header
struct ColoringCanvasHeader: View {
    let imageName: String
    let onClose: () -> Void
    let onUndo: () -> Void
    let onRedo: () -> Void
    let onClear: () -> Void
    let onSave: () async -> Void
    let canUndo: Bool
    let canRedo: Bool

    @State private var isSaving = false

    var body: some View {
        HStack {
            Button(action: onClose) {
                Image(systemName: "xmark.circle.fill")
                    .font(.title2)
                    .foregroundColor(Color(hex: "FF6F91"))
            }

            Spacer()

            VStack(spacing: 4) {
                Image(systemName: "sparkles")
                    .font(.caption)
                    .foregroundColor(Color(hex: "FFD166"))
                Text("Coloring Studio")
                    .font(.caption.bold())
                    .foregroundColor(Color(hex: "FF6F91"))
            }

            Spacer()

            HStack(spacing: 12) {
                Button(action: onUndo) {
                    Image(systemName: "arrow.uturn.backward")
                        .font(.title3)
                }
                .disabled(!canUndo)
                .opacity(canUndo ? 1 : 0.3)

                Button(action: onRedo) {
                    Image(systemName: "arrow.uturn.forward")
                        .font(.title3)
                }
                .disabled(!canRedo)
                .opacity(canRedo ? 1 : 0.3)

                Button(action: onClear) {
                    Image(systemName: "trash")
                        .font(.title3)
                }

                Button {
                    isSaving = true
                    Task {
                        await onSave()
                        isSaving = false
                    }
                } label: {
                    if isSaving {
                        ProgressView()
                            .tint(Color(hex: "FF6F91"))
                    } else {
                        Image(systemName: "square.and.arrow.down")
                            .font(.title3)
                    }
                }
            }
            .foregroundColor(Color(hex: "1DB9B3"))
        }
        .padding()
        .background(Color(hex: "FFE6EB").opacity(0.8))
    }
}

// MARK: - Tool Palette
struct ColoringToolPalette: View {
    @Binding var selectedColor: UIColor
    @Binding var strokeWidth: CGFloat
    @Binding var selectedTool: PKInkingTool.InkType

    let presetColors: [UIColor] = [
        UIColor(hex: "000000"), // Black
        UIColor(hex: "6b7280"), // Gray
        UIColor(hex: "ef4444"), // Red
        UIColor(hex: "f97316"), // Orange
        UIColor(hex: "facc15"), // Yellow
        UIColor(hex: "22c55e"), // Green
        UIColor(hex: "0ea5e9"), // Blue
        UIColor(hex: "6366f1"), // Indigo
        UIColor(hex: "ec4899"), // Pink
        UIColor(hex: "f9fafb"), // White
    ]

    var body: some View {
        VStack(spacing: 16) {
            // Color palette
            VStack(alignment: .leading, spacing: 8) {
                Text("BRUSH COLOR")
                    .font(.caption.bold())
                    .foregroundColor(Color(hex: "FF6F91"))

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(presetColors, id: \.self) { color in
                            Button {
                                selectedColor = color
                            } label: {
                                Circle()
                                    .fill(Color(uiColor: color))
                                    .frame(width: 40, height: 40)
                                    .overlay(
                                        Circle()
                                            .strokeBorder(
                                                selectedColor == color ?
                                                Color(hex: "3A2E39") : Color.white,
                                                lineWidth: selectedColor == color ? 3 : 2
                                            )
                                    )
                                    .shadow(radius: 3)
                            }
                        }

                        // Color picker
                        ColorPicker("", selection: Binding(
                            get: { Color(uiColor: selectedColor) },
                            set: { selectedColor = UIColor($0) }
                        ))
                        .labelsHidden()
                        .frame(width: 40, height: 40)
                        .clipShape(Circle())
                        .overlay(
                            Circle()
                                .strokeBorder(Color.white, lineWidth: 2)
                        )
                    }
                    .padding(.vertical, 4)
                }
            }

            // Brush size
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("BRUSH SIZE")
                        .font(.caption.bold())
                        .foregroundColor(Color(hex: "AA6A00"))

                    Spacer()

                    Text("\(Int(strokeWidth))px")
                        .font(.caption.bold())
                        .foregroundColor(Color(hex: "AA6A00"))
                }

                Slider(value: $strokeWidth, in: 2...30)
                    .tint(Color(hex: "FF6F91"))
            }

            // Tool selector
            HStack(spacing: 12) {
                ToolButton(
                    icon: "pencil.tip",
                    label: "Pen",
                    isSelected: selectedTool == .pen,
                    action: { selectedTool = .pen }
                )

                ToolButton(
                    icon: "highlighter",
                    label: "Marker",
                    isSelected: selectedTool == .marker,
                    action: { selectedTool = .marker }
                )

                ToolButton(
                    icon: "paintbrush.pointed",
                    label: "Brush",
                    isSelected: selectedTool == .pencil,
                    action: { selectedTool = .pencil }
                )
            }
        }
        .padding()
        .background(Color(hex: "FFE6EB").opacity(0.8))
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color(hex: "FFB3BA"), lineWidth: 3)
        )
    }
}

struct ToolButton: View {
    let icon: String
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.title3)
                Text(label)
                    .font(.caption2)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(
                isSelected ?
                Color(hex: "55C6C0") :
                Color.white.opacity(0.9)
            )
            .foregroundColor(
                isSelected ?
                .white :
                Color(hex: "1DB9B3")
            )
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color(hex: "A0E7E5"), lineWidth: 2)
            )
        }
    }
}

// MARK: - Canvas View
struct CanvasView: UIViewRepresentable {
    @Binding var canvasView: PKCanvasView
    let tool: PKInkingTool.InkType
    let color: UIColor
    let strokeWidth: CGFloat

    func makeUIView(context: Context) -> PKCanvasView {
        canvasView.tool = PKInkingTool(tool, color: color, width: strokeWidth)
        canvasView.drawingPolicy = .anyInput
        canvasView.backgroundColor = .clear
        canvasView.isOpaque = false
        return canvasView
    }

    func updateUIView(_ uiView: PKCanvasView, context: Context) {
        uiView.tool = PKInkingTool(tool, color: color, width: strokeWidth)
    }
}

// MARK: - Save Success Overlay
struct SaveSuccessOverlay: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.green)

            Text("Artwork Saved!")
                .font(.title2.bold())
                .foregroundColor(Color(hex: "3A2E39"))

            Text("Your colored masterpiece has been saved to your gallery")
                .font(.subheadline)
                .foregroundColor(Color(hex: "594144"))
                .multilineTextAlignment(.center)
        }
        .padding(30)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 25))
        .overlay(
            RoundedRectangle(cornerRadius: 25)
                .stroke(Color(hex: "A0E7E5"), lineWidth: 4)
        )
        .shadow(radius: 20)
        .padding(40)
    }
}

#Preview {
    ColoringCanvasView(
        image: ColoringImage(
            userId: "test",
            originalUrl: "https://example.com/original.jpg",
            coloringPageUrl: "https://example.com/coloring.jpg",
            name: "Test Image"
        )
    )
}
