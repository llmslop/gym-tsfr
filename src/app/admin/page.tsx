"use client";

import { api } from "@/lib/eden";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/components/toast-context";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/i18n/navigation";

type User = {
  _id: string;
  name: string;
  email: string;
  role?: string;
  createdAt: Date;
};

type StaffProfile = {
  _id: string;
  userId: string;
  role: string;
  position?: string;
  department?: string;
  status: string;
  user: User;
};

export default function AdminPage() {
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<"users" | "staff" | "attendance">("users");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffFormData, setStaffFormData] = useState({
    userId: "",
    role: "staff" as "staff" | "coach",
    position: "",
    department: "",
    hireDate: new Date().toISOString().split("T")[0],
    salary: "",
    notes: "",
  });

  // Check admin
  if (!isSessionPending && session?.user?.role !== "admin") {
    router.push("/dashboard");
    return null;
  }

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json() as Promise<User[]>;
    },
    enabled: session?.user?.role === "admin" && activeTab === "users",
  });

  // Fetch staff
  const { data: staff, isLoading: staffLoading } = useQuery({
    queryKey: ["admin", "staff"],
    queryFn: async () => {
      const res = await api.staff.get();
      if (res.error) throw new Error(res.error.value as string);
      return res.data as StaffProfile[];
    },
    enabled: session?.user?.role === "admin" && activeTab === "staff",
  });

  // Fetch attendance
  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ["admin", "attendance"],
    queryFn: async () => {
      const res = await api.staff.attendance.all.get();
      if (res.error) throw new Error(res.error.value as unknown as string);
      return res.data as any[];
    },
    enabled: session?.user?.role === "admin" && activeTab === "attendance",
  });

  // Create staff mutation
  const createStaffMutation = useMutation({
    mutationFn: async (data: typeof staffFormData) => {
      const res = await api.staff.post({
        userId: data.userId,
        role: data.role,
        position: data.position || undefined,
        department: data.department || undefined,
        hireDate: data.hireDate,
        salary: data.salary ? parseFloat(data.salary) : undefined,
        notes: data.notes || undefined,
      });
      if (res.error) throw new Error(res.error.value as unknown as string);
      return res.data;
    },
    onSuccess: () => {
      toast({ type: "success", message: "Staff created successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setShowStaffForm(false);
      setStaffFormData({
        userId: "",
        role: "staff",
        position: "",
        department: "",
        hireDate: new Date().toISOString().split("T")[0],
        salary: "",
        notes: "",
      });
    },
    onError: (error: any) => {
      toast({ type: "error", message: error.message });
    },
  });

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    createStaffMutation.mutate(staffFormData);
  };

  // Filter users without staff profiles for dropdown
  const availableUsers = users?.filter(
    (user) => !staff?.some((s) => s.userId === user._id) && user.role === "user"
  );

  if (isSessionPending) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6">
        <button
          className={`tab ${activeTab === "users" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
        <button
          className={`tab ${activeTab === "staff" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("staff")}
        >
          Staff
        </button>
        <button
          className={`tab ${activeTab === "attendance" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("attendance")}
        >
          Attendance
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div>
          <h2 className="text-2xl font-bold mb-4">All Users</h2>
          
          {usersLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${
                          user.role === "admin" ? "badge-error" :
                          user.role === "coach" ? "badge-primary" :
                          user.role === "staff" ? "badge-info" :
                          "badge-ghost"
                        }`}>
                          {user.role || "user"}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Staff Tab */}
      {activeTab === "staff" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Staff Members</h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowStaffForm(true)}
            >
              + Add Staff
            </button>
          </div>

          {staffLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Position</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staff?.map((s) => (
                    <tr key={s._id}>
                      <td>{s.user.name}</td>
                      <td>
                        <span className={`badge ${
                          s.role === "coach" ? "badge-primary" : "badge-info"
                        }`}>
                          {s.role}
                        </span>
                      </td>
                      <td>{s.position || "-"}</td>
                      <td>{s.department || "-"}</td>
                      <td>
                        <span className={`badge ${
                          s.status === "active" ? "badge-success" :
                          s.status === "on-leave" ? "badge-warning" :
                          "badge-ghost"
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Attendance Records</h2>
          
          {attendanceLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance?.map((a: any) => (
                    <tr key={a._id}>
                      <td>{a.user?.name}</td>
                      <td>{new Date(a.checkInTime).toLocaleString()}</td>
                      <td>
                        {a.checkOutTime 
                          ? new Date(a.checkOutTime).toLocaleString()
                          : "-"}
                      </td>
                      <td>{a.totalHours?.toFixed(2) || "-"}</td>
                      <td>
                        <span className={`badge ${
                          a.status === "present" ? "badge-success" : "badge-ghost"
                        }`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Staff Modal */}
      {showStaffForm && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Add New Staff</h3>
            
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Select User</span>
                </label>
                <select
                  className="select select-bordered"
                  value={staffFormData.userId}
                  onChange={(e) => setStaffFormData({ ...staffFormData, userId: e.target.value })}
                  required
                >
                  <option value="">Choose a user</option>
                  {availableUsers?.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Role</span>
                </label>
                <select
                  className="select select-bordered"
                  value={staffFormData.role}
                  onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value as "staff" | "coach" })}
                  required
                >
                  <option value="staff">Staff</option>
                  <option value="coach">Coach</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Position</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="e.g., Front Desk"
                    value={staffFormData.position}
                    onChange={(e) => setStaffFormData({ ...staffFormData, position: e.target.value })}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Department</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="e.g., Operations"
                    value={staffFormData.department}
                    onChange={(e) => setStaffFormData({ ...staffFormData, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Hire Date</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={staffFormData.hireDate}
                    onChange={(e) => setStaffFormData({ ...staffFormData, hireDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Salary (Optional)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    placeholder="0"
                    value={staffFormData.salary}
                    onChange={(e) => setStaffFormData({ ...staffFormData, salary: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Notes</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  placeholder="Additional information..."
                  value={staffFormData.notes}
                  onChange={(e) => setStaffFormData({ ...staffFormData, notes: e.target.value })}
                />
              </div>

              <div className="modal-action">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createStaffMutation.isPending}
                >
                  {createStaffMutation.isPending ? "Creating..." : "Create Staff"}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowStaffForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowStaffForm(false)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}
