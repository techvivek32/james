import { Course } from "../types";

export const initialCourses: Course[] = [
  {
    id: "door-knocking",
    title: "Door Knocking Foundations",
    tagline: "Mindset, safety, and on-the-door frameworks.",
    description:
      "Learn the fundamentals of knocking doors with confidence, safety, and consistency so you can build a reliable pipeline week after week.",
    lessonNames: ["Pre-game routine", "Body language", "Opening lines"],
    assetFiles: ["Door pitch one-pager.pdf", "Territory map template.xlsx"],
    marketingDocs: ["Neighborhood intro letter.docx", "Door hanger template.ai"],
    icon: "🚪",
    difficultyLabel: "Medium",
    timeLabel: "Short",
    difficultyScore: 60,
    timeScore: 40,
    riskScore: 30,
    capitalScore: 10,
    personalityScore: 70,
    quizQuestions: [
      {
        id: "dq1",
        prompt: "What is the primary goal of your first 5 seconds at the door?",
        options: [
          "Deliver your full pitch",
          "Build rapport and lower resistance",
          "Ask for a referral",
          "Confirm the homeowner’s schedule"
        ],
        correctIndex: 1
      },
      {
        id: "dq2",
        prompt: "Which element most impacts your confidence before a door run?",
        options: [
          "Having snacks",
          "Weather conditions",
          "Pre-game routine and mindset",
          "Number of business cards"
        ],
        correctIndex: 2
      }
    ],
    links: [
      {
        label: "Door knocking safety guide",
        href: "#door-safety"
      },
      {
        label: "Pre-game checklist",
        href: "#pregame-checklist"
      }
    ]
  },
  {
    id: "objections",
    title: "Objection Handling Lab",
    tagline: "Structured responses to the top objections.",
    description:
      "Drill the top field objections and practice frameworks so you never feel stuck when a homeowner pushes back.",
    lessonNames: ["No interest", "Not home owner", "Too busy"],
    assetFiles: ["Objection flashcards.pdf", "Role-play scripts.docx"],
    marketingDocs: ["Objection rebuttal card.pdf"],
    icon: "🎯",
    difficultyLabel: "Medium",
    timeLabel: "Medium",
    difficultyScore: 70,
    timeScore: 60,
    riskScore: 40,
    capitalScore: 5,
    personalityScore: 80,
    quizQuestions: [
      {
        id: "oq1",
        prompt: "What is the first step when you hear an objection?",
        options: [
          "Talk faster to overcome it",
          "Interrupt with a discount",
          "Acknowledge and label the concern",
          "End the conversation"
        ],
        correctIndex: 2
      }
    ],
    links: [
      {
        label: "Top 10 objections",
        href: "#top-objections"
      },
      {
        label: "Role-play tips",
        href: "#roleplay-tips"
      }
    ]
  }
];

