import type { Metadata } from "next";
import { Playfair_Display, Poppins, Montserrat } from "next/font/google";
import Script from "next/script"; // <-- 1. ADDED THIS IMPORT
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700"],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Kalankari | Premium Digital Printed Kurtis Brand",
  description: "Explore Kalankari's beautiful collection of luxury digital printed kurtis. Handcrafted motifs, premium silk/cotton fabrics, and modern Indian designer kurtas.",
  keywords: ["printed kurti", "designer ethnic wear", "Indian fashion brand", "modern silk kurti", "Kalankari kurtis", "Surat prints"],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.jpg",
  },
  openGraph: {
    title: "Kalankari | Premium Digital Printed Kurtis Brand",
    description: "Explore Kalankari's beautiful collection of luxury digital printed kurtis. Handcrafted motifs and premium fabrics.",
    url: "https://kalankari.com",
    siteName: "Kalankari Kurtis",
    images: [{ url: "https://kalankari.com/logo.jpg" }],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${poppins.variable} ${montserrat.variable}`}>
      {/* <-- 2. ADDED THE HEAD TAG AND META DATASET CODE HERE */}
      <head>
        <Script id="meta-dataset" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1573180711101361');
            fbq('track', 'PageView');
          `}
        </Script>
      </head>
      
      <body className="bg-brandBg-light text-brandText-light font-body min-h-screen flex flex-col pt-28 pb-10">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Navbar />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}