exports.up = async function(knex) {
	// Assure l'extension pour gen_random_uuid au cas où
	try { await knex.raw("CREATE EXTENSION IF NOT EXISTS pgcrypto"); } catch(e) {}

	// Ajouter departement_id si manquante
	const hasDepartementId = await knex.schema.hasColumn('users', 'departement_id');
	if (!hasDepartementId) {
		await knex.schema.alterTable('users', table => {
			table.uuid('departement_id').nullable();
		});
		// Ajouter la contrainte FK si la table departements existe
		const hasDepartements = await knex.schema.hasTable('departements');
		if (hasDepartements) {
			try {
				await knex.schema.alterTable('users', table => {
					table.foreign('departement_id').references('id').inTable('departements').onDelete('SET NULL');
				});
			} catch(e) { /* ignore if FK already exists */ }
		}
	}

	// Ajouter role si manquante
	const hasRole = await knex.schema.hasColumn('users', 'role');
	if (!hasRole) {
		await knex.schema.alterTable('users', table => {
			table.enu('role', ['SUPER_ADMIN', 'ADMIN', 'UTILISATEUR']).defaultTo('UTILISATEUR');
		});
	}

	// Ajouter password_hash si manquante
	const hasPasswordHash = await knex.schema.hasColumn('users', 'password_hash');
	if (!hasPasswordHash) {
		await knex.schema.alterTable('users', table => {
			table.string('password_hash', 255);
		});
	}
};

exports.down = async function(knex) {
	// Ne pas supprimer en production par sécurité
	return;
};

