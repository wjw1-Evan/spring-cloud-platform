import { LogoutOutlined, ReloadOutlined } from '@ant-design/icons';
import { PageContainer, ProCard, ProList } from '@ant-design/pro-components';
import { Button, Flex, Space, Tag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { fetchServices } from '../services/console';
import { useAuth } from '../hooks/useAuth';
import { ServiceInstance } from '../types';

export default function Dashboard() {
  const { user, token, logout, fetchUser } = useAuth();
  const [services, setServices] = useState<ServiceInstance[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchServices(token);
      setServices(data);
    } catch (err: any) {
      message.error(err?.response?.data?.message || '加载服务列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    load();
  }, [token]);

  return (
    <PageContainer
      title="微服务控制台"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            刷新
          </Button>
          <Button icon={<LogoutOutlined />} onClick={logout} danger>
            退出
          </Button>
        </Space>
      }
    >
      <ProCard title="当前用户" gutter={16} direction="column">
        <Typography.Text>邮箱：{user?.email}</Typography.Text>
        <Typography.Text>角色：{user?.roles?.join(', ')}</Typography.Text>
      </ProCard>
      <ProCard title="服务实例" style={{ marginTop: 16 }}>
        <ProList<ServiceInstance>
          loading={loading}
          dataSource={services}
          rowKey={(item) => `${item.serviceId}-${item.instanceId}`}
          metas={{
            title: {
              dataIndex: 'serviceId',
              title: '服务ID',
            },
            description: {
              render: (_, item) => `${item.host}:${item.port}`,
            },
            content: {
              render: (_, item) => (
                <Flex gap={8} align="center">
                  <Tag color={item.status === 'UP' ? 'green' : 'red'}>{item.status}</Tag>
                </Flex>
              ),
            },
          }}
        />
      </ProCard>
    </PageContainer>
  );
}
