import {assert} from "./Assert";
import {EventEmitter} from "events";

//저장소. JsonFile을 읽어서 가지고오는, 흡사 SQLDeveloper와 유사한 구조라고 보면 될듯.
export namespace Base {
    export class Repository<T> extends EventEmitter {
        protected entities = new Map<number, T>();
        private nextId = 0;

        get json(): Array<object> {
            let result = [];
            for (const entity of this.values()) {
                if ('json' in entity) {
                    result.push((entity as any).json);
                } else {
                    result.push(JSON.parse(JSON.stringify(entity)));
                }
            }
            return result;
        }

        get length(): number {
            return this.entities.size;
        }

        get(key: number): T {
            assert(this.has(key), `There's no Entity which id=${key} in repo!`);
            return this.entities.get(key)!;
        }

        getAll(key: number): Array<object> {
            let result = [];
            for (const entity of this.entities) {
                if(key in this.entities){
                    result.push(entity as any)
                }
            }
            return result;
        }

        has(key: number): boolean {
            return this.entities.has(key);
        }

        set(key: number, value: T): this {
            const alreadyHas = this.has(key);
            this.entities.set(key, value);
            if (!alreadyHas) {
                if (this.nextId < key + 1) {
                    this.nextId = key + 1;
                }
                this.emit('created', value);
            } else {
                this.emit('updated', value);
            }
            return this;
        }

        add(value: T): number {
            if ('id' in value) {
                //아이디 중복을 허용.
                let id: number = (value as any).id;
                //assert(!this.has(id), `reAdd ${id}!`);
                if (id !== null) {
                    while(this.has(id)){
                        ++id;
                    }
                    this.set(id, value);
                } else {
                    (value as any).id = this.nextId;
                    return this.add(value);
                }
                return id;
            }
            const key = this.nextId;
            this.set(key, value);
            return key;
        }

        [Symbol.iterator](): Iterator<[number, T]> {
            return this.entities[Symbol.iterator]();
        }

        delete(key: number | T): boolean {
            if (typeof key === 'number' && this.has(key)) {
                const theDeleted = this.get(key);
                this.entities.delete(key);
                this.emit('removed', theDeleted);
                return true;
            } else if (typeof key !== 'number' && 'id' in key) {
                return this.delete((key as any).id);
            }
            return false;
        }

        values(): IterableIterator<T> {
            return this.entities.values();
        }
    }
}
