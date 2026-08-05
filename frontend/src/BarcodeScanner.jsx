import React, { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

function BarcodeScanner({ onScanSuccess, onScanError, onClose }) {
  const scannerRef = useRef(null);
  const isMountedRef = useRef(true);
  const startedRef = useRef(false); // Track whether start() completed successfully

  useEffect(() => {
    isMountedRef.current = true;
    startedRef.current = false;

    const html5Qrcode = new Html5Qrcode("qr-reader-region");
    scannerRef.current = html5Qrcode;

    html5Qrcode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 300, height: 100 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
      },
      (decodedText) => {
        if (isMountedRef.current && onScanSuccess) {
          onScanSuccess(decodedText);
        }
      },
      (_errorMessage) => {
        // Per-frame "no barcode found" errors are completely normal — suppress them
      }
    ).then(() => {
      startedRef.current = true; // Only mark as started after the promise resolves
    }).catch((err) => {
      console.error('Failed to start scanner:', err);
    });

    return () => {
      isMountedRef.current = false;
      const scanner = scannerRef.current;
      if (scanner && startedRef.current) {
        // Only call stop() if the scanner actually started successfully
        scanner.stop().then(() => {
          scanner.clear();
        }).catch(() => {
          // Silently ignore stop errors
          scanner.clear();
        });
      } else if (scanner) {
        // Scanner instance created but never started — just clear the DOM
        scanner.clear();
      }
      scannerRef.current = null;
    };
  }, []);

  return (
    <div className="scanner-overlay animate-fade-in">
      <div className="scanner-modal">
        <div className="scanner-header">
          <h3>Scan ISBN Barcode</h3>
          <button type="button" onClick={onClose} className="btn-close-scanner">✕</button>
        </div>
        <div id="qr-reader-region" style={{ width: '100%' }}></div>
        <p className="scanner-hint">Align the barcode within the frame. Works best in good lighting.</p>
      </div>
    </div>
  );
}

export default BarcodeScanner;
