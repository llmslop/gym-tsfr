"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/eden";
import { useToast } from "@/components/toast-context";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type TrainerUser = {
  _id: string;
  name: string;
  email: string;
  image?: string;
};

type TrainerProfile = {
  _id: string;
  userId: string;
  specialization: string[];
  bio?: string;
  yearsOfExperience: number;
  user?: TrainerUser;
};

type Package = {
  _id: string;
  name: string;
};

type TrainerAssignment = {
  _id: string;
  trainerId: string;
  memberId: string;
  membershipId: string;
  packageId: string;
  startDate: string;
  endDate: string | null;
  totalSessions: number;
  completedSessions: number;
  status: "pending" | "active" | "completed" | "cancelled" | "rejected";
  notes: string | null;
  trainer?: TrainerProfile;
  package?: Package;
};

type TrainingSession = {
  _id: string;
  assignmentId: string;
  trainerId: string;
  memberId: string;
  sessionDate: string;
  duration: number;
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  memberRating: number | null;
  memberFeedback: string | null;
};

export default function MyTrainerTab() {
  const toast = useToast();
  const t = useTranslations("Profile.myTrainer");
  
  const { data: assignment, isLoading, refetch } = useQuery<TrainerAssignment | null>({
    queryKey: ["my-trainer-assignment"],
    queryFn: async () => {
      const response = await api.trainers["my-assignment"].get();
      if (response.error) throw new Error(response.error.value as string);
      return response.data as TrainerAssignment | null;
    },
  });

  const { data: sessions } = useQuery<TrainingSession[]>({
    queryKey: ["my-training-sessions"],
    queryFn: async () => {
      const response = await api.trainers.sessions.my.get();
      if (response.error) throw new Error(response.error.value as string);
      return (response.data || []) as unknown as TrainingSession[];
    },
    enabled: !!assignment,
  });

  const cancelMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await api.trainers.assignments({ id: assignmentId }).delete();
      if (response.error) throw new Error(response.error.value as unknown as string);
      return response.data;
    },
    onSuccess: () => {
      toast({ message: "Trainer assignment cancelled", type: "success" });
      refetch();
    },
    onError: (error: Error) => {
      toast({ message: error.message, type: "error" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="space-y-6">
        <div className="alert alert-info">
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>You don't have an assigned trainer yet</span>
        </div>

        <Link href="/trainers" className="btn btn-primary">
          Find a Trainer
        </Link>
      </div>
    );
  }

  // Show pending status
  if (assignment.status === "pending") {
    return (
      <div className="space-y-6">
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
          <div>
            <h3 className="font-bold">Trainer Request Pending</h3>
            <div className="text-sm">
              Your trainer request has been sent. Waiting for trainer approval.
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Requested Trainer</h2>
            {assignment.trainer && (
              <div className="flex items-center gap-4 mt-4">
                <div className="avatar">
                  <div className="w-16 rounded-full">
                    {assignment.trainer.user?.image ? (
                      <img 
                        src={assignment.trainer.user.image} 
                        alt={assignment.trainer.user.name || t("trainer")} 
                      />
                    ) : (
                      <div className="bg-neutral text-neutral-content flex items-center justify-center w-full h-full">
                        <span className="text-xl">
                          {assignment.trainer.user?.name?.charAt(0) || "T"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-semibold">{assignment.trainer.user?.name}</p>
                  <p className="text-sm text-base-content/60">
                    {assignment.trainer.specialization.join(", ")}
                  </p>
                </div>
              </div>
            )}
            {assignment.notes && (
              <div className="mt-4 p-3 bg-base-200 rounded">
                <p className="text-sm font-medium">Your Note:</p>
                <p className="text-sm text-base-content/70 mt-1">{assignment.notes}</p>
              </div>
            )}
            <p className="text-sm text-base-content/60 mt-2">
              Requested on: {new Date(assignment.startDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show rejected status
  if (assignment.status === "rejected") {
    return (
      <div className="space-y-6">
        <div className="alert alert-error">
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
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <div>
            <h3 className="font-bold">Request Declined</h3>
            <div className="text-sm">
              Your trainer request was declined. You can request another trainer.
            </div>
          </div>
        </div>

        <Link href="/trainers" className="btn btn-primary">
          Find Another Trainer
        </Link>
      </div>
    );
  }

  const trainer = assignment.trainer;
  const progressPercent = assignment.totalSessions > 0
    ? (assignment.completedSessions / assignment.totalSessions) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Trainer Info */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Your Personal Trainer</h2>

          <div className="flex items-start gap-4 mt-4">
            <div className="avatar">
              <div className="w-20 rounded-full">
                {trainer?.user?.image ? (
                  <img src={trainer.user.image} alt={trainer.user.name || t("trainer")} />
                ) : (
                  <div className="bg-neutral text-neutral-content flex items-center justify-center w-full h-full">
                    <span className="text-2xl">
                      {trainer?.user?.name?.charAt(0) || "T"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-bold">
                {trainer?.user?.name || t("trainer")}
              </h3>
              <p className="text-sm text-base-content/70">
                {trainer?.yearsOfExperience || 0} years experience
              </p>

              {/* Specializations */}
              {trainer?.specialization && trainer.specialization.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {trainer.specialization.map((spec: string) => (
                    <span key={spec} className="badge badge-primary badge-sm">
                      {spec}
                    </span>
                  ))}
                </div>
              )}

              {/* Bio */}
              {trainer?.bio && (
                <p className="text-sm mt-3 text-base-content/80">
                  {trainer.bio}
                </p>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">Session Progress</span>
              <span className="text-sm">
                {assignment.completedSessions} / {assignment.totalSessions}
              </span>
            </div>
            <progress
              className="progress progress-primary"
              value={assignment.completedSessions}
              max={assignment.totalSessions}
            ></progress>
            <p className="text-xs text-base-content/70 mt-1">
              {progressPercent.toFixed(0)}% completed
            </p>
          </div>

          {/* Package Info */}
          {assignment.package && (
            <div className="mt-4 p-4 bg-base-200 rounded">
              <p className="text-sm">
                <strong>Package:</strong> {assignment.package.name}
              </p>
              <p className="text-xs text-base-content/70 mt-1">
                Started: {new Date(assignment.startDate).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Notes */}
          {assignment.notes && (
            <div className="mt-4">
              <p className="text-sm font-semibold">Your Goals:</p>
              <p className="text-sm text-base-content/80">{assignment.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="card-actions justify-end mt-4">
            <button
              onClick={() => {
                if (confirm(t("cancelConfirm"))) {
                  cancelMutation.mutate(assignment._id);
                }
              }}
              className="btn btn-error btn-sm"
              disabled={cancelMutation.isPending}
            >
              Cancel Assignment
            </button>
          </div>
        </div>
      </div>

      {/* Training Sessions */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Training Sessions</h2>

          {sessions && sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session._id}>
                      <td>
                        {new Date(session.sessionDate).toLocaleDateString()}
                      </td>
                      <td>{session.duration} min</td>
                      <td>
                        <div
                          className={`badge ${
                            session.status === "completed"
                              ? "badge-success"
                              : session.status === "scheduled"
                              ? "badge-info"
                              : "badge-ghost"
                          }`}
                        >
                          {session.status}
                        </div>
                      </td>
                      <td>
                        {session.memberRating ? (
                          <div className="rating rating-sm">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <input
                                key={star}
                                type="radio"
                                className="mask mask-star-2 bg-orange-400"
                                checked={star === session.memberRating}
                                readOnly
                              />
                            ))}
                          </div>
                        ) : session.status === "completed" ? (
                          <span className="text-xs text-base-content/50">
                            Not rated
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-base-content/70">
              No training sessions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}