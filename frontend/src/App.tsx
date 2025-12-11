import { LinkOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import React from 'react';
import AuthProvider from '@/components/AuthProvider';
import { refresh as apiRefresh } from '@/services/auth';
import { request as umiRequest } from '@umijs/max';
import { refreshWith } from '@/utils/tokenRefresh';
import {
  AvatarDropdown,
  AvatarName,
  Footer,
  Question,
  SelectLang,
} from '@/components';
import { currentUser as queryCurrentUser } from '@/services/auth';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import '@ant-design/v5-patch-for-react-19';

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/user/login';

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser({
        skipErrorHandler: true,
      });
      return msg.data;
    } catch (_error) {
      history.push(loginPath);
    }
    return undefined;
  };
  // 如果不是登录页面，执行
  const { location } = history;
  if (
    ![loginPath, '/user/register', '/user/register-result'].includes(
      location.pathname,
    )
  ) {
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  return {
    actionsRender: () => [
      <Question key="doc" />,
      <SelectLang key="SelectLang" />,
    ],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    bgLayoutImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    links: isDev
      ? [
          <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
            <LinkOutlined />
            <span>OpenAPI 文档</span>
          </Link>,
        ]
      : [],
    menuHeaderRender: undefined,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <AuthProvider>
          {children}
          {isDev && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </AuthProvider>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  // leave baseURL empty so requests are relative to the site origin (proxied by nginx to gateway)
  baseURL: '',
  // attach Authorization header when token exists in localStorage
  requestInterceptors: [
    (url, options) => {
      try {
        const token = localStorage.getItem('token');
        // debug: log token presence for diagnosing 401s (will be stripped in production)
        // eslint-disable-next-line no-console
        console.debug('[requestInterceptor] token present?', !!token, 'url=', url);
        if (token) {
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${token}`,
          } as any;
        }
      } catch (e) {
        // ignore
      }
      return {
        url,
        options,
      };
    },
  ],
  // basic 401 handling: redirect to login when unauthorized
  responseInterceptors: [
    // Advanced 401 handler: try refresh token once and retry original request.
    async (response: any, options: any) => {
      try {
        if (!response) return response;
        if (response.status !== 401) return response;

        const refreshToken = (() => {
          try {
            return localStorage.getItem('refreshToken');
          } catch (e) {
            return null;
          }
        })();

        if (!refreshToken) {
          try {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
          } catch (e) {}
          window.location.href = '/user/login';
          return response;
        }

        // Use centralized single-flight refresh helper
        try {
          const data = await refreshWith(refreshToken as string);
          if (!data || !data.accessToken) {
            try {
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
            } catch (e) {}
            window.location.href = '/user/login';
            return response;
          }

          // store tokens if provided
          try {
            localStorage.setItem('token', data.accessToken as string);
            if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          } catch (e) {}

          // retry original request with new token
          try {
            const url = (options && (options as any).url) || (response && (response as any).url) || '';
            const reqOptions = { ...(options || {}), headers: { ...((options as any)?.headers || {}), Authorization: `Bearer ${data.accessToken}` } };
            const retryRes = await umiRequest(url, reqOptions as any);
            return retryRes as any;
          } catch (e) {
            try {
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
            } catch (e) {}
            window.location.href = '/user/login';
            return response;
          }
        } catch (e) {
          try {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
          } catch (er) {}
          window.location.href = '/user/login';
          return response;
        }
      } catch (e) {
        return response;
      }
    },
  ],
  ...errorConfig,
};
