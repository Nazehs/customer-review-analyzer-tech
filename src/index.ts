import * as path from 'path';
import { WorkerQueue } from './lib/Worker-Queue';
import CommentAnalyzer from './lib/CommentAnalyzer';

(async () => {
  const commentAnalyzer = new CommentAnalyzer();
  const commentsResults: any[] = [];
  const files = commentAnalyzer.getFiles('docs/');
  const pool = new WorkerQueue<{ i: number }, number>(
    path.join(__dirname, './lib/worker.js'),
    files.length
  );

  Promise.all(
    files.map(async (file, i) => {
      const result = await pool.startWorker(() => ({
        i,
        file,
      }));
      commentsResults.push(result);
    })
  ).then(_ => {
    console.log('**finished processing all files** \n');

    // combine all the workers results into a single result
    const finalResult = commentsResults.reduce((acc, curr) => {
      for (const [key, value] of curr) {
        if (acc[key]) {
          acc[key] += value;
        } else {
          acc[key] = value;
        }
      }
      return acc;
    }, {});

    console.log('PRINTING FINAL RESULT \n');

    for (const [key, value] of Object.entries(finalResult)) {
      console.log(`${key} : ${value}`);
    }
  });
})();
