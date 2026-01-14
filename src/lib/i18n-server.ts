import { getUserLocale } from "@/services/locale";
import { Locale, locales } from "@/i18n/config";

type Messages = {
  API: {
    errors: Record<string, string>;
    success: Record<string, string>;
  };
  [key: string]: Record<string, unknown>;
};

const cachedMessages: { [locale: string]: Messages } = {};

/**
 * Get messages for the current locale
 */
export async function getMessages(): Promise<Messages> {
  const userLocale = await getUserLocale();
  
  // Validate locale against whitelist to prevent path traversal
  const locale: Locale = locales.includes(userLocale as Locale) ? (userLocale as Locale) : "en";
  
  if (!cachedMessages[locale]) {
    try {
      cachedMessages[locale] = (await import(`../../messages/${locale}.json`)).default;
    } catch (error) {
      console.error(`Failed to load locale file for ${locale}:`, error);
      // Fallback to English if locale file fails to load
      if (locale !== "en") {
        cachedMessages[locale] = (await import(`../../messages/en.json`)).default;
      } else {
        throw new Error("Failed to load default locale");
      }
    }
  }
  
  return cachedMessages[locale];
}

/**
 * Get a specific translation by key path
 * @param keyPath - dot-separated path like "API.errors.unauthorized"
 * @returns The translated message or the key if not found
 */
export async function t(keyPath: string): Promise<string> {
  const messages = await getMessages();
  const keys = keyPath.split(".");
  
  let value: unknown = messages;
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return keyPath; // Return key if translation not found
    }
  }
  
  return typeof value === "string" ? value : keyPath;
}

/**
 * Get translation namespace (useful for getting multiple related translations)
 */
export async function getNamespace(namespace: string): Promise<Record<string, unknown>> {
  const messages = await getMessages();
  const keys = namespace.split(".");
  
  let value: unknown = messages;
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return {};
    }
  }
  
  return (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
}
