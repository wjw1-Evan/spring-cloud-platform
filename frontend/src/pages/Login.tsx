import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Form, Input, Typography, message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch (err: any) {
      message.error(err?.response?.data?.message || '登录失败');
    }
  };

  return (
    <Flex style={{ minHeight: '100vh' }} justify="center" align="center">
      <Card title="登录" style={{ width: 360 }}>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<MailOutlined />} placeholder="you@example.com" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}> 
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
          <Typography.Text>
            还没有账号？ <Link to="/register">注册</Link>
          </Typography.Text>
        </Form>
      </Card>
    </Flex>
  );
}
