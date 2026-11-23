//#region source-snapshot/src/utils/getBsTime.js
var WEEK_DAY = [
	"MON",
	"TUE",
	"WED",
	"THU",
	"FRI",
	"SAT",
	"SUN"
];
var getBsTime = (hours) => {
	return hours.map((each) => {
		if (each.fromDayOfWeek && !each.toDayOfWeek) each.bsDay = [];
		if (!each.fromDayOfWeek) each.bsDay = WEEK_DAY;
		if (each.fromDayOfWeek && each.toDayOfWeek) {
			const fromBsIndex = WEEK_DAY.findIndex((day) => day === each.fromDayOfWeek);
			const toBsIndex = WEEK_DAY.findIndex((day) => day === each.toDayOfWeek);
			if (fromBsIndex === -1 || toBsIndex === -1) each.bsDay = [];
			else if (toBsIndex >= fromBsIndex) each.bsDay = WEEK_DAY.slice(fromBsIndex, toBsIndex + 1);
			else each.bsDay = WEEK_DAY.slice(fromBsIndex).concat(WEEK_DAY.slice(0, toBsIndex + 1));
		}
		return each;
	});
};
//#endregion
export { getBsTime as t };
