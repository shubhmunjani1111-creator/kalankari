import type { Metadata } from "next";
import { Playfair_Display, Poppins, Montserrat } from "next/font/google";
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
    icon: "/logo.jpg",
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
