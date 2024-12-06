'use client'

import { ProfileSection } from './ProfileSection';

export function Navbar() {
  return (
    <nav className="flex justify-between items-center p-4 bg-white">
      <div>Your Logo</div>
      <ProfileSection />
    </nav>
  );
}

