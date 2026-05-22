import fs from "node:fs/promises";
import path from "node:path";
import Head from "next/head";
import Link from "next/link";
import Script from "next/script";

type HomePageProps = {
  landingContent: string;
};

export async function getStaticProps() {
  const htmlPath = path.join(process.cwd(), "front", "index.html");
  const html = await fs.readFile(htmlPath, "utf8");
  const mainMatch = html.match(/<main>[\s\S]*?<\/main>[\s\S]*?<footer[\s\S]*?<\/footer>/);

  const landingContent = (mainMatch?.[0] ?? "")
    .split("./assets/")
    .join("/landing/assets/")
    .split("catalogo.html")
    .join("/landing/catalogo.html")
    .split("construccion.html")
    .join("/landing/construccion.html");

  return {
    props: {
      landingContent,
    },
  };
}

export default function HomePage({ landingContent }: HomePageProps) {
  return (
    <>
      <Head>
        <title>Distribucion Electrica | Salta y Jujuy</title>
        <meta
          name="description"
          content="Empresa lider en distribucion de materiales electricos e iluminacion con pronta entrega en Salta y Jujuy, norte de Argentina."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/svg+xml" href="/landing/assets/brand/favicon.svg" />
        <link rel="stylesheet" href="/landing/css/style.css" />
      </Head>

      <PublicNavbar />
      <div dangerouslySetInnerHTML={{ __html: landingContent }} />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" strategy="afterInteractive" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" strategy="afterInteractive" />
      <Script src="/landing/js/config.js" strategy="afterInteractive" />
      <Script src="/landing/js/main.js" strategy="afterInteractive" />
      <Script src="/landing/js/nosotros.js" strategy="afterInteractive" />
      <Script src="/landing/js/premium-motion.js" strategy="afterInteractive" />
    </>
  );
}

function PublicNavbar() {
  return (
    <header className="navbar" id="navbar">
      <div className="nav-container">
        <a href="#" className="nav-logo" id="nav-logo-link" aria-label="Ir al inicio">
          <img
            src="/landing/assets/brand/logo.png"
            alt="Logo empresa"
            className="logo-img"
            onError={(event) => {
              event.currentTarget.style.display = "none";
              const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
              if (fallback) {
                fallback.style.display = "flex";
              }
            }}
          />
          <span className="logo-fallback">Luminoa</span>
        </a>

        <nav className="nav-links" id="nav-links" role="navigation" aria-label="Navegacion principal">
          <a href="#" className="nav-link active" id="nav-home">
            Home
          </a>
          <a href="#servicios" className="nav-link" id="nav-servicios">
            Servicios
          </a>
          <a href="#clientes" className="nav-link" id="nav-clientes">
            Clientes
          </a>
        </nav>

        <div className="nav-actions" id="nav-actions">
          <Link href="/login" className="btn btn-outline" id="btn-login">
            Log in
          </Link>
          <Link href="/login" className="btn btn-primary" id="btn-register">
            Hablar con un asesor
          </Link>
        </div>

        <button
          className="hamburger"
          id="hamburger-btn"
          aria-label="Abrir menu"
          aria-expanded="false"
          aria-controls="mobile-menu"
        >
          <span className="ham-line" />
          <span className="ham-line" />
          <span className="ham-line" />
        </button>
      </div>

      <div className="mobile-menu" id="mobile-menu" role="dialog" aria-label="Menu movil">
        <nav className="mobile-nav" aria-label="Navegacion movil">
          <a href="#" className="mobile-nav-link" id="mobile-home">
            Home
          </a>
          <a href="#servicios" className="mobile-nav-link" id="mobile-servicios">
            Servicios
          </a>
          <a href="#clientes" className="mobile-nav-link" id="mobile-clientes">
            Clientes
          </a>
        </nav>
        <div className="mobile-actions">
          <Link href="/login" className="btn btn-outline btn-full" id="mobile-btn-login">
            Log in
          </Link>
          <Link href="/login" className="btn btn-primary btn-full" id="mobile-btn-register">
            Hablar con un asesor
          </Link>
        </div>
      </div>
    </header>
  );
}
