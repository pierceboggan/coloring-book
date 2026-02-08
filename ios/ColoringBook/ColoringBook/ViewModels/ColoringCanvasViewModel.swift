//
//  ColoringCanvasViewModel.swift
//  ColoringBook
//
//  View model for the coloring canvas
//

import SwiftUI
import PencilKit
import Combine

@MainActor
class ColoringCanvasViewModel: ObservableObject {
    @Published var canvasView = PKCanvasView()
    @Published var selectedColor: UIColor = UIColor(hex: "ef4444")
    @Published var strokeWidth: CGFloat = 6.0
    @Published var selectedTool: PKInkingTool.InkType = .pen
    @Published var showSaveSuccess = false

    private var drawingHistory: [PKDrawing] = []
    private var redoStack: [PKDrawing] = []

    var canUndo: Bool {
        !drawingHistory.isEmpty
    }

    var canRedo: Bool {
        !redoStack.isEmpty
    }

    init() {
        // Save initial state
        saveDrawingState()
    }

    func undo() {
        guard !drawingHistory.isEmpty else { return }

        // Save current state to redo stack
        redoStack.append(canvasView.drawing)

        // Restore previous state
        let previousDrawing = drawingHistory.removeLast()
        canvasView.drawing = previousDrawing
    }

    func redo() {
        guard !redoStack.isEmpty else { return }

        // Save current state to history
        drawingHistory.append(canvasView.drawing)

        // Restore redo state
        let nextDrawing = redoStack.removeLast()
        canvasView.drawing = nextDrawing
    }

    func clearCanvas() {
        saveDrawingState()
        canvasView.drawing = PKDrawing()
        redoStack.removeAll()
    }

    func saveDrawingState() {
        drawingHistory.append(canvasView.drawing)
        // Keep only last 15 states to prevent memory issues
        if drawingHistory.count > 15 {
            drawingHistory.removeFirst()
        }
        redoStack.removeAll()
    }

    func saveArtwork(imageId: String) async {
        // Capture the canvas as an image
        let renderer = UIGraphicsImageRenderer(size: canvasView.bounds.size)
        let image = renderer.image { context in
            // Draw the canvas content
            canvasView.drawing.image(
                from: canvasView.bounds,
                scale: UIScreen.main.scale
            ).draw(at: .zero)
        }

        guard let imageData = image.pngData() else {
            print("❌ Failed to convert artwork to PNG")
            return
        }

        do {
            // Save to Firebase
            _ = try await FirebaseService.shared.saveColoredArtwork(
                imageId: imageId,
                artworkData: imageData
            )

            // Also save to Photos library
            UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)

            // Show success message
            showSaveSuccess = true
            try? await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds
            showSaveSuccess = false

            print("✅ Artwork saved successfully")
        } catch {
            print("❌ Failed to save artwork: \(error.localizedDescription)")
        }
    }
}
