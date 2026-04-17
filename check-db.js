require("dotenv").config({ path: ".env.test" });
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  // 查所有 token，按时间倒序
  const tokens = await p.passwordResetToken.findMany({ orderBy: { createdAt: "desc" }, take: 10 });
  console.log("=== All tokens (newest first) ===");
  const now = new Date();
  tokens.forEach(t => {
    const valid = !t.used && t.expiresAt > now;
    console.log(JSON.stringify({
      id: t.id,
      email: t.email,
      token_preview: (t.token || "").substring(0, 20) + "...",
      used: t.used,
      expiresAt: t.expiresAt,
      expired: t.expiresAt < now,
      valid: valid,
      age_min: (now - new Date(t.createdAt)) / 1000 / 60
    }));
  });

  // 确认用户存在
  const user = await p.user.findFirst({ where: { email: "90@163.com" } });
  console.log("\n=== User 90@163.com ===");
  console.log(JSON.stringify({ id: user?.id, email: user?.email, hasPassword: !!user?.passwordHash }));
})().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); });
