// `getSubWithPercentages` of stories-app/src/stories/Slider/Slider.stories.tsx: "30%" / "10% – 30%"
export const getSubWithPercentages = (sls: number[]): string => {
	let subLabelString = '';
	sls.forEach((s, idx, arr) => {
		const percentS = Math.round(s * 10);
		if (arr.length > 1) {
			if (idx === arr.length - 1) {
				subLabelString += `${percentS}%`;
			} else {
				subLabelString += `${percentS}% – `;
			}
		} else {
			subLabelString = `${percentS}%`;
		}
	});
	return subLabelString;
};
