import { useEffect, useRef } from 'react';
import apiClient from '../lib/api-client';
import type { Board, List } from '../types/board';
import { useSocket } from '../contexts/SocketContext';

interface UseBoardTelemetryOptions {
  board: Board | null;
  lists: List[];
  isLoading: boolean;
  isDragging?: boolean;
}

export const useBoardTelemetry = ({
  board,
  lists,
  isLoading,
  isDragging = false
}: UseBoardTelemetryOptions) => {
  const { socket, isConnected } = useSocket();
  const startTimeRef = useRef<number>(performance.now());
  const reportSentRef = useRef<boolean>(false);
  const currentBoardIdRef = useRef<string | null>(null);

  // Drag & drop FPS sampling
  const fpsSamplesRef = useRef<number[]>([]);
  const frameDropsRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);

  // Socket latency
  const socketPingMsRef = useRef<number>(0);

  // Track board ID switch
  if (board?.id && board.id !== currentBoardIdRef.current) {
    currentBoardIdRef.current = board.id;
    startTimeRef.current = performance.now();
    reportSentRef.current = false;
    fpsSamplesRef.current = [];
    frameDropsRef.current = 0;
  }

  // 1. Measure Socket.io ping latency
  useEffect(() => {
    if (!socket || !isConnected || !board?.id) return;

    const pingStart = performance.now();
    socket.emit('ping', () => {
      const pingDuration = Math.round(performance.now() - pingStart);
      socketPingMsRef.current = pingDuration;
    });
  }, [socket, isConnected, board?.id]);

  // 2. Measure FPS during Drag and Drop
  useEffect(() => {
    if (!isDragging) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      lastFrameTimeRef.current = null;
      return;
    }

    const measureFrame = (time: number) => {
      if (lastFrameTimeRef.current !== null) {
        const delta = time - lastFrameTimeRef.current;
        const currentFps = Math.min(60, Math.round(1000 / delta));
        fpsSamplesRef.current.push(currentFps);

        // A frame drop below 30 FPS (~33.3ms)
        if (delta > 33.3) {
          frameDropsRef.current++;
        }
      }
      lastFrameTimeRef.current = time;
      rafIdRef.current = requestAnimationFrame(measureFrame);
    };

    rafIdRef.current = requestAnimationFrame(measureFrame);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isDragging]);

  // 3. Send Telemetry after initial board load
  useEffect(() => {
    if (isLoading || !board || reportSentRef.current) return;

    // Small delay to ensure render layout is fully settled
    const timer = setTimeout(async () => {
      if (reportSentRef.current) return;
      reportSentRef.current = true;

      const loadTimeMs = Math.round(performance.now() - startTimeRef.current);

      // Estimate JSON payload size
      let payloadSizeBytes = 0;
      let totalCards = 0;
      let totalAttachments = 0;

      try {
        const serialized = JSON.stringify({ board, lists });
        payloadSizeBytes = new Blob([serialized]).size;
      } catch {
        payloadSizeBytes = 0;
      }

      for (const list of lists) {
        const cards = list.cards || [];
        totalCards += cards.length;
        for (const card of cards) {
          totalAttachments += card.attachments?.length || 0;
        }
      }

      // Calculate background info
      const bg = board.background || 'default';
      const isCustomImage = bg.startsWith('http') || bg.startsWith('/uploads');
      const backgroundType = isCustomImage ? 'image' : bg.startsWith('bg-') ? 'preset' : 'custom';

      // FPS stats
      const fpsArray = fpsSamplesRef.current;
      const avgFps = fpsArray.length > 0 
        ? Math.round(fpsArray.reduce((a, b) => a + b, 0) / fpsArray.length) 
        : 60;

      const connection = (navigator as any).connection;
      const effectiveType = connection?.effectiveType || 'unknown';
      const deviceMemory = (navigator as any).deviceMemory || null;
      const isMobile = window.innerWidth < 768;

      const telemetryPayload = {
        boardId: board.id,
        loadTimeMs,
        payloadSizeBytes,
        cardCount: totalCards,
        listCount: lists.length,
        attachmentCount: totalAttachments,
        backgroundType,
        backgroundLoadMs: 0,
        dndFrameDrops: frameDropsRef.current,
        avgFps,
        socketPingMs: socketPingMsRef.current,
        cardModalOpenMs: 0,
        deviceMemory,
        effectiveType,
        isMobile
      };

      try {
        await apiClient.post('/api/system/telemetry/board', telemetryPayload);
      } catch (err) {
        // Telemetry failure should never disrupt the user
        console.debug('Telemetry delivery skipped', err);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [isLoading, board, lists]);

  return {
    sendInteractionLagReport: async (lagMs: number, actionName: string) => {
      if (!board?.id) return;
      try {
        await apiClient.post('/api/system/telemetry/board', {
          boardId: board.id,
          loadTimeMs: 0,
          avgFps: Math.max(10, Math.round(1000 / Math.max(lagMs, 16))),
          notes: `Acción lenta detectada: ${actionName} (${lagMs}ms)`
        });
      } catch (e) {
        // silent
      }
    }
  };
};
