"use client";

import { useEffect, useRef, useState } from "react";

// A scene layer that survives its art not being there.
//
// Story mode and v4 merged on 2 Sep referencing eleven images that had never
// been committed (scripts/check_story_assets.mjs now catches that before it
// merges). While they were missing, every chapter drew four broken-image icons
// and v4's path showed a blank circle where the client's face goes, which reads
// as a broken app rather than as art that has not arrived.
//
// So a failed load falls back to the same box with the same classes, minus the
// browser's broken icon. Characters can pass an `initial`, which is the one
// piece of information the scene actually loses without them: with it you can
// still tell whose reading you are in.
//
// This is not a substitute for the art. It is what the screen does on the way
// there, and on anyone's machine that has not pulled it yet.
export default function SceneImage({ src, alt = "", className, initial, ref, style }) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef(null);

  // onError alone is not enough, and this was measured rather than reasoned:
  // the first version of this component changed nothing on screen.
  //
  // These pages are server-rendered, so the <img> is in the HTML the browser
  // gets. It starts fetching immediately, and a 404 comes back long before
  // React hydrates and attaches an onError handler — the error event fires at
  // a node that is not listening yet and is never heard again. So the mounted
  // element is also asked directly whether it already failed: a complete image
  // with no intrinsic width did not load.
  useEffect(() => {
    setFailed(false);
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [src]);

  // The caller's ref and this component's own both need the node. The one
  // external caller only measures a bounding box (to aim the speech bubble's
  // tail at the character's face), which the fallback box has too.
  const attach = (node) => {
    imgRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  if (failed) {
    return (
      <span
        ref={attach}
        style={style}
        className={[className, "art-pending"].filter(Boolean).join(" ")}
        aria-hidden="true"
      >
        {initial ? <span className="art-pending-initial">{initial}</span> : null}
      </span>
    );
  }

  return (
    <img
      ref={attach}
      style={style}
      className={className}
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
    />
  );
}
