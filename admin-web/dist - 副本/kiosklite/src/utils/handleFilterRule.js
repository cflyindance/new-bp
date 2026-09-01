const happyHourEffect = (rule) => {
  if (rule === undefined) {
    return false;
  }
  if (rule.dateFrom != undefined && rule.dateTo != undefined) {
    var nowmon = new Date().getMonth() + 1;
    var nowdate = new Date().getDate();
    var datefrom = rule.dateFrom.split('-');
    var dateto = rule.dateTo.split('-');
    if (parseInt(datefrom[0]) > nowmon || parseInt(dateto[0]) < nowmon) {
      return false;
    } else {
      if (
        (parseInt(datefrom[0]) == nowmon && parseInt(datefrom[1]) > nowdate) ||
        (parseInt(dateto[0]) == nowmon && parseInt(dateto[1]) < nowdate)
      ) {
        return false;
      }
    }
  }
  if (rule.weekdays != undefined && rule.weekdays != 0) {
    var nowday = new Date().getDay();
    nowday = Math.pow(2, nowday);
    var theday = rule.weekdays & nowday;
    if (theday == 0) {
      return false;
    }
  }
  if (rule.hourFrom != undefined && rule.hourTo != undefined) {
    var fromTime = rule.hourFrom.split(':');
    var toTime = rule.hourTo.split(':');
    var fromSec = new Date();
    fromSec.setHours(parseInt(fromTime[0]));
    fromSec.setMinutes(parseInt(fromTime[1]));
    fromSec.setSeconds(0);
    fromSec.setMilliseconds(0);
    if (parseInt(toTime[0] == 0) && parseInt(toTime[1] == 0)) {
      var toSec = new Date();
      toSec.setHours(23);
      toSec.setMinutes(59);
      toSec.setSeconds(59);
      toSec.setMilliseconds(999);
    } else {
      var toSec = new Date();
      toSec.setHours(parseInt(toTime[0]));
      toSec.setMinutes(parseInt(toTime[1]));
      toSec.setSeconds(0);
      toSec.setMilliseconds(0);
    }
    fromSec = fromSec.getTime();
    toSec = toSec.getTime();
    var nowSec = Date.now();
    if (nowSec < fromSec || nowSec > toSec) {
      return false;
    }
  }
  return true;
};

export default happyHourEffect;
