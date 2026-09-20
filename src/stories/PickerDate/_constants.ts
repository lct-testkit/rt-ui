// Port of stories-app/src/stories/PickerDate/constants.ts
const july = (days: number[]): Date[] => days.map((d) => new Date(`07.${String(d).padStart(2, '0')}.2023`));

// 07.01.2023 ... 07.31.2023 without 07.11.2023
export const DisabledDatesExample: Date[] = july(Array.from({ length: 31 }, (_, i) => i + 1).filter((d) => d !== 11));

export const EnabledDatesExample: Date[] = july([14, 15]);

export const MonthEng = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const MonthDe = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
