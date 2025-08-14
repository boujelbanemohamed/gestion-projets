const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:8002'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging pour toutes les requêtes
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url} - Auth: ${req.headers.authorization ? 'Bearer ***' : 'No auth'}`);
  next();
});

// Middleware d'authentification (version développement)
const simpleAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Validation basique du token (pour le développement)
    const token = authHeader.substring(7);
    if (token && token.length > 10) {
      req.user = { id: 1, email: 'marie.dupont@example.com', role: 'SUPER_ADMIN' };
      next();
    } else {
      return res.status(401).json({ error: 'Token invalide' });
    }
  } else {
    return res.status(401).json({ error: 'Token d\'authentification requis' });
  }
};

console.log('🔧 Configuration du serveur final...');

// Validation des données
const validateMeetingMinutes = (data) => {
  const errors = [];

  if (!data.titre || data.titre.trim().length < 3) {
    errors.push('Le titre doit contenir au moins 3 caractères');
  }

  if (!data.date_reunion) {
    errors.push('La date de réunion est requise');
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push('La description doit contenir au moins 10 caractères');
  }

  return errors;
};

// Fichier pour sauvegarder les données
const dataFile = path.join(__dirname, 'app-data.json');

// Données par défaut
let appData = {
  meetingMinutes: [],
  projects: [
    { id: 1, nom: 'Refonte Site Web', description: 'Modernisation du site web', statut: 'en_cours' },
    { id: 2, nom: 'Application Mobile', description: 'Développement app mobile', statut: 'en_cours' },
    { id: 3, nom: 'Migration Base de Données', description: 'Migration vers PostgreSQL', statut: 'en_cours' }
  ]
};

// Charger les données existantes
function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf8');
      appData = { ...appData, ...JSON.parse(data) };
      console.log(`📄 Données chargées: ${appData.meetingMinutes.length} PV, ${appData.projects.length} projets`);
    }
  } catch (error) {
    console.log('⚠️ Erreur lors du chargement, utilisation des données par défaut');
  }
}

// Sauvegarder les données
function saveData() {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(appData, null, 2));
    console.log('💾 Données sauvegardées');
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
  }
}

// Charger les données au démarrage
loadData();

// Routes d'authentification
app.post('/api/auth/login', (req, res) => {
  console.log('📡 Route /api/auth/login appelée');
  
  const user = {
    id: 1,
    email: 'marie.dupont@example.com',
    nom: 'Dupont',
    prenom: 'Marie',
    role: 'SUPER_ADMIN'
  };
  
  return res.json({
    message: 'Connexion réussie',
    user: user,
    token: 'fake-token-for-testing'
  });
});

// Routes projets
app.get('/api/projects/all', (req, res) => {
  console.log('📡 Route /api/projects/all appelée');
  return res.json({ projects: appData.projects });
});

app.get('/api/projects', (req, res) => {
  console.log('📡 Route /api/projects appelée');
  return res.json({ 
    projects: appData.projects,
    pagination: { pages: 1, total: appData.projects.length }
  });
});

// Routes PV de réunion (SANS authentification pour test)
app.get('/api/meeting-minutes', (req, res) => {
  console.log('📡 Route GET /api/meeting-minutes appelée');
  console.log('📄 Query params:', req.query);

  let filteredPV = [...appData.meetingMinutes];

  // Filtrer par projet si spécifié
  const { projet_id } = req.query;
  if (projet_id) {
    console.log(`🔍 Filtrage par projet ID: ${projet_id}`);
    filteredPV = filteredPV.filter(pv =>
      pv.projets && pv.projets.includes(projet_id.toString())
    );
  }

  console.log(`📄 Retour de ${filteredPV.length} PV (sur ${appData.meetingMinutes.length} total)`);

  // Enrichir les PV avec les noms des projets
  const enrichedPV = filteredPV.map(pv => {
    const projetsWithNames = pv.projets ? pv.projets.map(projetId => {
      const projet = appData.projects.find(p => p.id.toString() === projetId.toString());
      return {
        id: projetId,
        nom: projet ? projet.nom : `Projet ${projetId}`
      };
    }) : [];

    return {
      ...pv,
      projets: projetsWithNames
    };
  });

  return res.json({
    meetingMinutes: enrichedPV,
    pagination: { pages: 1, total: enrichedPV.length }
  });
});

// Route pour récupérer un PV spécifique
app.get('/api/meeting-minutes/:id', simpleAuth, (req, res) => {
  const id = parseInt(req.params.id);
  console.log(`📡 Route GET /api/meeting-minutes/${id} appelée`);

  const pv = appData.meetingMinutes.find(pv => pv.id === id);
  if (!pv) {
    return res.status(404).json({ error: 'PV non trouvé' });
  }

  // Enrichir le PV avec les noms des projets
  const projetsWithNames = pv.projets ? pv.projets.map(projetId => {
    const projet = appData.projects.find(p => p.id.toString() === projetId.toString());
    return {
      id: projetId,
      nom: projet ? projet.nom : `Projet ${projetId}`
    };
  }) : [];

  const enrichedPV = {
    ...pv,
    projets: projetsWithNames
  };

  console.log(`📄 PV ${id} trouvé: ${pv.titre}`);
  return res.json({ meetingMinutes: enrichedPV });
});

app.post('/api/meeting-minutes', simpleAuth, (req, res) => {
  console.log('📡 Route POST /api/meeting-minutes appelée');
  console.log('📄 Body reçu:', req.body);
  
  try {
    // Extraire les données du formulaire
    const { titre, date_reunion, description, projets } = req.body;

    // Validation des données
    const validationErrors = validateMeetingMinutes({ titre, date_reunion, description });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Données invalides',
        details: validationErrors
      });
    }
    
    // Parser les projets si c'est une string JSON
    let projetsArray = [];
    if (projets) {
      try {
        projetsArray = typeof projets === 'string' ? JSON.parse(projets) : projets;
      } catch (e) {
        projetsArray = [projets]; // Si c'est un seul projet
      }
    }
    
    const newPV = {
      id: appData.meetingMinutes.length + 1,
      titre: titre || `PV de Réunion #${appData.meetingMinutes.length + 1}`,
      date_reunion: date_reunion || new Date().toISOString().split('T')[0],
      description: description || 'PV créé avec succès',
      projets: projetsArray,
      file_name: `PV_${(titre || `Reunion_${appData.meetingMinutes.length + 1}`).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      nom_fichier: `PV_${(titre || `Reunion_${appData.meetingMinutes.length + 1}`).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      file_path: null,
      taille_fichier: Math.floor(Math.random() * 100000) + 50000, // Taille aléatoire entre 50KB et 150KB
      file_size: Math.floor(Math.random() * 100000) + 50000,
      created_by: 1,
      created_at: new Date().toISOString(),
      uploaded_by_nom: 'Marie',
      uploaded_by_prenom: 'Dupont'
    };
    
    appData.meetingMinutes.push(newPV);
    saveData();
    
    console.log(`✅ PV créé avec succès - ID: ${newPV.id}, Titre: ${newPV.titre}`);
    
    return res.json({
      meetingMinutes: newPV,
      message: 'PV créé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du PV:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la création du PV',
      details: error.message 
    });
  }
});

