// Port of packages/ui-kit/src/components/wrappers/ModalProvider/ModalContext.ts
// React: `ModalContext = createContext({ isInModal: false })`; <Modal> renders `<ModalContext.Provider value={{ isInModal: true }}>`
// and e.g. DropdownMenu reads it through `useModalContext()`.
// Svelte: a <Modal> calls `setModalContext()` (default value `{ isInModal: true }`) during its init, consumers call
// `useModalContext()` (src/lib/hooks/useModalContext.ts) or `getModalContext()`; outside a modal they get `{ isInModal: false }`.
import { getContext, setContext } from 'svelte';

export interface ModalContextState {
	isInModal: boolean;
}

export const defaultContextState: ModalContextState = {
	isInModal: false
};

export const MODAL_CONTEXT = Symbol('ModalContext');

/** Provider counterpart: call once in the component that wraps its subtree in the modal context (`<ModalContext.Provider>`). */
export const setModalContext = (value: ModalContextState = { isInModal: true }): ModalContextState => setContext(MODAL_CONTEXT, value);

/** Consumer counterpart (`useContext(ModalContext)`): call during component init. */
export const getModalContext = (): ModalContextState => getContext<ModalContextState | undefined>(MODAL_CONTEXT) ?? defaultContextState;
