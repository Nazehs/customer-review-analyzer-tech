import { isMainThread, parentPort } from 'node:worker_threads';
import CommentAnalyzer from './CommentAnalyzer';
const commentAnalyzer = new CommentAnalyzer();

(async function () {
  if (isMainThread) {
    throw new Error('Its not a worker');
  }
  parentPort?.on('message', async (data: any) => {
    const result = await processCommentsAndSendBack(data);
    parentPort?.postMessage(result);
  });
})();

async function processCommentsAndSendBack(data: any) {
  const countMap = new Map<string, number>();
  const fileContent = await commentAnalyzer.readCommentLineByLine(data.file);
  if (fileContent) {
    for await (const line of fileContent) {
      if (line.length < 15) {
        commentAnalyzer.checkOccurrence(countMap, 'SHORTER_THAN_15');
      }
      if (
        line.toLocaleLowerCase().includes('mover') &&
        !line.toLocaleLowerCase().includes('shaker')
      ) {
        commentAnalyzer.checkOccurrence(countMap, 'MOVER_MENTIONS');
      }
      if (
        line.toLocaleLowerCase().includes('shaker') &&
        !line.toLocaleLowerCase().includes('mover')
      ) {
        commentAnalyzer.checkOccurrence(countMap, 'SHAKER_MENTIONS');
      }
      if (
        line.toLocaleLowerCase().includes('shaker') &&
        line.toLocaleLowerCase().includes('mover')
      ) {
        commentAnalyzer.checkOccurrence(countMap, 'SHAKER_MENTIONS');
        commentAnalyzer.checkOccurrence(countMap, 'MOVER_MENTIONS');
      }
      if (line.toLocaleLowerCase().includes('taker')) {
        commentAnalyzer.checkOccurrence(countMap, 'TAKER_MENTIONS');
      }
      if (line.includes('?')) {
        commentAnalyzer.checkOccurrence(countMap, 'QUESTIONS');
      }
      if (line.includes('http') || line.includes('www')) {
        commentAnalyzer.checkOccurrence(countMap, 'SPAM');
      }
    }
  }
  return countMap;
}