// Route de modification
app.put('/api/meeting-minutes/:id', simpleAuth, (req, res) => {
  const id = parseInt(req.params.id);
  console.log(`📡 Route PUT /api/meeting-minutes/${id} appelée`);
  console.log('📄 Données de modification reçues:', req.body);

  try {
    const index = appData.meetingMinutes.findIndex(pv => pv.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'PV non trouvé' });
    }

    // Extraire les données du formulaire
    const { titre, date_reunion, description, projets } = req.body;

    // Parser les projets si c'est une string JSON
    let projetsArray = [];
    if (projets) {
      try {
        projetsArray = typeof projets === 'string' ? JSON.parse(projets) : projets;
      } catch (e) {
        projetsArray = Array.isArray(projets) ? projets : [projets];
      }
    }

    // Mettre à jour le PV existant
    appData.meetingMinutes[index] = {
      ...appData.meetingMinutes[index],
      titre: titre || appData.meetingMinutes[index].titre,
      date_reunion: date_reunion || appData.meetingMinutes[index].date_reunion,
      description: description || appData.meetingMinutes[index].description,
      projets: projetsArray.length > 0 ? projetsArray : appData.meetingMinutes[index].projets,
      updated_at: new Date().toISOString()
    };

    saveData();

    console.log(`✅ PV ${id} modifié avec succès - Titre: ${appData.meetingMinutes[index].titre}`);

    return res.json({
      meetingMinutes: appData.meetingMinutes[index],
      message: 'PV modifié avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la modification du PV:', error);
    return res.status(500).json({
      error: 'Erreur lors de la modification du PV',
      details: error.message
    });
  }
});

