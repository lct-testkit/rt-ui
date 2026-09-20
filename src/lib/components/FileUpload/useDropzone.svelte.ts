// Native Svelte implementation of what FileUpload takes from `react-dropzone@15.0.0` (`useDropzone`), together with the parts of
// `file-selector@2.1.2` (`fromEvent`) and `attr-accept` it depends on. Sources: design/react-vendor/react-dropzone/dist/es/index.js.
//
// USAGE (call during component initialisation; the option getter is re-read on every event / update, so props may change freely)
//
//   const dz = useDropzone(() => ({ onDrop: (accepted, rejections, event) => ..., accept: { 'image/*': ['.png'] } }));
//
//   <div {...dz.rootProps} use:dz.root class:drop={dz.isFocused || dz.isDragActive}>
//     <input {...dz.inputProps} use:dz.input />
//     Drop files here, or click to select
//   </div>
//
// * `rootProps` / `inputProps` = React `getRootProps()` / `getInputProps()` minus the event handlers (role="presentation", tabindex, type=file,
//   accept, multiple, the visually-hidden input style); the handlers are attached by the `root` / `input` ACTIONS with native listeners:
//     root:  keydown (Space / Enter on the root itself opens the dialog), focusin / focusout (= React onFocus / onBlur, they bubble), click
//            (opens the dialog), dragenter / dragover / dragleave / drop
//     input: change (= the files were chosen in the dialog -> the same path as a drop), click (stopPropagation, so that the click made by
//            `input.click()` does not reach the root again)
// * state (reactive getters): isFocused, isFileDialogActive, isDragActive, isDragAccept, isDragReject, acceptedFiles, fileRejections
//   (`isDragReject` is true only while dragging, after a drop use `fileRejections`), with react-dropzone's reducer semantics
//   (`openDialog` / `reset` clear the whole state, `focus` after a drop is not remembered ...).
// * options: react-dropzone's `accept` (`{ 'image/*': ['.png'] }` -> `accept="image/*,.png"`), `multiple` (true), `minSize`, `maxSize`, `maxFiles`,
//   `validator`, `disabled`, `noClick`, `noKeyboard`, `noDrag`, `noDragEventsBubbling`, `preventDropOnDocument` (true: a file dropped outside of
//   the zone does not navigate the tab to it), `autoFocus`, `getFilesFromEvent`, `onDrop(accepted, rejections, event)`, `onDropAccepted`,
//   `onDropRejected`, `onDragEnter` / `onDragOver` / `onDragLeave`, `onFileDialogOpen` / `onFileDialogCancel`, `onError`.
//   NOT ported: the File System Access API branch (`useFsAccessApi`, off by default in react-dropzone), `isDragGlobal`, and React's
//   `isPropagationStopped` guards (a DOM event has no "stopped" flag after its dispatch).
// * `open()` opens the file dialog programmatically.
import attrAccept from 'attr-accept';
import { COMMON_MIME_TYPES } from './mimeTypes.js';

// attr-accept ships a CommonJS build inside `dist/es`; depending on the bundler the default import is the function or `{ default }`
type AcceptFn = (file: { name?: string; type?: string }, accept: string | string[] | undefined) => boolean;
const accepts = (typeof attrAccept === 'function' ? attrAccept : (attrAccept as unknown as { default: typeof attrAccept }).default) as AcceptFn;

// ── types ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** `{ 'image/png': ['.png'], 'text/*': [] }` */
export type AcceptProp = Record<string, string[]>;
export interface FileError {
	message: string;
	code: string;
}
export interface FileWithPath extends File {
	readonly path?: string;
	readonly relativePath?: string;
}
export interface FileRejection {
	file: File;
	errors: FileError[];
}
/** During a drag the browser only exposes `DataTransferItem`s (no name, no contents) */
type FileLike = { name?: string; type: string; size?: number; getAsFile?: () => File | null };
type DropEvent = Event & { dataTransfer?: DataTransfer | null };

