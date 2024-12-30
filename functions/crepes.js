export async function onRequest(context) {
    const { request } = context;
    
    // Holen der Firebase-Konfigurationsvariablen aus den Umgebungsvariablen
    const FIREBASE_API_KEY = context.env.FIREBASE_API_KEY;
    const FIREBASE_PROJECT_ID = context.env.FIREBASE_PROJECT_ID;

    const FIREBASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/crepes`;

    if (request.method === 'GET') {
        // Abrufen der Crepes von Firestore
        const response = await fetch(FIREBASE_URL);
        const data = await response.json();
        
        if (response.ok) {
            const crepes = data.documents.map(doc => doc.fields);
            return new Response(JSON.stringify(crepes), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response('Fehler beim Abrufen der Crepes', { status: 500 });
        }
    }

    if (request.method === 'POST') {
        // Neue Crepe in Firestore hinzufügen
        const newCrepe = await request.json();

        const newCrepeData = {
            fields: {
                crepeName: { stringValue: newCrepe.crepeName },
                normalPrice: { integerValue: newCrepe.normalPrice },
                isReduced: { booleanValue: newCrepe.isReduced },
                reducedPrice: { integerValue: newCrepe.reducedPrice || 0 },
                isSoldOut: { booleanValue: newCrepe.isSoldOut }
            }
        };

        const response = await fetch(FIREBASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${FIREBASE_API_KEY}` // Firebase API Key für Authentifizierung
            },
            body: JSON.stringify(newCrepeData)
        });

        if (response.ok) {
            return new Response('Crepe erfolgreich hinzugefügt', { status: 200 });
        } else {
            return new Response('Fehler beim Hinzufügen der Crepe', { status: 500 });
        }
    }

    return new Response('Nicht erlaubt', { status: 405 });
}
