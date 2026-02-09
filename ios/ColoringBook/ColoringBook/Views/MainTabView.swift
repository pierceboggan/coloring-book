//
//  MainTabView.swift
//  ColoringBook
//
//  Main tab navigation for authenticated users
//

import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedTab: AppTab = .gallery

    enum AppTab: Hashable {
        case gallery
        case create
        case albums
        case settings
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Gallery", systemImage: "photo.on.rectangle")
                }
                .tag(AppTab.gallery)

            ImageUploadView {
                selectedTab = .gallery
            }
            .tabItem {
                Label("Create", systemImage: "plus.circle.fill")
            }
            .tag(AppTab.create)

            AlbumsView()
                .tabItem {
                    Label("Albums", systemImage: "folder.fill")
                }
                .tag(AppTab.albums)

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
                .tag(AppTab.settings)
        }
        .tabBarOnly()
        .tint(Color(hex: "FF6F91"))
    }
}

// MARK: - iPad Tab Bar Fix

private extension View {
    @ViewBuilder
    func tabBarOnly() -> some View {
        if #available(iOS 18.0, *) {
            self.tabViewStyle(.tabBarOnly)
        } else {
            self
        }
    }
}

#Preview {
    MainTabView()
        .environmentObject(AppState())
}
