declare global {
	namespace App {}
	interface Window {
		__rtReady?: boolean;
	}
}

export {};
