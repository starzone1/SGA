import React from 'react';

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'sm',
  className = '',
  title = 'Akun Resmi Terverifikasi Redaksi SGA'
}) => {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <span
      role="img"
      title={title}
      aria-label="Akun Terverifikasi"
      className={`inline-flex items-center shrink-0 ${className}`}
    >
      <svg
        className={`${sizeMap[size]} text-blue-500 fill-current drop-shadow-xs`}
        viewBox="0 0 24 24"
      >
        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6c-1.58 0-2.95.875-3.6 2.148-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.475 9.55.6 10.92.6 12.5c0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238 1.05 1.273 2.42 2.148 4 2.148 1.58 0 2.95-.875 3.6-2.148.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-1.05 2.148-2.42 2.148-4zM9.9 17.25l-4.25-4.25 1.41-1.41 2.84 2.83 7.07-7.07 1.41 1.41-8.48 8.49z" />
      </svg>
    </span>
  );
};

// Helper function to check if a user or author is admin/editor/verified
export const SGA_LOGO = 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png';

export const isUserAdminOrVerified = (role?: string, name?: string, isVerified?: boolean): boolean => {
  // If explicitly revoked/false, return false
  if (isVerified === false) return false;
  // If explicitly true, return true
  if (isVerified === true) return true;
  if (!role && !name) return false;

  const r = (role || '').toLowerCase();
  const n = (name || '').toLowerCase();

  // Primary owner/admin or explicit pemred
  if (
    n.includes('admin sga redaksi') ||
    n === 'admin' ||
    r === 'admin' ||
    r.includes('pemred') ||
    r.includes('pemimpin redaksi')
  ) {
    return true;
  }

  return false;
};

export const getAuthorAvatar = (
  rawAvatar?: string | null,
  role?: string,
  name?: string,
  isVerified?: boolean
): string => {
  const n = (name || '').toLowerCase();
  const r = (role || '').toLowerCase();

  if (
    n.includes('admin') ||
    n.includes('sga redaksi') ||
    n.includes('redaksi sga') ||
    r === 'admin' ||
    r.includes('pemred') ||
    r.includes('pemimpin redaksi')
  ) {
    if (!rawAvatar || rawAvatar.includes('unsplash') || rawAvatar.includes('photo-')) {
      return SGA_LOGO;
    }
  }

  return rawAvatar || SGA_LOGO;
};
