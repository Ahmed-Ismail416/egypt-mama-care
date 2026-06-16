import { Link } from "@tanstack/react-router";
import { Heart, Mail, Facebook, Instagram } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40 mt-16">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-pink to-brand-purple text-white">
              <Heart className="h-5 w-5" fill="currentColor" />
            </span>
            دليل دكتورات النساء
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            منصة عربية تساعدك في الوصول لأفضل الطبيبات المتخصصات في النساء والتوليد في جميع محافظات مصر.
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-3">روابط سريعة</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/doctors" className="hover:text-foreground">دليل الطبيبات</Link></li>
            <li><Link to="/register" className="hover:text-foreground">انضمي كطبيبة</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">تواصلي معنا</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">تابعينا</h3>
          <div className="flex items-center gap-3">
            <a href="#" className="grid h-10 w-10 place-items-center rounded-full bg-card border border-border hover:bg-secondary" aria-label="Facebook"><Facebook className="h-4 w-4" /></a>
            <a href="#" className="grid h-10 w-10 place-items-center rounded-full bg-card border border-border hover:bg-secondary" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>
            <a href="mailto:info@example.com" className="grid h-10 w-10 place-items-center rounded-full bg-card border border-border hover:bg-secondary" aria-label="Email"><Mail className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} دليل دكتورات النساء والتوليد في مصر — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}