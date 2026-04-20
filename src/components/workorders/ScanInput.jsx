import React, { useState, useRef, useEffect, useCallback } from "react";
import { ScanLine, Camera, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * ScanInput — Camera-based QR/Barcode scanner with manual fallback.
 * Uses BarcodeDetector API (Chrome/Edge/Android) or falls back to manual input.
 */
export default function ScanInput({ config = {}, value, onChange }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [detected, setDetected] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const detectorRef = useRef(null);

  const scanTypeLabel = {
    qrcode: "QR Code",
    barcode: "Barcode (1D)",
    text: "Text/Manual",
    any: "ทุกประเภท",
  };

  // Check if BarcodeDetector is available
  const hasBarcodeDetector = typeof window !== "undefined" && "BarcodeDetector" in window;

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
    setError("");
    setDetected(false);

    if (!hasBarcodeDetector) {
      setError("browser_unsupported");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Setup BarcodeDetector formats
      const formats = [];
      const scanType = config.scan_type || "any";
      if (scanType === "qrcode") {
        formats.push("qr_code");
      } else if (scanType === "barcode") {
        formats.push("code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "itf", "codabar", "code_93");
      } else {
        // "any" — use all common formats
        formats.push("qr_code", "code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "itf", "codabar", "data_matrix", "aztec", "pdf417");
      }

      try {
        detectorRef.current = new window.BarcodeDetector({ formats });
      } catch {
        // Some browsers support BarcodeDetector but not all formats; fallback to no format filter
        detectorRef.current = new window.BarcodeDetector();
      }

      setScanning(true);

      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const barcodes = await detectorRef.current.detect(videoRef.current);
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
      if (err.name === "NotAllowedError") {
        setError("camera_denied");
      } else if (err.name === "NotFoundError") {
        setError("no_camera");
      } else {
        setError("generic");
      }
      stopCamera();
    }
  };

  const handleManualChange = (e) => {
    onChange({ text: e.target.value });
    setDetected(false);
  };

  const clearValue = () => {
    onChange({ text: "" });
    setDetected(false);
  };

  const errorMessages = {
    camera_denied: "ไม่ได้รับอนุญาตใช้กล้อง กรุณาอนุญาตในการตั้งค่า browser",
    no_camera: "ไม่พบกล้องในอุปกรณ์นี้",
    browser_unsupported: "Browser ไม่รองรับการสแกน กรุณากรอกเอง",
    generic: "ไม่สามารถเปิดกล้องได้",
  };

  const currentText = value?.text || "";

  return (
    <div className="space-y-2">
      {/* Scan type label */}
      {config.scan_type && config.scan_type !== "any" && (
        <p className="text-[10px] text-slate-400">
          ประเภท: {scanTypeLabel[config.scan_type] || config.scan_type}
        </p>
      )}

      {/* Camera view */}
      {scanning && (
        <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {/* Scan frame overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-56 h-56 relative">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-md" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-md" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-md" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-md" />
              {/* Scanning line animation */}
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-green-400 opacity-80 animate-bounce" />
            </div>
          </div>
          {/* Close button */}
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

      {/* Result / input row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="สแกน หรือ กรอก Serial / Code..."
            value={currentText}
            onChange={handleManualChange}
            className={`pr-8 ${detected ? "border-green-400 bg-green-50" : ""}`}
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

        {/* Scan button */}
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

      {/* Status messages */}
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