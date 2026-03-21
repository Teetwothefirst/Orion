const db = require('../db');

const categories = [
    { name: 'Grains', icon: 'corn' },
    { name: 'Tubers', icon: 'nutrition' },
    { name: 'Vegetables', icon: 'leaf' },
    { name: 'Fruits', icon: 'restaurant' },
    { name: 'Livestock', icon: 'paw' },
    { name: 'Poultry', icon: 'egg' },
    { name: 'Farm Inputs', icon: 'flask' },
    { name: 'Equipment', icon: 'construct' }
];

const seed = async () => {
    console.log('Seeding categories...');
    for (const cat of categories) {
        try {
            await db.query('INSERT OR IGNORE INTO categories (name, icon) VALUES (?, ?)', [cat.name, cat.icon]);
            console.log(`Added category: ${cat.name}`);
        } catch (err) {
            // For Postgres, INSERT OR IGNORE won't work easily without ON CONFLICT
            try {
                await db.query('INSERT INTO categories (name, icon) VALUES (?, ?) ON CONFLICT (name) DO NOTHING', [cat.name, cat.icon]);
                console.log(`Added category: ${cat.name}`);
            } catch (pgErr) {
                console.error(`Error adding category ${cat.name}:`, pgErr.message);
            }
        }
    }
    console.log('Seeding complete.');
    process.exit(0);
};

seed();
