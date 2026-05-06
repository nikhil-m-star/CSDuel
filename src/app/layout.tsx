import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
          colorPrimary: "#06b6d4",
          colorBackground: "#111827",
          colorInputBackground: "#1e293b",
          colorInputText: "#f1f5f9",
        },
      }}
    >
      <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <body className="font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}
