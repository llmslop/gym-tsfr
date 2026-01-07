import { ObjectId } from "mongodb";

export type StaffRole = "staff" | "coach";

export type StaffProfile = {
  userId: ObjectId;
  role: StaffRole;
  
  // Basic info
  position?: string; // "Front Desk", "Manager", "Maintenance"
  department?: string; // "Operations", "Sales", "Training"
  
  // Employment details
  hireDate: Date;
  salary?: number;
  status: "active" | "on-leave" | "terminated";
  
  // Schedule
  schedule: {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string; // "09:00"
    endTime: string; // "17:00"
  }[];
  
  // Performance tracking
  performanceRating?: number; // 1-5
  lastEvaluationDate?: Date;
  
  // Additional info
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
};

export type StaffProfileWithId = StaffProfile & { _id: ObjectId };

// Staff evaluation/feedback
export type StaffEvaluation = {
  staffId: ObjectId;
  evaluatorId: ObjectId; // Admin/Manager who evaluated
  
  rating: number; // 1-5
  strengths: string;
  areasForImprovement: string;
  goals: string;
  
  evaluationDate: Date;
  nextEvaluationDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
};

export type StaffEvaluationWithId = StaffEvaluation & { _id: ObjectId };

// Staff attendance/time tracking
export type StaffAttendance = {
  staffId: ObjectId;
  checkInTime: Date;
  checkOutTime?: Date;
  totalHours?: number;
  status: "present" | "late" | "absent" | "on-leave";
  notes?: string;
  
  createdAt: Date;
};

export type StaffAttendanceWithId = StaffAttendance & { _id: ObjectId };
