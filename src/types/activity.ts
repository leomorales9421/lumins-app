export type ActivityType = 'COMMENT' | 'SYSTEM_EVENT';

export type ActivityItem = {
  id: string;
  type: ActivityType;
  user: {
    id: string; // ID del usuario que realizó la acción
    name: string;
    avatarUrl?: string;
    initials: string;
  };
  content?: string; // Solo para comentarios
  action?: string; // Ej: "ha movido esta tarjeta a En proceso" (Solo para eventos)
  createdAt: string | Date;
}
