import { CheckIcon, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { getCart } from "../api/cartApi";
import { BagIcon, UserIcon } from "./Icons";

const USERS = [1, 2, 3, 4, 5];

const linkClass = ({ isActive }) =>
  cn(
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 max-sm:hidden",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

const cartLinkClass = ({ isActive }) =>
  cn(
    "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    isActive
      ? "text-primary"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

export default function Navbar({ userId, onUserChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let active = true;
    function loadCount() {
      getCart(userId)
        .then((cart) => {
          if (active) {
            setCartCount(
              (cart.items ?? []).reduce((sum, item) => sum + item.quantity, 0),
            );
          }
        })
        .catch(() => {}); // cart-service bermasalah: badge tetap seperti sebelumnya.
    }
    loadCount();
    window.addEventListener("cart:changed", loadCount);
    return () => {
      active = false;
      window.removeEventListener("cart:changed", loadCount);
    };
  }, [userId]);

  function chooseUser(id) {
    onUserChange(id);
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3">
        <div className="flex items-center gap-3 sm:gap-6">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="swatch-cut-sm grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <BagIcon className="h-5 w-5" />
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">
              Toko Online
            </span>
          </NavLink>

          <NavLink to="/" end className={linkClass}>
            Produk
          </NavLink>
        </div>
        <nav className="flex items-center gap-1">
          <NavLink to="/cart" className={cartLinkClass}>
            <span className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none tabular-nums text-primary-foreground ring-2 ring-background">
                  {cartCount}
                  <span className="sr-only"> item</span>
                </span>
              )}
            </span>
            Keranjang
          </NavLink>
          <NavigationMenu
            viewport={false}
            value={menuOpen ? "user" : ""}
            onValueChange={(value) => setMenuOpen(value === "user")}
          >
            <NavigationMenuList>
              <NavigationMenuItem value="user">
                <NavigationMenuTrigger className="gap-1.5">
                  <UserIcon className="h-4 w-4" />
                  User {userId}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="absolute top-full right-0 left-auto mt-1.5">
                  {USERS.map((id) => (
                    <NavigationMenuLink key={id} asChild>
                      <button
                        type="button"
                        onClick={() => chooseUser(id)}
                        className={cn(
                          "w-full justify-between text-left",
                          id === userId && "bg-muted",
                        )}
                      >
                        <span>User {id}</span>
                        {id === userId && <CheckIcon aria-hidden="true" />}
                      </button>
                    </NavigationMenuLink>
                  ))}
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </nav>
      </div>
    </header>
  );
}
