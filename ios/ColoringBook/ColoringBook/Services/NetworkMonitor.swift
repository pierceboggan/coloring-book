//
//  NetworkMonitor.swift
//  ColoringBook
//
//  Network connectivity monitoring for offline support
//

import Foundation
import Network
import Combine

@MainActor
class NetworkMonitor: ObservableObject {
    static let shared = NetworkMonitor()

    @Published var isConnected = true
    @Published var connectionType: NWInterface.InterfaceType?

    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "com.coloringbook.networkmonitor")

    private init() {
        startMonitoring()
    }

    private func startMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            guard let self else { return }

            Task { @MainActor [self] in
                self.isConnected = path.status == .satisfied
                self.connectionType = path.availableInterfaces.first?.type
                self.logConnectionStatus(path)
            }
        }
        monitor.start(queue: queue)
    }

    private func logConnectionStatus(_ path: NWPath) {
        if path.status == .satisfied {
            print("✅ Network connected via \(path.availableInterfaces.first?.type.description ?? "unknown")")
        } else {
            print("❌ Network disconnected")
        }
    }

    func stopMonitoring() {
        monitor.cancel()
    }
}

extension NWInterface.InterfaceType {
    var description: String {
        switch self {
        case .wifi:
            return "WiFi"
        case .cellular:
            return "Cellular"
        case .wiredEthernet:
            return "Ethernet"
        case .loopback:
            return "Loopback"
        case .other:
            return "Other"
        @unknown default:
            return "Unknown"
        }
    }
}
