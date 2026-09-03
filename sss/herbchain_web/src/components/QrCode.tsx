import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface QrCodeProps {
  /** The text the code encodes — normally an absolute verification URL. */
  value: string;
  /** Rendered edge length in pixels. */
  size?: number;
  className?: string;
}

/**
 * A genuinely scannable QR code.
 *
 * The previous product QR was a hand-drawn decorative SVG that looked like a
 * code but encoded nothing — a phone camera would find no data in it. This
 * renders a real one, so the printed label actually resolves to the
 * verification page.
 *
 * The generator is loaded on demand: it is only needed on the few screens that
 * show a code, and keeping it out of the main bundle costs nothing here.
 */
export default function QrCode({ value, size = 220, className = '' }: QrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDataUrl(null);
    setFailed(false);

    (async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        // Rendered at 2x for crisp display and for print, where a QR that is
        // merely screen-resolution often fails to scan.
        const url = await QRCode.toDataURL(value, {
          // 4 modules is the quiet zone the QR spec requires. Narrower margins
          // look tidier but stop many phone cameras locking on to the code.
          margin: 4,
          width: size * 2,
          errorCorrectionLevel: 'M',
          color: { dark: '#0B3B20', light: '#FFFFFF' },
        });
        if (!cancelled) setDataUrl(url);
      } catch (err) {
        console.error('QR generation failed:', err);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground ${className}`}
        style={{ width: size, height: size }}
      >
        Could not render code
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-muted/40 ${className}`}
        style={{ width: size, height: size }}
      >
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      width={size}
      height={size}
      alt={`QR code for ${value}`}
      className={className}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
