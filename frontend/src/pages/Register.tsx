import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Form, Input, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      await register(values.email, values.password);
      navigate('/');
    } catch (err: any) {
      message.error(err?.response?.data?.message || '注册失败');
    }
  };

  return (
    <Flex style={{ minHeight: '100vh' }} justify="center" align="center">
      <Card title="注册" style={{ width: 360 }}>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<MailOutlined />} placeholder="you@example.com" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}> 
            <Input.Password prefix={<LockOutlined />} placeholder="至少6位" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              注册
            </Button>
          </Form.Item>
          <Typography.Text>
            已有账号？ <Link to="/login">去登录</Link>
          </Typography.Text>
        </Form>
      </Card>
    </Flex>
  );
}
