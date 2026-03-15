#!/bin/bash
# CyberFate Smoke Test

echo "=========================================="
echo "CyberFate Smoke Test"
echo "=========================================="

BASE_URL="http://localhost:3000"

echo ""
echo "1. 检查服务状态..."
if curl -s -o /dev/null -w "%{http_code}" $BASE_URL | grep -q "200"; then
  echo "✅ 服务正常运行"
else
  echo "❌ 服务未启动"
  exit 1
fi

echo ""
echo "2. 测试首页..."
curl -s $BASE_URL | grep -q "CyberFate" && echo "✅ 首页正常" || echo "❌ 首页失败"

echo ""
echo "3. 测试八字页面..."
curl -s $BASE_URL/bazi | grep -q "八字" && echo "✅ 八字页面正常" || echo "❌ 八字页面失败"

echo ""
echo "4. 测试每日运势页面..."
curl -s $BASE_URL/daily | grep -q "运势" && echo "✅ 运势页面正常" || echo "❌ 运势页面失败"

echo ""
echo "=========================================="
echo "测试完成！"
echo "=========================================="
