import React, { useEffect } from 'react';
import { useModel, history } from '@umijs/max';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initialState, loading } = useModel('@@initialState');

  useEffect(() => {
    // if initialState finished loading and there's no currentUser and no token, redirect
    const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('token') : false;
    if (!initialState?.currentUser && !hasToken && !loading) {
      history.replace('/user/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialState, loading]);

  return <>{children}</>;
};

export default RequireAuth;
