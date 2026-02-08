//
//  AuthView.swift
//  ColoringBook
//
//  Authentication view for sign in and sign up
//

import SwiftUI

struct AuthView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var appState: AppState

    @State private var email = ""
    @State private var password = ""
    @State private var isSignUp = false
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationView {
            ZStack {
                // Background
                LinearGradient(
                    colors: [Color(hex: "FFF5D6"), Color(hex: "FFE6EB")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        // Header
                        VStack(spacing: 12) {
                            Image(systemName: "paintpalette.fill")
                                .font(.system(size: 50))
                                .foregroundStyle(
                                    LinearGradient(
                                        colors: [Color(hex: "FF6F91"), Color(hex: "FFD166")],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )

                            Text(isSignUp ? "Create Account" : "Welcome Back")
                                .font(.title.bold())
                                .foregroundColor(Color(hex: "3A2E39"))
                        }
                        .padding(.top, 40)

                        // Form
                        VStack(spacing: 16) {
                            // Email field
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Email")
                                    .font(.subheadline.bold())
                                    .foregroundColor(Color(hex: "594144"))

                                TextField("your@email.com", text: $email)
                                    .textFieldStyle(CustomTextFieldStyle())
                                    .textInputAutocapitalization(.never)
                                    .keyboardType(.emailAddress)
                            }

                            // Password field
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Password")
                                    .font(.subheadline.bold())
                                    .foregroundColor(Color(hex: "594144"))

                                SecureField("••••••••", text: $password)
                                    .textFieldStyle(CustomTextFieldStyle())
                            }

                            // Error message
                            if let errorMessage = errorMessage {
                                Text(errorMessage)
                                    .font(.caption)
                                    .foregroundColor(.red)
                                    .padding(.horizontal)
                            }

                            // Submit button
                            Button {
                                Task {
                                    await handleAuth()
                                }
                            } label: {
                                if isLoading {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Text(isSignUp ? "Sign Up" : "Sign In")
                                        .font(.headline)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(hex: "FF6F91"))
                            .foregroundColor(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 20))
                            .overlay(
                                RoundedRectangle(cornerRadius: 20)
                                    .stroke(Color(hex: "FFB3BA"), lineWidth: 3)
                            )
                            .shadow(color: Color(hex: "f2557b"), radius: 0, x: 4, y: 4)
                            .disabled(isLoading)

                            // Toggle sign up/in
                            Button {
                                withAnimation {
                                    isSignUp.toggle()
                                    errorMessage = nil
                                }
                            } label: {
                                HStack {
                                    Text(isSignUp ? "Already have an account?" : "Don't have an account?")
                                    Text(isSignUp ? "Sign In" : "Sign Up")
                                        .bold()
                                }
                                .font(.subheadline)
                                .foregroundColor(Color(hex: "FF6F91"))
                            }
                            .padding(.top, 8)
                        }
                        .padding(.horizontal, 30)

                        Spacer(minLength: 40)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(Color(hex: "594144"))
                    }
                }
            }
        }
    }

    private func handleAuth() async {
        errorMessage = nil
        isLoading = true

        do {
            if isSignUp {
                try await FirebaseService.shared.signUp(email: email, password: password)
            } else {
                try await FirebaseService.shared.signIn(email: email, password: password)
            }

            // Update app state
            appState.isAuthenticated = true
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

struct CustomTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding()
            .background(Color.white.opacity(0.9))
            .clipShape(RoundedRectangle(cornerRadius: 15))
            .overlay(
                RoundedRectangle(cornerRadius: 15)
                    .stroke(Color(hex: "A0E7E5"), lineWidth: 2)
            )
    }
}

#Preview {
    AuthView()
        .environmentObject(AppState())
}
