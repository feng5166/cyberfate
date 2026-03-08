import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers/oauth'

export interface WechatProfile {
  openid: string
  nickname: string
  headimgurl: string
  unionid?: string
}

export default function WechatProvider<P extends WechatProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: 'wechat',
    name: 'WeChat',
    type: 'oauth',
    authorization: {
      url: 'https://open.weixin.qq.com/connect/qrconnect',
      params: {
        scope: 'snsapi_login',
        response_type: 'code',
      },
    },
    token: 'https://api.weixin.qq.com/sns/oauth2/access_token',
    userinfo: 'https://api.weixin.qq.com/sns/userinfo',
    profile(profile) {
      return {
        id: profile.openid,
        name: profile.nickname,
        image: profile.headimgurl,
        email: null,
      }
    },
    style: {
      logo: '/wechat-logo.svg',
      bg: '#07C160',
      text: '#fff',
    },
    options,
  }
}
