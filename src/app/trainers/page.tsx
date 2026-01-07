"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/eden";
import TrainerCard from "@/components/trainers/TrainerCard";
import { useState } from "react";

const SPECIALIZATIONS = [
  "Weight Loss",
  "Muscle Building",
  "Athletic Performance",
  "Rehabilitation",
  "Yoga",
  "Cardio",
  "Strength Training",
  "Nutrition",
  "CrossFit",
  "Powerlifting",
];

export default function TrainersPage() {
  const [filter, setFilter] = useState<string>("");

  const { data: trainers, isLoading } = useQuery({
    queryKey: ["trainers", filter],
    queryFn: async () => {
      const response = await api.trainers.get({
        query: filter ? { specialization: filter } : {},
      });
      if (response.error) throw new Error(response.error.value as unknown as string);
      return response.data;
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Personal Trainers</h1>
        <p className="text-base-content/70">
          Find the perfect trainer to help you reach your fitness goals
        </p>
      </div>

      {/* Filter */}
      <div className="mb-8">
        <label className="label">
          <span className="label-text">Filter by Specialization</span>
        </label>
        <select
          className="select select-bordered w-full max-w-xs"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All Trainers</option>
          {SPECIALIZATIONS.map((spec) => (
            <option key={spec} value={spec}>
              {spec}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      {/* Trainers Grid */}
      {trainers && trainers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((trainer: any) => (
            <TrainerCard key={trainer._id} trainer={trainer} />
          ))}
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-12">
            <p className="text-base-content/70">
              No trainers found matching your criteria
            </p>
          </div>
        )
      )}
    </div>
  );
}
