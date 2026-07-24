import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import BackToTop from "@/components/BackToTop";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "ট্যানজেন্ট — সংবাদ ও বিশ্লেষণ",
  description: "বাংলাদেশ ও বৈশ্বিক রাজনীতি, অর্থনীতি, ক্রীড়া এবং সমসাময়িক বিষয়ের নিরপেক্ষ ও বস্তুনিষ্ঠ বিশ্লেষণ।",
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
                  if (saved === 'dark') {
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
        </ThemeProvider>
      </body>
    </html>
  );
}