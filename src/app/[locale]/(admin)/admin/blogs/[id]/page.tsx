"use client";

import { useParams } from "next/navigation";
import BlogEditor from "@/components/admin/blogs/BlogEditor";

export default function AdminBlogEditPage() {
  const params = useParams();
  const id = String(params?.id || "");
  return <BlogEditor mode="edit" blogId={id} />;
}
