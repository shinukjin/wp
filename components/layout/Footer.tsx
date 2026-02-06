import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200/50 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-3">
          {/* Wedding Project 제목과 링크 */}
          <div className="flex flex-wrap items-center gap-4">
            <h3 className="text-sm font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Wedding Project</h3>
            <nav className="flex flex-wrap gap-4">
              <Link
                href="/"
                className="text-xs text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                홈
              </Link>
              <Link
                href="/wedding-prep"
                className="text-xs text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                결혼 준비
              </Link>
              <Link
                href="/real-estate"
                className="text-xs text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                부동산
              </Link>
              <Link
                href="/schedule"
                className="text-xs text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                일정계획
              </Link>
            </nav>
          </div>

          {/* Copyright */}
          <p className="text-xs text-gray-500 pt-2 border-t border-gray-200">
            © {currentYear} Wedding Project. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
