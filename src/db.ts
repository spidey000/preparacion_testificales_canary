import Dexie, { type EntityTable } from 'dexie';
import type { Flujo } from './types';

export const db = new (class TestificalesDB extends Dexie {
  flujos!: EntityTable<Flujo, 'id'>;

  constructor() {
    super('TestificalesDB');

    this.version(1).stores({
      flujos: 'id, titulo, createdAt, updatedAt',
    });
  }
})();
