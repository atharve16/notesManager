"use client";
import { useEffect, useState, Suspense } from "react";
import { useData } from "../context/dataContext";
import { useAuth } from "../context/authContext";
import toast from "react-hot-toast";
import Loader from "@/components/Loader";
import { useRouter } from "next/navigation";

export default function NotesPage() {
  const router = useRouter();
  const { notes, fetchNotes, getHeaders, loading: dataLoading } = useData();
  const { user, token, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState("");
  const [form, setForm] = useState({
    title: "",
    content: "",
    tags: "",
    isFavorite: false,
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState("updated"); 
  const [sortOrder, setSortOrder] = useState("desc");

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

  const fetchNotesWithFilters = async (
    searchTerm = "",
    tagFilter = "",
    favoritesOnly = false
  ) => {
    if (!token) return;

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("q", searchTerm);
      if (tagFilter) params.append("tags", tagFilter);
      if (favoritesOnly) params.append("favorites", "true");

      const url = `${BASE_URL}/notes${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      await retryWithBackoff(async () => {
        const res = await fetch(url, {
          method: "GET",
          headers: getHeaders(),
        });

        if (res.status === 429) {
          throw { status: 429, message: "Rate limited" };
        }

        if (!res.ok) {
          throw new Error("Failed to fetch notes");
        }

        const data = await res.json();
        return data;
      });
    } catch (error) {
      console.error("Fetch notes error:", error);
      toast.error("Failed to fetch notes");
    }
  };

  useEffect(() => {
    if (token && notes.length === 0) {
      fetchNotes();
    }
  }, [token, fetchNotes, notes.length]);

  if (authLoading || dataLoading) {
    return <Loader />;
  }

  if (!token) {
    return null;
  }

  const createNote = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      return toast.error("Title & content are required");
    }

    setLoading(true);
    try {
      const noteData = {
        title: form.title.trim(),
        content: form.content.trim(),
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
        isFavorite: form.isFavorite,
      };

      await retryWithBackoff(async () => {
        const res = await fetch(`${BASE_URL}/notes`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(noteData),
        });

        if (res.status === 429) {
          throw { status: 429, message: "Rate limited" };
        }

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || errorData.message || "Failed to create note"
          );
        }

        return await res.json();
      });

      toast.success("Note created successfully!");
      setForm({ title: "", content: "", tags: "", isFavorite: false });
      setShowForm(false);

      await delay(500);
      await fetchNotes();
    } catch (error) {
      console.error("Create note error:", error);
      if (error.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error(error.message || "Failed to create note");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateNote = async () => {
    if (!editingId) return;

    if (!form.title.trim() || !form.content.trim()) {
      return toast.error("Title & content are required");
    }

    setLoading(true);
    try {
      const noteData = {
        title: form.title.trim(),
        content: form.content.trim(),
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
        isFavorite: form.isFavorite,
      };

      await retryWithBackoff(async () => {
        const res = await fetch(`${BASE_URL}/notes/${editingId}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(noteData),
        });

        if (res.status === 429) {
          throw { status: 429, message: "Rate limited" };
        }

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || errorData.message || "Failed to update note"
          );
        }

        return await res.json();
      });

      toast.success("Note updated successfully!");
      setEditingId(null);
      setForm({ title: "", content: "", tags: "", isFavorite: false });
      setShowForm(false);

      await delay(500);
      await fetchNotes();
    } catch (error) {
      console.error("Update note error:", error);
      if (error.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error(error.message || "Failed to update note");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (noteId, currentFavoriteStatus) => {
    try {
      await retryWithBackoff(async () => {
        const res = await fetch(`${BASE_URL}/notes/${noteId}/favorite`, {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({ isFavorite: !currentFavoriteStatus }),
        });

        if (res.status === 429) {
          throw { status: 429, message: "Rate limited" };
        }

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error ||
              errorData.message ||
              "Failed to update favorite status"
          );
        }

        return await res.json();
      });

      toast.success(
        currentFavoriteStatus ? "Removed from favorites" : "Added to favorites"
      );

      await delay(500);
      await fetchNotes();
    } catch (error) {
      console.error("Toggle favorite error:", error);
      if (error.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error(error.message || "Failed to update favorite status");
      }
    }
  };

  const deleteNote = async (id) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await retryWithBackoff(async () => {
        const res = await fetch(`${BASE_URL}/notes/${id}`, {
          method: "DELETE",
          headers: getHeaders(),
        });

        if (res.status === 429) {
          throw { status: 429, message: "Rate limited" };
        }

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || errorData.message || "Failed to delete note"
          );
        }
      });

      toast.success("Note deleted successfully!");

      await delay(500);
      await fetchNotes();
    } catch (error) {
      console.error("Delete note error:", error);
      if (error.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error(error.message || "Failed to delete note");
      }
    }
  };

  const editNote = (note) => {
    setForm({
      title: note.title || "",
      content: note.content || "",
      tags: note.tags ? note.tags.join(", ") : "",
      isFavorite: note.isFavorite || false,
    });
    setEditingId(note._id);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: "", content: "", tags: "", isFavorite: false });
    setShowForm(false);
  };

  const getFilteredAndSortedNotes = () => {
    let filtered = notes.filter((note) => {
      const matchesSearch = search
        ? note.title.toLowerCase().includes(search.toLowerCase()) ||
          note.content.toLowerCase().includes(search.toLowerCase())
        : true;

      const matchesTags = tags
        ? note.tags?.some((noteTag) =>
            tags
              .split(",")
              .map((tag) => tag.trim().toLowerCase())
              .some((filterTag) => noteTag.toLowerCase().includes(filterTag))
          )
        : true;

      const matchesFavorites = showFavoritesOnly ? note.isFavorite : true;

      return matchesSearch && matchesTags && matchesFavorites;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "created":
          aValue = new Date(a.createdAt || a._id);
          bValue = new Date(b.createdAt || b._id);
          break;
        case "favorite":
          aValue = a.isFavorite ? 1 : 0;
          bValue = b.isFavorite ? 1 : 0;
          break;
        default:
          aValue = new Date(a.updatedAt || a.createdAt || a._id);
          bValue = new Date(b.updatedAt || b.createdAt || b._id);
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  };

  const filtered = getFilteredAndSortedNotes();

  const getTagColor = (tag) => {
    const colors = [
      "bg-purple-100 text-purple-800",
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-yellow-100 text-yellow-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
    ];
    return colors[tag.length % colors.length];
  };

  const favoriteCount = notes.filter((note) => note.isFavorite).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-2">
              📝 My Notes
            </h1>
            <p className="text-slate-600 text-lg">
              Welcome back, {user?.username || "User"}!
            </p>
            <div className="flex justify-center gap-4 mt-2 text-sm text-slate-500">
              <span>Total: {notes.length}</span>
              <span>Favorites: {favoriteCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <input
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-slate-50 focus:bg-white"
                placeholder="Search notes..."
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
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-slate-50 focus:bg-white"
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

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Show Favorites Only
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="updated">Last Updated</option>
                <option value="created">Date Created</option>
                <option value="title">Title</option>
                <option value="favorite">Favorites First</option>
              </select>

              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                title={`Sort ${
                  sortOrder === "asc" ? "Descending" : "Ascending"
                }`}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            {showForm ? "Cancel" : "✨ Create New Note"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 border-blue-500">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              {editingId ? "Edit Note" : "Create New Note"}
            </h2>
            <div className="space-y-4">
              <input
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-slate-50 focus:bg-white"
                placeholder="Note title..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <textarea
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-slate-50 focus:bg-white min-h-[120px] resize-y"
                placeholder="Write your note content..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
              <input
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-slate-50 focus:bg-white"
                placeholder="Tags (comma separated)"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFavorite}
                    onChange={(e) =>
                      setForm({ ...form, isFavorite: e.target.checked })
                    }
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Mark as Favorite
                  </span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
                  onClick={editingId ? updateNote : createNote}
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : editingId
                    ? "Update Note"
                    : "Save Note"}
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
            {filtered.map((note) => (
              <div
                key={note._id}
                className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 ${
                  note.isFavorite ? "border-red-500" : "border-blue-500"
                } overflow-hidden`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-slate-800 line-clamp-2 flex-1">
                      {note.title}
                    </h3>
                  </div>

                  <p className="text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                    {note.content}
                  </p>

                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {note.tags.map((tag, tagIndex) => (
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

                  <div className="text-xs text-slate-400 mb-4">
                    {note.updatedAt && (
                      <p>
                        Updated: {new Date(note.updatedAt).toLocaleDateString()}
                      </p>
                    )}
                    {note.createdAt && (
                      <p>
                        Created: {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => editNote(note)}
                      className="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteNote(note._id)}
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
            <div className="text-6xl mb-4">
              {showFavoritesOnly ? "❤️" : "📝"}
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              {search || tags || showFavoritesOnly
                ? "No notes found"
                : "No notes yet"}
            </h3>
            <p className="text-slate-600">
              {search || tags || showFavoritesOnly
                ? "Try adjusting your search, filter criteria, or favorite settings"
                : "Create your first note to get started!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
