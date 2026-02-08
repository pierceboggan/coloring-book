//
//  OfflinePersistence.swift
//  ColoringBook
//
//  Local persistence for offline support
//

import Foundation
import CoreData

class OfflinePersistenceService {
    static let shared = OfflinePersistenceService()

    private init() {
        setupCoreData()
    }

    // MARK: - Core Data Stack

    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "ColoringBook")
        container.loadPersistentStores { description, error in
            if let error = error {
                print("❌ Core Data failed to load: \(error.localizedDescription)")
            } else {
                print("✅ Core Data loaded successfully")
            }
        }
        return container
    }()

    var context: NSManagedObjectContext {
        return persistentContainer.viewContext
    }

    private func setupCoreData() {
        // Configure for offline support
        context.automaticallyMergesChangesFromParent = true
        context.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
    }

    // MARK: - Save Context

    func saveContext() {
        guard context.hasChanges else { return }

        do {
            try context.save()
            print("✅ Context saved")
        } catch {
            print("❌ Failed to save context: \(error.localizedDescription)")
        }
    }

    // MARK: - Image Cache

    func cacheImage(imageData: Data, imageId: String) {
        let cacheDirectory = FileManager.default.urls(
            for: .cachesDirectory,
            in: .userDomainMask
        )[0]
        let fileURL = cacheDirectory.appendingPathComponent("\(imageId).jpg")

        do {
            try imageData.write(to: fileURL)
            print("✅ Image cached: \(imageId)")
        } catch {
            print("❌ Failed to cache image: \(error.localizedDescription)")
        }
    }

    func getCachedImage(imageId: String) -> Data? {
        let cacheDirectory = FileManager.default.urls(
            for: .cachesDirectory,
            in: .userDomainMask
        )[0]
        let fileURL = cacheDirectory.appendingPathComponent("\(imageId).jpg")

        do {
            let data = try Data(contentsOf: fileURL)
            print("✅ Image retrieved from cache: \(imageId)")
            return data
        } catch {
            print("❌ Failed to retrieve cached image: \(error.localizedDescription)")
            return nil
        }
    }

    // MARK: - Pending Operations Queue

    func queueOperation(_ operation: PendingOperation) {
        // Store operation for later execution when online
        let entity = NSEntityDescription.entity(
            forEntityName: "PendingOperation",
            in: context
        )!
        let managedObject = NSManagedObject(entity: entity, insertInto: context)

        managedObject.setValue(operation.id, forKey: "id")
        managedObject.setValue(operation.type.rawValue, forKey: "type")
        managedObject.setValue(operation.data, forKey: "data")
        managedObject.setValue(Date(), forKey: "createdAt")

        saveContext()
        print("✅ Operation queued for offline sync")
    }

    func getPendingOperations() -> [PendingOperation] {
        let fetchRequest = NSFetchRequest<NSManagedObject>(entityName: "PendingOperation")

        do {
            let results = try context.fetch(fetchRequest)
            return results.compactMap { object in
                guard let id = object.value(forKey: "id") as? String,
                      let typeRaw = object.value(forKey: "type") as? String,
                      let type = OperationType(rawValue: typeRaw),
                      let data = object.value(forKey: "data") as? Data else {
                    return nil
                }

                return PendingOperation(id: id, type: type, data: data)
            }
        } catch {
            print("❌ Failed to fetch pending operations: \(error.localizedDescription)")
            return []
        }
    }

    func removePendingOperation(_ operationId: String) {
        let fetchRequest = NSFetchRequest<NSManagedObject>(entityName: "PendingOperation")
        fetchRequest.predicate = NSPredicate(format: "id == %@", operationId)

        do {
            let results = try context.fetch(fetchRequest)
            results.forEach { context.delete($0) }
            saveContext()
            print("✅ Pending operation removed")
        } catch {
            print("❌ Failed to remove pending operation: \(error.localizedDescription)")
        }
    }
}

// MARK: - Models

struct PendingOperation: Codable {
    let id: String
    let type: OperationType
    let data: Data
}

enum OperationType: String, Codable {
    case uploadImage
    case updateImage
    case deleteImage
    case saveArtwork
}
