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
          colorTextSecondary: "#ffffff",
          colorTextOnPrimaryBackground: "#ffffff",
          borderRadius: "24px",
          fontFamily: "var(--font-sans)",
        },
        elements: {
          card: "bg-black border border-[#222222] shadow-2xl rounded-[32px] p-2",
          headerTitle: "text-white text-3xl font-bold tracking-tight",
          headerSubtitle: "text-white text-base opacity-80",
          socialButtonsBlockButton: "bg-[#111111] border-[#222222] hover:bg-[#1A1A1A] transition-all h-12 rounded-2xl",
          socialButtonsBlockButtonText: "text-white font-semibold",
          formButtonPrimary: "bg-[#FF2E5B] hover:bg-[#E01B45] transition-all font-bold py-3 rounded-2xl text-base h-12 text-white",
          footerActionLink: "text-[#FF2E5B] hover:text-[#FF5A7E] font-bold",
          footerActionText: "text-white font-medium opacity-80",
          dividerLine: "bg-[#222222]",
          dividerText: "text-white font-medium opacity-60",
          identityPreviewText: "text-white font-medium",
          formFieldLabel: "text-white font-semibold mb-1.5",
          formFieldInput: "bg-[#111111] border-[#222222] text-white focus:ring-primary focus:border-primary h-12 rounded-xl",
          formFieldInputShowPasswordButton: "text-white opacity-60 hover:opacity-100",
          userButtonPopoverCard: "bg-black border border-[#222222] shadow-2xl rounded-[28px]",
          userButtonPopoverActionButton: "hover:bg-[#1A1A1A] transition-all py-3.5",
          userButtonPopoverActionButtonText: "text-white font-semibold",
          userButtonPopoverActionButtonIcon: "text-[#FF2E5B]",
          userPreviewMainIdentifier: "text-white font-bold",
          userPreviewSecondaryIdentifier: "text-white opacity-60",
          userButtonPopoverFooter: "hidden", 
          userButtonOuterIdentifier: "text-white font-medium",
        }
      }}
    >
      <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
        <body className="font-sans antialiased text-text-primary selection:bg-primary/30 selection:text-white">{children}</body>
      </html>
    </ClerkProvider>
  );
}
