import Nedb from 'nedb';

export default class Repository<T> {
  db: Nedb;

  constructor(collection: string) {
    this.db = new Nedb({ filename: collection, autoload: true });
  }

  find(query: object): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.find(query, (err: any, docs: T[]) => {
        if (err) reject(err);
        else resolve(docs);
      });
    });
  }

  insert(newDoc: T): Promise<T> {
    return new Promise((resolve, reject) => {
      this.db.insert(newDoc, (err: any, doc: T) => {
        if (err) reject(err);
        else resolve(doc);
      });
    });
  }

  update(_id: string, update: object): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.update(
        { _id },
        { $set: { ...update } }, {}, (err: any, numberOfUpdated: number) => {
          if (err) reject(new Error(`Updating realm with value: ${_id} - ${err.message}`));
          else resolve(numberOfUpdated);
        },
      );
    });
  }

  delete(_id: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.remove({ _id }, { multi: true }, (err: any, numRemoved: number) => {
        if (err) reject(new Error(`Deleting realm with value: ${_id} - ${err.message}`));
        else resolve(numRemoved);
      });
    });
  }
}
