import "./globals.css";

export const metadata = {
  title: "Decentralised Freelancing",
  description: "Escrow-backed decentralised freelance platform"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
