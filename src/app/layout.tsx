import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "lenis/dist/lenis.css";
import "./globals.css";

const display = localFont({
  src: [
    { path: "../fonts/Boska-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Boska-400i.woff2", weight: "400", style: "italic" },
    { path: "../fonts/Boska-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Boska-500i.woff2", weight: "500", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const body = localFont({
  src: [
    { path: "../fonts/GeneralSans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/GeneralSans-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/GeneralSans-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

const title = "The Oak Barrel — Cocktail & Whiskey Bar in Wyandotte, MI";
const description =
  "Handcrafted cocktails, exclusive distillates and fine wines on Oak Street, Wyandotte. Live music Wednesday to Saturday, private events and premium bottle service.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "https://www.oakbarrelbar.com"),
  title,
  description,
  applicationName: "The Oak Barrel",
  keywords: ["Wyandotte bar", "cocktail bar", "whiskey bar", "live music Wyandotte", "bottle service", "private events", "Downriver bars"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "The Oak Barrel",
    title,
    description,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title, description },
  formatDetection: { telephone: true, address: true },
};

export const viewport: Viewport = {
  themeColor: "#07130e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BarOrPub",
  name: "The Oak Barrel",
  url: "https://www.oakbarrelbar.com",
  telephone: "+1-313-456-9909",
  email: "info@prime166.com",
  servesCuisine: "Cocktails, whiskey, wine",
  address: {
    "@type": "PostalAddress",
    streetAddress: "166 Oak Street",
    addressLocality: "Wyandotte",
    addressRegion: "MI",
    addressCountry: "US",
  },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Wednesday", "Thursday"], opens: "17:00", closes: "00:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Friday", "Saturday"], opens: "17:00", closes: "02:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "15:00", closes: "21:00" },
  ],
  sameAs: ["https://www.instagram.com/oakbarrelwyandotte/", "https://www.facebook.com/profile.php?id=100066416667255"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
