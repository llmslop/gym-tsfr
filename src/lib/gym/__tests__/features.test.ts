import { describe, it, expect } from 'vitest';
import { isValidFeature, availableFeatures, featureCategories } from '../features';

describe('features', () => {
  describe('isValidFeature', () => {
    it('should return true for valid features', () => {
      expect(isValidFeature('access_all_facilities')).toBe(true);
      expect(isValidFeature('basic_equipment')).toBe(true);
      expect(isValidFeature('locker_room')).toBe(true);
      expect(isValidFeature('discount_10_percent')).toBe(true);
    });

    it('should return false for invalid features', () => {
      expect(isValidFeature('invalid_feature')).toBe(false);
      expect(isValidFeature('')).toBe(false);
      expect(isValidFeature('ACCESS_ALL_FACILITIES')).toBe(false);
    });
  });

  describe('availableFeatures', () => {
    it('should contain expected features', () => {
      expect(availableFeatures).toContain('access_all_facilities');
      expect(availableFeatures).toContain('basic_equipment');
      expect(availableFeatures).toContain('all_equipment');
      expect(availableFeatures).toContain('locker_room');
    });

    it('should have correct length', () => {
      expect(availableFeatures.length).toBe(16);
    });
  });

  describe('featureCategories', () => {
    it('should have all expected categories', () => {
      expect(featureCategories).toHaveProperty('access');
      expect(featureCategories).toHaveProperty('facilities');
      expect(featureCategories).toHaveProperty('training');
      expect(featureCategories).toHaveProperty('benefits');
    });

    it('should have correct features in access category', () => {
      expect(featureCategories.access).toEqual([
        'access_all_facilities',
        'basic_equipment',
        'all_equipment',
      ]);
    });

    it('should have correct features in facilities category', () => {
      expect(featureCategories.facilities).toEqual([
        'locker_room',
        'shower_facilities',
      ]);
    });

    it('should have correct features in training category', () => {
      expect(featureCategories.training).toEqual([
        'one_free_personal_training',
        'three_free_personal_training',
        'unlimited_personal_training',
      ]);
    });
  });
});
