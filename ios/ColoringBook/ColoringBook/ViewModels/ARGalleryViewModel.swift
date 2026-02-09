//
//  ARGalleryViewModel.swift
//  ColoringBook
//
//  View model for AR Gallery functionality
//

import Foundation
import ARKit
import SwiftUI
import Photos

@MainActor
class ARGalleryViewModel: NSObject, ObservableObject {
    // MARK: - Published Properties
    @Published var statusMessage: String?
    @Published var isARSupported: Bool = ARWorldTrackingConfiguration.isSupported
    
    // MARK: - Private Properties
    private let image: ColoringImage
    private var arView: ARSCNView?
    private var currentImageNode: SCNNode?
    private var currentScale: Float = 0.3 // Default size (0.3 meters = 30cm)
    private var imageTexture: UIImage?
    private let sizeIncreaseFactor: Float = 1.2
    private let sizeDecreaseFactor: Float = 0.8
    
    // MARK: - Initialization
    init(image: ColoringImage) {
        self.image = image
        super.init()
        loadImage()
    }
    
    // MARK: - AR Session Management
    func setupARView(_ arView: ARSCNView) {
        self.arView = arView
        arView.delegate = self
        arView.session.delegate = self
        
        // Enable default lighting
        arView.autoenablesDefaultLighting = true
        arView.automaticallyUpdatesLighting = true
        
        // Add tap gesture recognizer
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
        arView.addGestureRecognizer(tapGesture)
        
        // Add pinch gesture for scaling
        let pinchGesture = UIPinchGestureRecognizer(target: self, action: #selector(handlePinch(_:)))
        arView.addGestureRecognizer(pinchGesture)
        
        // Add pan gesture for repositioning
        let panGesture = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
        arView.addGestureRecognizer(panGesture)
    }
    
    func startARSession() {
        guard let arView = arView else { return }
        
        if !isARSupported {
            showMessage("AR is not supported on this device")
            return
        }
        
        let configuration = ARWorldTrackingConfiguration()
        configuration.planeDetection = [.horizontal, .vertical]
        configuration.environmentTexturing = .automatic
        
        arView.session.run(configuration, options: [.resetTracking, .removeExistingAnchors])
        showMessage("Move your device to detect surfaces", duration: 3.0)
    }
    
    func pauseARSession() {
        arView?.session.pause()
    }
    
    // MARK: - Image Loading
    private func loadImage() {
        guard let urlString = image.coloringPageUrl,
              let url = URL(string: urlString) else {
            showMessage("No image available")
            return
        }
        
        Task {
            do {
                let (data, _) = try await URLSession.shared.data(from: url)
                if let image = UIImage(data: data) {
                    self.imageTexture = image
                }
            } catch {
                print("❌ Failed to load image: \(error.localizedDescription)")
                showMessage("Failed to load image")
            }
        }
    }
    
    // MARK: - Gesture Handlers
    @objc private func handleTap(_ gesture: UITapGestureRecognizer) {
        guard let arView = arView,
              let imageTexture = imageTexture else { return }
        
        let location = gesture.location(in: arView)
        
        // Use modern raycast API to find a surface
        let query = arView.raycastQuery(from: location, allowing: .existingPlaneGeometry, alignment: .any)
        guard let raycastQuery = query else {
            showMessage("No surface detected. Try moving your device.")
            return
        }
        
        let raycastResults = arView.session.raycast(raycastQuery)
        
        guard let raycastResult = raycastResults.first else {
            showMessage("No surface detected. Try moving your device.")
            return
        }
        
        // Remove existing node if any
        currentImageNode?.removeFromParentNode()
        
        // Create a plane geometry for the image
        let aspectRatio = imageTexture.size.width / imageTexture.size.height
        let width = CGFloat(currentScale)
        let height = width / aspectRatio
        
        let plane = SCNPlane(width: width, height: height)
        
        // Apply the image as a texture
        let material = SCNMaterial()
        material.diffuse.contents = imageTexture
        material.isDoubleSided = true
        material.lightingModel = .constant // Prevents shadowing on the image
        plane.materials = [material]
        
        // Create node
        let imageNode = SCNNode(geometry: plane)
        
        // Position the node at the raycast location
        let transform = raycastResult.worldTransform
        let position = SCNVector3(transform.columns.3.x, transform.columns.3.y, transform.columns.3.z)
        imageNode.position = position
        
        // Orient the plane based on the surface alignment
        if raycastResult.targetAlignment == .vertical {
            // For vertical surfaces (walls), rotate to face the camera
            imageNode.eulerAngles.y = .pi
        }
        
        // Add to scene
        arView.scene.rootNode.addChildNode(imageNode)
        currentImageNode = imageNode
        
        showMessage("Artwork placed! Pinch to resize.", duration: 2.0)
    }
    
    @objc private func handlePinch(_ gesture: UIPinchGestureRecognizer) {
        guard let node = currentImageNode else { return }
        
        if gesture.state == .changed {
            let scale = Float(gesture.scale)
            node.scale = SCNVector3(scale, scale, scale)
        } else if gesture.state == .ended {
            // Update the base scale
            let scale = Float(gesture.scale)
            currentScale *= scale
            node.scale = SCNVector3(1, 1, 1)
            
            // Update geometry with new size
            updateImageSize()
        }
    }
    
    @objc private func handlePan(_ gesture: UIPanGestureRecognizer) {
        guard let arView = arView,
              let node = currentImageNode else { return }
        
        let location = gesture.location(in: arView)
        
        // Use modern raycast API to find a new surface
        let query = arView.raycastQuery(from: location, allowing: .existingPlaneGeometry, alignment: .any)
        guard let raycastQuery = query else { return }
        
        let raycastResults = arView.session.raycast(raycastQuery)
        guard let raycastResult = raycastResults.first else { return }
        
        // Update node position
        let transform = raycastResult.worldTransform
        let position = SCNVector3(transform.columns.3.x, transform.columns.3.y, transform.columns.3.z)
        
        if gesture.state == .changed {
            node.position = position
        }
    }
    
    // MARK: - Control Actions
    func resetScene() {
        currentImageNode?.removeFromParentNode()
        currentImageNode = nil
        currentScale = 0.3
        showMessage("Scene reset. Tap to place again.", duration: 2.0)
    }
    
    func increaseSize() {
        guard currentImageNode != nil else {
            showMessage("Place an image first")
            return
        }
        currentScale *= sizeIncreaseFactor
        updateImageSize()
        showMessage("Size increased")
    }
    
    func decreaseSize() {
        guard currentImageNode != nil else {
            showMessage("Place an image first")
            return
        }
        currentScale *= sizeDecreaseFactor
        updateImageSize()
        showMessage("Size decreased")
    }
    
    private func updateImageSize() {
        guard let node = currentImageNode,
              let imageTexture = imageTexture,
              let plane = node.geometry as? SCNPlane else { return }
        
        let aspectRatio = imageTexture.size.width / imageTexture.size.height
        let width = CGFloat(currentScale)
        let height = width / aspectRatio
        plane.width = width
        plane.height = height
    }
    
    func takeScreenshot() {
        guard let arView = arView else { return }
        
        let image = arView.snapshot()
        
        // Save to photo library with modern API (iOS 14+, which is available on all iOS 16+ devices)
        PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
            if status == .authorized {
                UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
                Task { @MainActor in
                    self.showMessage("Screenshot saved to Photos!", duration: 2.0)
                }
            } else {
                Task { @MainActor in
                    self.showMessage("Photo library access denied")
                }
            }
        }
    }
    
