const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixVip() {
  // 查找 feng@163.com 用户
  const user = await prisma.user.findUnique({
    where: { email: 'feng@163.com' },
    include: { payments: { orderBy: { createdAt: 'desc' } } }
  });

  if (!user) {
    console.log('用户不存在');
    return;
  }

  console.log('\n当前用户信息:');
  console.log('Email:', user.email);
  console.log('VIP 状态:', user.isPremium);
  console.log('到期时间:', user.premiumExpiry);
  
  console.log('\n订阅记录:');
  user.payments.forEach(p => {
    console.log(`- ${p.plan} | ${p.payMethod} | ${p.status} | ${p.createdAt}`);
  });

  // 最近一次订阅
  const latestPayment = user.payments[0];
  if (latestPayment && latestPayment.plan === 'quarterly') {
    // 季度应该是 3 个月后
    const correctExpiry = new Date();
    correctExpiry.setMonth(correctExpiry.getMonth() + 3);
    
    console.log('\n修正信息:');
    console.log('当前到期:', user.premiumExpiry);
    console.log('正确到期:', correctExpiry);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { premiumExpiry: correctExpiry }
    });
    
    console.log('✅ 已修正为季度会员（3个月）');
  }
}

fixVip()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
