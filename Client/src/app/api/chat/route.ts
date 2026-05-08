import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const MODEL   = "gpt-4o";

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(): string {
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  return `Tu es Rahma Assistant, un assistant médical IA chaleureux et professionnel du Cabinet Médical Rahma.

## Ton rôle
Tu aides les patients à :
- 📅 **Prendre un rendez-vous** — en les guidant pas à pas
- 📋 **Consulter leurs rendez-vous** — historique et prochains RDV
- 🩺 **Suivre leur parcours médical** — consultations passées et traitements
- 👨‍⚕️ **Connaître nos médecins** — spécialités, disponibilités

## Pour créer un rendez-vous, recueille ces informations dans l'ordre :
1. **Spécialité ou médecin souhaité** — Demande au patient quel type de médecin il recherche
2. **Date souhaitée** — Demande la date préférée (doit être une date future)
3. **Créneau horaire** — Montre les créneaux disponibles et laisse le patient choisir
4. **Motif de la consultation** — Demande brièvement pourquoi il souhaite consulter

## Règles importantes :
- Pose **une seule question à la fois** pour ne pas surcharger le patient
- **Confirme toujours** tous les détails (médecin, date, heure, motif) avant de créer le RDV
- Si un créneau n'est pas disponible, propose des **alternatives** (autre jour ou autre heure)
- Après la création du RDV, **résume** ce qui a été réservé
- Sois toujours **empathique**, clair et professionnel
- Réponds dans la **même langue que le patient** (français ou anglais) — par défaut en français

## Date du jour : ${today}`;
}