    // MARK: - Helper Methods
    private func showMessage(_ message: String, duration: TimeInterval = 1.5) {
        statusMessage = message
        
        Task {
            try? await Task.sleep(nanoseconds: UInt64(duration * 1_000_000_000))
            if statusMessage == message {
                statusMessage = nil
            }
        }
    }
}

// MARK: - ARSCNViewDelegate
extension ARGalleryViewModel: ARSCNViewDelegate {
    nonisolated func renderer(_ renderer: SCNSceneRenderer, didAdd node: SCNNode, for anchor: ARAnchor) {
        // Plane detected
        if anchor is ARPlaneAnchor {
            Task { @MainActor [weak self] in
                self?.showMessage("Surface detected! Tap to place.", duration: 2.0)
            }
        }
    }
}

// MARK: - ARSessionDelegate
extension ARGalleryViewModel: ARSessionDelegate {
    nonisolated func session(_ session: ARSession, didFailWithError error: Error) {
        Task { @MainActor [weak self] in
            self?.showMessage("AR Session failed: \(error.localizedDescription)")
        }
    }

    nonisolated func sessionWasInterrupted(_ session: ARSession) {
        Task { @MainActor [weak self] in
            self?.showMessage("AR Session interrupted")
        }
    }

    nonisolated func sessionInterruptionEnded(_ session: ARSession) {
        Task { @MainActor [weak self] in
            self?.showMessage("AR Session resumed")
            self?.resetScene()
        }
    }
}
