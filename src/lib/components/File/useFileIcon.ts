// Port of packages/ui-kit/src/components/File/useFileIcon.tsx
//
// Maps a file extension to (icon component, colour group). React held icon COMPONENTS in the map too (`Icon: DOCMonochrome`),
// so the shape is identical; File.svelte renders `<Icon />` dynamically.
import type { Component } from 'svelte';
import DOCMonochrome from '../../icons/24/document/DOCMonochrome.svelte';
import DOCXMonochrome from '../../icons/24/document/DOCXMonochrome.svelte';
import DOCMMonochrome from '../../icons/24/document/DOCMMonochrome.svelte';
import DOTXMonochrome from '../../icons/24/document/DOTXMonochrome.svelte';
import TXTMonochrome from '../../icons/24/document/TXTMonochrome.svelte';
import MDMonochrome from '../../icons/24/document/MDMonochrome.svelte';
import ODTMonochrome from '../../icons/24/document/ODTMonochrome.svelte';
import PDFMonochrome from '../../icons/24/document/PDFMonochrome.svelte';
import XLSMonochrome from '../../icons/24/document/XLSMonochrome.svelte';
import XLSXMonochrome from '../../icons/24/document/XLSXMonochrome.svelte';
import XLSMMonochrome from '../../icons/24/document/XLSMMonochrome.svelte';
import XLSBMonochrome from '../../icons/24/document/XLSBMonochrome.svelte';
import CSVMonochrome from '../../icons/24/document/CSVMonochrome.svelte';
import ODSMonochrome from '../../icons/24/document/ODSMonochrome.svelte';
import PPTMonochrome from '../../icons/24/document/PPTMonochrome.svelte';
import PPTXMonochrome from '../../icons/24/document/PPTXMonochrome.svelte';
import ODPMonochrome from '../../icons/24/document/ODPMonochrome.svelte';
import JPGMonochrome from '../../icons/24/document/JPGMonochrome.svelte';
import PNGMonochrome from '../../icons/24/document/PNGMonochrome.svelte';
import GIFMonochrome from '../../icons/24/document/GIFMonochrome.svelte';
import SVGMonochrome from '../../icons/24/document/SVGMonochrome.svelte';
import WEBPMonochrome from '../../icons/24/document/WEBPMonochrome.svelte';
import TIFMonochrome from '../../icons/24/document/TIFMonochrome.svelte';
import TIFFMonochrome from '../../icons/24/document/TIFFMonochrome.svelte';
import JFIFMonochrome from '../../icons/24/document/JFIFMonochrome.svelte';
import PSMonochrome from '../../icons/24/document/PSMonochrome.svelte';
import AIMonochrome from '../../icons/24/document/AIMonochrome.svelte';
import FIGMonochrome from '../../icons/24/document/FIGMonochrome.svelte';
import XDMonochrome from '../../icons/24/document/XDMonochrome.svelte';
import MP3Monochrome from '../../icons/24/document/MP3Monochrome.svelte';
import WAVMonochrome from '../../icons/24/document/WAVMonochrome.svelte';
import MusicMonochrome from '../../icons/24/document/MusicMonochrome.svelte';
import MediaMonochrome from '../../icons/24/document/MediaMonochrome.svelte';
import MPEGMonochrome from '../../icons/24/document/MPEGMonochrome.svelte';
import ZIPMonochrome from '../../icons/24/document/ZIPMonochrome.svelte';
import RARMonochrome from '../../icons/24/document/RARMonochrome.svelte';
import SevenZIPMonochrome from '../../icons/24/document/SevenZIPMonochrome.svelte';
import ArchiveMonochrome from '../../icons/24/document/ArchiveMonochrome.svelte';
import HTMLMonochrome from '../../icons/24/document/HTMLMonochrome.svelte';
import CSSMonochrome from '../../icons/24/document/CSSMonochrome.svelte';
import JSMonochrome from '../../icons/24/document/JSMonochrome.svelte';
import JSONMonochrome from '../../icons/24/document/JSONMonochrome.svelte';
import ScriptMonochrome from '../../icons/24/document/ScriptMonochrome.svelte';
import SQLMonochrome from '../../icons/24/document/SQLMonochrome.svelte';
import EXEMonochrome from '../../icons/24/document/EXEMonochrome.svelte';
import APPMonochrome from '../../icons/24/document/APPMonochrome.svelte';
import MBOXMonochrome from '../../icons/24/document/MBOXMonochrome.svelte';
import MSGMonochrome from '../../icons/24/document/MSGMonochrome.svelte';
import MPPMonochrome from '../../icons/24/document/MPPMonochrome.svelte';
import VSDMonochrome from '../../icons/24/document/VSDMonochrome.svelte';
import VSDXMonochrome from '../../icons/24/document/VSDXMonochrome.svelte';
import DocumentText from '../../icons/24/document/DocumentText.svelte';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FileIconComponent = Component<any>;

