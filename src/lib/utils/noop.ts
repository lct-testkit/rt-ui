// Port of packages/ui-kit/src/utils/noop.ts
// React had two identical `noop` helpers (utils/noop.ts and utils/function.ts). Here it is one function:
// this file only re-exports it so both original import paths keep working.
export { noop } from './function.js';
