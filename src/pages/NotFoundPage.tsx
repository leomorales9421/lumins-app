import React from 'react';
import ErrorView from '../components/ui/ErrorView';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAFA] dark:bg-[#14171C]">
      <ErrorView code="404" />
    </div>
  );
};

export default NotFoundPage;
