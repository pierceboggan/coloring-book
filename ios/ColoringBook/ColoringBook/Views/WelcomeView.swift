//
//  WelcomeView.swift
//  ColoringBook
//
//  Landing/welcome screen with sign in and get started options
//

import SwiftUI

struct WelcomeView: View {
    @State private var showAuthSheet = false
    @State private var showUploader = false

    var body: some View {
        ZStack {
            // Background with fun colors
            LinearGradient(
                colors: [
                    Color(hex: "FFF5D6"),
                    Color(hex: "FFE6EB")
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            // Paint splotches decoration
            PaintSplotchesView()

            ScrollView {
                VStack(spacing: 30) {
                    Spacer(minLength: 40)

                    // Logo and title
                    VStack(spacing: 16) {
                        Image(systemName: "paintpalette.fill")
                            .font(.system(size: 60))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [Color(hex: "FF6F91"), Color(hex: "FFD166")],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )

                        Text("ColoringBook.AI")
                            .font(.system(size: 42, weight: .black))
                            .foregroundColor(Color(hex: "3A2E39"))

                        Text("Turn Your Photos into")
                            .font(.title2)
                            .foregroundColor(Color(hex: "594144"))
                        Text("Coloring Adventures!")
                            .font(.title.bold())
                            .foregroundColor(Color(hex: "FF6F91"))
                    }
                    .padding(.horizontal)

                    // Description
                    Text(
                        "Our friendly AI helpers trace every giggle, wiggle, and wagging tail " +
                        "into playful line art that's ready for crayons, markers, and imagination."
                    )
                        .font(.body)
                        .foregroundColor(Color(hex: "594144"))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)

                    // Action buttons
                    VStack(spacing: 16) {
                        Button {
                            showUploader = true
                        } label: {
                            HStack {
                                Text("Create a Coloring Page")
                                    .font(.headline)
                                Image(systemName: "arrow.right")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(hex: "FF6F91"))
                            .foregroundColor(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 25))
                            .overlay(
                                RoundedRectangle(cornerRadius: 25)
                                    .stroke(Color(hex: "FFB3BA"), lineWidth: 4)
                            )
                            .shadow(color: Color(hex: "f2557b"), radius: 0, x: 6, y: 6)
                        }

                        Button {
                            showAuthSheet = true
                        } label: {
                            Text("Sign In")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.white.opacity(0.9))
                                .foregroundColor(Color(hex: "FF6F91"))
                                .clipShape(RoundedRectangle(cornerRadius: 25))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 25)
                                        .stroke(Color(hex: "FFB3BA"), lineWidth: 4)
                                )
                        }
                    }
                    .padding(.horizontal, 40)

                    // Features
                    VStack(spacing: 20) {
                        FeatureRow(
                            icon: "sparkles",
                            title: "Magical Line Art",
                            description: "AI-powered tracing creates perfect coloring pages"
                        )

                        FeatureRow(
                            icon: "heart.fill",
                            title: "Family Friendly",
                            description: "Safe and fun for all ages"
                        )

                        FeatureRow(
                            icon: "square.and.arrow.down.fill",
                            title: "Ready to Print",
                            description: "Download high-resolution pages instantly"
                        )
                    }
                    .padding(.horizontal, 40)
                    .padding(.top, 20)

                    Spacer(minLength: 40)
                }
            }
        }
        .sheet(isPresented: $showAuthSheet) {
            AuthView()
        }
        .fullScreenCover(isPresented: $showUploader) {
            ImageUploadView()
        }
    }
}

struct FeatureRow: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(Color(hex: "FF6F91"))
                .frame(width: 44, height: 44)
                .background(Color(hex: "FFE6EB"))
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(Color(hex: "3A2E39"))

                Text(description)
                    .font(.subheadline)
                    .foregroundColor(Color(hex: "594144"))
            }

            Spacer()
        }
    }
}

struct PaintSplotchesView: View {
    var body: some View {
        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color(hex: "FFB3BA").opacity(0.7), Color.clear],
                        center: .center,
                        startRadius: 0,
                        endRadius: 140
                    )
                )
                .frame(width: 280, height: 280)
                .position(x: -50, y: 50)

            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color(hex: "FFD166").opacity(0.6), Color.clear],
                        center: .center,
                        startRadius: 0,
                        endRadius: 160
                    )
                )
                .frame(width: 320, height: 320)
                .position(x: UIScreen.main.bounds.width + 50, y: 150)

            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color(hex: "9BF6FF").opacity(0.6), Color.clear],
                        center: .center,
                        startRadius: 0,
                        endRadius: 180
                    )
                )
                .frame(width: 360, height: 360)
                .position(x: UIScreen.main.bounds.width * 0.3, y: UIScreen.main.bounds.height - 100)
        }
    }
}

#Preview {
    WelcomeView()
}
