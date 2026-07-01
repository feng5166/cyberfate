import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Screen } from '@/components/ui';
import { colors } from '@/lib/theme';

const tip = { fontSize: 14, color: colors.secondary, lineHeight: 20 } as const;

export function NeedLogin({ feature }: { feature: string }) {
  const router = useRouter();
  return (
    <Screen>
      <Card style={{ gap: 12 }}>
        <Text style={tip}>{feature}需登录后使用。</Text>
        <Button title="去登录" onPress={() => router.push('/login')} />
      </Card>
    </Screen>
  );
}

export function NeedProfile() {
  const router = useRouter();
  return (
    <Screen>
      <Card style={{ gap: 12 }}>
        <Text style={tip}>请先填写出生信息再继续。</Text>
        <Button title="填写出生信息" onPress={() => router.push('/birth-input')} />
      </Card>
    </Screen>
  );
}
