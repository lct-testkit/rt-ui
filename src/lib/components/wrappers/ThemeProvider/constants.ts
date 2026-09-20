// Themes shipped in packages/themes (rostelecom-{default,purple}-{light,dark}.css); the CSS class of each is `Theme_root_<theme>`.
export const THEMES = ['rtk_default_light', 'rtk_default_dark', 'rtk_purple_light', 'rtk_purple_dark'] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = 'rtk_default_light';

/** `rtk_default_dark` -> `Theme_root_rtk_default_dark` */
export const themeClassName = (theme: Theme): string => `Theme_root_${theme}`;
