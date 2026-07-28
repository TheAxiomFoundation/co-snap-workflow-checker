import type { SnapState } from "@/lib/axiomRuntime";
import type { StateId } from "@/lib/snapWorkflow";
import { US_CO } from "./us-co";
import { US_NY } from "./us-ny";

export const SNAP_STATES: Record<StateId, SnapState> = {
  "us-ny": US_NY,
  "us-co": US_CO,
};

export const STATE_ORDER: StateId[] = ["us-ny", "us-co"];

export const DEFAULT_STATE_ID: StateId = "us-ny";
