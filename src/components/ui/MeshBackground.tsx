"use client";

// Persistent ambient mesh — lives in the root layout, never remounts.
// Three blobs drift at different speeds, always present, adding depth without distraction.
export function MeshBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <div
        className="blob-a absolute rounded-full"
        style={{
          top: "-20%",
          left: "-15%",
          width: "70vmax",
          height: "70vmax",
          background: "radial-gradient(circle, var(--mesh-a) 0%, transparent 70%)",
        }}
      />
      <div
        className="blob-b absolute rounded-full"
        style={{
          top: "30%",
          left: "50%",
          width: "60vmax",
          height: "60vmax",
          background: "radial-gradient(circle, var(--mesh-b) 0%, transparent 70%)",
        }}
      />
      <div
        className="blob-c absolute rounded-full"
        style={{
          top: "65%",
          left: "-5%",
          width: "50vmax",
          height: "50vmax",
          background: "radial-gradient(circle, var(--mesh-c) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
