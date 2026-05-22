import React, { createContext, useState, useContext, useEffect } from 'react';

const UserRoleContext = createContext(null);

export const UserRoleProvider = ({ children }) => {
  const [role, setRoleState] = useState(() => {
    return localStorage.getItem('orion_user_role') || 'buyer';
  });

  const setRole = (newRole) => {
    if (['buyer', 'seller', 'both'].includes(newRole)) {
      setRoleState(newRole);
      localStorage.setItem('orion_user_role', newRole);
    }
  };

  const isBuyer = role === 'buyer' || role === 'both';
  const isSeller = role === 'seller' || role === 'both';
  const isBoth = role === 'both';

  return (
    <UserRoleContext.Provider value={{ role, setRole, isBuyer, isSeller, isBoth }}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};
