interface PasswordResetEmailParams {
  resetUrl: string
}

export function getPasswordResetEmailSubject(): string {
  return '重置您的 CyberFate 密码'
}

export function getPasswordResetEmailText({ resetUrl }: PasswordResetEmailParams): string {
  return `您好，

您请求重置 CyberFate 密码。请点击以下链接重置密码：

${resetUrl}

此链接将在 15 分钟后过期。

如果您没有请求重置密码，请忽略此邮件。

——CyberFate 赛博命理师`
}

export function getPasswordResetEmailHtml({ resetUrl }: PasswordResetEmailParams): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>重置您的 CyberFate 密码</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF9F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="520" style="max-width: 520px; width: 100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <span style="font-size: 28px; font-weight: 700; color: #1C1A16; letter-spacing: -0.5px;">
                CyberFate
              </span>
              <br />
              <span style="font-size: 13px; color: #9B9590;">赛博命理师</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color: #FFFFFF; border-radius: 16px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #1C1A16; text-align: center;">
                重置您的密码
              </h1>
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: #6B6560; text-align: center;">
                我们收到了您的密码重置请求。<br />
                请点击下方按钮设置新密码。
              </p>
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}"
                       style="display: inline-block; padding: 14px 36px; background-color: #1C1A16; color: #FFFFFF; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">
                      重置密码
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 28px 0 0; font-size: 13px; line-height: 1.5; color: #B8B4AE; text-align: center;">
                此链接将在 <strong style="color: #9B9590;">15 分钟</strong> 后过期。<br />
                如果您没有请求重置密码，请忽略此邮件。
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="margin: 0; font-size: 12px; color: #B8B4AE;">
                &copy; ${new Date().getFullYear()} CyberFate 赛博命理师
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
