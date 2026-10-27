import React from 'react';

import AuthForm from './AuthForm';

export default function LogIn({ onLogIn }) {
  return (
    <AuthForm
      endpoint="/login"
      onSuccess={(data) => onLogIn(data.username)}
      title="Log In"
    />
  );
}
