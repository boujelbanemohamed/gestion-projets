exports.up = async function (knex) {
  const hasDescription = await knex.schema.hasColumn('departements', 'description');
  const hasUpdatedAt = await knex.schema.hasColumn('departements', 'updated_at');

  if (!hasDescription || !hasUpdatedAt) {
    await knex.schema.alterTable('departements', (table) => {
      if (!hasDescription) {
        table.text('description').nullable();
      }
      if (!hasUpdatedAt) {
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      }
    });
  }

  // Backfill updated_at for existing rows if needed
  if (!hasUpdatedAt) {
    await knex('departements').update({ updated_at: knex.fn.now() });
  }
};

exports.down = async function (knex) {
  // Safe down migration (no-op in production). If needed:
  // await knex.schema.alterTable('departements', (table) => {
  //   table.dropColumn('description');
  //   table.dropColumn('updated_at');
  // });
  return;
};


