"use client";

import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { AccountInfo } from "./account-info";
import { Overview } from "./overview";
import { MyPlan } from "./my-plan";
import { WorkoutHistory } from "./workout-history";
import MyTrainerTab from "./my-trainer";
import { useTranslations } from "next-intl";

export default function Profile() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const t = useTranslations("Profile.tabs");
  const tProfile = useTranslations("Profile");

  if (!isPending && session === null) {
    router.push("/");
    return;
  }

  return !isPending ? (
    <main className="tabs tabs-lift m-10 tabs-lg">
      <input
        type="radio"
        name="tabs"
        className="tab"
        aria-label={t("overview")}
        defaultChecked={true}
      />
      <div className="tab-content bg-base-100 border-base-300 p-6">
        <Overview session={session!} />
      </div>

      <input
        type="radio"
        name="tabs"
        className="tab"
        aria-label={t("accountInfo")}
      />
      <div className="tab-content bg-base-100 border-base-300 p-6">
        <AccountInfo session={session!} />
      </div>

      <input type="radio" name="tabs" className="tab" aria-label={t("myPlan")} />
      <div className="tab-content bg-base-100 border-base-300 p-6">
        <MyPlan />
      </div>

      <input
        type="radio"
        name="tabs"
        className="tab"
        aria-label={t("workoutHistory")}
      />
      <div className="tab-content bg-base-100 border-base-300 p-6">
        <WorkoutHistory session={session!} />
      </div>

      <input type="radio" name="tabs" className="tab" aria-label={t("myTrainer")} />
      <div className="tab-content bg-base-100 border-base-300 p-6">
        <MyTrainerTab />
      </div>

      <input type="radio" name="tabs" className="tab" aria-label={t("billing")} />
      <div className="tab-content bg-base-100 border-base-300 p-6">
        {tProfile("underConstruction")}
      </div>
    </main>
  ) : (
    <div className="flex justify-center items-center h-screen">
      <span className="loading loading-spinner loading-xl"></span>
    </div>
  );
}
