import { EntityManager, ObjectLiteral, Repository } from 'typeorm';

/**
 * The repository bound to `manager`'s transaction when one is given, else the
 * injected repository. Homes the `manager ? manager.getRepository(...) : this.repo`
 * line every transactional repository repeated, so a load + its sibling write
 * can share one transaction without re-spelling the fallback.
 *
 * `repo.target` carries the entity, so callers never re-pass it:
 *   const r = scopedRepo(this.repo, manager);
 */
export function scopedRepo<T extends ObjectLiteral>(
  repo: Repository<T>,
  manager?: EntityManager,
): Repository<T> {
  return manager ? manager.getRepository<T>(repo.target) : repo;
}
