// app/layout.tsx
import './globals.css'; // Simplified globals.css
import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import NextAuthProviders from '@/src/components/Providers';
import Navbar from '@/src/components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Used by fontFamily.sans in tailwind.config.js
  display: 'swap',
  weight: ['400', '500', '600'],
});

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins', // Used by fontFamily.display in tailwind.config.js
  display: 'swap',
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'OrElse: Public Goal Accountability',
  description: 'Achieve your goals with fun, community-enforced consequences. OrElse!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning // Recommended for next-themes
      className={`${inter.variable} ${poppins.variable}`} // Make font variables available
    >
      {/* Apply base background and text colors directly */}
      {/* Tailwind's fontFamily.sans will apply Inter by default */}
      <body className="bg-carolina-white dark:bg-raycast-black text-carolina-black dark:text-raycast-white transition-colors duration-300">
        <ThemeProvider
          attribute="class" // Use class strategy for dark mode
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange // Optional: smoother transitions without JS flicker
        >
          <NextAuthProviders>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              {/* pt-16 assumes navbar height h-16 (4rem). Adjust if needed. */}
              <main className="flex-grow pt-16">
                {children}
              </main>
              {/* Footer can go here */}
            </div>
          </NextAuthProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
