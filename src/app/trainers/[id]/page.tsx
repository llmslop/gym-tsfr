"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/eden";
import { useParams } from "next/navigation";
import RequestTrainerForm from "@/components/trainers/RequestTrainerForm";
import { useState } from "react";
import { Link } from "@/i18n/navigation";

export default function TrainerDetailPage() {
  const params = useParams();
  const trainerId = params.id as string;
  const [showRequestForm, setShowRequestForm] = useState(false);

  const { data: trainer, isLoading } = useQuery({
    queryKey: ["trainer", trainerId],
    queryFn: async () => {
      const response = await api.trainers({ id: trainerId }).get();
      if (response.error) throw new Error(response.error.value as unknown as string);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!trainer || 'message' in trainer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <span>{'message' in (trainer || {}) ? (trainer as { message: string }).message : 'Trainer not found'}</span>
        </div>
      </div>
    );
  }

  const availableSlots =
    trainer.maxClients - (trainer.stats?.activeClients || 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link href="/trainers" className="btn btn-ghost mb-4">
        ← Back to Trainers
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-start gap-6">
                <div className="avatar">
                  <div className="w-32 rounded-full">
                    {trainer.user?.image ? (
                      <img src={trainer.user.image} alt={trainer.user.name} />
                    ) : (
                      <div className="bg-neutral text-neutral-content flex items-center justify-center w-full h-full">
                        <span className="text-4xl">
                          {trainer.user?.name?.charAt(0) || "T"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl font-bold">
                    {trainer.user?.name || "Trainer"}
                  </h1>
                  <p className="text-lg text-base-content/70 mt-1">
                    {trainer.yearsOfExperience} years of experience
                  </p>

                  {/* Status */}
                  <div className="mt-4">
                    {trainer.isActive ? (
                      <div className="badge badge-success badge-lg">
                        Active - Accepting Clients
                      </div>
                    ) : (
                      <div className="badge badge-ghost badge-lg">
                        Not Currently Accepting Clients
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">About</h2>
              <p className="text-base-content/80">{trainer.bio}</p>
            </div>
          </div>

          {/* Specializations */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Specializations</h2>
              <div className="flex flex-wrap gap-2">
                {trainer.specialization.map((spec: string) => (
                  <div key={spec} className="badge badge-primary badge-lg">
                    {spec}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Certifications */}
          {trainer.certifications.length > 0 && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Certifications</h2>
                <ul className="space-y-2">
                  {trainer.certifications.map((cert: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-success"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {cert}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Availability */}
          {trainer.availability.length > 0 && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Availability</h2>
                <div className="space-y-2">
                  {trainer.availability.map((slot: { dayOfWeek: number; startTime: string; endTime: string }, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 bg-base-200 rounded"
                    >
                      <span className="font-semibold">
                        {
                          [
                            "Sunday",
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                          ][slot.dayOfWeek]
                        }
                      </span>
                      <span>
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Statistics</h2>
              <div className="stats stats-vertical shadow">
                <div className="stat">
                  <div className="stat-title">Active Clients</div>
                  <div className="stat-value text-primary">
                    {trainer.stats?.activeClients || 0}
                  </div>
                  <div className="stat-desc">
                    {availableSlots} slots available
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-title">Completed Sessions</div>
                  <div className="stat-value text-secondary">
                    {trainer.stats?.completedAssignments || 0}
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-title">Total Assignments</div>
                  <div className="stat-value">
                    {trainer.stats?.totalAssignments || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Request Button */}
          {trainer.isActive && availableSlots > 0 && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                {!showRequestForm ? (
                  <button
                    onClick={() => setShowRequestForm(true)}
                    className="btn btn-primary btn-block"
                  >
                    Request This Trainer
                  </button>
                ) : (
                  <RequestTrainerForm
                    trainerId={trainerId}
                    trainerName={trainer.user?.name || "Trainer"}
                    onSuccess={() => {
                      setShowRequestForm(false);
                      window.location.href = "/profile?tab=my-trainer";
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
