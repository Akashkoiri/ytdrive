import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YT Drive • Personal YouTube Cloud Vault",
  description:
    "Transform YouTube into an unlimited, organized personal cloud drive for your video media with folder collections, instant streaming, and privacy controls.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem("ytdrive-theme");var meta=document.querySelector('meta[name="color-scheme"]');if(meta){meta.content=(m==="light"||m==="dark")?m:"light dark";}var t=m==="light"?"light":(m==="dark"?"dark":(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"));var r=document.documentElement;r.classList.remove("light","dark");r.classList.add(t);r.setAttribute("data-theme",t);r.style.colorScheme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
