import { useState, useEffect } from 'react';
import type { MouseEventHandler, ReactNode } from 'react';
import type { NextPage } from 'next';
import clsx from 'clsx';
import { useResizeDetector } from 'react-resize-detector';

const VIDEO_ASPECT_RATIO = 16 / 9;
const GAP_PX = 12;
const MINIMUM_VIDEO_HEIGHT_PX = 60;

const Button = ({ onClick, children }: { onClick: MouseEventHandler<HTMLButtonElement>; children?: ReactNode }) => (
  <button className="w-40 rounded-md border-2 border-slate-300 p-2 text-slate-800 hover:bg-slate-100" onClick={onClick}>
    {children}
  </button>
);

const Home: NextPage = () => {
  const { width: containerWidth, height: containerHeight, ref: containerRef } = useResizeDetector<HTMLDivElement>();

  const [showChat, setShowChat] = useState(false);
  const [showBottomBar, setShowBottomBar] = useState(false);

  const [numberOfVideos, setNumberOfVideos] = useState(1);

  const [isWindowTooSmall, setIsWindowTooSmall] = useState(false);
  const [constraints, setConstraints] = useState<{ column: number | null; row: number | null }>({
    column: 1,
    row: null,
  });

  useEffect(() => {
    if (!containerWidth || !containerHeight) return;

    const possibleConstraints: (typeof constraints & { videoHeight: number })[] = [];

    for (let columns = 1; columns <= numberOfVideos; columns++) {
      const rows = Math.ceil(numberOfVideos / columns);

      if (columns * (rows - 1) >= numberOfVideos) continue;
      if ((columns - 1) * rows >= numberOfVideos) continue;

      const itemWidth = (containerWidth - GAP_PX * (columns - 1)) / columns;
      const itemHeight = (containerHeight - GAP_PX * (rows - 1)) / rows;

      if (itemWidth < 0 || itemHeight < 0) continue;

      const itemAspectRatio = itemWidth / itemHeight;
      const relativeAspectRatio = itemAspectRatio / VIDEO_ASPECT_RATIO;

      possibleConstraints.push({
        videoHeight: relativeAspectRatio > 1 ? itemHeight : itemWidth / VIDEO_ASPECT_RATIO,
        column: relativeAspectRatio > 1 ? null : columns,
        row: relativeAspectRatio > 1 ? rows : null,
      });
    }

    const [bestConstraint] = possibleConstraints.sort((a, b) => b.videoHeight - a.videoHeight);
    if (!bestConstraint) return;

    if (bestConstraint.videoHeight < MINIMUM_VIDEO_HEIGHT_PX) {
      setIsWindowTooSmall(true);
      return;
    }

    setConstraints(bestConstraint);
    setIsWindowTooSmall(false);
  }, [containerWidth, containerHeight, numberOfVideos]);

  const videoArray = Array.from({ length: numberOfVideos }, (_, index) => `Video ${index + 1}`);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-wrap justify-center gap-2">
        <span className="flex gap-2">
          <Button onClick={() => setNumberOfVideos(numberOfVideos + 1)}>Add Video</Button>
          <Button onClick={() => setNumberOfVideos(Math.max(numberOfVideos - 1, 1))}>Remove Video</Button>
        </span>
        <span className="flex gap-2">
          <Button onClick={() => setShowChat(!showChat)}>{showChat ? 'Hide Chat' : 'Show Chat'}</Button>
          <Button onClick={() => setShowBottomBar(!showBottomBar)}>
            {showBottomBar ? 'Hide Bottom Bar' : 'Show Bottom Bar'}
          </Button>
        </span>
      </div>
      <div className="flex w-full grow basis-0 gap-4 overflow-clip">
        <div
          className="flex grow  basis-0 flex-wrap content-center items-center justify-center overflow-clip"
          style={{ gap: `${GAP_PX}px` }}
          ref={containerRef}
        >
          {isWindowTooSmall ? (
            <div>Please Expand Your Window</div>
          ) : (
            videoArray.map((video, index) => (
              <div
                className={clsx(
                  'flex items-center justify-center overflow-hidden rounded border border-slate-600 bg-slate-400 p-4',
                  constraints.column && 'w-full',
                  constraints.row && 'h-full'
                )}
                style={{
                  aspectRatio: VIDEO_ASPECT_RATIO.toFixed(6),
                  maxWidth: constraints.column
                    ? `calc((100% - ${GAP_PX * (constraints.column - 1)}px]) / ${constraints.column})`
                    : '',
                  maxHeight: constraints.row
                    ? `calc((100% - ${GAP_PX * (constraints.row - 1)}px) / ${constraints.row})`
                    : '',
                }}
                key={index}
              >
                {video}
              </div>
            ))
          )}
        </div>
        {showChat && <div className="h-full w-96 max-w-[50%] rounded bg-slate-200"></div>}
      </div>
      {showBottomBar && <div className="h-14 w-full rounded bg-slate-200"></div>}
    </div>
  );
};

export default Home;
