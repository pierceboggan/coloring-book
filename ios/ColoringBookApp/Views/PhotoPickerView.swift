import PhotosUI
import SwiftUI
import UniformTypeIdentifiers
import UIKit

struct PhotoPickerView: UIViewControllerRepresentable {
    @Binding var imageURL: URL?
    let onComplete: (Result<URL, Error>) -> Void

    func makeUIViewController(context: Context) -> PHPickerViewController {
        var configuration = PHPickerConfiguration(photoLibrary: .shared())
        configuration.filter = .images
        configuration.selectionLimit = 1
        let controller = PHPickerViewController(configuration: configuration)
        controller.delegate = context.coordinator
        return controller
    }

    func updateUIViewController(_ uiViewController: PHPickerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    final class Coordinator: NSObject, PHPickerViewControllerDelegate {
        private let parent: PhotoPickerView

        init(parent: PhotoPickerView) {
            self.parent = parent
        }

        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            picker.dismiss(animated: true)

            guard let provider = results.first?.itemProvider, provider.canLoadObject(ofClass: UIImage.self) else {
                parent.onComplete(.failure(PickerError.noSelection))
                return
            }

            provider.loadFileRepresentation(forTypeIdentifier: UTType.image.identifier) { url, error in
                if let error = error {
                    DispatchQueue.main.async {
                        parent.onComplete(.failure(error))
                    }
                    return
                }

                guard let url = url else {
                    DispatchQueue.main.async {
                        parent.onComplete(.failure(PickerError.unableToLoad))
                    }
                    return
                }

                let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".jpg")

                do {
                    if FileManager.default.fileExists(atPath: tempURL.path) {
                        try FileManager.default.removeItem(at: tempURL)
                    }
                    try FileManager.default.copyItem(at: url, to: tempURL)
                    DispatchQueue.main.async {
                        parent.imageURL = tempURL
                        parent.onComplete(.success(tempURL))
                    }
                } catch {
                    DispatchQueue.main.async {
                        parent.onComplete(.failure(error))
                    }
                }
            }
        }
    }
}

enum PickerError: LocalizedError {
    case noSelection
    case unableToLoad

    var errorDescription: String? {
        switch self {
        case .noSelection:
            return "No image was selected."
        case .unableToLoad:
            return "Unable to load the selected image."
        }
    }
}
