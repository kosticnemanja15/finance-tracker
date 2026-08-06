// Centralni tipovi. User ogledalo backend DTO-a (bez password_hash).
export interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
}