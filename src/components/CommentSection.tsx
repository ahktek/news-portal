"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";

type Comment = {
  id: string;
  articleId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export default function CommentSection({ articleId }: { articleId: string }) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "c-1",
      articleId,
      authorName: "সাদমান রহমান",
      body: "নিবন্ধটি অত্যন্ত সময়োপযোগী ও বিশ্লেষণধর্মী। আমাদের অর্থনৈতিক সক্ষমতা বৃদ্ধিতে এটি ভূমিকা রাখবে আশা করি।",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "c-2",
      articleId,
      authorName: "নুসরাত জাহান",
      body: "এলডিসি উত্তরণ আমাদের জন্য যেমন গৌরবের, তেমনই এটি একটি বড় চ্যালেঞ্জও বটে। আমাদের নীতিগত সংস্কার দরকার।",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    }
  ]);
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !body.trim()) return;

    setError("");

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      articleId,
      authorName: authorName.trim(),
      body: body.trim(),
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, newComment]);
    setAuthorName("");
    setBody("");
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-lg font-bold tracking-tight text-tangent-black">মন্তব্য ও আলোচনা</h2>
        <hr className="cobalt-rule" />
      </div>

      <form onSubmit={handleSubmit} className="mb-8 bg-white border border-tangent-border p-4 rounded-lg shadow-2xs">
        <h3 className="text-sm font-bold mb-3 text-tangent-black">আপনার মতামত দিন</h3>
        <div className="mb-3">
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="আপনার নাম"
            className="admin-input text-sm"
            required
            maxLength={50}
          />
        </div>
        <div className="mb-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="মতামত লিখুন..."
            className="admin-input text-sm resize-y min-h-[80px]"
            required
            maxLength={2000}
          />
        </div>
        {error && <p className="text-tangent-red text-xs mb-2">{error}</p>}
        <button
          type="submit"
          disabled={!authorName.trim() || !body.trim()}
          className="admin-btn admin-btn-primary text-sm disabled:opacity-50"
        >
          মন্তব্য করুন
        </button>
      </form>

      <div className="space-y-4">
        {comments.length === 0 && (
          <p className="text-tangent-slate text-sm">কোনো মন্তব্য পাওয়া যায়নি। প্রথম মন্তব্যকারী হোন।</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="comment-bubble py-3 animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm text-tangent-black">{comment.authorName}</span>
              <span className="text-xs text-tangent-slate">{formatDate(comment.createdAt)}</span>
            </div>
            <p className="text-sm leading-relaxed text-tangent-slate">{comment.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}