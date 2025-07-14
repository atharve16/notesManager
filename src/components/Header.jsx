"use client";
import { useState, useEffect } from "react";
import { Home, Bell, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../app/context/authContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const { user, Logout } = useAuth();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDropdown && !e.target.closest(".dropdown-container")) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showDropdown]);

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white/80 backdrop-blur-lg border-b border-gray-200/50 transition-shadow ${
        isScrolled ? "shadow-lg" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center group space-x-2">
            <Home className="h-10 w-10 text-gradient bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent" />
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-700 bg-clip-text text-transparent">
                Notes Manager
              </span>
              <div className="text-xs text-gray-500 mt-1 lg:block hidden">
                Collection of Your Thoughts!
              </div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center space-x-1">
            {[
              { name: "Notes", href: "/notes" },
              { name: "Bookmarks", href: "/bookmarks" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm px-4 py-2 font-medium rounded-xl text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 transition"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4 dropdown-container relative">
            <button className="relative p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition-all duration-200">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>

            {user ? (
              <div className="relative dropdown-container">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-3 bg-white/60 backdrop-blur-md rounded-2xl px-4 py-3 hover:bg-white/80 transition-all duration-300 border border-white/30 shadow-md hover:shadow-lg"
                >
                  <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.charAt(0) || "U"}
                  </div>
                  <span className="font-semibold text-gray-700 hidden sm:block">
                    {user.name}
                  </span>
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 py-2 z-50">
                    <button
                      onClick={() => {
                        Logout();
                        setShowDropdown(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50/60 transition-all duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push("/user/login")}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-6 py-2 rounded-2xl font-semibold hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition shadow-md hover:shadow-xl transform hover:scale-105 text-sm"
              >
                Get Started
              </button>
            )}

            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-gray-700 hover:bg-blue-100/50 transition"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-4 space-y-2 bg-white/90 backdrop-blur-md border-t border-gray-200/50">
          {[
            { name: "Notes", href: "/notes" },
            { name: "Bookmarks", href: "/bookmarks" },
          ].map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block w-full text-left px-4 py-2 text-gray-700 rounded-xl hover:bg-blue-50/70 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
