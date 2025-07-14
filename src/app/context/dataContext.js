"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import toast from "react-hot-toast";
import { useAuth } from "./authContext";

const DataContext = createContext();

const BASE_URL = "http://localhost:8080/api";

export const DataProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  });

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

  const fetchNotes = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      await retryWithBackoff(async () => {
        const res = await fetch(`${BASE_URL}/notes`, {
          headers: getHeaders(),
        });

        if (res.status === 429) {
          throw { status: 429, message: "Rate limited" };
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        setNotes(data);
      });
    } catch (err) {
      console.error("Fetch notes error:", err);
      if (err.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error("Failed to load notes");
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchBookmarks = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      await retryWithBackoff(async () => {
        const res = await fetch(`${BASE_URL}/bookmarks`, {
          headers: getHeaders(),
        });

        if (res.status === 429) {
          throw { status: 429, message: "Rate limited" };
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        setBookmarks(data);
      });
    } catch (err) {
      console.error("Fetch bookmarks error:", err);
      if (err.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error("Failed to load bookmarks");
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ✅ Use useRef instead of state to track timeout
  const fetchTimeoutRef = useRef(null);

  const debouncedFetch = useCallback(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(async () => {
      if (token) {
        await fetchNotes();
        await delay(500);
        await fetchBookmarks();
      }
    }, 300);
  }, [token, fetchNotes, fetchBookmarks]);

  // ✅ Fetch when token changes, clear data if logged out
  useEffect(() => {
    if (token) {
      debouncedFetch();
    } else {
      setNotes([]);
      setBookmarks([]);
    }

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [token, debouncedFetch]);

  return (
    <DataContext.Provider
      value={{
        notes,
        setNotes,
        fetchNotes,
        bookmarks,
        setBookmarks,
        fetchBookmarks,
        getHeaders,
        loading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
