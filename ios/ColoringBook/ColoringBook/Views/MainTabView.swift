//
//  MainTabView.swift
//  ColoringBook
//
//  Main tab navigation for authenticated users
//

import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("Gallery", systemImage: "photo.on.rectangle")
                }

            ImageUploadView()
                .tabItem {
                    Label("Create", systemImage: "plus.circle.fill")
                }

            AlbumsView()
                .tabItem {
                    Label("Albums", systemImage: "folder.fill")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
        }
        .tint(Color(hex: "FF6F91"))
    }
}

#Preview {
    MainTabView()
        .environmentObject(AppState())
}
