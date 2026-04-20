'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ScanValue {
  text?: string;
}

interface ScanConfig {
  scan_type?: 'any' | 'qrcode' | 'barcode' | 'text';
}

interface Props {
  config?: ScanConfig;
  value?: ScanValue;
  onChange: (value: ScanValue) => void;
}

// TODO: tighten type — BarcodeDetector is not in standard lib typings yet
type BarcodeDetectorInstance = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
};

type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => BarcodeDetectorInstance;

export default function ScanInput({ config = {}, value, onChange }: Props) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [detected, setDetected] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);

  const scanTypeLabel: Record<string, string> = {
    qrcode: 'QR Code',
    barcode: 'Barcode (1D)',
    text: 'Text/Manual',
    any: 'ทุกประเภท',
  };

  const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = async () => {
    setError('');
    setDetected(false);

    if (!hasBarcodeDetector) {
      setError('browser_unsupported');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const formats: string[] = [];
      const scanType = config.scan_type || 'any';
      if (scanType === 'qrcode') {
        formats.push('qr_code');
      } else if (scanType === 'barcode') {
        formats.push('code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf', 'codabar', 'code_93');
      } else {
        formats.push('qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf', 'codabar', 'data_matrix', 'aztec', 'pdf417');
      }

      const BarcodeDetector = (window as unknown as { BarcodeDetector: BarcodeDetectorCtor }).BarcodeDetector;
      try {
        detectorRef.current = new BarcodeDetector({ formats });
      } catch {
        detectorRef.current = new BarcodeDetector();
      }

      setScanning(true);

      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const barcodes = await detectorRef.current!.detect(videoRef.current);
          if (barcodes.length > 0) {
            const result = barcodes[0].rawValue;
            onChange({ text: result });
            setDetected(true);
            stopCamera();
          }
        } catch {
          // ignore per-frame errors
        }
      }, 300);
    } catch (err) {
      const e = err as Error;
      if (e.name === 'NotAllowedError') {
        setError('camera_denied');
      } else if (e.name === 'NotFoundError') {
        setError('no_camera');
      } else {
        setError('generic');
      }
      stopCamera();
    }
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ text: e.target.value });
    setDetected(false);
  };

  const clearValue = () => {
    onChange({ text: '' });
    setDetected(false);
  };

  const errorMessages: Record<string, string> = {
    camera_denied: 'ไม่ได้รับอนุญาตใช้กล้อง กรุณาอนุญาตในการตั้งค่า browser',
    no_camera: 'ไม่พบกล้องในอุปกรณ์นี้',
    browser_unsupported: 'Browser ไม่รองรับการสแกน กรุณากรอกเอง',
    generic: 'ไม่สามารถเปิดกล้องได้',
  };

  const currentText = value?.text || '';

  return (
    <div className="space-y-2">
      {config.scan_type && config.scan_type !== 'any' && (
        <p className="text-[10px] text-slate-400">
          ประเภท: {scanTypeLabel[config.scan_type] || config.scan_type}
        </p>
      )}

      {scanning && (
        <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-56 h-56 relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-md" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-md" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-md" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-md" />
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-green-400 opacity-80 animate-bounce" />
            </div>
          </div>
          <button
            type="button"
            onClick={stopCamera}
            className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/80">
            วางโค้ดในกรอบเพื่อสแกน
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="สแกน หรือ กรอก Serial / Code..."
            value={currentText}
            onChange={handleManualChange}
            className={`pr-8 ${detected ? 'border-green-400 bg-green-50' : ''}`}
          />
          {currentText && (
            <button
              type="button"
              onClick={clearValue}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {!scanning && (
          <button
            type="button"
            onClick={startCamera}
            title="เปิดกล้องสแกน"
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium transition-colors shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">สแกน</span>
          </button>
        )}
        {scanning && (
          <button
            type="button"
            onClick={stopCamera}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-medium transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">หยุด</span>
          </button>
        )}
      </div>

      {detected && currentText && (
        <div className="flex items-center gap-1.5 text-xs text-green-600">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>สแกนสำเร็จ: <span className="font-mono font-semibold">{currentText}</span></span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{errorMessages[error] || error}</span>
        </div>
      )}

      {!hasBarcodeDetector && !error && (
        <p className="text-[10px] text-slate-400">
          💡 กรอก Serial / Code ด้านบน หรือใช้ scanner อุปกรณ์ภายนอก
        </p>
      )}
    </div>
  );
}
