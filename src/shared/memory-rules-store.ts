import { randomUUID } from 'node:crypto';
import type { StoredRule } from './rule-document.js';

export interface MemoryRule extends StoredRule {
  readonly sequence: number;
}

/** Armazenamento em memória, só para desenvolvimento e testes. */
export class MemoryRulesStore {
  readonly rules = new Map<string, MemoryRule>();
  private sequence = 0;

  newId(): string {
    return randomUUID();
  }

  nextSequence(): number {
    this.sequence += 1;
    return this.sequence;
  }

  /** Mesma regra do índice do Mongo: sem diferenciar maiúsculas, acentos continuam valendo. */
  isNameTaken(name: string, exceptId?: string): boolean {
    const key = name.toLocaleLowerCase('pt');
    for (const rule of this.rules.values()) {
      if (rule.id !== exceptId && rule.name.toLocaleLowerCase('pt') === key) return true;
    }
    return false;
  }
}
