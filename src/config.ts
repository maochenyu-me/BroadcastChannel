// 站点自定义配置（构建时读取，改完需重新 build / 重启 dev）
export const siteConfig = {
  // 每页展示的说说条数，默认 10；建议不超过 20（Telegram 单窗口返回量的硬限制）
  pageSize: 10,

  // Moments 主题（朋友圈风格）自定义项
  moments: {
    // 启用 Moments 主题：注入 /themes/moments.css 并显示明暗切换按钮。
    // 启用后无需再通过 HEADER_INJECT 注入主题样式（环境变量值不允许空格）
    enabled: true,
    // 头部封面图 URL，留空则使用主题内置渐变
    coverImage: '',
    // 自定义头像 URL，留空则使用 Telegram 频道头像
    avatar: 'https://q2.qlogo.cn/headimg_dl?dst_uin=3149261770&spec=0',
    // 自定义昵称，留空则使用 Telegram 频道名称
    name: '喵洛阁',
  },
}
