"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/eden";
import { useToast } from "@/components/toast-context";

type PendingRequest = {
  _id: string;
  memberId: string;
  trainerId: string;
  startDate: string;
  status: string;
  notes: string | null;
  createdAt: string;
  member: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    memberCode: string | null;
  } | null;
};

export default function TrainerRequestsManager() {
  const toast = useToast();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const normalizeRequest = (raw: any): PendingRequest => {
    const member = raw?.member
      ? {
          id: String(raw.member.id ?? raw.member._id ?? ""),
          name: String(raw.member.name ?? ""),
          email: String(raw.member.email ?? ""),
          image: raw.member.image ?? null,
          memberCode: raw.member.memberCode ?? null,
        }
      : null;

    return {
      _id: String(raw?._id ?? ""),
      memberId: String(raw?.memberId ?? ""),
      trainerId: String(raw?.trainerId ?? ""),
      startDate: String(raw?.startDate ?? ""),
      status: String(raw?.status ?? ""),
      notes: raw?.notes ?? null,
      createdAt: String(raw?.createdAt ?? ""),
      member,
    };
  };

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await api.trainers.requests.pending.get();

      if (response.error) {
        const message =
          typeof response.error.value === "string"
            ? response.error.value
            : (response.error.value as any)?.message;
        console.error("API error fetching requests:", response.error, "Status:", response.status);
        
        // Don't show error toast for "Trainer profile not found" - handle it gracefully
        if (response.status !== 404) {
          toast({ message: message || "Failed to load pending requests", type: "error" });
        }
        setRequests([]);
        return;
      }

      const data = response.data;
      setRequests(Array.isArray(data) ? data.map(normalizeRequest) : []);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      toast({ message: "Failed to load pending requests", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const handleAccept = async (requestId: string) => {
    try {
      setProcessing(requestId);
      const response = await api.trainers.requests({ id: requestId }).accept.post();

      if (response.error) {
        const message =
          typeof response.error.value === "string"
            ? response.error.value
            : (response.error.value as any)?.message;
        toast({ message: message || "Failed to accept request", type: "error" });
        return;
      }

      toast({ message: "Request accepted successfully!", type: "success" });
      // Remove from list
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
    } catch (error) {
      console.error("Error accepting request:", error);
      toast({ message: "Failed to accept request", type: "error" });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string, reason?: string) => {
    try {
      setProcessing(requestId);
      const response = await api.trainers.requests({ id: requestId }).reject.post({
        reason,
      });

      if (response.error) {
        const message =
          typeof response.error.value === "string"
            ? response.error.value
            : (response.error.value as any)?.message;
        toast({ message: message || "Failed to reject request", type: "error" });
        return;
      }

      toast({ message: "Request rejected", type: "success" });
      // Remove from list
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({ message: "Failed to reject request", type: "error" });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-base-200 rounded-lg p-8 text-center">
        <p className="text-base-content/60">No pending requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Pending Client Requests</h2>

      {requests.map((request) => (
        <div
          key={request._id}
          className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="card-body">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {request.member?.image ? (
                  <img
                    src={request.member.image}
                    alt={request.member.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {request.member?.name?.[0]?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-semibold">
                    {request.member?.name || "Unknown Member"}
                  </h3>
                  <p className="text-sm text-base-content/60">
                    {request.member?.email}
                  </p>
                  {request.member?.memberCode && (
                    <p className="text-sm text-base-content/60">
                      Code: {request.member.memberCode}
                    </p>
                  )}
                  <p className="text-xs text-base-content/40 mt-1">
                    Requested on:{" "}
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <span className="badge badge-warning">Pending</span>
            </div>

            {request.notes && (
              <div className="mt-3 p-3 bg-base-200 rounded">
                <p className="text-sm font-medium mb-1">Member's Note:</p>
                <p className="text-sm text-base-content/80">{request.notes}</p>
              </div>
            )}

            <div className="card-actions justify-end mt-4">
              <button
                className="btn btn-error btn-sm"
                onClick={() => handleReject(request._id)}
                disabled={processing === request._id}
              >
                {processing === request._id ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  "Reject"
                )}
              </button>
              <button
                className="btn btn-success btn-sm"
                onClick={() => handleAccept(request._id)}
                disabled={processing === request._id}
              >
                {processing === request._id ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  "Accept"
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
