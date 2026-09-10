"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  type GrantResult,
  grantStampAction,
  grantStampByUsernameAction,
} from "./action";
import styles from "./scan.module.css";

type ScannerSpot = { id: string; name: string };

/**
 * The subset of the Barcode Detection API we use. It is not in lib.dom yet,
 * and it is absent entirely on iOS Safari — hence the jsQR fallback below.
 */
type DetectedBarcode = { rawValue: string };
type BarcodeDetectorLike = {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
};
declare const BarcodeDetector: {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
};

type CameraStatus = "idle" | "starting" | "scanning" | "denied" | "failed";

/** How often to look at a frame. 8/s reads instantly and spares the battery. */
const SCAN_INTERVAL_MS = 125;
/** Ignore the same code for this long, so one badge is not read 30 times. */
const REPEAT_MS = 2500;

export function Scanner({ spots }: { spots: readonly ScannerSpot[] }) {
  const [spotId, setSpotId] = useState(spots[0]?.id ?? "");
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [result, setResult] = useState<GrantResult | null>(null);
  const [isBusy, setBusy] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Refs rather than state: these are read inside the scan loop, where a
  // re-render would not have happened yet, and none of them belongs on screen.
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);
  const busyRef = useRef(false);

  const submit = useCallback(
    async (code: string) => {
      const now = Date.now();
      const last = lastCodeRef.current;
      if (last && last.code === code && now - last.at < REPEAT_MS) return;
      if (busyRef.current) return;

      lastCodeRef.current = { code, at: now };
      busyRef.current = true;
      setBusy(true);
      try {
        setResult(await grantStampAction(spotId, code));
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
      // Changing booth re-creates this, which restarts the scan loop below —
      // cheap, and it guarantees a scan can never be filed against the spot
      // that was selected a moment ago.
    },
    [spotId],
  );

  const submitUsername = useCallback(
    async (username: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      try {
        setResult(await grantStampByUsernameAction(spotId, username));
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [spotId],
  );

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    setStatus("starting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        // The rear camera; a laptop with only a front camera still works, the
        // constraint is a preference rather than a requirement.
        video: { facingMode: "environment" },
      });
    } catch (error) {
      // Distinguish "said no" from "no camera / not https", because the fix
      // differs: one is a browser permission, the other is the device.
      setStatus(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "denied"
          : "failed",
      );
      return;
    }

    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    video.srcObject = stream;
    await video.play().catch(() => undefined);
    setStatus("scanning");
  }, []);

  // Stop the camera when the operator leaves the page. Without this the
  // recording indicator stays lit and the track keeps the device awake.
  useEffect(() => stop, [stop]);

  useEffect(() => {
    if (status !== "scanning") return;

    let cancelled = false;
    let detector: BarcodeDetectorLike | null = null;
    let decodeFallback: typeof import("jsqr").default | null = null;

    const readFrame = async () => {
      const video = videoRef.current;
      if (!video || video.readyState < video.HAVE_CURRENT_DATA) return;

      const canvas = (canvasRef.current ??= document.createElement("canvas"));
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (width === 0 || height === 0) return;

      if (detector) {
        const [found] = await detector.detect(video);
        if (found) await submit(found.rawValue);
        return;
      }

      if (!decodeFallback) return;
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(video, 0, 0, width, height);
      const found = decodeFallback(
        context.getImageData(0, 0, width, height).data,
        width,
        height,
      );
      if (found) await submit(found.data);
    };

    const run = async () => {
      if (typeof BarcodeDetector === "function") {
        detector = new BarcodeDetector({ formats: ["qr_code"] });
      } else {
        // Loaded only when the platform has no detector of its own, and only
        // on this route — it never reaches any other page's bundle.
        decodeFallback = (await import("jsqr")).default;
      }

      while (!cancelled) {
        try {
          await readFrame();
        } catch {
          // A dropped frame is not worth stopping the scanner for.
        }
        await new Promise((resolve) => setTimeout(resolve, SCAN_INTERVAL_MS));
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [status, submit]);

  const spotName = spots.find((spot) => spot.id === spotId)?.name ?? "";

  return (
    <div className={styles.scanner}>
      {spots.length > 1 && (
        <label className={styles.field}>
          <span className={styles.fieldLabel}>スタンプを押す展示</span>
          <select
            className={styles.select}
            value={spotId}
            onChange={(event) => setSpotId(event.target.value)}
          >
            {spots.map((spot) => (
              <option key={spot.id} value={spot.id}>
                {spot.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <p className={styles.target}>
        <span className={styles.targetLabel}>押す展示</span>
        <span className={styles.targetName}>{spotName}</span>
      </p>

      <div className={styles.viewport}>
        <video
          ref={videoRef}
          className={styles.video}
          playsInline
          muted
          // Decorative: the operator aims with it, but it carries no
          // information a screen reader could use.
          aria-hidden="true"
        />
        {status !== "scanning" && (
          <div className={styles.overlay}>
            {status === "denied" && (
              <p>
                カメラの使用が許可されていません。
                <br />
                ブラウザの設定から許可してください。
              </p>
            )}
            {status === "failed" && (
              <p>
                カメラを起動できませんでした。
                <br />
                下の手入力をお使いください。
              </p>
            )}
            {status === "starting" && <p>カメラを起動しています…</p>}
            {status === "idle" && (
              <button type="button" className={styles.start} onClick={start}>
                カメラを起動
              </button>
            )}
          </div>
        )}
        {status === "scanning" && <div className={styles.reticle} />}
      </div>

      <p className={styles.result} aria-live="polite">
        {isBusy && <span className={styles.muted}>読み取り中…</span>}
        {!isBusy && result?.status === "collected" && (
          <span className={styles.ok}>
            {result.username} さんに「{result.spotName}」を押しました
          </span>
        )}
        {!isBusy && result?.status === "already" && (
          <span className={styles.muted}>
            {result.username} さんは取得済みです
          </span>
        )}
        {!isBusy && result?.status === "unreadable" && (
          <span className={styles.bad}>QRコードを読み取れませんでした</span>
        )}
        {!isBusy && result?.status === "unknown-user" && (
          <span className={styles.bad}>アカウントが見つかりません</span>
        )}
        {!isBusy && result?.status === "self" && (
          <span className={styles.bad}>自分のカードには押せません</span>
        )}
        {!isBusy && result?.status === "forbidden" && (
          <span className={styles.bad}>この展示を押す権限がありません</span>
        )}
        {!isBusy && result?.status === "signed-out" && (
          <span className={styles.bad}>ログインし直してください</span>
        )}
        {!isBusy && result?.status === "rate-limited" && (
          <span className={styles.bad}>
            回数が多すぎます（{result.retryAfterSeconds}秒後に再開）
          </span>
        )}
      </p>

      {/* Every camera path can fail — permissions, a cracked lens, a phone
          that will not focus. Typing the username is always available. */}
      <form
        className={styles.manual}
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const input = new FormData(form).get("username");
          if (typeof input !== "string" || input.trim() === "") return;
          await submitUsername(input.trim());
          form.reset();
        }}
      >
        <label className={styles.fieldLabel} htmlFor="manual-username">
          読み取れないとき（ユーザー名を手入力）
        </label>
        <div className={styles.manualRow}>
          <input
            id="manual-username"
            name="username"
            className={styles.input}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={32}
            placeholder="1A01"
          />
          <button
            type="submit"
            className={styles.manualSubmit}
            disabled={isBusy}
          >
            押す
          </button>
        </div>
      </form>

      {status === "scanning" && (
        <button type="button" className={styles.stop} onClick={stop}>
          カメラを止める
        </button>
      )}
    </div>
  );
}
