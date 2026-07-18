"use client";

import type { DeckSkinProps } from "@/components/player/skins/types";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

/** One full rotation of the record scrubs this many seconds of the track */
const SCRUB_SECONDS_PER_ROTATION = 10;
/** Degrees of rotation before a pointer-down counts as a scrub, not a click */
const SCRUB_ENGAGE_DEG = 4;
/** Released arm at or above this angle lands on the record (resumes) */
const ARM_DROP_ON_DEG = 12;
const ARM_ON_RECORD_DEG = 25;
const ARM_PARKED_DEG = 0;
const ARM_MIN_DEG = -6;
const ARM_MAX_DEG = 32;

function angleAt(clientX: number, clientY: number, rect: DOMRect) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
}

/** Normalize an angle difference to [-180, 180) so crossing ±180° doesn't jump */
function normalizeDelta(deg: number) {
  return ((deg + 540) % 360) - 180;
}

type ScrubState = {
  pointerId: number;
  rect: DOMRect;
  lastAngle: number;
  total: number;
  engaged: boolean;
  wasPlaying: boolean;
  startMs: number | null;
  durationMs: number;
};

type ArmDragState = {
  pointerId: number;
  pivotX: number;
  pivotY: number;
  startPointerDeg: number;
  startArmDeg: number;
};

