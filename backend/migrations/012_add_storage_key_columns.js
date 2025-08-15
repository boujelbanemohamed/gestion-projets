exports.up = async function(knex) {
  // Ajouter la colonne storage_key si absente dans chaque table d'attachments
  const tables = ['projet_attachments', 'tache_attachments', 'commentaire_attachments'];

  for (const table of tables) {
    const hasColumn = await knex.schema.hasColumn(table, 'storage_key');
    if (!hasColumn) {
      await knex.schema.alterTable(table, (t) => {
        t.text('storage_key').nullable();
      });
    }
  }
};

exports.down = async function(knex) {
  // Safe down (no-op en production). Si besoin, décommentez:
  // const tables = ['projet_attachments', 'tache_attachments', 'commentaire_attachments'];
  // for (const table of tables) {
  //   await knex.schema.alterTable(table, (t) => {
  //     t.dropColumn('storage_key');
  //   });
  // }
  return;
};


