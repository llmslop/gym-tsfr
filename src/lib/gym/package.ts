// Note: keep this as a small enum to keep admin UX simple.
// Extra package types are represented as additional duration keys.
export const packageDurations = [
  "1-month",
  "3-months",
  "6-months",
  "1-year",
  "per-session-10",
  "vip-1-month",
  "pt-10-sessions",
] as const;
export type PackageDuration = (typeof packageDurations)[number];

export type Package = {
  packageId: string;
  duration: PackageDuration;
  price: number;
  currency: string;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PackageWithId<IdType = string> = Package & { _id: IdType };

export const defaultPackages: Omit<Package, "packageId" | "createdAt" | "updatedAt">[] = [
  {
    duration: "per-session-10",
    price: 350000,
    currency: "VND",
    isActive: true,
    features: [
      "access_all_facilities",
      "basic_equipment",
      "locker_room",
      "shower_facilities",
    ],
  },
  {
    duration: "vip-1-month",
    price: 900000,
    currency: "VND",
    isActive: true,
    features: [
      "access_all_facilities",
      "all_equipment",
      "locker_room",
      "shower_facilities",
      "priority_booking",
      "massage_therapy",
      "exclusive_events",
    ],
  },
  {
    duration: "pt-10-sessions",
    price: 2000000,
    currency: "VND",
    isActive: true,
    features: [
      "one_free_personal_training",
      "nutrition_consultation",
      "priority_booking",
    ],
  },
  {
    duration: "1-month",
    price: 500000,
    currency: "VND",
    isActive: true,
    features: [
      "access_all_facilities",
      "basic_equipment",
      "locker_room",
      "shower_facilities",
    ],
  },
  {
    duration: "3-months",
    price: 1350000,
    currency: "VND",
    isActive: true,
    features: [
      "access_all_facilities",
      "basic_equipment",
      "locker_room",
      "shower_facilities",
      "one_free_personal_training",
      "discount_10_percent",
    ],
  },
  {
    duration: "6-months",
    price: 2500000,
    currency: "VND",
    isActive: true,
    features: [
      "access_all_facilities",
      "all_equipment",
      "locker_room",
      "shower_facilities",
      "three_free_personal_training",
      "discount_15_percent",
      "nutrition_consultation",
      "priority_booking",
    ],
  },
  {
    duration: "1-year",
    price: 4500000,
    currency: "VND",
    isActive: true,
    features: [
      "access_all_facilities",
      "all_equipment",
      "locker_room",
      "shower_facilities",
      "unlimited_personal_training",
      "discount_20_percent",
      "nutrition_consultation",
      "priority_booking",
      "free_guest_passes",
      "massage_therapy",
      "exclusive_events",
    ],
  },
];