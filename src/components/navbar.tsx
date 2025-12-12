"use client";

import Link from "next/link";
import Logo from "./logo";
import { useEffect, useState } from "react";
import ThemeController from "./theme-controller";
import LanguageController from "./lang-controller";
import {
  ChartPieIcon,
  ChatBubbleLeftRightIcon,
  CubeIcon,
  CurrencyDollarIcon,
  FlagIcon,
  UserGroupIcon,
  UserPlusIcon,
} from "@heroicons/react/24/solid";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/i18n/navigation";
import { HidePageChrome } from "./hide-page-chrome";

export default function Navbar() {
  const routes = [
    ["Dashboard", "/dashboard", ChartPieIcon],
    ["Staff", "/staff", UserGroupIcon],
    ["Packages", "/packages", CubeIcon],
    ["Memberships", "/memberships", UserPlusIcon],
    ["Feedbacks", "/feedbacks", ChatBubbleLeftRightIcon],
    ["Purchases", "/purchases", CurrencyDollarIcon],
    ["Reports", "/reports", FlagIcon],
  ] satisfies [string, string, React.FC][];

  const pathname = usePathname();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const router = useRouter();

  const navItems = routes.map(([name, path, RouteIcon]) => {
    const current = path.split("/")[1] === pathname.split("/")[1];
    return (
      <li key={path}>
        <Link href={path} className="group">
          <div className="flex gap-1 relative">
            <RouteIcon className={`size-6 ${current ? "text-primary" : ""}`} />
            <span className={current ? "text-primary" : ""}>{name}</span>
            <div
              className={`absolute h-0.5 -bottom-1 -left-1 -right-1 ${current ? "bg-primary" : "bg-base-content origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"}`}
            ></div>
          </div>
        </Link>
      </li>
    );
  });

  return (
    <HidePageChrome>
      <header className="navbar">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {" "}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />{" "}
              </svg>
            </div>

            <ul
              tabIndex={-1}
              className="menu menu-lg dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
            >
              {navItems}
            </ul>
          </div>
          <Link href="/" className="btn btn-ghost text-xl">
            <Logo className="text-primary w-[1em] h-[1em]" />
            <i className="italic">
              Gym
              <span className="text-emerald-500/70">Embrace</span>
            </i>
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 text-lg">{navItems}</ul>
        </div>
        <div className="navbar-end flex gap-2">
          <LanguageController />
          <ThemeController />
          {!isSessionPending &&
            (session !== null ? (
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  className={[
                    "btn btn-circle btn-ghost avatar avatar-online",
                    session.user.image === undefined
                      ? "avatar-placeholder"
                      : "",
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
                      <span className="text-xl text-center align-middle">
                        {session.user.name[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  tabIndex={-1}
                  className="menu menu-md dropdown-content bg-base-100 z-1 mt-3 w-64 p-2 shadow rounded-box"
                >
                  <ul className="flex flex-col">
                    <li className="menu-title font-bold text-lg text-center text-base-content">
                      Hi, {session.user.name}
                    </li>
                    <li>
                      <Link
                        className="btn btn-info text-info-content"
                        href="/profile"
                      >
                        View my profile
                      </Link>
                    </li>
                    <div className="h-0.5 bg-base-200 my-2 w-full"></div>
                    <li>
                      <button
                        className="btn btn-error text-error-content"
                        onClick={() => {
                          authClient.signOut();
                          router.push("/");
                        }}
                      >
                        Sign out
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <button
                onClick={() => router.push("/auth/login")}
                className="btn btn-primary"
              >
                Sign in
              </button>
            ))}
        </div>
      </header>
    </HidePageChrome>
  );
}
