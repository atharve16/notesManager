"use client";
import { useEffect, useState, Suspense } from "react";
import { useData } from "../context/dataContext";
import { useAuth } from "../context/authContext";
import toast from "react-hot-toast";
import Loader from "@/components/Loader";
import { useRouter } from "next/navigation";

export default function BookmarksPage() {
  const router = useRouter();
  const { bookmarks, fetchBookmarks, getHeaders, loading: dataLoading } = useData();
  const { user, token, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [form, setForm] = useState({
    title: "",
    url: "",
    description: "",
    tags: "",
    isFavorite: false,
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const BASE_URL = "http://localhost:8080/api";

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const retryWithBackoff = async (fn, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (error.status === 429 && i < maxRetries - 1) {
          const waitTime = Math.pow(2, i) * 1000; 
          console.log(
            `Rate limited, waiting ${waitTime}ms before retry ${
              i + 1
            }/${maxRetries}`
          );
          await delay(waitTime);
          continue;
        }
        throw error;
      }
    }
  };

  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/user/login");
    }
  }, [token, authLoading, router]);

  useEffect(() => {
    if (token && bookmarks.length === 0) {
      fetchBookmarks();
    }
  }, [token, fetchBookmarks, bookmarks.length]);

  if (authLoading || dataLoading) {
    return <Loader />;
  }

  if (!token) {
    return null;
  }

  const isValidURL = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const createBookmark = async () => {
    if (!form.url.trim()) {
      return toast.error("URL is required");
    }

    if (!isValidURL(form.url.trim())) {
      return toast.error("Please enter a valid URL");
    }

    setLoading(true);
    try {
      const bookmarkData = {
        title: form.title.trim(),
        url: form.url.trim(),
        description: form.description.trim(),
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
        isFavorite: form.isFavorite,
      };

      await retryWithBackoff(async () => {
        const res = await fetch(`${BASE_URL}/bookmarks`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(bookmarkData),
        });

        if (res.status === 429) {
          throw { status: 429, message: "Rate limited" };
        }

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || errorData.message || "Failed to create bookmark"
          );
        }

        return await res.json();
      });

      toast.success("Bookmark created successfully!");
      setForm({
        title: "",
        url: "",
        description: "",
        tags: "",
        isFavorite: false,
      });
      setShowForm(false);

      await delay(500);
      await fetchBookmarks();
    } catch (error) {
      console.error("Create bookmark error:", error);
      if (error.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error(error.message || "Failed to create bookmark");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateBookmark = async () => {
    if (!editingId) return;

    if (!form.url.trim()) {
      return toast.error("URL is required");
    }

    if (!isValidURL(form.url.trim())) {
      return toast.error("Please enter a valid URL");
    }

    setLoading(true);
    try {
      const bookmarkData = {
        title: form.title.trim(),
        url: form.url.trim(),
        description: form.description.trim(),
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
        isFavorite: form.isFavorite,
      };

      await retryWithBackoff(async () => {
        const res = await fetch(`${BASE_URL}/bookmarks/${editingId}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(bookmarkData),
        });

        if (res.status === 429) {
          throw { status: 429, message: "Rate limited" };
        }

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || errorData.message || "Failed to update bookmark"
          );
        }

        return await res.json();
      });

      toast.success("Bookmark updated successfully!");
      setEditingId(null);
      setForm({
        title: "",
        url: "",
        description: "",
        tags: "",
        isFavorite: false,
      });
      setShowForm(false);

      await delay(500);
      await fetchBookmarks();
    } catch (error) {
      console.error("Update bookmark error:", error);
      if (error.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error(error.message || "Failed to update bookmark");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteBookmark = async (id) => {
    if (!confirm("Are you sure you want to delete this bookmark?")) return;

    try {
      await retryWithBackoff(async () => {
        const res = await fetch(`${BASE_URL}/bookmarks/${id}`, {
          method: "DELETE",
          headers: getHeaders(),
        });

        if (res.status === 429) {
          throw { status: 429, message: "Rate limited" };
        }

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || errorData.message || "Failed to delete bookmark"
          );
        }
      });

      toast.success("Bookmark deleted successfully!");

      await delay(500);
      await fetchBookmarks();
    } catch (error) {
      console.error("Delete bookmark error:", error);
      if (error.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error(error.message || "Failed to delete bookmark");
      }
    }
  };

  const toggleFavorite = async (bookmark) => {
    try {
      await retryWithBackoff(async () => {
        const res = await fetch(`${BASE_URL}/bookmarks/${bookmark._id}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            ...bookmark,
            isFavorite: !bookmark.isFavorite,
          }),
        });

        if (res.status === 429) {
          throw { status: 429, message: "Rate limited" };
        }

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || errorData.message || "Failed to update favorite"
          );
        }

        return await res.json();
      });

      toast.success(
        bookmark.isFavorite
          ? "Removed from favorites"
          : "Added to favorites"
      );

      await delay(500);
      await fetchBookmarks();
    } catch (error) {
      console.error("Toggle favorite error:", error);
      if (error.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error(error.message || "Failed to update favorite");
      }
    }
  };

  const editBookmark = (bookmark) => {
    setForm({
      title: bookmark.title || "",
      url: bookmark.url || "",
      description: bookmark.description || "",
      tags: bookmark.tags ? bookmark.tags.join(", ") : "",
      isFavorite: bookmark.isFavorite || false,
    });
    setEditingId(bookmark._id);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      title: "",
      url: "",
      description: "",
      tags: "",
      isFavorite: false,
    });
    setShowForm(false);
  };

  const filtered = bookmarks.filter((bookmark) => {
    const matchesSearch = search
      ? bookmark.title.toLowerCase().includes(search.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(search.toLowerCase()) ||
        bookmark.description.toLowerCase().includes(search.toLowerCase())
      : true;

    const matchesTags = tags
      ? bookmark.tags?.some((bookmarkTag) =>
          tags
            .split(",")
            .map((tag) => tag.trim().toLowerCase())
            .some((filterTag) => bookmarkTag.toLowerCase().includes(filterTag))
        )
      : true;

    const matchesFavorites = showFavorites ? bookmark.isFavorite : true;

    return matchesSearch && matchesTags && matchesFavorites;
  });

  const getTagColor = (tag) => {
    const colors = [
      "bg-emerald-100 text-emerald-800",
      "bg-cyan-100 text-cyan-800",
      "bg-violet-100 text-violet-800",
      "bg-orange-100 text-orange-800",
      "bg-rose-100 text-rose-800",
      "bg-teal-100 text-teal-800",
    ];
    return colors[tag.length % colors.length];
  };

  const getDomainFromUrl = (url) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace("www.", "");
    } catch {
      return url;
    }
  };

  const getFaviconUrl = (url) => {
    try {
      const domain = new URL(url).origin;
      return `${domain}/favicon.ico`;
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-2">
              🔖 My Bookmarks
            </h1>
            <p className="text-slate-600 text-lg">
              Welcome back, {user?.username || "User"}!
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <input
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors bg-slate-50 focus:bg-white"
                placeholder="Search bookmarks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <svg
                className="absolute left-3 top-3.5 h-5 w-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div className="relative flex-1">
              <input
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors bg-slate-50 focus:bg-white"
                placeholder="Filter by tags (comma separated)..."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <svg
                className="absolute left-3 top-3.5 h-5 w-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex-1 md:flex-none bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {showForm ? "Cancel" : "✨ Add New Bookmark"}
            </button>
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className={`flex-1 md:flex-none px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg ${
                showFavorites
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-yellow-400"
              }`}
            >
              {showFavorites ? "⭐ Show All" : "⭐ Favorites Only"}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 border-purple-500">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              {editingId ? "Edit Bookmark" : "Add New Bookmark"}
            </h2>
            <div className="space-y-4">
              <input
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors bg-slate-50 focus:bg-white"
                placeholder="Title (optional - will be auto-fetched if empty)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <input
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors bg-slate-50 focus:bg-white"
                placeholder="URL (required)"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
              <textarea
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors bg-slate-50 focus:bg-white min-h-[100px] resize-y"
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <input
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors bg-slate-50 focus:bg-white"
                placeholder="Tags (comma separated)"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFavorite}
                    onChange={(e) =>
                      setForm({ ...form, isFavorite: e.target.checked })
                    }
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-slate-700 font-medium">
                    ⭐ Mark as favorite
                  </span>
                </label>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="flex-1 bg-gradient-to-r from-green-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
                  onClick={editingId ? updateBookmark : createBookmark}
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : editingId
                    ? "Update Bookmark"
                    : "Save Bookmark"}
                </button>
                <button
                  className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all duration-200"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <Suspense fallback={<Loader />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((bookmark) => (
              <div
                key={bookmark._id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-purple-500 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <img
                        src={getFaviconUrl(bookmark.url)}
                        alt=""
                        className="w-4 h-4"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "block";
                        }}
                      />
                      <span className="text-white text-sm font-bold hidden">
                        🔗
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-lg font-bold text-slate-800 hover:text-purple-600 transition-colors line-clamp-2 flex-1"
                        >
                          {bookmark.title || getDomainFromUrl(bookmark.url)}
                        </a>
                        <button
                          onClick={() => toggleFavorite(bookmark)}
                          className={`flex-shrink-0 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                            bookmark.isFavorite
                              ? "text-yellow-500 hover:text-yellow-600"
                              : "text-gray-400 hover:text-yellow-500"
                          }`}
                        >
                          <svg
                            className="w-5 h-5"
                            fill={bookmark.isFavorite ? "currentColor" : "none"}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {getDomainFromUrl(bookmark.url)}
                      </p>
                    </div>
                  </div>

                  {bookmark.description && (
                    <p className="text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                      {bookmark.description}
                    </p>
                  )}

                  {bookmark.tags && bookmark.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {bookmark.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getTagColor(
                            tag
                          )}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => editBookmark(bookmark)}
                      className="flex-1 bg-purple-50 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors font-medium"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteBookmark(bookmark._id)}
                      className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Suspense>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔖</div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              {search || tags || showFavorites ? "No bookmarks found" : "No bookmarks yet"}
            </h3>
            <p className="text-slate-600">
              {search || tags || showFavorites
                ? "Try adjusting your search, filter criteria, or favorite settings"
                : "Create your first bookmark to get started!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}