import React, { memo } from 'react';
import { DoctorProfile } from './DoctorProfile';
import { OperatingHours } from './OperatingHours';

interface DoctorShowcaseProps {
  onBookClick: () => void;
  isAdminUnlocked?: boolean;
  onAdminToggle?: () => void;
}

export const DoctorShowcase: React.FC<DoctorShowcaseProps> = memo(({
  onBookClick,
  isAdminUnlocked,
  onAdminToggle
}) => {
  return (
    <div className="space-y-8">
      {/* Operating Hours Box */}
      <OperatingHours onBookClick={onBookClick} />

      {/* Main Doctor Profile & Treatment Showcase */}
      <DoctorProfile
        onBookClick={onBookClick}
        isAdminUnlocked={isAdminUnlocked}
        onAdminToggle={onAdminToggle}
      />
    </div>
  );
});
