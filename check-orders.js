// 临时脚本：检查用户订单和订阅记录
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'feng123@163.com' },
      include: {
        orders: { orderBy: { createdAt: 'desc' } },
        subscriptions: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!user) {
      console.log('用户不存在');
      return;
    }

    console.log('\n=== 用户信息 ===');
    console.log('Email:', user.email);
    console.log('ID:', user.id);

    console.log('\n=== 订单记录 (Orders) ===');
    user.orders.forEach((order, i) => {
      console.log(`\n订单 ${i + 1}:`);
      console.log('  Plan:', order.plan);
      console.log('  Amount:', order.amount, '分');
      console.log('  Status:', order.status);
      console.log('  PayMethod:', order.payMethod);
      console.log('  CreatedAt:', order.createdAt.toISOString());
      console.log('  PaidAt:', order.paidAt?.toISOString() || 'null');
    });

    console.log('\n=== 订阅记录 (Subscriptions) ===');
    user.subscriptions.forEach((sub, i) => {
      console.log(`\n订阅 ${i + 1}:`);
      console.log('  Plan:', sub.plan);
      console.log('  Status:', sub.status);
      console.log('  StartAt:', sub.startAt.toISOString());
      console.log('  ExpireAt:', sub.expireAt.toISOString());
      console.log('  CreatedAt:', sub.createdAt.toISOString());
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
