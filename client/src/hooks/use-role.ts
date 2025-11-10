import { useState, useEffect } from 'react';

export type UserRole = 'client' | 'trainer' | null;

export function useRole() {
  const [role, setRoleState] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      return (sessionStorage.getItem('userRole') as UserRole) || null;
    }
    return null;
  });

  const setRole = (newRole: UserRole) => {
    if (newRole) {
      sessionStorage.setItem('userRole', newRole);
    } else {
      sessionStorage.removeItem('userRole');
    }
    setRoleState(newRole);
  };

  const isTrainer = role === 'trainer';
  const isClient = role === 'client';

  return {
    role,
    setRole,
    isTrainer,
    isClient
  };
}
