import React from 'react';
import LoginPage from './LoginPage';

const ForgotPasswordPage: React.FC = () => {
  return <LoginPage initialStep="FORGOT_PASSWORD" />;
};

export default ForgotPasswordPage;
