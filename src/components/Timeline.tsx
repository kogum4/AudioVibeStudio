import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TextOverlay } from '../types/visual';

interface TimelineTrack {
  id: string;
  name: string;
  type: 'effect' | 'text' | 'audio';
  items: TimelineItem[];
  visible: boolean;
  locked: boolean;
}

interface TimelineItem {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  type: 'effect' | 'text' | 'transition';
  data: any;
  color: string;
}

interface TimelineProps {
  duration: number; // Total duration in ms
  currentTime: number;
  onTimeChange: (time: number) => void;
  onItemSelect?: (item: TimelineItem | null) => void;
  textOverlays?: TextOverlay[];
  onTextOverlayUpdate?: (overlays: TextOverlay[]) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  onTimeChange,
  onItemSelect,
  textOverlays = [],
  onTextOverlayUpdate
}) => {
  const [tracks, setTracks] = useState<TimelineTrack[]>([
    {
      id: 'audio',
      name: 'Audio',
      type: 'audio',
      items: [],
      visible: true,
      locked: false
    },
    {
      id: 'effects',
      name: 'Visual Effects',
      type: 'effect',
      items: [],
      visible: true,
      locked: false
    },
    {
      id: 'text',
      name: 'Text Overlays',
      type: 'text',
      items: [],
      visible: true,
      locked: false
    }
  ]);

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<{
    type: 'playhead' | 'item' | 'resize';
    itemId?: string;
    startX?: number;
    startTime?: number;
    edge?: 'start' | 'end';
  } | null>(null);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [scroll, setScroll] = useState(0);

  // Convert time to pixel position
  const timeToPixel = useCallback((time: number): number => {
    const pixelsPerMs = (800 * zoom) / duration;
    return (time * pixelsPerMs) - scroll;
  }, [duration, zoom, scroll]);

  // Convert pixel position to time
  const pixelToTime = useCallback((pixel: number): number => {
    const pixelsPerMs = (800 * zoom) / duration;
    return Math.max(0, Math.min(duration, (pixel + scroll) / pixelsPerMs));
  }, [duration, zoom, scroll]);

  // Update text track items when text overlays change
  useEffect(() => {
    const textItems: TimelineItem[] = textOverlays.map(overlay => ({
      id: overlay.id,
      name: overlay.text,
      startTime: overlay.timing.startTime,
      endTime: overlay.timing.endTime || overlay.timing.startTime + overlay.animation.duration,
      type: 'text' as const,
      data: overlay,
      color: '#4ecdc4'
    }));

    setTracks(prev => prev.map(track => 
      track.id === 'text' ? { ...track, items: textItems } : track
    ));
  }, [textOverlays]);

  const handleMouseDown = (e: React.MouseEvent, type: 'playhead' | 'item' | 'resize', itemId?: string, edge?: 'start' | 'end') => {
    e.preventDefault();
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = e.clientX - rect.left;
    const startTime = pixelToTime(startX);

    setIsDragging({
      type,
      itemId,
      startX,
      startTime,
      edge
    });

    if (type === 'playhead') {
      onTimeChange(startTime);
    } else if (type === 'item' && itemId) {
      setSelectedItem(itemId);
      const item = tracks.flatMap(t => t.items).find(i => i.id === itemId);
      onItemSelect?.(item || null);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentTime = pixelToTime(currentX);

    if (isDragging.type === 'playhead') {
      onTimeChange(currentTime);
    } else if (isDragging.type === 'item' && isDragging.itemId) {
      // Move item
      const deltaTime = currentTime - (isDragging.startTime || 0);
      moveTimelineItem(isDragging.itemId, deltaTime);
    } else if (isDragging.type === 'resize' && isDragging.itemId && isDragging.edge) {
      // Resize item
      resizeTimelineItem(isDragging.itemId, isDragging.edge, currentTime);
    }
  }, [isDragging, onTimeChange, pixelToTime]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const moveTimelineItem = (itemId: string, deltaTime: number) => {
    setTracks(prev => prev.map(track => ({
      ...track,
      items: track.items.map(item => {
        if (item.id === itemId) {
          const newStartTime = Math.max(0, item.startTime + deltaTime);
          const itemDuration = item.endTime - item.startTime;
          const newEndTime = Math.min(duration, newStartTime + itemDuration);
          
          return {
            ...item,
            startTime: newStartTime,
            endTime: newEndTime
          };
        }
        return item;
      })
    })));

    // Update text overlays if this is a text item
    if (onTextOverlayUpdate) {
      const updatedOverlays = textOverlays.map(overlay => {
        if (overlay.id === itemId) {
          const newStartTime = Math.max(0, overlay.timing.startTime + deltaTime);
          return {
            ...overlay,
            timing: {
              ...overlay.timing,
              startTime: newStartTime
            }
          };
        }
        return overlay;
      });
      onTextOverlayUpdate(updatedOverlays);
    }
  };

  const resizeTimelineItem = (itemId: string, edge: 'start' | 'end', newTime: number) => {
    setTracks(prev => prev.map(track => ({
      ...track,
      items: track.items.map(item => {
        if (item.id === itemId) {
          if (edge === 'start') {
            return {
              ...item,
              startTime: Math.max(0, Math.min(newTime, item.endTime - 100))
            };
          } else {
            return {
              ...item,
              endTime: Math.max(item.startTime + 100, Math.min(newTime, duration))
            };
          }
        }
        return item;
      })
    })));

    // Update text overlays if this is a text item
    if (onTextOverlayUpdate) {
      const updatedOverlays = textOverlays.map(overlay => {
        if (overlay.id === itemId) {
          if (edge === 'start') {
            return {
              ...overlay,
              timing: {
                ...overlay.timing,
                startTime: Math.max(0, Math.min(newTime, overlay.timing.endTime - 100))
              }
            };
          } else {
            return {
              ...overlay,
              timing: {
                ...overlay.timing,
                endTime: Math.max(overlay.timing.startTime + 100, Math.min(newTime, duration))
              }
            };
          }
        }
        return overlay;
      });
      onTextOverlayUpdate(updatedOverlays);
    }
  };

  const deleteSelectedItem = () => {
    if (!selectedItem) return;

    setTracks(prev => prev.map(track => ({
      ...track,
      items: track.items.filter(item => item.id !== selectedItem)
    })));

    // Remove from text overlays if this is a text item
    if (onTextOverlayUpdate) {
      const updatedOverlays = textOverlays.filter(overlay => overlay.id !== selectedItem);
      onTextOverlayUpdate(updatedOverlays);
    }

    setSelectedItem(null);
    onItemSelect?.(null);
  };

  const formatTime = (time: number): string => {
    const seconds = Math.floor(time / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const toggleTrackVisibility = (trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, visible: !track.visible } : track
    ));
  };

  const toggleTrackLock = (trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, locked: !track.locked } : track
    ));
  };

  return (
    <div className="timeline">
      {/* Timeline Header */}
      <div className="timeline-header">
        <div className="timeline-controls">
          <span className="time-display">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div className="zoom-controls">
            <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}>-</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(5, zoom + 0.1))}>+</button>
          </div>
        </div>
        
        {selectedItem && (
          <div className="item-controls">
            <button onClick={deleteSelectedItem} className="delete-button">
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Track Headers */}
      <div className="track-headers">
        {tracks.map(track => (
          <div key={track.id} className="track-header">
            <div className="track-name">{track.name}</div>
            <div className="track-buttons">
              <button
                onClick={() => toggleTrackVisibility(track.id)}
                className={`track-button ${track.visible ? 'active' : ''}`}
              >
                👁
              </button>
              <button
                onClick={() => toggleTrackLock(track.id)}
                className={`track-button ${track.locked ? 'active' : ''}`}
              >
                🔒
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Content */}
      <div className="timeline-content" ref={timelineRef}>
        {/* Time Ruler */}
        <div className="time-ruler">
          {Array.from({ length: Math.ceil(duration / 1000) + 1 }, (_, i) => (
            <div
              key={i}
              className="time-mark"
              style={{ left: timeToPixel(i * 1000) }}
            >
              <span>{formatTime(i * 1000)}</span>
            </div>
          ))}
        </div>

        {/* Tracks */}
        {tracks.map(track => (
          <div key={track.id} className={`track ${!track.visible ? 'hidden' : ''}`}>
            {track.items.map(item => (
              <div
                key={item.id}
                className={`timeline-item ${selectedItem === item.id ? 'selected' : ''}`}
                style={{
                  left: timeToPixel(item.startTime),
                  width: Math.max(20, timeToPixel(item.endTime) - timeToPixel(item.startTime)),
                  backgroundColor: item.color
                }}
                onMouseDown={(e) => handleMouseDown(e, 'item', item.id)}
              >
                <div className="item-content">
                  <span className="item-name">{item.name}</span>
                </div>
                
                {/* Resize handles */}
                <div
                  className="resize-handle left"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e, 'resize', item.id, 'start');
                  }}
                />
                <div
                  className="resize-handle right"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e, 'resize', item.id, 'end');
                  }}
                />
              </div>
            ))}
          </div>
        ))}

        {/* Playhead */}
        <div
          className="playhead"
          style={{ left: timeToPixel(currentTime) }}
          onMouseDown={(e) => handleMouseDown(e, 'playhead')}
        >
          <div className="playhead-line" />
          <div className="playhead-handle" />
        </div>
      </div>

      <style>{`
        .timeline {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          overflow: hidden;
          margin: 20px 0;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          background: #2a2a2a;
          border-bottom: 1px solid #333;
        }

        .timeline-controls {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .time-display {
          color: #ccc;
          font-family: monospace;
          font-size: 14px;
        }

        .zoom-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .zoom-controls button {
          width: 24px;
          height: 24px;
          background: #4ecdc4;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.2s;
        }

        .zoom-controls button:hover {
          background: #45b7b8;
        }

        .zoom-controls span {
          color: #ccc;
          font-size: 12px;
          min-width: 40px;
          text-align: center;
        }

        .item-controls {
          display: flex;
          gap: 10px;
        }

        .delete-button {
          padding: 6px 12px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.2s;
        }

        .delete-button:hover {
          background: #c0392b;
        }

        .track-headers {
          width: 200px;
          float: left;
          background: #2a2a2a;
        }

        .track-header {
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 15px;
          border-bottom: 1px solid #333;
          color: #ccc;
        }

        .track-name {
          font-size: 14px;
          font-weight: 500;
        }

        .track-buttons {
          display: flex;
          gap: 5px;
        }

        .track-button {
          width: 24px;
          height: 24px;
          background: #444;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.2s;
        }

        .track-button.active {
          background: #4ecdc4;
        }

        .track-button:hover {
          background: #555;
        }

        .track-button.active:hover {
          background: #45b7b8;
        }

        .timeline-content {
          margin-left: 200px;
          position: relative;
          height: 240px;
          overflow-x: auto;
          overflow-y: hidden;
          background: #1a1a1a;
        }

        .time-ruler {
          height: 30px;
          position: relative;
          background: #2a2a2a;
          border-bottom: 1px solid #333;
        }

        .time-mark {
          position: absolute;
          top: 0;
          height: 100%;
          border-left: 1px solid #444;
          padding-left: 5px;
          display: flex;
          align-items: center;
        }

        .time-mark span {
          color: #ccc;
          font-size: 10px;
          font-family: monospace;
        }

        .track {
          height: 60px;
          position: relative;
          border-bottom: 1px solid #333;
        }

        .track.hidden {
          opacity: 0.3;
        }

        .timeline-item {
          position: absolute;
          top: 10px;
          height: 40px;
          border-radius: 4px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.2s;
          user-select: none;
        }

        .timeline-item:hover {
          border-color: rgba(255, 255, 255, 0.3);
        }

        .timeline-item.selected {
          border-color: #4ecdc4;
        }

        .item-content {
          padding: 8px;
          height: 100%;
          display: flex;
          align-items: center;
          overflow: hidden;
        }

        .item-name {
          color: white;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .resize-handle {
          position: absolute;
          top: 0;
          width: 6px;
          height: 100%;
          cursor: ew-resize;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .timeline-item:hover .resize-handle {
          opacity: 1;
        }

        .resize-handle.left {
          left: -3px;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.5));
        }

        .resize-handle.right {
          right: -3px;
          background: linear-gradient(to left, transparent, rgba(255, 255, 255, 0.5));
        }

        .playhead {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          z-index: 10;
          cursor: ew-resize;
        }

        .playhead-line {
          width: 2px;
          height: 100%;
          background: #ff6b6b;
          box-shadow: 0 0 4px rgba(255, 107, 107, 0.5);
        }

        .playhead-handle {
          position: absolute;
          top: -5px;
          left: -6px;
          width: 14px;
          height: 14px;
          background: #ff6b6b;
          border-radius: 50%;
          cursor: ew-resize;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};