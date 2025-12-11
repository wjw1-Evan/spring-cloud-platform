import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Progress, Space } from 'antd';
import { history } from '@umijs/max';
import { useAuth } from '@/components/AuthProvider';

const Register: React.FC = () => {
  const { register } = useAuth();

  const [password, setPassword] = useState('');

  const calcStrength = (pwd: string) => {
    let score = 0;
    if (!pwd) return { score: 0, label: '太短' };
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    const percent = Math.min(100, (score / 5) * 100);
    const label = percent < 40 ? '弱' : percent < 80 ? '中' : '强';
    return { score: percent, label };
  };

  const onFinish = async (values: any) => {
    try {
      await register(values.email, values.password);
      message.success('注册成功，已登录');
      history.push('/');
    } catch (e: any) {
      const msg = e?.message || '注册失败';
      message.error(msg);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Card title="注册" style={{ width: 360 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ required: true, type: 'email', message: '请输入有效的邮箱' }]}
          >
            <Input placeholder="you@example.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, min: 6, message: '至少6位' }]}
            hasFeedback
          >
            <Input.Password
              placeholder="至少6位"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>

          <Form.Item>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Progress percent={calcStrength(password).score} showInfo={false} status={calcStrength(password).score < 40 ? 'exception' : calcStrength(password).score < 80 ? 'normal' : 'success'} />
              <div style={{ textAlign: 'right', color: '#888' }}>{password ? `强度：${calcStrength(password).label}` : '请输入密码以查看强度'}</div>
            </Space>
          </Form.Item>

          <Form.Item
            name="confirm"
            label="确认密码"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="再次输入密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              注册并登录
            </Button>
          </Form.Item>

          <Form.Item>
            <a onClick={() => history.push('/user/login')}>已有账号？去登录</a>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
