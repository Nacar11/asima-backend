import { OpenAPIObject } from '@nestjs/swagger';

/**
 * Group definition for the Swagger "Schemas" section.
 *
 *  `name` — human-readable group label, e.g. `'Auth'` → schemas appear as
 *           `[Auth] LoginDto`, `[Auth] LoginResponseDto`, etc.
 *  `schemas` — original class names (declaration order is preserved within
 *           the group; groups themselves render in the order declared).
 */
export type SwaggerSchemaGroup = {
  name: string;
  schemas: string[];
};

/**
 * Reorders + prefixes schemas in an OpenAPI document so the Swagger UI
 * "Schemas" panel renders them clustered by feature instead of in the
 * arbitrary discovery order the framework picks up.
 *
 * Why post-process rather than `@ApiSchema({ name })`?
 *   `@ApiSchema` was added in `@nestjs/swagger` 7.5; the project pins 7.4.x.
 *   This avoids a dependency bump while delivering the same UX.
 *
 * What it does:
 *   1. For each grouped schema, renames the entry in `components.schemas`
 *      from `Foo` → `[Group] Foo`.
 *   2. Rebuilds `components.schemas` in group order; ungrouped schemas
 *      keep their original order at the bottom.
 *   3. Rewrites every `$ref: '#/components/schemas/Foo'` in the document
 *      to point to the new key. Implemented as a JSON-string replace —
 *      $refs are always quoted strings so this is safe and avoids a tree
 *      walk.
 */
export function applySwaggerSchemaGroups(
  doc: OpenAPIObject,
  groups: SwaggerSchemaGroup[],
): OpenAPIObject {
  const schemas = doc.components?.schemas;
  if (!schemas) return doc;

  const renames: Record<string, string> = {};
  for (const group of groups) {
    for (const oldName of group.schemas) {
      renames[oldName] = `[${group.name}] ${oldName}`;
    }
  }

  // 1 + 2 — build a fresh ordered map: grouped (in group order) then ungrouped.
  type SchemaValue = (typeof schemas)[string];
  const ordered: Record<string, SchemaValue> = {};
  for (const group of groups) {
    for (const oldName of group.schemas) {
      const newName = renames[oldName];
      if (schemas[oldName] !== undefined) ordered[newName] = schemas[oldName];
    }
  }
  for (const [name, schema] of Object.entries(schemas)) {
    if (!renames[name]) ordered[name] = schema;
  }
  doc.components!.schemas = ordered;

  // 3 — rewrite every $ref. Cheap and robust because $refs are quoted
  // strings, so a substring match can't bleed into adjacent schema names
  // (the closing `"` is part of the search key).
  let json = JSON.stringify(doc);
  for (const [oldName, newName] of Object.entries(renames)) {
    json = json
      .split(`"#/components/schemas/${oldName}"`)
      .join(`"#/components/schemas/${newName}"`);
  }
  return JSON.parse(json) as OpenAPIObject;
}
