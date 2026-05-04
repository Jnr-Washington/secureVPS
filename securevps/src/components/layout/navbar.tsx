import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Menu, X, ShieldCheck } from "lucide-react"; // Install lucide-react if not present
import { useNavigate } from "react-router-dom";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const handleLoginClick = () => { navigate("/login"); };
  const handleSignupClick = () => { navigate("/signup"); };

  return (
    <nav className="bg-emerald-950 border-b border-emerald-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo Section */}
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-400 w-8 h-8" />
            <span className="text-white font-bold text-xl tracking-tight">SecureVPS</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <NavigationMenu className="text-white">
              <NavigationMenuList className="gap-2">
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-emerald-900 hover:text-emerald-400 focus:bg-emerald-900">
                    Product
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-emerald-900 border-emerald-800 p-4 min-w-[200px]">
                    <ul className="flex flex-col gap-2">
                      <li className="p-2 hover:bg-emerald-800 rounded-md cursor-pointer text-sm">Automated Deployment</li>
                      <li className="p-2 hover:bg-emerald-800 rounded-md cursor-pointer text-sm">CIS Hardening</li>
                      <li className="p-2 hover:bg-emerald-800 rounded-md cursor-pointer text-sm">Vulnerability Scans</li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-emerald-900 hover:text-emerald-400">
                    Solutions
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-emerald-900 border-emerald-800 p-4 min-w-[200px]">
                    <ul className="flex flex-col gap-2">
                      <li className="p-2 hover:bg-emerald-800 rounded-md cursor-pointer text-sm">Enterprise Security</li>
                      <li className="p-2 hover:bg-emerald-800 rounded-md cursor-pointer text-sm">Startup Infrastructure</li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink className={`${navigationMenuTriggerStyle()} bg-transparent hover:bg-emerald-900 text-white`}>
                    Pricing
                  </NavigationMenuLink>
                </NavigationMenuItem>
                
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Action Buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="text-white hover:bg-emerald-900" onClick={handleLoginClick}>
              Login
            </Button>
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-white" onClick={handleSignupClick}>
              Free Signup
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-emerald-400 p-2"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-emerald-950 border-t border-emerald-900 px-4 pt-2 pb-6 space-y-2">
          <div className="flex flex-col space-y-4">
            <a href="#" className="text-emerald-100 hover:text-white px-3 py-2 text-base font-medium">Product</a>
            <a href="#" className="text-emerald-100 hover:text-white px-3 py-2 text-base font-medium">Solutions</a>
            <a href="#" className="text-emerald-100 hover:text-white px-3 py-2 text-base font-medium">Pricing</a>
            <div className="pt-4 flex flex-col gap-3">
              <Button variant="outline" className="w-full text-emerald-950 border-emerald-500" onClick={handleLoginClick}>Login</Button>
              <Button className="w-full bg-emerald-500" onClick={handleSignupClick}>Free Signup</Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}