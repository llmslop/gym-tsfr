import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";

export default function ServerProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider value={{ light: "lemonade", dark: "abyss" }}>
      <NextIntlClientProvider>{children}</NextIntlClientProvider>
    </ThemeProvider>
  );
}
