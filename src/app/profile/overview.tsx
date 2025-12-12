import { authClient } from "@/lib/auth-client";
import QRCode from "react-qr-code";

function QRCodeSection({
  session,
}: {
  session: typeof authClient.$Infer.Session;
}) {
  // #578 rickroll
  // NOTE: this is only a POC, since the check-in device doesn't really exist
  const url = new URL("https://www.youtube.com/watch?v=Tsk7dbhAQIA");
  url.searchParams.append("userId", session.user.id);

  return (
    <fieldset className="fieldset w-full max-w-lg bg-base-200 border-base-300 rounded-box border p-4 place-items-center">
      <legend className="fieldset-legend">Checkin & Checkout QR Code</legend>

      <div className="p-8 bg-white">
        <QRCode className="" value={url.toString()} />
      </div>

      <p className="text-center">
        Use this QR code to check in at the gym quickly and easily.
      </p>
      <p className="text-center">
        Checking out is optional, but it helps you keep track of gym usage.
      </p>
    </fieldset>
  );
}

function classifyBMI(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function UserStats({ session }: { session: typeof authClient.$Infer.Session }) {
  const month = new Date().getMonth();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const bmi = 13.18;
  return (
    <div className="stats shadow">
      <div className="stat place-items-center">
        <div className="stat-title">This month objective</div>
        <div className="stat-value">
          11/20 <span className="text-xs text-base-content/50">sessions</span>
        </div>
        <div className="stat-desc">
          From {monthNames[month]} 1st to {monthNames[(month + 1) % 12]} 1st
        </div>
      </div>

      <div className="stat place-items-center">
        <div className="stat-title">Current streak</div>
        <div className="stat-value">
          67 <span className="text-xs text-base-content/50">weeks</span>
        </div>
        <div className="stat-desc">meeting weekly goal</div>
      </div>

      <div className="stat place-items-center">
        <div className="stat-title">Body Weight</div>
        <div className="stat-value">
          39<span className="text-xs text-base-content/50">kg</span>
        </div>
        <div className="stat-desc">
          Last updated:{" "}
          {new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
          }).format(new Date())}
        </div>
      </div>

      <div className="stat place-items-center">
        <div className="stat-title">Body Mass Index</div>
        <div className="stat-value">{bmi.toFixed(1)}</div>
        <div className="stat-desc">{classifyBMI(bmi)}</div>
      </div>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatMemberSince(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    day: "numeric",
  })
    .formatToParts(date)
    .map((p) => (p.type === "day" ? ordinal(Number(p.value)) : p.value))
    .join("");
}

export function Overview({
  session,
}: {
  session: typeof authClient.$Infer.Session;
}) {
  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="flex gap-4 items-center">
        <div
          className={[
            "avatar avatar-online",
            session.user.image === undefined ? "avatar-placeholder" : "",
          ].join(" ")}
        >
          <div className="ring-primary ring-offset-base-100 w-8 rounded-full ring-2 ring-offset-2 inline">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt="User avatar"
                className="w-full h-full"
              />
            ) : (
              <div className="font-bold text-xl text-center align-middle w-full">
                {session.user.name[0].toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <h1 className="font-bold text-xl">{session.user.name}</h1>
          <p>Member since {formatMemberSince(session.user.createdAt)}</p>
        </div>
      </div>

      <UserStats session={session} />
      <QRCodeSection session={session} />
    </div>
  );
}
