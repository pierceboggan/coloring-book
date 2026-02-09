//
//  SettingsView.swift
//  ColoringBook
//
//  Settings and account management
//

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @State private var showKidModeSettings = false
    @State private var showSignOutAlert = false

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "FFF5D6"), Color(hex: "FFE6EB")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                List {
                    // Account section
                    Section {
                        if let email = SupabaseService.shared.currentUser?.email {
                            HStack {
                                Text("Email")
                                    .foregroundColor(Color(hex: "594144"))
                                Spacer()
                                Text(email)
                                    .foregroundColor(Color(hex: "3A2E39"))
                                    .font(.subheadline)
                            }
                        }
                    } header: {
                        Text("Account")
                    }

                    // Kid Mode section
                    Section {
                        Toggle("Kid Mode", isOn: $appState.isKidModeActive)
                            .tint(Color(hex: "FF6F91"))

                        if appState.isKidModeActive {
                            Text("Kid Mode locks the app to only show coloring pages")
                                .font(.caption)
                                .foregroundColor(Color(hex: "594144"))
                        }

                        Button {
                            showKidModeSettings = true
                        } label: {
                            Text("Kid Mode Settings")
                                .foregroundColor(Color(hex: "FF6F91"))
                        }
                    } header: {
                        Text("Kid Mode")
                    }

                    // App info
                    Section {
                        HStack {
                            Text("Version")
                            Spacer()
                            Text("1.0.0")
                                .foregroundColor(Color(hex: "594144"))
                        }

                        Link(destination: URL(string: "https://coloringbook.ai")!) {
                            HStack {
                                Text("Website")
                                Spacer()
                                Image(systemName: "arrow.up.right")
                                    .font(.caption)
                            }
                        }
                    } header: {
                        Text("About")
                    }

                    // Sign out
                    Section {
                        Button(role: .destructive) {
                            showSignOutAlert = true
                        } label: {
                            Text("Sign Out")
                                .frame(maxWidth: .infinity)
                        }
                    }
                }
                .scrollContentBackground(.hidden)
            }
            .navigationTitle("Settings")
            .alert("Sign Out", isPresented: $showSignOutAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Sign Out", role: .destructive) {
                    Task {
                        do {
                            try await SupabaseService.shared.signOut()
                            appState.isAuthenticated = false
                        } catch {
                            print("❌ Failed to sign out: \(error.localizedDescription)")
                        }
                    }
                }
            } message: {
                Text("Are you sure you want to sign out?")
            }
            .sheet(isPresented: $showKidModeSettings) {
                KidModeSettingsView()
                    .environmentObject(appState)
            }
        }
    }
}

struct KidModeSettingsView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var newCode = ""
    @State private var confirmCode = ""
    @State private var errorMessage: String?
    @State private var showSuccess = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        Text("Current Code")
                        Spacer()
                        Text(appState.parentCode)
                            .foregroundColor(.secondary)
                            .font(.system(.body, design: .monospaced))
                    }
                } header: {
                    Text("Current Parent Code")
                } footer: {
                    Text("This is the code needed to exit Kid Mode.")
                }

                Section {
                    SecureField("New code (4+ digits)", text: $newCode)
                        .keyboardType(.numberPad)

                    SecureField("Confirm new code", text: $confirmCode)
                        .keyboardType(.numberPad)

                    if let errorMessage {
                        Text(errorMessage)
                            .font(.caption)
                            .foregroundColor(.red)
                    }

                    if showSuccess {
                        Label("Code updated!", systemImage: "checkmark.circle.fill")
                            .foregroundColor(.green)
                            .font(.caption)
                    }
                } header: {
                    Text("Change Parent Code")
                }

                Section {
                    Button("Save New Code") {
                        saveCode()
                    }
                    .frame(maxWidth: .infinity)
                    .disabled(newCode.isEmpty || confirmCode.isEmpty)
                }
            }
            .navigationTitle("Kid Mode Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }

    private func saveCode() {
        errorMessage = nil
        showSuccess = false

        guard newCode.count >= 4 else {
            errorMessage = "Code must be at least 4 characters"
            return
        }
        guard newCode == confirmCode else {
            errorMessage = "Codes don't match"
            return
        }

        appState.parentCode = newCode
        showSuccess = true
        newCode = ""
        confirmCode = ""

        // Auto-dismiss after brief delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            dismiss()
        }
    }
}

#Preview {
    SettingsView()
        .environmentObject(AppState())
}
