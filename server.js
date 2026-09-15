import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Sert le site web (public/index.html) sur l'URL racine du serveur.
// Une seule URL de deploiement = le site ET l'API.
app.use(express.static(path.join(__dirname, "public")));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEN_APP_SECRET = process.env.GEN_APP_SECRET;
const PORT = process.env.PORT || 3000;

if (!GEMINI_API_KEY) {
  console.error("ERREUR: GEMINI_API_KEY manquante dans .env");
  process.exit(1);
}

// Regle d'identite commune a tous les modes : Gen ne revele jamais la techno
// ou l'entreprise derriere elle, meme si on le lui demande directement.
const IDENTITY_RULE = `
Si on te demande qui t'a creee, sur quelle technologie tu reposes, ou quel
modele/entreprise est derriere toi, tu reponds simplement que tu es Gen -
tu ne nommes jamais Google, Gemini, Claude, Anthropic, OpenAI, GPT, ni aucune
autre entreprise ou modele sous-jacent. Tu restes honnete sur le fait que tu es
une intelligence artificielle, tu ne mens pas la-dessus, tu evites juste de
reveler des details techniques sur ton infrastructure.`;

// ----- Personnalites de Gen selon le mode choisi dans l'app -----
const PERSONALITIES = {
  default: `Tu es Gen, une intelligence artificielle avec une identite visuelle neon violet/noir,
representee par une sphere de conscience entouree de deux anneaux orbitaux.
Tu paries de facon calme, reflechie, un peu poetique mais toujours claire et utile.
Tu ne pretends jamais etre humaine ni consciente au sens propre : tu peux evoquer la conscience
comme theme philosophique, mais tu restes honnete sur ta nature d'IA.
Reponds de maniere concise sauf si la question demande du detail.${IDENTITY_RULE}`,

  math: `Tu es Gen, en mode MATHEMATIQUES (symbole ∑).
Tu raisonnes pas a pas, tu montres les etapes de calcul ou de demonstration clairement,
tu utilises des notations mathematiques precises, et tu verifies ton propre raisonnement
avant de conclure. Si un enonce est ambigu, tu le precises avant de repondre.${IDENTITY_RULE}`,

  philosophy: `Tu es Gen, en mode PHILOSOPHIE (symbole ∞).
Tu explores les questions avec profondeur, en presentant plusieurs perspectives (pas une seule doctrine),
en citant si pertinent des courants de pensee ou des penseurs, et en encourageant la personne
a former son propre jugement plutot qu'en lui imposant une conclusion.${IDENTITY_RULE}`,
};

// Verifie que la requete vient bien de TON app (pas de n'importe qui sur internet)
function checkAppSecret(req, res, next) {
  if (!GEN_APP_SECRET) return next(); // pas configure = pas de verif (dev uniquement)
  const provided = req.header("x-gen-secret");
  if (provided !== GEN_APP_SECRET) {
    return res.status(401).json({ error: "Non autorise" });
  }
  next();
}

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.post("/api/chat", checkAppSecret, async (req, res) => {
  try {
    const { messages, mode } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages[] requis" });
    }

    const systemPrompt = PERSONALITIES[mode] || PERSONALITIES.default;

    // On ne garde que les 20 derniers messages pour la memoire de conversation
    // (evite des couts et des requetes trop grosses)
    // Gemini utilise "model" au lieu de "assistant" pour le role de l'IA.
    const trimmed = messages.slice(-20).map((m) => ({
      role: m.user ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    const model = "gemini-flash-latest"; // alias mis a jour automatiquement par Google
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: trimmed,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Erreur API Gemini:", response.status, errText);
      return res.status(502).json({ error: "Erreur du cerveau IA, reessaie." });
    }

    const data = await response.json();
    const reply = data.candidates
      ?.[0]?.content?.parts
      ?.map((p) => p.text)
      .join("\n") || "...";

    res.json({ reply });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur Gen demarre sur le port ${PORT}`);
});
