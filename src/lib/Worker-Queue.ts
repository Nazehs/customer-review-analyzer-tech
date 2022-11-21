import { Worker } from 'node:worker_threads';
type QueueCallback<N> = (err: any, result?: N) => void;
interface QueueItem<T, N> {
  callback: QueueCallback<N>;
  getData: any;
}
export class WorkerQueue<T, N> {
  private queue: QueueItem<T, N>[] = [];
  private workersById: { [key: number]: Worker } = {};
  private activeWorkersById: { [key: number]: boolean } = {};
  public constructor(
    public workerPath: string,
    public numberOfThreads: number
  ) {
    this.createWorker();
  }
  public createWorker(): void | null {
    if (this.numberOfThreads < 1) {
      return null;
    }
    for (let i = 0; i < this.numberOfThreads; i += 1) {
      const worker = new Worker(this.workerPath);
      this.workersById[i] = worker;
      this.activeWorkersById[i] = false;
    }
  }

  public startWorker(getData: () => { i: number; file: string }) {
    return new Promise((resolve, reject): any => {
      const availableWorkerId = this.getInactiveWorkerId();
      const queueItem = {
        getData,
        callback: (error: any, result: any) => {
          if (error) {
            return reject(error);
          }
          return resolve(result);
        },
      };
      if (availableWorkerId === -1) {
        this.queue.push(queueItem);
        return null;
      }
      this.runWorker(availableWorkerId, queueItem);
    }).catch(err => console.log(err));
  }

  private getInactiveWorkerId(): number {
    for (let i = 0; i < this.numberOfThreads; i++) {
      if (!this.activeWorkersById[i]) {
        return i;
      }
    }
    return -1;
  }

  private async runWorker(
    workerId: number,
    queueItem: QueueItem<T, N> | undefined
  ) {
    const worker = this.workersById[workerId];
    this.activeWorkersById[workerId] = true;

    const messageCallback = (result: N) => {
      queueItem?.callback(null, result);
      cleanUp();
    };
    const errorCallback = (error: any) => {
      queueItem?.callback(error);
      cleanUp();
    };
    const cleanUp = (): void | null => {
      worker.removeAllListeners('message');
      worker.removeAllListeners('error');
      this.activeWorkersById[workerId] = false;
      if (!this.queue.length) {
        return null;
      }
      this.runWorker(workerId, this.queue.shift());
    };
    worker.on('message', messageCallback);
    worker.on('error', errorCallback);
    worker.postMessage(await queueItem?.getData());
  }
}