// Route de suppression
app.delete('/api/meeting-minutes/:id', simpleAuth, (req, res) => {
  const id = parseInt(req.params.id);
  console.log(`📡 Route DELETE /api/meeting-minutes/${id} appelée`);

  const index = appData.meetingMinutes.findIndex(pv => pv.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'PV non trouvé' });
  }

  appData.meetingMinutes.splice(index, 1);
  saveData();

  console.log(`🗑️ PV ${id} supprimé`);
  return res.json({ message: 'PV supprimé avec succès' });
});

// Route de téléchargement
app.get('/api/meeting-minutes/:id/download', simpleAuth, (req, res) => {
  const id = parseInt(req.params.id);
  console.log(`📡 Route GET /api/meeting-minutes/${id}/download appelée`);

  const pv = appData.meetingMinutes.find(pv => pv.id === id);
  if (!pv) {
    return res.status(404).json({ error: 'PV non trouvé' });
  }

  // Pour la démo, on génère un fichier PDF simple
  const fileName = pv.file_name || `PV_${pv.titre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  const content = `PV de Réunion: ${pv.titre}\nDate: ${pv.date_reunion}\nDescription: ${pv.description}`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(Buffer.from(content, 'utf8'));

  console.log(`📥 Téléchargement du PV ${id}: ${fileName}`);
});

// Route pour récupérer les PV d'un projet spécifique (utilisée par ProjectMeetingMinutes)
app.get('/api/projects/:projectId/meeting-minutes', simpleAuth, (req, res) => {
  const projectId = req.params.projectId;
  console.log(`📡 Route GET /api/projects/${projectId}/meeting-minutes appelée`);

  // Filtrer les PV par projet
  const projectPV = appData.meetingMinutes.filter(pv =>
    pv.projets && pv.projets.includes(projectId.toString())
  );

  console.log(`📄 Retour de ${projectPV.length} PV pour le projet ${projectId}`);

  // Enrichir les PV avec les noms des projets
  const enrichedPV = projectPV.map(pv => {
    const projetsWithNames = pv.projets ? pv.projets.map(projetId => {
      const projet = appData.projects.find(p => p.id.toString() === projetId.toString());
      return {
        id: projetId,
        nom: projet ? projet.nom : `Projet ${projetId}`
      };
    }) : [];

    return {
      ...pv,
      projets: projetsWithNames
    };
  });

  return res.json({
    meetingMinutes: enrichedPV
  });
});

// Routes de test
app.get('/api/test', (req, res) => {
  console.log('📡 Route /api/test appelée');
  return res.json({ 
    message: 'Serveur final fonctionne!',
    timestamp: new Date().toISOString(),
    status: 'OK',
    data: {
      meetingMinutes: appData.meetingMinutes.length,
      projects: appData.projects.length
    }
  });
});

app.get('/api/health', (req, res) => {
  console.log('📡 Route /api/health appelée');
  return res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0-final'
  });
});

// Middleware d'erreur
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Route 404
app.use('*', (req, res) => {
  console.log(`❌ Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route non trouvée', url: req.originalUrl });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log('🚀 Serveur final démarré sur le port', PORT);
  console.log('🌐 URLs disponibles:');
  console.log('   - http://localhost:3000/api/test');
  console.log('   - http://localhost:3000/api/health');
  console.log('   - http://localhost:3000/api/auth/login');
  console.log('   - http://localhost:3000/api/projects/all');
  console.log('   - http://localhost:3000/api/meeting-minutes');
  console.log('');
  console.log('✅ Le serveur est prêt !');
  console.log(`📄 ${appData.meetingMinutes.length} PV en mémoire`);
  console.log(`📊 ${appData.projects.length} projets disponibles`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur final...');
  saveData();
  process.exit(0);
});
