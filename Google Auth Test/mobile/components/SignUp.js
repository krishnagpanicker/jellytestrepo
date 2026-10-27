import React from 'react';

import AuthForm from './AuthForm';

export default function SignUp() {
  return (
    <AuthForm
      endpoint="/signup"
      onSuccess={(data) => console.log('User created:', data)}
      title="Sign Up"
    />
  );
}
