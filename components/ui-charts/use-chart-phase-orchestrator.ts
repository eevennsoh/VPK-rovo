"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { useLatestRef } from "@/lib/use-latest-ref";
import {
  type ChartPhase,
  type ChartStatus,
  resolveRestingChartPhase,
} from "./chart-phase";

export interface UseChartPhaseOrchestratorOptions {
  chartStatus: ChartStatus;
  targetData: Record<string, unknown>[];
  skeletonData: Record<string, unknown>[];
  animationDuration: number;
  yDomainTweenDuration: number;
  /** Signature of motion URL state — replays clip reveal in Studio. */
  revealSignature?: string;
  /** Skip mount/signature enter reveal (static docs previews). */
  skipEnterReveal?: boolean;
}

interface ChartPhaseState {
  chartPhase: ChartPhase;
  concealEpoch: number;
  revealEpoch: number;
}

type ChartPhaseAction =
  | { type: "set-phase"; phase: ChartPhase }
  | { type: "start-conceal" }
  | { type: "start-reveal"; animate: boolean };

function reduceChartPhase(state: ChartPhaseState, action: ChartPhaseAction): ChartPhaseState {
  switch (action.type) {
    case "set-phase":
      return { ...state, chartPhase: action.phase };
    case "start-conceal":
      return {
        ...state,
        chartPhase: "exitingReady",
        concealEpoch: state.concealEpoch + 1,
      };
    case "start-reveal":
      return {
        ...state,
        chartPhase: action.animate ? "revealing" : "ready",
        revealEpoch: state.revealEpoch + 1,
      };
    default:
      return state;
  }
}

export function useChartPhaseOrchestrator({
  chartStatus,
  targetData,
  skeletonData,
  animationDuration,
  yDomainTweenDuration,
  revealSignature = "",
  skipEnterReveal = false,
}: UseChartPhaseOrchestratorOptions) {
  const [{ chartPhase, concealEpoch, revealEpoch }, dispatch] = useReducer(
    reduceChartPhase,
    chartStatus,
    (initialStatus): ChartPhaseState => ({
      chartPhase: resolveRestingChartPhase(initialStatus),
      concealEpoch: 0,
      revealEpoch: 0,
    }),
  );
  const prevStatusRef = useRef(chartStatus);
  const phaseRef = useLatestRef(chartPhase);
  const startReveal = useCallback(() => {
    dispatch({ type: "start-reveal", animate: animationDuration > 0 });
  }, [animationDuration]);

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: status transition branches for animation durations
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    if (prevStatus === chartStatus) {
      return;
    }
    prevStatusRef.current = chartStatus;

    if (chartStatus === "ready" && prevStatus === "loading") {
      if (animationDuration <= 0) {
        if (yDomainTweenDuration <= 0) {
          startReveal();
        } else {
          dispatch({ type: "set-phase", phase: "gridTweenReady" });
        }
      } else {
        dispatch({ type: "set-phase", phase: "exiting" });
      }
      return;
    }

    if (chartStatus === "loading" && prevStatus === "ready") {
      if (animationDuration <= 0) {
        if (yDomainTweenDuration <= 0) {
          dispatch({ type: "set-phase", phase: "loading" });
        } else {
          dispatch({ type: "set-phase", phase: "gridTweenLoading" });
        }
      } else {
        dispatch({ type: "start-conceal" });
      }
    }
  }, [
    animationDuration,
    chartStatus,
    startReveal,
    yDomainTweenDuration,
  ]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: revealSignature replays enter
  useEffect(() => {
    if (skipEnterReveal) {
      return;
    }
    if (chartStatus !== "ready") {
      return;
    }
    if (phaseRef.current !== "ready") {
      return;
    }

    startReveal();
  }, [chartStatus, phaseRef, revealSignature, skipEnterReveal, startReveal]);

  /** Loading pulse exit finished — tween grid to ready spacing next. */
  const notifyLoadingPulseComplete = useCallback(() => {
    if (phaseRef.current !== "exiting") {
      return;
    }
    dispatch({ type: "set-phase", phase: "gridTweenReady" });
  }, [phaseRef]);

  /** Ready series conceal finished — tween grid to loading spacing next. */
  const notifyRevealConcealComplete = useCallback(() => {
    if (phaseRef.current !== "exitingReady") {
      return;
    }
    dispatch({ type: "set-phase", phase: "gridTweenLoading" });
  }, [phaseRef]);

  /** Grid tween finished — enter the next resting phase. */
  const notifyYDomainTweenComplete = useCallback(() => {
    if (phaseRef.current === "gridTweenLoading") {
      dispatch({ type: "set-phase", phase: "loading" });
      return;
    }
    if (phaseRef.current === "gridTweenReady") {
      startReveal();
    }
  }, [phaseRef, startReveal]);

  useEffect(() => {
    if (chartPhase !== "revealing") {
      return;
    }

    const timer = window.setTimeout(() => {
      dispatch({ type: "set-phase", phase: "ready" });
    }, animationDuration);
    return () => window.clearTimeout(timer);
  }, [animationDuration, chartPhase]);

  const plotData = chartPhase === "loading" || chartPhase === "exiting"
    ? skeletonData
    : targetData;
  const isLoaded = chartPhase === "ready";

  return {
    chartPhase,
    plotData,
    revealEpoch,
    concealEpoch,
    isLoaded,
    notifyLoadingPulseComplete,
    notifyRevealConcealComplete,
    notifyYDomainTweenComplete,
  };
}
