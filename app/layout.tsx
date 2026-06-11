import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const META_TITLE = "Virnix — 1 video. Every platform. 60 seconds.";
const META_DESCRIPTION =
  "Paste any YouTube link and get TikTok hooks, X threads, LinkedIn posts, and Instagram captions — ready to post.";

export const metadata: Metadata = {
  metadataBase: new URL("https://virnix.pro"),
  title: META_TITLE,
  description: META_DESCRIPTION,
  openGraph: {
    title: META_TITLE,
    description: META_DESCRIPTION,
    url: "https://virnix.pro",
    siteName: "Virnix",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: META_TITLE,
    description: META_DESCRIPTION,
    creator: "@virnix",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Sync theme from localStorage before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.classList.remove('dark');else document.documentElement.classList.add('dark');}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
