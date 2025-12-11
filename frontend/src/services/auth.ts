// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 登录 POST /auth/login */
export async function login(body: { email: string; password: string }, options?: { [key: string]: any }) {
  return request<any>('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 注册 POST /auth/register */
export async function register(body: { email: string; password: string }, options?: { [key: string]: any }) {
  return request<any>('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 刷新 token POST /auth/refresh */
export async function refresh(body: { refreshToken: string }, options?: { [key: string]: any }) {
  return request<any>('/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取当前用户 GET /users/me */
export async function currentUser(options?: { [key: string]: any }) {
  return request<any>('/users/me', {
    method: 'GET',
    ...(options || {}),
  });
}