export interface DropzoneOptions {
	accept?: AcceptProp;
	disabled?: boolean;
	multiple?: boolean;
	minSize?: number;
	maxSize?: number;
	maxFiles?: number;
	validator?: ((file: File) => FileError | FileError[] | null) | null;
	preventDropOnDocument?: boolean;
	noClick?: boolean;
	noKeyboard?: boolean;
	noDrag?: boolean;
	noDragEventsBubbling?: boolean;
	autoFocus?: boolean;
	getFilesFromEvent?: (event: Event) => Promise<(File | DataTransferItem)[]> | (File | DataTransferItem)[];
	onDrop?: (acceptedFiles: FileWithPath[], fileRejections: FileRejection[], event: Event) => void;
	onDropAccepted?: (files: FileWithPath[], event: Event) => void;
	onDropRejected?: (fileRejections: FileRejection[], event: Event) => void;
	onDragEnter?: (event: Event) => void;
	onDragOver?: (event: Event) => void;
	onDragLeave?: (event: Event) => void;
	onFileDialogOpen?: () => void;
	onFileDialogCancel?: () => void;
	onError?: (error: unknown) => void;
}

interface DropzoneState {
	isFocused: boolean;
	isFileDialogActive: boolean;
	isDragActive: boolean;
	isDragAccept: boolean;
	isDragReject: boolean;
	acceptedFiles: FileWithPath[];
	fileRejections: FileRejection[];
}

// ── react-dropzone/utils ─────────────────────────────────────────────────────────────────────────────────────────────────────

const FILE_INVALID_TYPE = 'file-invalid-type';
const FILE_TOO_LARGE = 'file-too-large';
const FILE_TOO_SMALL = 'file-too-small';
const TOO_MANY_FILES = 'too-many-files';
export const ErrorCode = { FileInvalidType: FILE_INVALID_TYPE, FileTooLarge: FILE_TOO_LARGE, FileTooSmall: FILE_TOO_SMALL, TooManyFiles: TOO_MANY_FILES } as const;

const getInvalidTypeRejectionErr = (accept = ''): FileError => {
	const acceptArr = accept.split(',');
	const msg = acceptArr.length > 1 ? `one of ${acceptArr.join(', ')}` : acceptArr[0];
	return { code: FILE_INVALID_TYPE, message: `File type must be ${msg}` };
};
const getTooLargeRejectionErr = (maxSize: number): FileError => ({
	code: FILE_TOO_LARGE,
	message: `File is larger than ${maxSize} ${maxSize === 1 ? 'byte' : 'bytes'}`
});
const getTooSmallRejectionErr = (minSize: number): FileError => ({
	code: FILE_TOO_SMALL,
	message: `File is smaller than ${minSize} ${minSize === 1 ? 'byte' : 'bytes'}`
});
const TOO_MANY_FILES_REJECTION: FileError = { code: TOO_MANY_FILES, message: 'Too many files' };

const isDefined = <T>(value: T | null | undefined): value is T => value !== undefined && value !== null;

/** Chrome reports an empty MIME type for some files (`.md`) of a `DataTransferItem` while dragging; the real `File` is checked on drop */
const isDataTransferItemWithEmptyType = (file: FileLike) => file.type === '' && typeof file.getAsFile === 'function';

function fileAccepted(file: FileLike, accept: string | undefined): [boolean, FileError | null] {
	const isAcceptable = file.type === 'application/x-moz-file' || accepts(file, accept) || isDataTransferItemWithEmptyType(file);
	return [isAcceptable, isAcceptable ? null : getInvalidTypeRejectionErr(accept)];
}

