// Port of stories-app/src/utils/iconsClickCopy.tsx (default export `handleClick(text)`): copy a string to the clipboard.
// Same code as the `useCopyClipboard` hook, so it just delegates to it.
//   import handleClick from '$stories/_utils/iconsClickCopy';   <button onclick={() => handleClick('import ...')}>
import { copyToClipboard } from '$lib/hooks/useCopyClipboard.js';

const handleClick = (text: string | null | undefined): void => copyToClipboard(text);

export default handleClick;
