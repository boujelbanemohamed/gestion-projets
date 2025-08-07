const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Supprimer les données existantes
  await knex('tache_history').del();
  await knex('commentaire_attachments').del();
  await knex('tache_attachments').del();
  await knex('projet_attachments').del();
  await knex('commentaires').del();
  await knex('tache_utilisateurs').del();
  await knex('taches').del();
  await knex('projets').del();
  await knex('users').del();
  await knex('departements').del();

  // Insérer les départements
  const departements = await knex('departements').insert([
    { nom: 'IT' },
    { nom: 'Design' },
    { nom: 'Marketing' },
    { nom: 'Qualité' },
    { nom: 'RH' }
  ]).returning('*');

  // Hash du mot de passe par défaut
  const passwordHash = await bcrypt.hash('password123', 12);

  // Insérer les utilisateurs
  const users = await knex('users').insert([
    {
      nom: 'Dupont',
      prenom: 'Marie',
      email: 'marie.dupont@example.com',
      fonction: 'Chef de projet',
      departement_id: departements.find(d => d.nom === 'IT').id,
      role: 'SUPER_ADMIN',
      password_hash: passwordHash
    },
    {
      nom: 'Martin',
      prenom: 'Pierre',
      email: 'pierre.martin@example.com',
      fonction: 'Développeur Senior',
      departement_id: departements.find(d => d.nom === 'IT').id,
      role: 'ADMIN',
      password_hash: passwordHash
    },
    {
      nom: 'Lemoine',
      prenom: 'Sophie',
      email: 'sophie.lemoine@example.com',
      fonction: 'Designer UX/UI',
      departement_id: departements.find(d => d.nom === 'Design').id,
      role: 'UTILISATEUR',
      password_hash: passwordHash
    },
    {
      nom: 'Moreau',
      prenom: 'Jean',
      email: 'jean.moreau@example.com',
      fonction: 'Développeur',
      departement_id: departements.find(d => d.nom === 'IT').id,
      role: 'UTILISATEUR',
      password_hash: passwordHash
    },
    {
      nom: 'Rousseau',
      prenom: 'Alice',
      email: 'alice.rousseau@example.com',
      fonction: 'Testeur QA',
      departement_id: departements.find(d => d.nom === 'Qualité').id,
      role: 'UTILISATEUR',
      password_hash: passwordHash
    }
  ]).returning('*');

  // Insérer les projets
  const projets = await knex('projets').insert([
    {
      nom: 'Refonte Site Web',
      description: 'Modernisation complète du site web de l\'entreprise avec une nouvelle interface utilisateur.',
      departement_id: departements.find(d => d.nom === 'IT').id
    },
    {
      nom: 'Application Mobile',
      description: 'Développement d\'une application mobile native pour iOS et Android.',
      departement_id: departements.find(d => d.nom === 'Design').id
    },
    {
      nom: 'Migration Base de Données',
      description: 'Migration de l\'ancienne base de données vers une nouvelle infrastructure cloud.',
      departement_id: departements.find(d => d.nom === 'IT').id
    }
  ]).returning('*');

  // Insérer les tâches
  const taches = await knex('taches').insert([
    {
      nom: 'Analyse des besoins',
      description: 'Analyser les besoins fonctionnels et techniques pour la refonte du site web.',
      etat: 'cloturee',
      date_realisation: new Date('2024-02-10'),
      projet_id: projets.find(p => p.nom === 'Refonte Site Web').id
    },
    {
      nom: 'Design UI/UX',
      description: 'Concevoir l\'interface utilisateur et l\'expérience utilisateur du nouveau site web.',
      etat: 'en_cours',
      date_realisation: new Date('2024-02-25'),
      projet_id: projets.find(p => p.nom === 'Refonte Site Web').id
    },
    {
      nom: 'Développement Frontend',
      description: 'Développer l\'interface utilisateur du site web en utilisant les technologies modernes.',
      etat: 'non_debutee',
      date_realisation: new Date('2024-03-15'),
      projet_id: projets.find(p => p.nom === 'Refonte Site Web').id
    }
  ]).returning('*');

  // Assigner les utilisateurs aux tâches
  await knex('tache_utilisateurs').insert([
    {
      tache_id: taches[0].id,
      user_id: users.find(u => u.email === 'marie.dupont@example.com').id
    },
    {
      tache_id: taches[0].id,
      user_id: users.find(u => u.email === 'pierre.martin@example.com').id
    },
    {
      tache_id: taches[1].id,
      user_id: users.find(u => u.email === 'sophie.lemoine@example.com').id
    },
    {
      tache_id: taches[2].id,
      user_id: users.find(u => u.email === 'pierre.martin@example.com').id
    },
    {
      tache_id: taches[2].id,
      user_id: users.find(u => u.email === 'jean.moreau@example.com').id
    }
  ]);

  console.log('✅ Données de test insérées avec succès');
  console.log('📧 Comptes de test créés :');
  console.log('   - marie.dupont@example.com (SUPER_ADMIN)');
  console.log('   - pierre.martin@example.com (ADMIN)');
  console.log('   - sophie.lemoine@example.com (UTILISATEUR)');
  console.log('   - jean.moreau@example.com (UTILISATEUR)');
  console.log('   - alice.rousseau@example.com (UTILISATEUR)');
  console.log('🔑 Mot de passe pour tous : password123');
};