function fileMatchSize(file: FileLike, minSize?: number, maxSize?: number): [boolean, FileError | null] {
	if (isDefined(file.size)) {
		if (isDefined(minSize) && isDefined(maxSize)) {
			if (file.size > maxSize) return [false, getTooLargeRejectionErr(maxSize)];
			if (file.size < minSize) return [false, getTooSmallRejectionErr(minSize)];
		} else if (isDefined(minSize) && file.size < minSize) return [false, getTooSmallRejectionErr(minSize)];
		else if (isDefined(maxSize) && file.size > maxSize) return [false, getTooLargeRejectionErr(maxSize)];
	}
	return [true, null];
}

function allFilesAccepted(args: {
	files: FileLike[];
	accept?: string;
	minSize?: number;
	maxSize?: number;
	multiple?: boolean;
	maxFiles?: number;
	validator?: DropzoneOptions['validator'];
}): boolean {
	const { files, accept, minSize, maxSize, multiple, maxFiles = 0, validator } = args;
	if ((!multiple && files.length > 1) || (multiple && maxFiles >= 1 && files.length > maxFiles)) return false;
	return files.every((file) => {
		const [accepted] = fileAccepted(file, accept);
		const [sizeMatch] = fileMatchSize(file, minSize, maxSize);
		const customErrors = validator ? validator(file as File) : null;
		return accepted && sizeMatch && !customErrors;
	});
}

function isEvtWithFiles(event: DropEvent): boolean {
	if (!event.dataTransfer) return !!event.target && !!(event.target as HTMLInputElement).files;
	return Array.prototype.some.call(event.dataTransfer.types, (type: string) => type === 'Files' || type === 'application/x-moz-file');
}

const isMIMEType = (v: string) => v === 'audio/*' || v === 'video/*' || v === 'image/*' || v === 'text/*' || v === 'application/*' || /\w+\/[-+.\w]+/g.test(v);
const isExt = (v: string) => /^.*\.[\w]+$/.test(v);

/** `{ 'image/png': ['.png'] }` -> `'image/png,.png'` (invalid entries are dropped silently) */
function acceptPropAsAcceptAttr(accept: AcceptProp | undefined | null): string | undefined {
	if (!isDefined(accept)) return undefined;
	return Object.entries(accept)
		.reduce<string[]>((a, [mimeType, ext]) => [...a, mimeType, ...ext], [])
		.filter((v) => isMIMEType(v) || isExt(v))
		.join(',');
}

// ── file-selector (`fromEvent`) ──────────────────────────────────────────────────────────────────────────────────────────────

const FILES_TO_IGNORE = ['.DS_Store', 'Thumbs.db'];
const isObject = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null; // eslint-disable-line @typescript-eslint/no-explicit-any

function setObjProp(f: object, key: string, value: unknown) {
	if (Object.getOwnPropertyDescriptor(f, key)) return;
	Object.defineProperty(f, key, { value, writable: false, configurable: false, enumerable: true });
}

/** Browsers give an empty `type` to files they do not know (`.md`, `.rar` ...): fill it in from the extension */
function withMimeType(file: File): File {
	const { name } = file;
	if (name && name.lastIndexOf('.') !== -1 && !file.type) {
		const type = COMMON_MIME_TYPES.get(name.split('.').pop()!.toLowerCase());
		if (type) Object.defineProperty(file, 'type', { value: type, writable: false, configurable: false, enumerable: true });
	}
	return file;
}

/** Adds the read-only `path` / `relativePath` properties (`./name`, or the path inside a dropped folder) */
function toFileWithPath(file: File, path?: string): FileWithPath {
	const f = withMimeType(file);
	const { webkitRelativePath } = file;
	const p = typeof path === 'string' ? path : typeof webkitRelativePath === 'string' && webkitRelativePath.length > 0 ? webkitRelativePath : `./${file.name}`;
	if (typeof (f as FileWithPath).path !== 'string') setObjProp(f, 'path', p);
	setObjProp(f, 'relativePath', p);
	return f as FileWithPath;
}

const fromList = <T>(items: ArrayLike<T> | null | undefined): T[] => (items ? Array.from(items) : []);

