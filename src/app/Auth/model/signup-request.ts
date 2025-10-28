export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  role: string;
  fullName?: string; // Opcional, solo se envía si role === 'EMPLOYEE'
}
