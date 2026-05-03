import { Link } from "react-router-dom";
import { 
  ShieldCheck, 
  Globe,  
  MessageSquare, // For Discord or Community
  Cpu            // For Hardware/System status
} from "lucide-react";
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#031511] text-gray-400 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck className="w-8 h-8 text-[#10b981]" />
              <span className="text-xl font-bold tracking-tight">SecureVPS</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Automated VPS deployment, vulnerability scanning, and AI-powered security reporting for modern enterprises.
            </p>
            <div className="flex gap-4 pt-2">
  {/* Replace Github with Globe for Web/Public Presence */}
            <Link to="#" className="hover:text-white transition-colors" aria-label="Website">
                <Globe className="w-5 h-5 text-emerald-500" />
            </Link>

            {/* Replace Linkedin with MessageSquare for Discord/Chat */}
            <Link to="#" className="hover:text-white transition-colors" aria-label="Support Chat">
                <MessageSquare className="w-5 h-5 text-blue-400" />
            </Link>

            {/* Added Cpu icon for System/Hardware Status */}
            <Link to="#" className="hover:text-white transition-colors" aria-label="System Status">
                <Cpu className="w-5 h-5 text-amber-400" />
            </Link>
</div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="#" className="hover:text-emerald-400 transition-colors">Vulnerability Scanner</Link></li>
              <li><Link to="#" className="hover:text-emerald-400 transition-colors">VPS Hardening</Link></li>
              <li><Link to="#" className="hover:text-emerald-400 transition-colors">ML Intelligence</Link></li>
              <li><Link to="#" className="hover:text-emerald-400 transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-bold mb-6">Resources</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="#" className="hover:text-emerald-400 transition-colors">Documentation</Link></li>
              <li><Link to="#" className="hover:text-emerald-400 transition-colors">API Reference</Link></li>
              <li><Link to="#" className="hover:text-emerald-400 transition-colors">Security Blog</Link></li>
              <li><Link to="#" className="hover:text-emerald-400 transition-colors">Community</Link></li>
            </ul>
          </div>

          {/* Legal/Enterprise */}
          <div>
            <h4 className="text-white font-bold mb-6">Enterprise</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="#" className="hover:text-emerald-400 transition-colors">SLA</Link></li>
              <li><Link to="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="#" className="hover:text-emerald-400 transition-colors">Compliance</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Academic & Version Info */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] font-medium uppercase tracking-wider text-gray-500">
          <p>© {currentYear} SecureVPS Platform</p>
          <p className="text-center md:text-right">
            Dept. of Computer Science & IT | Academic Year 2025/2026 | v1.0
          </p>
        </div>
      </div>
    </footer>
  );
}