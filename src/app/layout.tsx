import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import BackToTop from "@/components/BackToTop";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/useAuth";

export const metadata: Metadata = {
  metadataBase: new URL("https://tangentnews.vercel.app"),
  title: {
    default: "ট্যানজেন্ট — সংবাদ ও বিশ্লেষণ",
    template: "%s — ট্যানজেন্ট",
  },
  description: "বাংলাদেশ ও বৈশ্বিক রাজনীতি, অর্থনীতি, ক্রীড়া এবং সমসাময়িক বিষয়ের নিরপেক্ষ ও বস্তুনিষ্ঠ বিশ্লেষণ।",
  openGraph: {
    type: "website",
    siteName: "ট্যানজেন্ট",
    title: "ট্যানজেন্ট — সংবাদ ও বিশ্লেষণ",
    description: "বাংলাদেশ ও বৈশ্বিক রাজনীতি, অর্থনীতি, ক্রীড়া এবং সমসাময়িক বিষয়ের নিরপেক্ষ ও বস্তুনিষ্ঠ বিশ্লেষণ।",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    locale: "bn_BD",
  },
  twitter: {
    card: "summary_large_image",
    title: "ট্যানজেন্ট — সংবাদ ও বিশ্লেষণ",
    description: "বাংলাদেশ ও বৈশ্বিক রাজনীতি, অর্থনীতি, ক্রীড়া এবং সমসাময়িক বিষয়ের নিরপেক্ষ ও বস্তুনিষ্ঠ বিশ্লেষণ।",
    images: ["/og-default.png"],
  },
  alternates: {
    canonical: "https://tangentnews.vercel.app",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && systemDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            <a href="#main-content" className="skip-to-content">
              সরাসরি মূল কনটেন্টে যান
            </a>
            <div className="announcement-banner">
              ট্যানজেন্ট — স্বাধীন ও নিরপেক্ষ সংবাদ মাধ্যম। কোনো পেওয়াল নেই, কোনো ট্র্যাকার নেই।
            </div>
            <SiteHeader />
            <main id="main-content" className="flex-1">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
            <Footer />
            <BackToTop />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}