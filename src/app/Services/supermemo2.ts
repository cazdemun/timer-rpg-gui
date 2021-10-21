import { parse, add, format } from 'date-fns';
// Variation from https://gist.github.com/doctorpangloss/13ab29abd087dc1927475e560f876797

export const supermemo2 = (history: number[], a: number = 6.0, b: number = -0.8,
  c: number = 0.28, d: number = 0.02, theta: number = 0.2): string => {
  const isArrayEmpty = history.length < 1;
  if (isArrayEmpty) throw new Error('History must contain at least one element');
  const isEveryNumberInRange = history.reduce((acc, x) => acc && (0 <= x && x <= 5), true);
  if (!isEveryNumberInRange) throw new Error('Range allowed is 0 - 5');

  const streak: number = history.reduce((acc, x) => x >= 3 ? acc + 1 : 0, 0);

  if (streak === 0) return '1';
  if (streak === 1) return '1';

  const historySum = history.reduce((acc, x) => acc + (b + (c * x) + (d * x * x)), 0)
  // console.log('historySum', historySum);
  const daysToReview = a * Math.pow(Math.max(1.3, 2.5 + historySum), theta * streak);
  // return daysToReview.toFixed(2);
  return (daysToReview * 3 / 4).toFixed(2);
  // return (daysToReview / 2).toFixed(2);
};

export const addDays = (date: string, d: number): string => format(add(
  parse(date, 'yyyy-MM-dd', new Date()), { days: d }), 'yyyy-MM-dd');

export const supermemoScheduleThree = (date: string, label: string) => {
  // 'yyyy-MM-dd'
  const daysToAdd: string[] = [
    supermemo2([3]),
    supermemo2([3, 3]),
    supermemo2([3, 3, 3]),
    supermemo2([3, 3, 3, 3]),
    supermemo2([3, 3, 3, 3, 3]),
  ];
  // console.log(daysToAdd);

  // const schedule = [
  //   date,
  //   ...daysToAdd
  //     .map((d: string) => addDays(date, parseInt(d)))
  // ];
  // console.log(schedule);

  const incrementalSchedule = daysToAdd
    .reduce((acc: string[], d: string) => {
      const [lastDate] = acc.slice(-1);
      const newDate = addDays(lastDate, parseInt(d));
      return acc.concat([newDate]);
    }, [date])
  // console.log(incrementalSchedule);

  const incrementalScheduleObject = incrementalSchedule
    .reduce((acc: any, x: string) => {
      return {
        ...acc,
        [x]: [{ type: 'success', content: label }],
      };
    }, {})
  // console.log(incrementalScheduleObject);
  return incrementalScheduleObject;
}

if (require.main === module) {
  // const trace = (x: any) => {
  //   console.log(x);
  //   return x;
  // }

  // const trycatchlog = (fn: Function) => {
  //   try {
  //     console.log(fn());
  //   } catch (error) {
  //     console.log('ERROR:', error.message);
  //   }
  // }

  // // It should return 1
  // trycatchlog(() => supermemo2(trace([0])));
  // // It should throw error
  // trycatchlog(() => supermemo2(trace([])));
  // // It should throw error
  // trycatchlog(() => supermemo2(trace([6])));
  // trycatchlog(() => supermemo2(trace([6, 7])));
  // trycatchlog(() => supermemo2(trace([6, 7, 3])));
  // // It should return 1
  // trycatchlog(() => supermemo2(trace([3, 1, 0])));
  // trycatchlog(() => supermemo2(trace([3, 1, 0, 1, 2])));
  // // It should return more than 1
  // trycatchlog(() => supermemo2(trace([3, 1, 0, 1, 4, 5])));
  // // It should return more than 1
  // trycatchlog(() => supermemo2(trace([0, 0, 0, 0, 0, 0])));
  // trycatchlog(() => supermemo2(trace([0, 0, 3])));
  // trycatchlog(() => supermemo2(trace([0, 0, 0, 0, 0, 3])));
  // trycatchlog(() => supermemo2(trace([0, 0, 0, 1, 0, 3])));
  // trycatchlog(() => supermemo2(trace([0, 0, 1, 1, 0, 3])));
  // trycatchlog(() => supermemo2(trace([0, 1, 1, 1, 0, 3])));
  // trycatchlog(() => supermemo2(trace([1, 1, 1, 1, 0, 3])));
  // trycatchlog(() => supermemo2(trace([5, 5, 5, 5, 5, 5])));
  // trycatchlog(() => supermemo2(trace([5, 5, 5, 5, 5, 5, 5])));

  // trycatchlog(() => supermemo2(trace([0, 3])));
  // trycatchlog(() => supermemo2(trace([3])));
}