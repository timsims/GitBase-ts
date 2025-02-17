import Link from 'next/link'

interface FooterLink {
  href: string
  label: string
  isExternal?: boolean
}

const quickLinks: FooterLink[] = [
  { href: '/', label: 'Home' },
  { href: '/resources', label: 'Resources' },
  { href: '/posts', label: 'Articles' },
]

const connectLinks: FooterLink[] = [
  { href: 'https://gitbase.app/', label: 'GitBase', isExternal: true },
  { href: 'https://github.com/qiayue/gitbase', label: 'GitHub', isExternal: true },
  { href: 'https://twitter.com/gefei55', label: 'Twitter', isExternal: true },
]

function FooterLinkList({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">
        {title}
      </h3>
      <ul className="mt-4 space-y-4">
        {links.map((link) => (
          <li key={link.href}>
            {link.isExternal ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base text-gray-500 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-base text-gray-500 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">
              About
            </h3>
            <p className="mt-4 text-base text-gray-500">
              GitBase is an open-source dynamic website solution without a traditional database,
              built with Next.js and powered by GitHub.
            </p>
          </div>
          <FooterLinkList title="Quick Links" links={quickLinks} />
          <FooterLinkList title="Connect" links={connectLinks} />
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-400 text-center">
            &copy; {currentYear} GitBase. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}