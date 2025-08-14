exports.up = async function(knex) {
	// Assurer la présence de la colonne password_hash
	const hasPasswordHash = await knex.schema.hasColumn('users', 'password_hash');
	if (!hasPasswordHash) {
		await knex.schema.alterTable('users', table => {
			table.string('password_hash', 255);
		});
	}

	// Seeder un compte admin si absent, ou définir un mot de passe si manquant
	const bcrypt = require('bcryptjs');
	const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
	const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin12345!';

	const existing = await knex('users')
		.where('email', adminEmail)
		.select(['id', 'password_hash'])
		.first();

	if (!existing) {
		const saltRounds = 12;
		const hash = await bcrypt.hash(adminPassword, saltRounds);
		await knex('users').insert({
			id: knex.raw('gen_random_uuid()'),
			nom: 'Admin',
			prenom: 'Root',
			email: adminEmail,
			fonction: 'Administrateur',
			role: 'SUPER_ADMIN',
			password_hash: hash,
			created_at: knex.fn.now(),
			updated_at: knex.fn.now(),
		});
	} else if (!existing.password_hash) {
		const saltRounds = 12;
		const hash = await bcrypt.hash(adminPassword, saltRounds);
		await knex('users')
			.where('id', existing.id)
			.update({ password_hash: hash, updated_at: knex.fn.now() });
	}
};

exports.down = async function(knex) {
	// Ne rien faire (sécuritaire en production)
	return;
};

