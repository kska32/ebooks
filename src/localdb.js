import Dexie from "dexie";
const db = new Dexie('my-million-ebook');

/*
{
    "kind": "drive#file",
    "fileExtension": "epub",
    "mimeType": "application/epub+zip",
    "webViewLink": "https://drive.google.com/file/d/145q4HOgucYg4K3WMsW0ilzZ2vBzg48_r/view?usp=drivesdk",
    "webContentLink": "https://drive.google.com/uc?id=145q4HOgucYg4K3WMsW0ilzZ2vBzg48_r&export=download",
    "size": "8506621",
    "id": "145q4HOgucYg4K3WMsW0ilzZ2vBzg48_r",
    "name": "세이노의 가르침.epub",
    "createdTime": "2023-09-03T13:49:07.467Z",
    "modifiedTime": "2023-09-03T13:23:38.000Z"
}
*/


function createStore(collection, keyNames){
        db.version(1).stores({[collection]: keyNames});

        return {
                'db': ()=>db[collection],
                "setItem": (key, value) => {
                        if(value?.constructor?.name?.toLowerCase() !== 'object'){
                                console.error('Not A plain object.');
                                return false;
                        }
                        return db[collection].put({
                                key,
                                ...value,
                                timestamp: Date.now(),
                        }).then(()=>true);
                },
                "getItem": (key) => {
                        return new Promise((resolve)=>{
                                return db[collection].get(key).then((res)=>{
                                        resolve(res)
                                }).catch((err)=>{
                                        resolve(null);
                                })
                        });
                },
                "upsertItem": (key,value) => {
                        if(value?.constructor?.name?.toLowerCase() !== 'object'){
                                console.error('Not A plain object.');
                                return false;
                        }
                        return db[collection].update(key,{
                                ...value,
                                timestamp: Date.now()
                        }).then((updatedCount)=>{
                                if(updatedCount===0){
                                        return db[collection].put({
                                                        key:key,
                                                        ...value,
                                                        timestamp: Date.now(),
                                                        //updateTimestamp: Date.now()
                                                }).then(()=>true);
                                }else{
                                        return true;
                                }
                        });
                },
                "getLastMany": (limit=3, offset=0) => {
                        return db[collection]
                                .orderBy('timestamp')
                                .reverse()
                                .offset(offset)
                                .limit(limit)
                                .toArray();
                },
                "getFollowingMany": (reqkey, limit=1, includeSpecReqkey=false) => {
                        let count = 0;
                        return db[collection].orderBy('timestamp').reverse().filter((item)=>{
                                if(item.key === reqkey){
                                        count++;
                                        return includeSpecReqkey;
                                }
                                if(count> 0 && count <= limit){
                                        count++;
                                        return true;
                                }
                                return false;
                        }).toArray();
                },
                "getAll": ()=> db[collection].orderBy('timestamp').toArray(),
                "count": () => db[collection].count(),
                "deleteByKey": (key) => db[collection].where('key').equals(key).delete(),
                "primaryKeys": () => db[collection].orderBy('timestamp').reverse().primaryKeys(),
                "putAll": (value) => {
                        if(!!value && value.constructor === Array){
                                return db[collection].bulkPut(value);
                        }
                        if(!!value && value.constructor === Object){
                                return db[collection].add(value);
                        }
                },
                "search": (keyword) => {
                        return db[collection]
                                .orderBy('name')
                                .filter((list) => new RegExp(`${keyword}`,'gi').test(list.name))
                                .toArray();
                }
        }
}

export const bookListDB = createStore('book-list', 'id, name, fileExtension, size, createdTime, modifiedTime');