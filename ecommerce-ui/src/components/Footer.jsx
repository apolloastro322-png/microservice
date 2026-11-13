import {
  HeadphonesIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  TruckIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { BagIcon } from "./Icons";

const linkClass =
  "w-fit rounded transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

const services = [
  { icon: TruckIcon, label: "Pengiriman ke seluruh Indonesia" },
  { icon: ShieldCheckIcon, label: "Garansi resmi produk" },
  { icon: HeadphonesIcon, label: "Dukungan pembeli" },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link
            to="/"
            className="flex w-fit items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="swatch-cut-sm grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <BagIcon className="h-5 w-5" />
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">
              Toko Online
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Elektronik &amp; aksesoris pilihan dengan harga jelas, stok
            ter-update, dan ulasan asli pembeli.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Belanja
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/" className={linkClass}>
                Semua produk
              </Link>
            </li>
            <li>
              <Link to="/cart" className={linkClass}>
                Keranjang
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Layanan
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {services.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Kontak
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <MailIcon className="h-4 w-4 shrink-0 text-primary" />
              <a href="mailto:halo@tokoonline.id" className={linkClass}>
                halo@tokoonline.id
              </a>
            </li>
            <li className="flex items-center gap-2">
              <PhoneIcon className="h-4 w-4 shrink-0 text-primary" />
              <a href="tel:+622112345678" className={linkClass}>
                (021) 1234 5678
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 shrink-0 text-primary" />
              Sumatera Barat, Indonesia
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Toko Online. Semua hak dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
