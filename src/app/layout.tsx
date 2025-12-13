import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Providers from "@/components/client-providers";
import ClientProviders from "@/components/client-providers";
import ServerProviders from "@/components/server-providers";

const notoSans = Noto_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-noto-sans",
});

export const metadata: Metadata = {
  title: "GymEmbrace - Where your dreams come true",
  description:
    "Totally not a reference to CTB Girls' Dorm's SOTY candidate Glow Embrace",
};

export default async function RootLayout(
  props: Readonly<{
    children: React.ReactNode;
    params: { locale: string };
  }>
) {
  const params = await props.params;

  const {
    locale
  } = params;

  const {
    children
  } = props;

  return (
    <html suppressHydrationWarning>
      <head />
      <body className={`${notoSans.variable} antialiased`}>
        <ServerProviders>
          <ClientProviders>
            <div className="grid grid-rows-[auto_1fr_auto] min-h-screen">
              <Navbar />
              {children}
              <Footer />
            </div>
          </ClientProviders>
        </ServerProviders>
      </body>
    </html>
  );
}
