import { ObjectId } from "mongodb";

// profile cho coach
export type TrainerProfile = {
    userId: ObjectId;
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

export type TrainerProfileWithId = TrainerProfile & {
    _id: ObjectId;
}

// phan cong coach cho member nao
export type TrainerAssignment = {
    trainerId: ObjectId;
    memberId: ObjectId;
    membershipId: ObjectId;
    packageId: ObjectId;

    startDate: Date;
    endDate: Date | null;
    totalSessions: number;
    completedSessions: number;

    status: "pending" | "active" | "completed" | "cancelled" | "rejected";
    notes : string | null;

    createdAt: Date;
    updatedAt: Date;
}

export type TrainerAssignmentWithId = TrainerAssignment & {
    _id: ObjectId;
}

// data cho 1 session training
export type TrainingSession = {
    assignmentId: ObjectId;
    trainerId: ObjectId;
    memberId: ObjectId;

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

export type TrainingSessionWithId = TrainingSession & {
    _id: ObjectId;
}