export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  roles: string[];
}

export interface UserInfo {
  id: string;
  email: string;
  roles: string[];
  enabled: boolean;
  createdAt: string;
}

export interface ServiceInstance {
  serviceId: string;
  instanceId: string;
  host: string;
  port: number;
  status: string;
}
