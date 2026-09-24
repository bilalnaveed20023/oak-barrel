import Experience from "@/components/Experience";
import Nav from "@/components/Nav";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import Features from "@/components/sections/Features";
import Gallery from "@/components/sections/Gallery";
import Stats from "@/components/sections/Stats";
import Closing from "@/components/sections/Closing";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <a href="#manifesto" className="skip">Skip to content</a>
      <Nav />
      <main>
        <Hero />
        <Manifesto />
        <Features />
        <Gallery />
        <Stats />
        <Closing />
      </main>
      <Footer />
      <Experience />
    </>
  );
}
