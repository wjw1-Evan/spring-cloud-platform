import { PageContainer } from '@ant-design/pro-components';
import { useModel, history } from '@umijs/max';
import { Card, theme } from 'antd';
import React, { useEffect } from 'react';
import RequireAuth from '@/components/RequireAuth';

/**
 * 每个单独的卡片，为了复用样式抽成了组件
 * @param param0
 * @returns
 */
// Simplified welcome page — demo content removed. This page requires authentication.

const Welcome: React.FC = () => {
  const { token } = theme.useToken();
  const { initialState } = useModel('@@initialState');

  useEffect(() => {
    // Redirect to login if user is not authenticated
    const user = initialState?.currentUser;
    const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('token') : false;
    if (!user && !hasToken) {
      history.replace('/user/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialState]);

  return (
    <PageContainer>
      <Card style={{ borderRadius: 8 }}>
        <div style={{ padding: 24 }}>
          <h2 style={{ marginBottom: 8 }}>欢迎</h2>
          <p style={{ marginBottom: 16 }}>
            {initialState?.currentUser
              ? `欢迎回来，${initialState.currentUser.name || initialState.currentUser.email || ''}`
              : '请先登录以访问系统内容。'}
          </p>

          {initialState?.currentUser && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 260, flex: 1 }}>
                <Card title="账户信息" size="small">
                  <div>
                    <strong>邮箱: </strong>
                    <span>{initialState.currentUser.email}</span>
                  </div>
                  <div>
                    <strong>用户名: </strong>
                    <span>{initialState.currentUser.name || '-'}</span>
                  </div>
                  <div>
                    <strong>用户 ID: </strong>
                    <span>{initialState.currentUser.userId || initialState.currentUser.id || '-'}</span>
                  </div>
                  <div>
                    <strong>角色: </strong>
                    <span>{(initialState.currentUser.roles || []).join(', ') || '-'}</span>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </Card>
    </PageContainer>
  );
};

export default () => (
  <RequireAuth>
    <Welcome />
  </RequireAuth>
);
