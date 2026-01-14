"use client";

import Link from "next/link";
import { TrainerProfileWithId } from "@/lib/gym/trainer";
import { useTranslations } from "next-intl";

type TrainerWithUser = TrainerProfileWithId & {
  user?: {
    name: string;
    email: string;
    image?: string;
  };
  stats?: {
    activeClients: number;
    completedAssignments: number;
    totalAssignments: number;
  };
};

export default function TrainerCard({ trainer }: { trainer: TrainerWithUser }) {
  const t = useTranslations("Trainers.trainerCard");
  const availableSlots = trainer.maxClients - (trainer.stats?.activeClients || 0);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="avatar">
            <div className="w-20 rounded-full">
              {trainer.user?.image ? (
                <img src={trainer.user.image} alt={trainer.user.name} />
              ) : (
                <div className="bg-neutral text-neutral-content flex items-center justify-center w-full h-full">
                  <span className="text-2xl">
                    {trainer.user?.name?.charAt(0) || "T"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <h2 className="card-title">{trainer.user?.name || t("trainer")}</h2>
            <p className="text-sm text-base-content/70">
              {trainer.yearsOfExperience} years experience
            </p>

            {/* Specializations */}
            <div className="flex flex-wrap gap-1 mt-2">
              {trainer.specialization.slice(0, 3).map((spec) => (
                <span key={spec} className="badge badge-primary badge-sm">
                  {spec}
                </span>
              ))}
              {trainer.specialization.length > 3 && (
                <span className="badge badge-ghost badge-sm">
                  +{trainer.specialization.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="text-right">
            {trainer.isActive ? (
              <div className="badge badge-success">Active</div>
            ) : (
              <div className="badge badge-ghost">Inactive</div>
            )}
            <p className="text-xs mt-1 text-base-content/70">
              {availableSlots > 0
                ? `${availableSlots} slots available`
                : "Fully booked"}
            </p>
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm mt-4 line-clamp-3">{trainer.bio}</p>

        {/* Stats */}
        {trainer.stats && (
          <div className="stats stats-vertical lg:stats-horizontal shadow mt-4">
            <div className="stat">
              <div className="stat-title text-xs">Active Clients</div>
              <div className="stat-value text-2xl">
                {trainer.stats.activeClients}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title text-xs">Completed</div>
              <div className="stat-value text-2xl">
                {trainer.stats.completedAssignments}
              </div>
            </div>
          </div>
        )}

        {/* Certifications */}
        {trainer.certifications.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Certifications</h3>
            <ul className="text-xs space-y-1">
              {trainer.certifications.slice(0, 3).map((cert, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-success"
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
        )}

        {/* Actions */}
        <div className="card-actions justify-end mt-4">
          <Link
            href={`/trainers/${trainer._id.toString()}`}
            className="btn btn-primary btn-sm"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