// ---------------------------------------------------------------------------
// Tool definitions (OpenAI function-calling format)
// ---------------------------------------------------------------------------

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_doctors",
      description:
        "Récupère la liste des médecins du cabinet avec leurs spécialités et informations. " +
        "Utilise cet outil pour aider le patient à choisir un médecin ou pour répondre à des questions sur les médecins disponibles.",
      parameters: {
        type: "object",
        properties: {
          search: {
            type: "string",
            description: "Terme de recherche optionnel (nom, prénom ou spécialité)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_available_slots",
      description:
        "Récupère les créneaux horaires disponibles pour un médecin donné à une date donnée. " +
        "Appelle cet outil une fois que le patient a choisi un médecin et une date.",
      parameters: {
        type: "object",
        properties: {
          medecinId: {
            type: "number",
            description: "L'identifiant du médecin",
          },
          date: {
            type: "string",
            description: "La date souhaitée au format YYYY-MM-DD",
          },
        },
        required: ["medecinId", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_appointment",
      description:
        "Crée un nouveau rendez-vous pour le patient. " +
        "N'appelle cet outil QUE APRÈS avoir confirmé tous les détails avec le patient : médecin, date, heure et motif.",
      parameters: {
        type: "object",
        properties: {
          medecinId: {
            type: "number",
            description: "L'identifiant du médecin",
          },
          dateHeure: {
            type: "string",
            description: "Date et heure du RDV au format ISO : YYYY-MM-DDTHH:MM:00",
          },
          motif: {
            type: "string",
            description: "Motif de la consultation (raison de la visite)",
          },
          notes: {
            type: "string",
            description: "Notes supplémentaires optionnelles",
          },
        },
        required: ["medecinId", "dateHeure", "motif"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_appointments",
      description:
        "Récupère les rendez-vous du patient connecté (passés et à venir). " +
        "Utilise cet outil quand le patient veut connaître ses rendez-vous.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_medical_followup",
      description:
        "Récupère l'historique des consultations médicales du patient connecté. " +
        "Utilise cet outil quand le patient pose des questions sur son suivi médical, " +
        "ses traitements ou ses consultations passées.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  token: string
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    switch (name) {
      // ── Get doctors ──────────────────────────────────────────────────────
      case "get_doctors": {
        const q = new URLSearchParams({ size: "50" });
        if (input.search) q.set("search", String(input.search));
        const res  = await fetch(`${BACKEND}/api/v1/medecins?${q}`, { headers });
        const data = await res.json();
        const list = (data?.data?.content ?? []) as Record<string, unknown>[];
        if (list.length === 0) return "Aucun médecin trouvé.";
        return JSON.stringify(
          list.map((m) => ({
            id:         m.id,
            nom:        `Dr. ${m.prenom} ${m.nom}`,
            specialite: m.specialite,
            telephone:  m.telephone ?? "—",
          }))
        );
      }

      // ── Available slots ──────────────────────────────────────────────────
      case "get_available_slots": {
        const res  = await fetch(
          `${BACKEND}/api/v1/rendez-vous/disponibilites/${input.medecinId}?date=${input.date}`,
          { headers }
        );
        const data = await res.json();
        const slots = data?.data as string[] ?? [];
        if (slots.length === 0)
          return `Aucun créneau disponible le ${input.date}. Essayez une autre date.`;
        return JSON.stringify({ date: input.date, creneaux: slots });
      }

      // ── Create appointment ───────────────────────────────────────────────
      case "create_appointment": {
        const meRes  = await fetch(`${BACKEND}/api/v1/patients/me`, { headers });
        const meData = await meRes.json();
        const patientId = meData?.data?.id as number | undefined;
        if (!patientId) return JSON.stringify({ erreur: "Profil patient introuvable." });

        const body = {
          patientId,
          medecinId: input.medecinId,
          dateHeure: input.dateHeure,
          motif:     input.motif,
          notes:     input.notes ?? undefined,
        };

        const res  = await fetch(`${BACKEND}/api/v1/rendez-vous`, {
          method:  "POST",
          headers,
          body:    JSON.stringify(body),
        });
        const data = await res.json();

        if (!res.ok) {
          return JSON.stringify({
            erreur: data?.message ?? "Impossible de créer le rendez-vous.",
          });
        }

        const rdv = data?.data as Record<string, unknown>;
        return JSON.stringify({
          succès:    true,
          message:   "Rendez-vous créé avec succès !",
          id:        rdv?.id,
          dateHeure: rdv?.dateHeure,
          medecin:   `Dr. ${rdv?.medecinPrenom} ${rdv?.medecinNom}`,
          motif:     rdv?.motif,
          statut:    rdv?.statut,
        });
      }

      // ── My appointments ──────────────────────────────────────────────────
      case "get_my_appointments": {
        const res  = await fetch(
          `${BACKEND}/api/v1/patients/me/rendez-vous?size=20&page=0`,
          { headers }
        );
        const data = await res.json();
        const list = (data?.data?.content ?? []) as Record<string, unknown>[];
        if (list.length === 0) return "Vous n'avez aucun rendez-vous enregistré.";
        return JSON.stringify(
          list.map((r) => ({
            id:         r.id,
            dateHeure:  r.dateHeure,
            medecin:    `Dr. ${r.medecinPrenom} ${r.medecinNom}`,
            specialite: r.medecinSpecialite,
            motif:      r.motif,
            statut:     r.statut,
          }))
        );
      }

      // ── Medical follow-up ────────────────────────────────────────────────
      case "get_my_medical_followup": {
        const res  = await fetch(
          `${BACKEND}/api/v1/patients/me/consultations?size=20&page=0`,
          { headers }
        );
        const data = await res.json();
        const list = (data?.data?.content ?? []) as Record<string, unknown>[];
        if (list.length === 0) return "Aucune consultation enregistrée.";
        return JSON.stringify(
          list.map((c) => ({
            id:                c.id,
            date:              c.dateVisite,
            medecin:           `Dr. ${c.medecinPrenom} ${c.medecinNom}`,
            motif:             c.motif,
            diagnosticPatient: c.diagnosticPatient,
            actesRealises:     c.actesRealises,
            montantTotal:      c.montantTotal,
          }))
        );
      }

      default:
        return JSON.stringify({ erreur: `Outil inconnu : ${name}` });
    }
  } catch (err) {
    return JSON.stringify({ erreur: `Erreur réseau : ${String(err)}` });
  }
}

// ---------------------------------------------------------------------------
// Route handler — agentic loop
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const { messages, token } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      token: string;
    };

    if (!token) {
      return NextResponse.json({ error: "Token manquant." }, { status: 401 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY non configurée." },
        { status: 500 }
      );
    }

    // Build the messages array for OpenAI
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: buildSystemPrompt() },
      ...messages,
    ];

    let finalText = "";
    const MAX_ITERATIONS = 6;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await client.chat.completions.create({
        model:    MODEL,
        messages: openaiMessages,
        tools:    TOOLS,
      });

      const choice = response.choices[0];
      const msg    = choice.message;

      // Always push the assistant message into the history
      openaiMessages.push(msg);

      // Capture any text content
      if (msg.content) {
        finalText = msg.content;
      }

      // Done — no more tool calls
      if (choice.finish_reason === "stop" || !msg.tool_calls?.length) break;

      // Execute all requested tool calls in parallel
      const toolResults = await Promise.all(
        msg.tool_calls.map(async (tc) => {
          const input = JSON.parse(tc.function.arguments || "{}") as Record<string, unknown>;
          const output = await executeTool(tc.function.name, input, token);
          return {
            role:         "tool" as const,
            tool_call_id: tc.id,
            content:      output,
          };
        })
      );

      // Append tool results and continue loop
      openaiMessages.push(...toolResults);
    }

    return NextResponse.json({
      reply: finalText || "Désolé, je n'ai pas pu traiter votre demande.",
    });
  } catch (err) {
    console.error("[chat/route]", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur IA." },
      { status: 500 }
    );
  }
}
