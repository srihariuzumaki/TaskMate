'use client'

import { ProfileSection } from './ProfileSection';
import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="flex justify-between items-center p-4 bg-white">
      <div>Your Logo</div>
      <div className="flex items-center space-x-4">
        <Link 
          href="/contact" 
          className="text-[#1A5F7A] hover:text-[#57A7B3]"
        >
          Contact Admin
        </Link>
        <ProfileSection />
      </div>
    </nav>
  );
}