export function VinylRecordDeck({ coverUrl, isPlaying, player }: DeckSkinProps) {

  const platterRef = useRef<HTMLDivElement | null>(null);
  const armBaseRef = useRef<HTMLDivElement | null>(null);

  // ── Record scrubbing ──
  const scrubRef = useRef<ScrubState | null>(null);
  const [scrubDeg, setScrubDeg] = useState<number | null>(null);
  // Keep the arm visually on the record while scrubbing mid-playback
  const [scrubHoldArm, setScrubHoldArm] = useState(false);

  const onRecordDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const platter = platterRef.current;
      if (!player || !platter) {
        return;
      }
      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = platter.getBoundingClientRect();
      const s: ScrubState = {
        pointerId: e.pointerId,
        rect,
        lastAngle: angleAt(e.clientX, e.clientY, rect),
        total: 0,
        engaged: false,
        wasPlaying: isPlaying,
        startMs: null,
        durationMs: 0,
      };
      scrubRef.current = s;
      void player
        .getCurrentState()
        .then((state) => {
          if (scrubRef.current !== s) {
            return;
          }
          if (!state || state.duration <= 0) {
            scrubRef.current = null;
            setScrubDeg(null);
            setScrubHoldArm(false);
            return;
          }
          s.startMs = state.position;
          s.durationMs = state.duration;
        })
        .catch(() => {});
    },
    [player, isPlaying]
  );

  const onRecordMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const s = scrubRef.current;
      if (!s || e.pointerId !== s.pointerId) {
        return;
      }
      const angle = angleAt(e.clientX, e.clientY, s.rect);
      s.total += normalizeDelta(angle - s.lastAngle);
      s.lastAngle = angle;
      if (!s.engaged && Math.abs(s.total) > SCRUB_ENGAGE_DEG) {
        s.engaged = true;
        setScrubHoldArm(s.wasPlaying);
        if (s.wasPlaying) {
          void player?.pause().catch(() => {});
        }
      }
      if (s.engaged) {
        setScrubDeg(s.total);
      }
    },
    [player]
  );

  const onRecordUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const s = scrubRef.current;
      if (!s || e.pointerId !== s.pointerId) {
        return;
      }
      scrubRef.current = null;
      if (s.engaged && player && s.startMs !== null && s.durationMs > 0) {
        const offsetMs = (s.total / 360) * SCRUB_SECONDS_PER_ROTATION * 1000;
        const targetMs = Math.min(
          Math.max(s.startMs + offsetMs, 0),
          s.durationMs - 500
        );
        void player
          .seek(Math.floor(targetMs))
          .then(() => {
            if (s.wasPlaying) {
              return player.resume();
            }
          })
          .catch(() => {});
      }
      setScrubDeg(null);
      setScrubHoldArm(false);
    },
    [player]
  );

  // ── Tonearm dragging ──
  const armRef = useRef<ArmDragState | null>(null);
  const [armDeg, setArmDeg] = useState<number | null>(null);
  const [armDragging, setArmDragging] = useState(false);
  // Desired isPlaying after an arm drop; the inline arm angle stays applied until
  // the SDK state catches up so the arm doesn't snap back while pause/resume is in flight
  const [armPending, setArmPending] = useState<boolean | null>(null);
  const armClearTimerRef = useRef<number | null>(null);

  const clearArmTimer = useCallback(() => {
    if (armClearTimerRef.current !== null) {
      window.clearTimeout(armClearTimerRef.current);
      armClearTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearArmTimer, [clearArmTimer]);

  // Inline arm angle applies while dragging, or after a drop until the SDK confirms
  const armHold =
    armDragging || (armPending !== null && isPlaying !== armPending);
  const armAngleOverride = armHold ? armDeg : null;

  const armAngleFromEvent = useCallback(
    (e: React.PointerEvent, drag: ArmDragState) => {
      const pointerDeg =
        (Math.atan2(e.clientY - drag.pivotY, e.clientX - drag.pivotX) * 180) /
        Math.PI;
      const next =
        drag.startArmDeg + normalizeDelta(pointerDeg - drag.startPointerDeg);
      return Math.min(Math.max(next, ARM_MIN_DEG), ARM_MAX_DEG);
    },
    []
  );

  const onArmDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const base = armBaseRef.current;
      if (!base || !player) {
        return;
      }
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      clearArmTimer();
      setArmPending(null);
      const rect = base.getBoundingClientRect();
      const pivotX = rect.left + rect.width / 2;
      const pivotY = rect.top + rect.height / 2;
      const drag: ArmDragState = {
        pointerId: e.pointerId,
        pivotX,
        pivotY,
        startPointerDeg:
          (Math.atan2(e.clientY - pivotY, e.clientX - pivotX) * 180) / Math.PI,
        startArmDeg:
          armAngleOverride ?? (isPlaying ? ARM_ON_RECORD_DEG : ARM_PARKED_DEG),
      };
      armRef.current = drag;
      setArmDragging(true);
      setArmDeg(drag.startArmDeg);
    },
    [player, isPlaying, armAngleOverride, clearArmTimer]
  );

  const onArmMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = armRef.current;
      if (!drag || e.pointerId !== drag.pointerId) {
        return;
      }
      setArmDeg(armAngleFromEvent(e, drag));
    },
    [armAngleFromEvent]
  );

  const onArmUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = armRef.current;
      if (!drag || e.pointerId !== drag.pointerId) {
        return;
      }
      armRef.current = null;
      setArmDragging(false);
      const finalDeg = armAngleFromEvent(e, drag);
      const droppedOnRecord = finalDeg >= ARM_DROP_ON_DEG;
      const targetPlaying = droppedOnRecord;

      if (targetPlaying === isPlaying || !player) {
        // No playback change needed; let the state classes drive the angle
        setArmDeg(null);
        return;
      }

      setArmDeg(droppedOnRecord ? ARM_ON_RECORD_DEG : ARM_PARKED_DEG);
      setArmPending(targetPlaying);
      void (droppedOnRecord ? player.resume() : player.pause()).catch(
        () => {}
      );
      // Fallback: if the SDK never confirms (e.g. no track loaded), release the override
      armClearTimerRef.current = window.setTimeout(() => {
        setArmPending(null);
      }, 2000);
    },
    [player, isPlaying, armAngleFromEvent]
  );

  const scrubbing = scrubDeg !== null;
  const armOnRecord = isPlaying || (scrubbing && scrubHoldArm);

  return (
    <div className="vinyl-player-deck" data-speed="33">
      <div
        id="turntable"
        className={cn(
          isPlaying ? "play" : "pause",
          armOnRecord ? "arm-on-record" : "arm-parked",
          scrubbing && "scrubbing",
          armDragging && "arm-dragging"
        )}
        style={
          armAngleOverride !== null
            ? ({ "--arm-angle": `${armAngleOverride}deg` } as React.CSSProperties)
            : undefined
        }
      >
        <div className="vinyl-platter" ref={platterRef}>
          <div
            id="record"
            style={
              scrubDeg !== null
                ? { transform: `rotate(${scrubDeg}deg)` }
                : undefined
            }
            onPointerDown={onRecordDown}
            onPointerMove={onRecordMove}
            onPointerUp={onRecordUp}
            onPointerCancel={onRecordUp}
          >
            <div id="record-inner">
              <div id="label">
                {coverUrl ? (
                  <>
                    <Image
                      src={coverUrl}
                      alt=""
                      fill
                      className="vinyl-label-cover object-cover"
                      sizes="(max-width: 1100px) 40vw, 200px"
                    />
                    <span className="sr-only">Album art from Spotify</span>
                  </>
                ) : (
                  <div className="vinyl-label-placeholder" aria-hidden />
                )}
              </div>
            </div>
          </div>
          <div id="shine" aria-hidden />
          <div id="controls">
            <div id="arm">
              <div className="base" ref={armBaseRef} />
              <div className="arm">
                <div
                  className="head"
                  role="button"
                  aria-label={
                    isPlaying
                      ? "Drag the tonearm off the record to pause"
                      : "Drag the tonearm onto the record to play"
                  }
                  onPointerDown={onArmDown}
                  onPointerMove={onArmMove}
                  onPointerUp={onArmUp}
                  onPointerCancel={onArmUp}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
