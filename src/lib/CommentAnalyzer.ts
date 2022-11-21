import * as fs from 'fs';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

export default class CommentAnalyzer {
  checkOccurrence(countMap: any, key: string): void {
    if (countMap) {
      if (countMap.has(key)) {
        countMap.set(key, countMap.get(key) + 1);
      } else {
        countMap.set(key, 1);
      }
    }
  }

  async readCommentLineByLine(fileName: string): Promise<any> {
    try {
      const rl = createInterface({
        input: createReadStream(fileName, { autoClose: true }),
        crlfDelay: Infinity,
      });
      return rl;
    } catch (err) {
      console.error(err);
    }
  }

  getFiles(path: string): string[] {
    return fs.readdirSync(path).map(file => path + file);
  }
}
