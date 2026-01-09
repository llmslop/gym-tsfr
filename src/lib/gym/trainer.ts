// profile cho coach
export type TrainerProfile<IdType = string> = {
  userId: IdType;
  specialization: string[];
  bio: string;
  certifications: string[];
  yearsOfExperience: number;
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  maxClients: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TrainerProfileWithId<IdType = string> = TrainerProfile<IdType> & {
  _id: IdType;
}

// phan cong coach cho member nao
export type TrainerAssignment<IdType = string> = {
  trainerId: IdType;
  memberId: IdType;
  membershipId: IdType;
  packageId: IdType;
  startDate: Date;
  endDate: Date | null;
  totalSessions: number;
  completedSessions: number;

  status: "pending" | "active" | "completed" | "cancelled" | "rejected";
  notes: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export type TrainerAssignmentWithId<IdType = string> = TrainerAssignment<IdType> & {
  _id: IdType;
}

// data cho 1 session training
export type TrainingSession<IdType = string> = {
  assignmentId: IdType;
  trainerId: IdType;
  memberId: IdType;

  sessionDate: Date;
  duration: number; // phut
  exercises: {
    name: string;
    sets: number;
    reps: number;
    weight?: number; // kg
    notes?: string | null;
  }[];

  trainerNotes: string | null;
  memberFeedback: string | null;
  memberRating: number | null; // 1-5
  status: "scheduled" | "completed" | "cancelled" | "no-show";

  createdAt: Date;
  updatedAt: Date;
}

export type TrainingSessionWithId<IdType = string> = TrainingSession<IdType> & {
  _id: IdType;
}

export type Payment<IdType = string> = {
  userId: IdType;
  membershipId: IdType;
  packageId: IdType;
  receiptNo: string;
  amount: number;
  method: string;
  paidAt: Date;
};

export type PaymentWithId<IdType = string> = Payment<IdType> & {
  _id: IdType;
};
