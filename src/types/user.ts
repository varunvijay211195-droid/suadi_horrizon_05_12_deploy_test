export interface User {
    id: string;
    _id?: string; // Keep for backward compatibility during migration
    email: string;
    name?: string;
    role: string;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    isActive?: boolean;
    avatar?: string;
    phone?: string;
}
