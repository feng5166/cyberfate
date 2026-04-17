require("dotenv").config({ path: ".env.test" });
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const user = await p.user.findFirst({ where: { email: "90@163.com" }, select: { id: true, email: true, passwordHash: true } });
  console.log("User:", JSON.stringify(user));
  const tokens = await p.passwordResetToken.findMany({ orderBy: { createdAt: "desc" }, take: 5 });
  console.log("Tokens count:", tokens.length);
  tokens.forEach(t => {
    const obj = { id: t.id, email: t.email, token: (t.token || "").substring(0, 15), used: t.used, expiresAt: t.expiresAt };
    console.log(JSON.stringify(obj));
  });
})().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); });
