import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Leaflet mounts with a zero-size container when placed inside something that starts hidden
 * (a tab panel, a collapsed section), which leaves its internal projection wrong — markers land
 * in the wrong place — until the container's real size is measured. Re-invalidate whenever the
 * container's size actually changes so it self-corrects the moment it becomes visible.
 */
export default function MapSizeFixer() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}
