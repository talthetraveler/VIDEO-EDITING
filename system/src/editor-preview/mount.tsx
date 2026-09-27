/**
 * Instant editor preview — a Remotion <Player> mounted into the review
 * dashboard's timeline editor. The Player plays the SAME <ProjectVideo>
 * composition the final MP4 renders, straight from the source clips in the
 * browser — so trim / reorder / delete / caption edits show up immediately
 * with NO encode. The MP4 render only runs on Publish.
 *
 * esbuild bundles this to scratch/editor-preview/bundle.js (see
 * scripts/build-editor-preview.mjs). review-server.mjs serves it at
 * /editor-preview.js and calls window.__mountPreview(el, data).
 */
import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Player, type PlayerRef } from "@remotion/player";
import { ProjectVideo, type ProjectData } from "../components/ProjectVideo";

const durationOf = (d: ProjectData) =>
  Math.max(
    1,
    d.tracks.video.reduce(
      (n, c) => n + Math.max(1, Math.round(((c.sourceOut - c.sourceIn) / (c.speed ?? 1)) * d.fps)),
      0,
    ),
  );

export type PreviewHandle = {
  update: (d: ProjectData) => void;
  seek: (seconds: number) => void;
  getSeconds: () => number;
  play: () => void;
  pause: () => void;
  playing: boolean;
  onFrame: (cb: (seconds: number) => void) => void;
  destroy: () => void;
};

const Shell = React.forwardRef<PreviewHandle, { initial: ProjectData }>(({ initial }, ref) => {
  const [data, setData] = useState(initial);
  const player = useRef<PlayerRef>(null);
  const frameCb = useRef<((s: number) => void) | null>(null);
  const playing = useRef(false);
  useImperativeHandle(ref, () => ({
    update: (d) => setData(d),
    seek: (s) => player.current?.seekTo(Math.round(s * data.fps)),
    getSeconds: () => (player.current ? player.current.getCurrentFrame() / data.fps : 0),
    play: () => player.current?.play(),
    pause: () => player.current?.pause(),
    get playing() {
      return playing.current;
    },
    onFrame: (cb) => {
      frameCb.current = cb;
    },
    destroy: () => {},
  }));
  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const onF = (e: { detail: { frame: number } }) => frameCb.current?.(e.detail.frame / data.fps);
    const onPlay = () => (playing.current = true);
    const onPause = () => (playing.current = false);
    p.addEventListener("frameupdate", onF);
    p.addEventListener("play", onPlay);
    p.addEventListener("pause", onPause);
    return () => {
      p.removeEventListener("frameupdate", onF);
      p.removeEventListener("play", onPlay);
      p.removeEventListener("pause", onPause);
    };
  }, [data.fps]);
  useEffect(() => {
    // keep the current frame in range when the timeline shrinks
    const p = player.current;
    if (!p) return;
    const max = durationOf(data) - 1;
    if (p.getCurrentFrame() > max) p.seekTo(Math.max(0, max));
  }, [data]);
  return (
    <Player
      ref={player}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={ProjectVideo as any}
      inputProps={{ data }}
      durationInFrames={durationOf(data)}
      compositionWidth={data.width}
      compositionHeight={data.height}
      fps={data.fps}
      style={{ width: "100%", height: "100%" }}
      controls
      loop
      acknowledgeRemotionLicense
    />
  );
});
Shell.displayName = "PreviewShell";

function mountPreview(el: HTMLElement, data: ProjectData): PreviewHandle {
  const root: Root = createRoot(el);
  const box: { h: PreviewHandle | null } = { h: null };
  const setRef = (h: PreviewHandle | null) => {
    box.h = h;
  };
  root.render(<Shell ref={setRef} initial={data} />);
  return {
    update: (d) => box.h?.update(d),
    seek: (s) => box.h?.seek(s),
    getSeconds: () => box.h?.getSeconds() ?? 0,
    play: () => box.h?.play(),
    pause: () => box.h?.pause(),
    get playing() {
      return box.h?.playing ?? false;
    },
    onFrame: (cb) => box.h?.onFrame(cb),
    destroy: () => root.unmount(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__mountPreview = mountPreview;
