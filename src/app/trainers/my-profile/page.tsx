"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/eden";
import TrainerProfileForm from "@/components/trainers/TrainerProfileForm";
import TrainerRequestsManager from "@/components/trainers/TrainerRequestsManager";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MyTrainerProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "requests">("profile");

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["trainer-profile", "me"],
    queryFn: async () => {
      const response = await api.trainers.profile.me.get();
      if (response.error) {
        // If 404, user doesn't have a profile yet
        if (response.status === 404) return null;
        throw new Error(response.error.value as string);
      }
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Trainer Dashboard</h1>
        <p className="text-base-content/70">
          Manage your profile and client requests
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6">
        <a
          className={`tab ${activeTab === "profile" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          My Profile
        </a>
        <a
          className={`tab ${activeTab === "requests" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          Client Requests
        </a>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">
              {profile ? "Edit Trainer Profile" : "Create Trainer Profile"}
            </h2>
            <TrainerProfileForm
              onSuccess={async () => {
                // Refetch profile to enable Requests tab
                await refetch();
                // Switch to Requests tab after profile is saved
                setTimeout(() => {
                  setActiveTab("requests");
                }, 300);
              }}
            />
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <>
          {!profile ? (
            <div className="alert alert-warning">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                ></path>
              </svg>
              <span>Please create your trainer profile first before accepting clients</span>
            </div>
          ) : (
            <TrainerRequestsManager />
          )}
        </>
      )}
    </div>
  );
}
