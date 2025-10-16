// Importa as funções necessárias do SDK do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Suas credenciais do Firebase que estavam no arquivo HTML
const firebaseConfig = {
    apiKey: "AIzaSyBWkQZG6Q3iZv0e-r2Lb4vsXgT3qyZlCJ4",
    authDomain: "carne-arcanjo.firebaseapp.com",
    projectId: "carne-arcanjo",
    storageBucket: "carne-arcanjo.appspot.com",
    messagingSenderId: "82856076853",
    appId: "1:82856076853:web:b799a56f0bcf39c53fb37c"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Cria referências para as coleções
const carnesCollection = collection(db, "carnes");
const clientesCollection = collection(db, "clientes");

// Exporta as referências para que possam ser usadas em outros arquivos
export { db, carnesCollection, clientesCollection };
