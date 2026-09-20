// Port of packages/ui-kit/src/hooks/useCopyClipboard.ts (also stories-app/src/utils/iconsClickCopy.tsx: same code).
//
// USAGE
//   const { copy } = useCopyClipboard();
//   <button onclick={() => copy('some text')}>copy</button>
//   // or without the hook wrapper:  copyToClipboard('text')

/** Copy `text` to the clipboard (Clipboard API, falling back to a hidden <textarea> + `execCommand('copy')`). Empty text is ignored. */
export function copyToClipboard(text: string | null | undefined): void {
	if (!text) return;
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard.writeText(text).then(
			() => {},
			(err) => {
				console.error('Не удалось скопировать текст: ', err);
			}
		);
	} else {
		const textArea = document.createElement('textarea');
		textArea.value = text;
		textArea.style.position = 'fixed';
		textArea.style.left = '-99999px';
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		try {
			document.execCommand('copy');
		} catch (err) {
			console.error('Не удалось скопировать текст: ', err);
		}
		document.body.removeChild(textArea);
	}
}

export const useCopyClipboard = (): { copy: (text: string | null | undefined) => void } => ({ copy: copyToClipboard });
