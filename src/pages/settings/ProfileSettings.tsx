import React from 'react';
import UserProfileForm from '../../components/settings/UserProfileForm';

const ProfileSettings: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">Perfil</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Gestiona tu información personal y cómo te ven los demás.</p>
      </div>
      <UserProfileForm />
    </div>
  );
};

export default ProfileSettings;