function fromFileEntry(entry: FileSystemFileEntry): Promise<FileWithPath> {
	return new Promise((resolve, reject) => entry.file((file) => resolve(toFileWithPath(file, entry.fullPath)), reject));
}

const fromEntry = (entry: FileSystemEntry): Promise<FileWithPath | FileWithPath[]> =>
	entry.isDirectory ? fromDirEntry(entry as FileSystemDirectoryEntry) : fromFileEntry(entry as FileSystemFileEntry);

/** Reads a dropped folder recursively */
function fromDirEntry(entry: FileSystemDirectoryEntry): Promise<FileWithPath[]> {
	const reader = entry.createReader();
	return new Promise((resolve, reject) => {
		const entries: Promise<(FileWithPath | FileWithPath[])[]>[] = [];
		const readEntries = () =>
			reader.readEntries(
				async (batch) => {
					if (!batch.length) {
						try {
							resolve((await Promise.all(entries)).flat(Infinity) as FileWithPath[]);
						} catch (err) {
							reject(err);
						}
					} else {
						entries.push(Promise.all(batch.map(fromEntry)));
						readEntries(); // the reader hands out the entries in batches
					}
				},
				(err) => reject(err)
			);
		readEntries();
	});
}

/** One dropped `DataTransferItem` -> file(s). NB: everything that reads the item runs synchronously (the drag data store is closed after the event) */
function toFilePromises(item: DataTransferItem): Promise<FileWithPath | FileWithPath[]> {
	const entry = typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null;
	if (entry && entry.isDirectory) return fromDirEntry(entry as FileSystemDirectoryEntry);
	const file = item.getAsFile();
	if (!file) return Promise.reject(new Error(`${item} is not a File`));
	return Promise.resolve(toFileWithPath(file, entry?.fullPath ?? undefined));
}

async function getDataTransferFiles(dt: DataTransfer, type: string): Promise<(File | DataTransferItem)[]> {
	if (dt.items) {
		const items = fromList(dt.items).filter((item) => item.kind === 'file');
		// only `dragstart` and `drop` can read the data (https://html.spec.whatwg.org/multipage/dnd.html#dndevents): while dragging the
		// items themselves are returned (they still have a `type`)
		if (type !== 'drop') return items;
		const files = (await Promise.all(items.map(toFilePromises))).flat(Infinity) as FileWithPath[];
		return files.filter((file) => !FILES_TO_IGNORE.includes(file.name));
	}
	return fromList(dt.files)
		.map((file) => toFileWithPath(file))
		.filter((file) => !FILES_TO_IGNORE.includes(file.name));
}

/** file-selector `fromEvent`: the files of a `drop` / `dragenter` (DataTransfer) or of the `change` event of a file input */
export async function fromEvent(evt: unknown): Promise<(File | DataTransferItem)[]> {
	if (isObject(evt) && isObject(evt.dataTransfer)) return getDataTransferFiles(evt.dataTransfer as DataTransfer, evt.type);
	if (isObject(evt) && isObject(evt.target)) return fromList((evt.target as HTMLInputElement).files).map((file) => toFileWithPath(file));
	return [];
}

// ── the hook ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────

const initialState: DropzoneState = {
	isFocused: false,
	isFileDialogActive: false,
	isDragActive: false,
	isDragAccept: false,
	isDragReject: false,
	acceptedFiles: [],
	fileRejections: []
};

type Action =
	| { type: 'focus' | 'blur' | 'openDialog' | 'closeDialog' | 'reset' }
	| { type: 'setDraggedFiles'; isDragActive: boolean; isDragAccept: boolean; isDragReject: boolean }
	| { type: 'setFiles'; acceptedFiles: FileWithPath[]; fileRejections: FileRejection[] };

