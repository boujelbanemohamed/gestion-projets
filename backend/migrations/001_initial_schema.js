exports.up = async function(knex) {
  // Assure l'existence de la fonction gen_random_uuid
  await knex.raw("CREATE EXTENSION IF NOT EXISTS pgcrypto");

  // Départements
  const hasDepartements = await knex.schema.hasTable('departements');
  if (!hasDepartements) {
    await knex.schema.createTable('departements', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('nom', 100).notNullable().unique();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // Utilisateurs
  const hasUsers = await knex.schema.hasTable('users');
  if (!hasUsers) {
    await knex.schema.createTable('users', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('nom', 100).notNullable();
      table.string('prenom', 100).notNullable();
      table.string('email', 255).notNullable().unique();
      table.string('fonction', 100);
      table.uuid('departement_id').references('id').inTable('departements').onDelete('SET NULL');
      table.enu('role', ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER']).defaultTo('USER');
      table.string('password_hash').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.index('email');
    });
  }

  // Projets
  const hasProjets = await knex.schema.hasTable('projets');
  if (!hasProjets) {
    await knex.schema.createTable('projets', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('nom', 200).notNullable();
      table.text('description');
      table.uuid('departement_id').references('id').inTable('departements').onDelete('SET NULL');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // Tâches
  const hasTaches = await knex.schema.hasTable('taches');
  if (!hasTaches) {
    await knex.schema.createTable('taches', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('nom', 200).notNullable();
      table.text('description');
      table.text('scenario_execution');
      table.text('criteres_acceptation');
      table.enu('etat', ['non_debutee', 'en_cours', 'cloturee']).defaultTo('non_debutee');
      table.date('date_realisation').notNullable();
      table.uuid('projet_id').references('id').inTable('projets').onDelete('CASCADE');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.index('projet_id');
      table.index('etat');
    });
  }

  // Liaison tâches-utilisateurs
  const hasTacheUsers = await knex.schema.hasTable('tache_utilisateurs');
  if (!hasTacheUsers) {
    await knex.schema.createTable('tache_utilisateurs', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('tache_id').references('id').inTable('taches').onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.unique(['tache_id', 'user_id']);
      table.index('tache_id');
      table.index('user_id');
    });
  }

  // Commentaires
  const hasCommentaires = await knex.schema.hasTable('commentaires');
  if (!hasCommentaires) {
    await knex.schema.createTable('commentaires', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.text('contenu').notNullable();
      table.uuid('tache_id').references('id').inTable('taches').onDelete('CASCADE');
      table.uuid('auteur_id').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index('tache_id');
    });
  }

  // Pièces jointes projets
  const hasProjetAttachments = await knex.schema.hasTable('projet_attachments');
  if (!hasProjetAttachments) {
    await knex.schema.createTable('projet_attachments', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('nom', 255).notNullable();
      table.bigInteger('taille').notNullable();
      table.string('type', 100).notNullable();
      table.string('url', 500).notNullable();
      table.uuid('projet_id').references('id').inTable('projets').onDelete('CASCADE');
      table.uuid('uploaded_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('uploaded_at').defaultTo(knex.fn.now());
    });
  }

  // Pièces jointes tâches
  const hasTacheAttachments = await knex.schema.hasTable('tache_attachments');
  if (!hasTacheAttachments) {
    await knex.schema.createTable('tache_attachments', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('nom', 255).notNullable();
      table.bigInteger('taille').notNullable();
      table.string('type', 100).notNullable();
      table.string('url', 500).notNullable();
      table.uuid('tache_id').references('id').inTable('taches').onDelete('CASCADE');
      table.uuid('uploaded_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('uploaded_at').defaultTo(knex.fn.now());
    });
  }

  // Pièces jointes commentaires
  const hasCommentaireAttachments = await knex.schema.hasTable('commentaire_attachments');
  if (!hasCommentaireAttachments) {
    await knex.schema.createTable('commentaire_attachments', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('nom', 255).notNullable();
      table.bigInteger('taille').notNullable();
      table.string('type', 100).notNullable();
      table.string('url', 500).notNullable();
      table.uuid('commentaire_id').references('id').inTable('commentaires').onDelete('CASCADE');
      table.timestamp('uploaded_at').defaultTo(knex.fn.now());
    });
  }

  // Historique des tâches
  const hasTacheHistory = await knex.schema.hasTable('tache_history');
  if (!hasTacheHistory) {
    await knex.schema.createTable('tache_history', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('tache_id').references('id').inTable('taches').onDelete('CASCADE');
      table.string('action', 50).notNullable();
      table.text('description').notNullable();
      table.uuid('auteur_id').references('id').inTable('users').onDelete('SET NULL');
      table.jsonb('details');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index('tache_id');
    });
  }
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('tache_history')
    .dropTableIfExists('commentaire_attachments')
    .dropTableIfExists('tache_attachments')
    .dropTableIfExists('projet_attachments')
    .dropTableIfExists('commentaires')
    .dropTableIfExists('tache_utilisateurs')
    .dropTableIfExists('taches')
    .dropTableIfExists('projets')
    .dropTableIfExists('users')
    .dropTableIfExists('departements');
};