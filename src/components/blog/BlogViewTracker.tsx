"use client";

import { useEffect, useRef } from "react";
import { incrementBlogView } from "@/lib/api/blogs.public";

export default function BlogViewTracker({ blogId }: { blogId: string }) {
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    incrementBlogView(blogId).catch(() => {});
  }, [blogId]);

  return null;
}
