export type Role = "ADMIN" | "RECEPCIONISTA" | "VENDEDOR";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type LoginResponse = {
  token: string;
  user: CurrentUser;
};
