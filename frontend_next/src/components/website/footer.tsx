/**
 * footer.tsx
 * TRAI 官网页脚
 * - 品牌信息
 * - 链接分组
 * - 社交媒体
 * - 底部版权
 */

import Link from "next/link";
import { Bot, Globe2, MessageCircle, Users } from "lucide-react";

const footerLinks = {
  产品: [
    { label: "功能介绍", href: "/features" },
    { label: "定价方案", href: "/pricing" },
    { label: "更新日志", href: "/changelog" },
    { label: "路线图", href: "/roadmap" },
  ],
  开发者: [
    { label: "快速开始", href: "/docs/quickstart" },
    { label: "API 参考", href: "/docs/api" },
    { label: "常见问题", href: "/docs/faq" },
    { label: "SDK 下载", href: "/docs/sdk" },
  ],
  公司: [
    { label: "关于我们", href: "/about" },
    { label: "加入我们", href: "/careers" },
    { label: "联系我们", href: "/contact" },
    { label: "隐私政策", href: "/privacy" },
  ],
  合作: [
    { label: "成为代理", href: "/partner" },
    { label: "OEM 合作", href: "/oem" },
    { label: "企业定制", href: "/enterprise" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-[#080c1a] border-t border-slate-200 dark:border-slate-800/50">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">TRAI</span>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6 max-w-xs">
              新一代 AI Agent 平台，为企业提供安全、可靠、可扩展的智能助手解决方案。
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Globe2, href: "#", label: "社区" },
                { Icon: MessageCircle, href: "#", label: "微信" },
                { Icon: Users, href: "#", label: "社群" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-blue-100 dark:hover:bg-blue-500/20 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">{category}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600 dark:text-slate-500">
            &copy; {new Date().getFullYear()} TRAI. 保留所有权利.
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-600 dark:text-slate-500">
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">隐私政策</Link>
            <Link href="/terms" className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">服务条款</Link>
            <Link href="/cookies" className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Cookie 设置</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
