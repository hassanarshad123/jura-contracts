// Package entrypoint - the one hand-maintained file re-exporting both the auto-generated base
// types (generated/) and the hand-maintained semantic wrappers around them (validators/). Do not
// put logic here; this file only wires the two together for consumers.
export * from "./generated/typescript/src/index.js";
export * from "./validators/typescript/src/good-law-mapping.js";
