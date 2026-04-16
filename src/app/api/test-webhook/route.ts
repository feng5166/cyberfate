import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// 测试签名验证逻辑
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || req.headers.get('Stripe-Signature');
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  const result: Record<string, unknown> = {
    bodyLength: body.length,
    bodyPreview: body.substring(0, 100),
    signatureHeader: sig,
    secretConfigured: !!webhookSecret,
    secretPrefix: webhookSecret?.substring(0, 15),
  };
  
  if (sig && webhookSecret) {
    // Parse signature
    const items = sig.split(',');
    const timestamp = items
      .map((item) => item.split('='))
      .filter(([key]) => key === 't')
      .map(([, value]) => parseInt(value, 10))[0];
    const v1Sigs = items
      .map((item) => item.split('='))
      .filter(([key]) => key === 'v1')
      .map(([, value]) => value);
    
    result.parsedTimestamp = timestamp;
    result.parsedSignatures = v1Sigs;
    
    if (timestamp && v1Sigs.length > 0) {
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(`${timestamp}.${body}`, 'utf8')
        .digest('hex');
      
      result.expectedSignature = expectedSig;
      result.receivedSignature = v1Sigs[0];
      result.match = expectedSig === v1Sigs[0];
    }
  }
  
  return NextResponse.json(result);
}

export async function GET() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  return NextResponse.json({
    secretConfigured: !!webhookSecret,
    secretPrefix: webhookSecret?.substring(0, 15),
    secretLength: webhookSecret?.length,
  });
}