export const fileIcons: Record<string, Record<string, FileIconComponent>> = {
	// Документы
	doc: {
		doc: DOCMonochrome,
		docx: DOCXMonochrome,
		docm: DOCMMonochrome,
		dotx: DOTXMonochrome,
		txt: TXTMonochrome,
		rtf: TXTMonochrome,
		md: MDMonochrome,
		odt: ODTMonochrome
	},
	read: {
		pdf: PDFMonochrome
	},
	// Таблицы
	table: {
		xls: XLSMonochrome,
		xlsx: XLSXMonochrome,
		xlsm: XLSMMonochrome,
		xlsb: XLSBMonochrome,
		csv: CSVMonochrome,
		ods: ODSMonochrome
	},
	// Презентации
	prez: {
		ppt: PPTMonochrome,
		pptx: PPTXMonochrome,
		odp: ODPMonochrome
	},
	// Изображения
	image: {
		jpg: JPGMonochrome,
		jpeg: JPGMonochrome,
		png: PNGMonochrome,
		gif: GIFMonochrome,
		svg: SVGMonochrome,
		webp: WEBPMonochrome,
		tif: TIFMonochrome,
		tiff: TIFFMonochrome,
		jfif: JFIFMonochrome,
		psd: PSMonochrome,
		ai: AIMonochrome,
		fig: FIGMonochrome,
		xd: XDMonochrome
	},
	// Аудио
	audio: {
		mp3: MP3Monochrome,
		wav: WAVMonochrome,
		ogg: MusicMonochrome,
		flac: MusicMonochrome,
		aac: MusicMonochrome
	},
	// Видео
	video: {
		mp4: MediaMonochrome,
		mpeg: MPEGMonochrome,
		avi: MediaMonochrome,
		mov: MediaMonochrome,
		mkv: MediaMonochrome,
		webm: MediaMonochrome
	},
	// Архивы
	archive: {
		zip: ZIPMonochrome,
		rar: RARMonochrome,
		'7z': SevenZIPMonochrome,
		gz: ArchiveMonochrome,
		tar: ArchiveMonochrome
	},
	// Код
	code: {
		html: HTMLMonochrome,
		htm: HTMLMonochrome,
		css: CSSMonochrome,
		js: JSMonochrome,
		jsx: JSMonochrome,
		ts: JSMonochrome,
		tsx: JSMonochrome,
		json: JSONMonochrome,
		xml: ScriptMonochrome,
		sql: SQLMonochrome,
		php: ScriptMonochrome,
		py: ScriptMonochrome,
		rb: ScriptMonochrome,
		java: ScriptMonochrome,
		cpp: ScriptMonochrome,
		c: ScriptMonochrome,
		h: ScriptMonochrome,
		go: ScriptMonochrome,
		rs: ScriptMonochrome,
		swift: ScriptMonochrome,
		kt: ScriptMonochrome
	},
	// Разное
	other: {
		exe: EXEMonochrome,
		msi: EXEMonochrome,
		app: APPMonochrome,
		mbox: MBOXMonochrome,
		msg: MSGMonochrome,
		mpp: MPPMonochrome,
		vsd: VSDMonochrome,
		vsdx: VSDXMonochrome
	}
};

/** React `useFileIcon(fileName)` (a plain function, not a real hook): the icon of the file extension and the colour group (`iconType`). */
export function useFileIcon(fileName?: string): { Icon: FileIconComponent; iconType: string } {
	if (!fileName) return { Icon: DocumentText, iconType: '' };
	const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
	// like React's `Object.keys(fileIcons).reduce(...)`: the LAST group that knows the extension wins
	let icon: FileIconComponent | undefined;
	let fileType = '';
	for (const type of Object.keys(fileIcons)) {
		if (Object.prototype.hasOwnProperty.call(fileIcons[type], ext)) {
			icon = fileIcons[type][ext];
			fileType = type;
		}
	}
	return { Icon: icon ?? DocumentText, iconType: fileType };
}
