//
//  KidModeViewModel.swift
//  ColoringBook
//
//  View model for Kid Mode
//

import Foundation

@MainActor
class KidModeViewModel: ObservableObject {
    struct KidModePage: Identifiable, Equatable {
        let id: String
        let baseImage: ColoringImage
        let displayURL: String

        var canvasImage: ColoringImage {
            var copy = baseImage
            copy.coloringPageUrl = displayURL
            return copy
        }
    }

    @Published var availablePages: [KidModePage] = []
    @Published var selectedPage: KidModePage?
    @Published var isLoading = false

    private func nonEmpty(_ url: String?) -> String? {
        guard let url else { return nil }
        let trimmed = url.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    func loadImages() async {
        isLoading = true

        guard let userId = SupabaseService.shared.currentUserId else {
            isLoading = false
            return
        }

        do {
            let allImages = try await SupabaseService.shared.fetchImages(userId: userId)

            // Kid Mode should only show ready-to-color pages (generated line art), not original photos.
            // Treat each URL (main + variants) as its own “page” so kids can color all available options.
            let completedImages = allImages.filter { $0.status == .completed }

            availablePages = completedImages.flatMap { image in
                let pageUrls: [String] = ([nonEmpty(image.coloringPageUrl)] + (image.variantUrls ?? []).compactMap(nonEmpty)).compactMap { $0 }
                let baseId = image.id ?? UUID().uuidString

                return pageUrls.enumerated().map { index, url in
                    KidModePage(
                        id: "\(baseId)-page-\(index)",
                        baseImage: image,
                        displayURL: url
                    )
                }
            }
            isLoading = false
        } catch {
            print("❌ Failed to load images for Kid Mode: \(error.localizedDescription)")
            isLoading = false
        }
    }
}
