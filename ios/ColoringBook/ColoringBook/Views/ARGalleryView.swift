//
//  ARGalleryView.swift
//  ColoringBook
//
//  AR Gallery for viewing coloring pages in augmented reality
//

import SwiftUI
import ARKit

struct ARGalleryView: View {
    let image: ColoringImage
    
    @StateObject private var viewModel: ARGalleryViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var showingInstructions = true
    
    init(image: ColoringImage) {
        self.image = image
        self._viewModel = StateObject(wrappedValue: ARGalleryViewModel(image: image))
    }
    
    var body: some View {
        ZStack {
            // AR View
            ARViewContainer(viewModel: viewModel)
                .edgesIgnoringSafeArea(.all)
            
            // UI Overlays
            VStack {
                // Top bar
                topBar
                
                Spacer()
                
                // Instructions overlay
                if showingInstructions {
                    instructionsOverlay
                }
                
                // Bottom controls
                bottomControls
            }
            
            // Status messages
            if let message = viewModel.statusMessage {
                VStack {
                    Spacer()
                    Text(message)
                        .font(.caption.weight(.medium))
                        .foregroundColor(.white)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 12)
                        .background(Color.black.opacity(0.7))
                        .cornerRadius(20)
                        .padding(.bottom, 120)
                }
                .transition(.opacity)
            }
        }
        .onAppear {
            viewModel.startARSession()
        }
        .onDisappear {
            viewModel.pauseARSession()
        }
    }
    
    private var topBar: some View {
        HStack {
            Button(action: {
                dismiss()
            }) {
                Image(systemName: "xmark.circle.fill")
                    .font(.title2)
                    .foregroundColor(.white)
                    .shadow(color: .black.opacity(0.3), radius: 3, x: 0, y: 2)
            }
            
            Spacer()
            
            Text("AR Gallery")
                .font(.headline)
                .foregroundColor(.white)
                .shadow(color: .black.opacity(0.3), radius: 3, x: 0, y: 2)
            
            Spacer()
            
            Button(action: {
                showingInstructions.toggle()
            }) {
                Image(systemName: "questionmark.circle.fill")
                    .font(.title2)
                    .foregroundColor(.white)
                    .shadow(color: .black.opacity(0.3), radius: 3, x: 0, y: 2)
            }
        }
        .padding()
        .background(
            LinearGradient(
                colors: [Color.black.opacity(0.3), Color.clear],
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }
    
    private var instructionsOverlay: some View {
        VStack(spacing: 12) {
            Text("How to use AR Gallery")
                .font(.headline)
                .foregroundColor(.white)
            
            VStack(alignment: .leading, spacing: 8) {
                instructionRow(icon: "hand.tap", text: "Tap on a surface to place your artwork")
                instructionRow(icon: "arrow.up.left.and.arrow.down.right", text: "Pinch to resize the image")
                instructionRow(icon: "arrow.clockwise", text: "Drag to reposition")
                instructionRow(icon: "camera", text: "Take a screenshot to save your AR scene")
            }
            
            Button(action: {
                withAnimation {
                    showingInstructions = false
                }
            }) {
                Text("Got it!")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(Color(hex: "3A2E39"))
                    .padding(.horizontal, 24)
                    .padding(.vertical, 10)
                    .background(Color.white)
                    .cornerRadius(20)
            }
            .padding(.top, 8)
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(hex: "A0E7E5").opacity(0.95))
                .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
        )
        .padding()
        .transition(.scale.combined(with: .opacity))
    }
    
    private func instructionRow(icon: String, text: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.white)
                .frame(width: 30)
            
            Text(text)
                .font(.subheadline)
                .foregroundColor(.white)
            
            Spacer()
        }
    }
    
    private var bottomControls: some View {
        HStack(spacing: 30) {
            // Reset button
            Button(action: {
                viewModel.resetScene()
            }) {
                VStack(spacing: 4) {
                    Image(systemName: "arrow.counterclockwise")
                        .font(.title2)
                    Text("Reset")
                        .font(.caption2)
                }
                .foregroundColor(.white)
                .frame(width: 70, height: 70)
                .background(Color(hex: "FF6B9D").opacity(0.9))
                .clipShape(Circle())
                .shadow(color: .black.opacity(0.3), radius: 5, x: 0, y: 3)
            }
            
            // Screenshot button
            Button(action: {
                viewModel.takeScreenshot()
            }) {
                VStack(spacing: 4) {
                    Image(systemName: "camera.fill")
                        .font(.title2)
                    Text("Photo")
                        .font(.caption2)
                }
                .foregroundColor(.white)
                .frame(width: 70, height: 70)
                .background(Color(hex: "A0E7E5").opacity(0.9))
                .clipShape(Circle())
                .shadow(color: .black.opacity(0.3), radius: 5, x: 0, y: 3)
            }
            
            // Size control
            VStack(spacing: 8) {
                Button(action: {
                    viewModel.increaseSize()
                }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title3)
                        .foregroundColor(.white)
                }
                
                Button(action: {
                    viewModel.decreaseSize()
                }) {
                    Image(systemName: "minus.circle.fill")
                        .font(.title3)
                        .foregroundColor(.white)
                }
            }
            .frame(width: 50, height: 70)
            .background(Color(hex: "FEC8D8").opacity(0.9))
            .clipShape(RoundedRectangle(cornerRadius: 15))
            .shadow(color: .black.opacity(0.3), radius: 5, x: 0, y: 3)
        }
        .padding(.bottom, 40)
    }
}

// MARK: - ARViewContainer
struct ARViewContainer: UIViewRepresentable {
    let viewModel: ARGalleryViewModel
    
    func makeUIView(context: Context) -> ARSCNView {
        let arView = ARSCNView(frame: .zero)
        viewModel.setupARView(arView)
        return arView
    }
    
    func updateUIView(_ uiView: ARSCNView, context: Context) {
        // Updates handled by view model
    }
}

// MARK: - Preview
#Preview {
    ARGalleryView(image: ColoringImage(
        id: "preview",
        userId: "user123",
        originalUrl: "https://example.com/original.jpg",
        coloringPageUrl: "https://example.com/coloring.jpg",
        name: "My Coloring Page",
        status: .completed
    ))
}
