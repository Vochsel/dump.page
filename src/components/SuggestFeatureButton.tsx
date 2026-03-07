"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

type FeatureType = "feature" | "fix";
type FeatureKind = "request" | "prompt";

export function SuggestFeatureButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeatureType>("feature");
  const [kind, setKind] = useState<FeatureKind>("request");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [creditOptIn, setCreditOptIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = useMutation(api.featureRequests.submit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    await submit({
      type,
      kind,
      description: description.trim(),
      email: email.trim() || undefined,
      creditOptIn: kind === "prompt" ? creditOptIn : undefined,
    });

    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setDescription("");
      setEmail("");
      setType("feature");
      setKind("request");
      setCreditOptIn(false);
    }, 1500);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors cursor-pointer"
      >
        Suggest a feature
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6">
            {submitted ? (
              <div className="text-center py-8">
                <p className="text-lg font-semibold text-gray-800 font-[family-name:var(--font-poppins)]">
                  Thanks for your suggestion!
                </p>
                <p className="text-sm text-gray-500 mt-1 font-[family-name:var(--font-poppins)]">
                  We&apos;ll review it soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800 font-[family-name:var(--font-poppins)]">
                    Suggest something
                  </h2>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer"
                  >
                    &times;
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 font-[family-name:var(--font-poppins)]">
                      Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as FeatureType)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 font-[family-name:var(--font-poppins)] bg-white"
                    >
                      <option value="feature">Feature</option>
                      <option value="fix">Fix</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 font-[family-name:var(--font-poppins)]">
                      Category
                    </label>
                    <select
                      value={kind}
                      onChange={(e) => setKind(e.target.value as FeatureKind)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 font-[family-name:var(--font-poppins)] bg-white"
                    >
                      <option value="request">Request</option>
                      <option value="prompt">Prompt</option>
                    </select>
                  </div>
                </div>

                {kind === "prompt" && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-xs text-emerald-700 font-[family-name:var(--font-poppins)]">
                      If this prompt is successfully merged, we&apos;ll credit you in the changelog!
                    </p>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={creditOptIn}
                        onChange={(e) => setCreditOptIn(e.target.checked)}
                        className="rounded border-emerald-300 text-emerald-600 accent-emerald-600"
                      />
                      <span className="text-xs text-emerald-700 font-[family-name:var(--font-poppins)]">
                        Yes, credit me in the changelog
                      </span>
                    </label>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 font-[family-name:var(--font-poppins)]">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your suggestion..."
                    rows={3}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 font-[family-name:var(--font-poppins)] resize-none placeholder:text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 font-[family-name:var(--font-poppins)]">
                    Email <span className="text-gray-300">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 font-[family-name:var(--font-poppins)] placeholder:text-gray-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!description.trim()}
                  className="w-full py-2.5 text-white text-sm font-semibold rounded-lg font-[family-name:var(--font-poppins)] transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
                  style={{
                    backgroundColor: "#7bd096",
                    boxShadow: "0 2px 8px rgba(123, 208, 150, 0.4)",
                  }}
                >
                  Submit suggestion
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
