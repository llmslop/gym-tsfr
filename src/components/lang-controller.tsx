"use client";

import { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { setUserLocale } from "@/services/locale";
import { useTransition } from "react";

export default function LanguageController() {
  const [_isPending, startTransition] = useTransition();

  const setLanguage = (lang: Locale) => {
    startTransition(() => {
      setUserLocale(lang);
    });
  };

  return (
    <div className="dropdown">
      <div tabIndex={0} className="btn btn-ghost m-1 px-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-10"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802"
          />
        </svg>
      </div>
      <ul
        tabIndex={-1}
        className="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
      >
        <li>
          <Link
            href=""
            onClick={() => {
              (document.activeElement as HTMLElement).blur();
              setLanguage("en");
            }}
          >
            English
          </Link>
        </li>
        <li>
          <Link
            href=""
            onClick={() => {
              (document.activeElement as HTMLElement).blur();
              setLanguage("vi");
            }}
          >
            Tiếng Việt
          </Link>
        </li>
      </ul>
    </div>
  );
}
