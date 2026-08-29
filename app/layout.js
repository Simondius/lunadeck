import "./globals.css";
import TabBar from "@/components/tabbar";

export const metadata = {
  title: "Lunadeck",
  description: "Learn to read tarot, one card at a time.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* On a wide window this becomes the device frame; below 900px it is
            an inert wrapper. See "desktop framing" in globals.css. */}
        <div className="app-frame">
          {children}
          <TabBar />
        </div>
      </body>
    </html>
  );
}
