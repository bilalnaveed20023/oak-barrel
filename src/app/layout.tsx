import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "lenis/dist/lenis.css";
import "./globals.css";

// Matched to the bar's printed menu: Rye for the signage-style title moments,
// Domine (variable 400–700) for headings and text, like the menu's names and descriptions.
const brand = localFont({
  src: [{ path: "../fonts/Rye-400.woff2", weight: "400", style: "normal" }],
  variable: "--font-brand",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "serif"],
});

const display = localFont({
  src: [{ path: "../fonts/Domine-var.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-display",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const body = localFont({
  src: [{ path: "../fonts/Domine-var.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-body",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
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
  email: "theoakbarrelwyandotte@gmail.com",
  servesCuisine: "Cocktails, whiskey, wine",
  address: {
    "@type": "PostalAddress",
    streetAddress: "166 Oak Street",
    addressLocality: "Wyandotte",
    addressRegion: "MI",
    addressCountry: "US",
  },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"], opens: "15:00", closes: "00:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Friday", "Saturday"], opens: "15:00", closes: "02:00" },
  ],
  sameAs: ["https://www.instagram.com/oakbarrelwyandotte/", "https://www.facebook.com/profile.php?id=100066416667255"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${brand.variable} ${display.variable} ${body.variable}`}>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
