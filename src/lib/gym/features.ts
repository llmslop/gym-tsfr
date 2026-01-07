// Danh sách tất cả features có sẵn cho packages
export const availableFeatures = [
  "access_all_facilities",
  "basic_equipment",
  "all_equipment",
  "locker_room",
  "shower_facilities",
  "one_free_personal_training",
  "three_free_personal_training",
  "unlimited_personal_training",
  "discount_10_percent",
  "discount_15_percent",
  "discount_20_percent",
  "nutrition_consultation",
  "priority_booking",
  "free_guest_passes",
  "massage_therapy",
  "exclusive_events",
] as const;

export type PackageFeature = (typeof availableFeatures)[number];

// Helper để check xem feature có valid không
export function isValidFeature(feature: string): feature is PackageFeature {
  return availableFeatures.includes(feature as PackageFeature);
}

// Nhóm features theo category để hiển thị cho dễ nhìn
export const featureCategories = {
  access: [
    "access_all_facilities",
    "basic_equipment",
    "all_equipment",
  ],
  facilities: [
    "locker_room",
    "shower_facilities",
  ],
  training: [
    "one_free_personal_training",
    "three_free_personal_training",
    "unlimited_personal_training",
  ],
  benefits: [
    "discount_10_percent",
    "discount_15_percent",
    "discount_20_percent",
    "nutrition_consultation",
    "priority_booking",
    "free_guest_passes",
    "massage_therapy",
    "exclusive_events",
  ],
} as const;

export type FeatureCategory = keyof typeof featureCategories;
