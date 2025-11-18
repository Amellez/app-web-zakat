# Créer les dossiers
mkdir -p src/app/admin
mkdir -p src/components/admin/ui
mkdir -p src/components/admin/beneficiaires
mkdir -p src/components/admin/inventaire
mkdir -p src/components/admin/packs
mkdir -p src/components/admin/itineraires

# Créer les fichiers UI
touch src/components/admin/ui/StatCard.jsx
touch src/components/admin/ui/StatutBadge.jsx
touch src/components/admin/ui/SourceBadge.jsx
touch src/components/admin/ui/SearchAndFilter.jsx
touch src/components/admin/ui/EmptyState.jsx

# Créer les fichiers Bénéficiaires
touch src/components/admin/beneficiaires/BeneficiaireRow.jsx
touch src/components/admin/beneficiaires/BeneficiairesTab.jsx

# Créer les fichiers Inventaire
touch src/components/admin/inventaire/InventaireCard.jsx
touch src/components/admin/inventaire/InventaireTab.jsx

# Créer les fichiers Packs
touch src/components/admin/packs/PackCard.jsx
touch src/components/admin/packs/PacksTab.jsx

# Créer les fichiers Itinéraires
touch src/components/admin/itineraires/ItinerairesTab.jsx

# Créer le Dashboard principal
touch src/components/admin/AdminDashboard.jsx

# Créer la page route
touch src/app/admin/page.jsx

echo "✅ Tous les fichiers ont été créés!"