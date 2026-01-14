"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const t = useTranslations("404");
  return (
    <div className="flex flex-col gap-8 justify-center items-center h-full w-full">
      <h1 className="font-bold text-3xl">{t("notfound")}</h1>
      <button className="btn btn-info" onClick={() => router.push("/")}>
        {t("return")}
      </button>
    </div>
  );
}
