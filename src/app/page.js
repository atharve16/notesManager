"use client";
import Link from "next/link";
import { Bookmark, StickyNote } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <section className="w-full max-w-6xl text-center py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="px-4 sm:px-6 lg:px-8"
        >
          {/* Icons */}
          <div className="flex justify-center mb-6 space-x-4 text-blue-600">
            <StickyNote size={32} className="sm:size-36" />
            <Bookmark size={32} className="sm:size-36" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Save Smarter. Think Clearer.
          </h1>

          {/* Subtext */}
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 mb-10 max-w-3xl mx-auto">
            Store your notes and bookmarks securely in one place. Quickly find
            them using tags, search, and filters — anytime, anywhere.
          </p>

          {/* CTA Button */}
          <Link
            href="/notes"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-700 hover:to-blue-700 transition-all text-white px-8 py-4 rounded-full text-lg shadow-xl"
          >
            🚀 Explore Now
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
