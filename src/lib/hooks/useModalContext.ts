// Port of packages/ui-kit/src/hooks/useModalContext.ts (`useContext(ModalContext)`).
// Call at component init: `const { isInModal } = useModalContext();`
import { getModalContext } from '../components/wrappers/ModalProvider/ModalContext.js';

export const useModalContext = getModalContext;