function reducer(state: DropzoneState, action: Action): DropzoneState {
	switch (action.type) {
		case 'focus':
			return { ...state, isFocused: true };
		case 'blur':
			return { ...state, isFocused: false };
		case 'openDialog':
			return { ...initialState, isFileDialogActive: true };
		case 'closeDialog':
			return { ...state, isFileDialogActive: false };
		case 'setDraggedFiles':
			return { ...state, isDragActive: action.isDragActive, isDragAccept: action.isDragAccept, isDragReject: action.isDragReject };
		case 'setFiles':
			return { ...state, acceptedFiles: action.acceptedFiles, fileRejections: action.fileRejections, isDragReject: false };
		case 'reset':
			return { ...initialState };
		default:
			return state;
	}
}

/** React `getInputProps().style` (the input is visually hidden but stays focusable-by-script), in the form Chrome serialises it */
const INPUT_STYLE =
	'border: 0px; clip: rect(0px, 0px, 0px, 0px); clip-path: inset(50%); height: 1px; margin: 0px -1px -1px 0px; overflow: hidden; padding: 0px; position: absolute; width: 1px; white-space: nowrap;';

export function useDropzone(getOptions: () => DropzoneOptions = () => ({})) {
	// react-dropzone `defaultProps` (getFilesFromEvent = file-selector `fromEvent`)
	const opts = () => ({
		disabled: false,
		getFilesFromEvent: fromEvent,
		maxSize: Infinity,
		minSize: 0,
		multiple: true,
		maxFiles: 0,
		preventDropOnDocument: true,
		noClick: false,
		noKeyboard: false,
		noDrag: false,
		noDragEventsBubbling: false,
		validator: null,
		autoFocus: false,
		...getOptions()
	});

	const acceptAttr = $derived(acceptPropAsAcceptAttr(getOptions().accept));

	let state = $state.raw<DropzoneState>({ ...initialState });
	const dispatch = (action: Action) => {
		state = reducer(state, action);
	};

	let rootEl = $state.raw<HTMLElement | null>(null);
	let inputEl: HTMLInputElement | null = null;
	let dragTargets: EventTarget[] = [];

	const onErr = (e: unknown) => {
		const { onError } = opts();
		if (onError) onError(e);
		else console.error(e); // let the user know something went wrong if there is no `onError`
	};
	const stopPropagation = (event: Event) => {
		if (opts().noDragEventsBubbling) event.stopPropagation();
	};

	// ── window focus after the file dialog was opened: nothing chosen -> the dialog was cancelled ──
	$effect(() => {
		if (!state.isFileDialogActive) return;
		const onWindowFocus = () => {
			setTimeout(() => {
				if (inputEl && !inputEl.files?.length) {
					dispatch({ type: 'closeDialog' });
					opts().onFileDialogCancel?.();
				}
			}, 300);
		};
		window.addEventListener('focus', onWindowFocus, false);
		return () => window.removeEventListener('focus', onWindowFocus, false);
	});

	// ── a file dropped anywhere else must not be opened by the browser ──
	$effect(() => {
		if (!opts().preventDropOnDocument) return;
		const onDocumentDragOver = (event: Event) => event.preventDefault();
		const onDocumentDrop = (event: Event) => {
			if (rootEl && rootEl.contains(event.target as Node | null)) return; // let it reach the zone's own drop handler
			event.preventDefault();
			dragTargets = [];
		};
		document.addEventListener('dragover', onDocumentDragOver, false);
		document.addEventListener('drop', onDocumentDrop, false);
		return () => {
			document.removeEventListener('dragover', onDocumentDragOver);
			document.removeEventListener('drop', onDocumentDrop);
		};
	});

	$effect(() => {
		const { disabled, autoFocus } = opts();
		if (!disabled && autoFocus && rootEl) rootEl.focus();
	});

	// ── files ──
	function setFiles(files: (File | DataTransferItem)[], event: Event | null) {
		const { minSize, maxSize, multiple, maxFiles, validator, onDrop, onDropRejected, onDropAccepted } = opts();
		const acceptedFiles: FileWithPath[] = [];
		const fileRejections: FileRejection[] = [];
		for (const file of files as FileWithPath[]) {
			const [accepted, acceptError] = fileAccepted(file, acceptAttr);
			const [sizeMatch, sizeError] = fileMatchSize(file, minSize, maxSize);
			const customErrors = validator ? validator(file) : null;
			if (accepted && sizeMatch && !customErrors) {
				acceptedFiles.push(file);
			} else {
				const custom = customErrors ? (Array.isArray(customErrors) ? customErrors : [customErrors]) : [];
				fileRejections.push({ file, errors: [acceptError, sizeError, ...custom].filter((e): e is FileError => !!e) });
			}
		}
		if ((!multiple && acceptedFiles.length > 1) || (multiple && maxFiles >= 1 && acceptedFiles.length > maxFiles)) {
			// reject everything and empty the accepted files
			acceptedFiles.forEach((file) => fileRejections.push({ file, errors: [TOO_MANY_FILES_REJECTION] }));
			acceptedFiles.splice(0);
		}
		dispatch({ type: 'setFiles', acceptedFiles, fileRejections });
		onDrop?.(acceptedFiles, fileRejections, event as Event);
		if (fileRejections.length > 0) onDropRejected?.(fileRejections, event as Event);
		if (acceptedFiles.length > 0) onDropAccepted?.(acceptedFiles, event as Event);
	}

	// ── drag & drop ──
	function onDragEnter(event: DragEvent) {
		event.preventDefault();
		stopPropagation(event);
		dragTargets = [...dragTargets, event.target as EventTarget];
		if (isEvtWithFiles(event)) {
			const o = opts();
			Promise.resolve(o.getFilesFromEvent(event))
				.then((files) => {
					const fileCount = files.length;
					const isDragAccept =
						fileCount > 0 &&
						allFilesAccepted({ files: files as FileLike[], accept: acceptAttr, minSize: o.minSize, maxSize: o.maxSize, multiple: o.multiple, maxFiles: o.maxFiles, validator: o.validator });
					dispatch({ type: 'setDraggedFiles', isDragAccept, isDragReject: fileCount > 0 && !isDragAccept, isDragActive: true });
					o.onDragEnter?.(event);
				})
				.catch(onErr);
		}
	}

	function onDragOver(event: DragEvent) {
		event.preventDefault();
		stopPropagation(event);
		const hasFiles = isEvtWithFiles(event);
		if (hasFiles && event.dataTransfer) {
			try {
				event.dataTransfer.dropEffect = 'copy';
			} catch {
				/* some browsers throw while the drag store is read-only */
			}
		}
		if (hasFiles) opts().onDragOver?.(event);
	}

	function onDragLeave(event: DragEvent) {
		event.preventDefault();
		stopPropagation(event);
		// only deactivate once the dropzone and all its children have been left
		const targets = dragTargets.filter((target) => rootEl && rootEl.contains(target as Node));
		// a target present several times (Firefox fires dragenter / dragleave more than once on the same element) is removed only once
		const targetIdx = targets.indexOf(event.target as EventTarget);
		if (targetIdx !== -1) targets.splice(targetIdx, 1);
		dragTargets = targets;
		if (targets.length > 0) return;
		dispatch({ type: 'setDraggedFiles', isDragActive: false, isDragAccept: false, isDragReject: false });
		if (isEvtWithFiles(event)) opts().onDragLeave?.(event);
	}

	/** `drop` on the zone and `change` of the file input */
	function onDropOrChange(event: Event) {
		event.preventDefault();
		stopPropagation(event);
		dragTargets = [];
		if (isEvtWithFiles(event)) {
			Promise.resolve(opts().getFilesFromEvent(event))
				.then((files) => setFiles(files, event))
				.catch(onErr);
		}
		dispatch({ type: 'reset' });
	}

	// ── file dialog ──
	function openFileDialog() {
		if (inputEl) {
			dispatch({ type: 'openDialog' });
			opts().onFileDialogOpen?.();
			inputEl.value = '';
			inputEl.click();
		}
	}

	// ── root ──
	function onKeyDown(event: KeyboardEvent) {
		const { disabled, noKeyboard } = opts();
		if (disabled || noKeyboard) return;
		// ignore keyboard events bubbling up from the children
		if (!rootEl || rootEl !== event.target) return;
		if (event.key === ' ' || event.key === 'Enter' || event.keyCode === 32 || event.keyCode === 13) {
			event.preventDefault();
			openFileDialog();
		}
	}
	function onFocus() {
		const { disabled, noKeyboard } = opts();
		if (!disabled && !noKeyboard) dispatch({ type: 'focus' });
	}
	function onBlur() {
		const { disabled, noKeyboard } = opts();
		if (!disabled && !noKeyboard) dispatch({ type: 'blur' });
	}
	function onClick() {
		const { disabled, noClick } = opts();
		if (disabled || noClick) return;
		openFileDialog();
	}
	const dragHandler = (fn: (event: DragEvent) => void) => (event: Event) => {
		const { disabled, noDrag } = opts();
		if (!disabled && !noDrag) fn(event as DragEvent);
	};

	/** action of the drop container (`getRootProps()` handlers + the `rootRef`) */
	function root(node: HTMLElement) {
		rootEl = node;
		const listeners: [string, EventListener][] = [
			['keydown', onKeyDown as EventListener],
			['focusin', onFocus],
			['focusout', onBlur],
			['click', onClick],
			['dragenter', dragHandler(onDragEnter)],
			['dragover', dragHandler(onDragOver)],
			['dragleave', dragHandler(onDragLeave)],
			['drop', dragHandler(onDropOrChange)]
		];
		for (const [type, fn] of listeners) node.addEventListener(type, fn);
		return {
			destroy() {
				for (const [type, fn] of listeners) node.removeEventListener(type, fn);
				if (rootEl === node) rootEl = null;
			}
		};
	}

	/** action of the hidden `<input type="file">` (`getInputProps()` handlers + the `inputRef`) */
	function input(node: HTMLInputElement) {
		inputEl = node;
		const onChange = (event: Event) => {
			if (!opts().disabled) onDropOrChange(event);
		};
		const onInputClick = (event: Event) => {
			if (!opts().disabled) event.stopPropagation();
		};
		node.addEventListener('change', onChange);
		node.addEventListener('click', onInputClick);
		return {
			destroy() {
				node.removeEventListener('change', onChange);
				node.removeEventListener('click', onInputClick);
				if (inputEl === node) inputEl = null;
			}
		};
	}

	return {
		/** the dropzone is focused (the root or one of its children has the focus) */
		get isFocused() {
			return state.isFocused && !opts().disabled;
		},
		get isFileDialogActive() {
			return state.isFileDialogActive;
		},
		get isDragActive() {
			return state.isDragActive;
		},
		get isDragAccept() {
			return state.isDragAccept;
		},
		/** true only while dragging: after a drop it is reset, use `fileRejections` */
		get isDragReject() {
			return state.isDragReject;
		},
		get acceptedFiles() {
			return state.acceptedFiles;
		},
		get fileRejections() {
			return state.fileRejections;
		},
		/** the `accept` attribute of the input (`undefined` without `accept`) */
		get acceptAttr() {
			return acceptAttr;
		},
		/** spread on the root: `role="presentation"` and `tabindex="0"` (not while disabled / `noKeyboard`) */
		get rootProps(): { role: 'presentation'; tabindex: 0 | undefined } {
			const { disabled, noKeyboard } = opts();
			return { role: 'presentation', tabindex: !disabled && !noKeyboard ? 0 : undefined };
		},
		/** spread on the input */
		get inputProps() {
			return { type: 'file' as const, accept: acceptAttr, multiple: opts().multiple, style: INPUT_STYLE, tabindex: -1 };
		},
		root,
		input,
		/** opens the file dialog */
		open: () => {
			if (!opts().disabled) openFileDialog();
		}
	};
}
