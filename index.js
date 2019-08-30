'use strict';

const MongoClient = require('mongodb').MongoClient;

const MONGO_CLIENT_SETTINGS = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

const DEFAULT_CONFIG = {
  host: 'localhost',
  port: 27017,
  dbName: 'dashbi'
};

const LIMIT_PER_SID = 1000000;


/*
 * MongoDB Driver
 */

class MongoDBDriver {

  /**
   * Constructor
   * @param {Object} settings Settings
   */
  constructor (settings) {
    this.config = Object.deepAssign({}, DEFAULT_CONFIG, settings);

    this._client = null;
    this._db = null;
    this._collection = null;

    // ready
    this.ready = new Promise( (resolve, reject) => {
      MongoClient.connect(this.connectionURI, MONGO_CLIENT_SETTINGS, (err, client) => {
        if (err) {
          reject(`Connection error! ${err}`);
        } else {
          this._client = client;
          this._db = client.db(this.config.dbName);

          this._db.createCollection('datastore', (err, collection) => {
            if (err) {
              this._collection = this._db.collection('datastore');
              resolve(this._collection);
            } else {
              this._collection = collection;
              collection.createIndex('sid', (err, res) => {
                if (err) {
                  reject(`Error while creating index! ${err}`);
                } else {
                  resolve(this._collection);
                }
              });
            }
          });
        }
      });
    });
  }

  /**
   * Connection URI
   */
  get connectionURI () {
    return `mongodb://${this.config.host}:${this.config.port}/${this.config.dbName}`;
  }

  /**
   * Put data to datastore
   * @param {string} sid Source ID
   * @param {*} state State
   */
  put (sid, state) {
    return new Promise( (resolve, reject) => {
      this.ready.then( (collection) => {
        collection.insertOne({
          sid,
          state,
          createdAt: Date.now()
        }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res.ops[0]);
          }
        });
      }).catch(reject);
    });
  }

  /**
   * Fetch data from datastore
   * @param {string} sid Source ID
   */
  fetch (sid) {
    return new Promise( (resolve, reject) => {
      this.ready.then( (collection) => {
        collection.find({ sid })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray( (err, docs) => {
          if (err) {
            reject(err);
          } else {
            resolve(docs.reverse());
          }
        });
      }).catch(reject);
    });
  }

  /**
   *  Clean up given Source
   * @param {string} sid Source ID
   */
  cleanUp (sid) {
    this.ready.then( (collection) => {
      collection.find({ sid })
      .sort({ createdAt: -1 })
      .skip(LIMIT_PER_SID)
      .toArray( (err, docs) => {
        if (!err && docs.length) {
          let sids = docs.map((doc) => doc.sid);
          collection.deleteMany({
            sid: { $in: sids }
          });
        }
      });
    });
  }

}

// Export
module.exports = MongoDBDriver;
