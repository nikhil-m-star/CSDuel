import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "CSDuel — Real-Time CS Quiz Battles",
  description:
    "Challenge your friends to real-time 1v1 duels on Data Structures, Algorithms, Operating Systems, Databases, and Computer Networks. Powered by AI-generated questions.",
  keywords: ["CS quiz", "DSA", "competitive programming", "computer science", "duel"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#FF2E5B",
          colorBackground: "#000000",
          colorInputBackground: "#111111",
          colorInputText: "#ffffff",
          colorText: "#ffffff",
          colorTextSecondary: "#eeeeee",
          colorTextOnPrimaryBackground: "#ffffff",
          borderRadius: "24px",
          fontFamily: "var(--font-sans)",
        },
        elements: {
          card: "bg-black border border-[#1A1A1A] shadow-2xl",
          headerTitle: "text-2xl font-bold tracking-tight",
          headerSubtitle: "text-gray-400",
          socialButtonsBlockButton: "bg-[#111111] border-[#1A1A1A] hover:bg-[#1A1A1A] transition-all",
          socialButtonsBlockButtonText: "font-bold",
          formButtonPrimary: "bg-primary hover:bg-primary-dark transition-all font-bold py-3",
          footerActionLink: "text-primary hover:text-primary-dark font-bold",
          identityPreviewText: "text-white",
          formFieldLabel: "text-gray-300 font-medium",
          formFieldInput: "bg-[#111111] border-[#1A1A1A] focus:ring-primary focus:border-primary",
          userButtonPopoverCard: "bg-black border border-[#1A1A1A] shadow-2xl rounded-[24px]",
          userButtonPopoverActionButton: "hover:bg-[#1A1A1A] transition-all py-3",
          userButtonPopoverActionButtonText: "text-white font-bold",
          userButtonPopoverActionButtonIcon: "text-primary",
          userPreviewMainIdentifier: "text-white font-bold",
          userPreviewSecondaryIdentifier: "text-gray-400",
          userButtonPopoverFooter: "hidden", 
        }
      }}
    >
      <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
        <body className="font-sans antialiased text-text-primary selection:bg-primary/30 selection:text-white">{children}</body>
      </html>
    </ClerkProvider>
  );
}
