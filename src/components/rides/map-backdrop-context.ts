'use client';

import { createContext, useContext } from 'react';

export interface MapBackdropMetrics {
  /** Measured peek-region height in CSS pixels (visible map above the sheet). */
  peekPx: number;
  /** Measured total backdrop height in CSS pixels (map-container height). */
  backdropPx: number;
}

export const MapBackdropContext = createContext<MapBackdropMetrics | null>(null);

export function useMapBackdropMetrics(): MapBackdropMetrics | null {
  return useContext(MapBackdropContext);
}
