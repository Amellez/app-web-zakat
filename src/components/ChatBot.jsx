'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, HelpCircle } from 'lucide-react';

// Base de connaissances FAQ
const FAQ_DATABASE = {
  categories: {
    inventaire: {
      title: "📦 Inventaire",
      questions: [
        {
          q: "Comment ajouter un article ?",
          a: "Allez dans l'onglet **Inventaire** → Cliquez sur **Ajouter un produit** → Remplissez le nom, la quantité et l'unité → Enregistrez. L'article sera automatiquement ajouté !"
        },
        {
          q: "Comment modifier la quantité d'un article ?",
          a: "Dans l'onglet **Inventaire** → Cliquez sur le bouton **Modifier** (✏️) sur la carte de l'article → Changez la quantité → Cliquez sur **Enregistrer**. Les packs seront automatiquement régénérés !"
        },
        {
          q: "Comment supprimer un article ?",
          a: "Dans l'onglet **Inventaire** → Cliquez sur le bouton **🗑️** rouge → Confirmez la suppression. Attention : cette action est irréversible !"
        }
      ]
    },
    beneficiaires: {
      title: "👥 Bénéficiaires",
      questions: [
        {
          q: "Comment inscrire un bénéficiaire ?",
          a: "Dans l'onglet **Bénéficiaires** → Cliquez sur **Ajouter sur place** → Remplissez le formulaire → Enregistrez."
        },
        {
          q: "Comment valider un bénéficiaire ?",
          a: "Dans le tableau des bénéficiaires → Cliquez sur le bouton **Valider** (✓) vert. Le bénéficiaire pourra recevoir un pack."
        },
        {
          q: "Comment exporter la liste ?",
          a: "En haut de l'onglet **Bénéficiaires** → Cliquez sur **📥 Exporter Excel** → Le fichier se télécharge avec tous les bénéficiaires."
        }
      ]
    },
    packs: {
      title: "🎁 Packs",
      questions: [
        {
          q: "Comment générer les packs ?",
          a: "Onglet **Packs** → Cliquez sur **✨ Générer les packs** → Vérifiez → Confirmez. Les packs sont créés automatiquement !"
        },
        {
          q: "C'est quoi les suppléments ?",
          a: "Les suppléments sont 30% des articles favoris distribués aux familles qui ont choisi cet article (RIZ, PÂTES, ou COUSCOUS)."
        }
      ]
    },
    general: {
      title: "ℹ️ Général",
      questions: [
        {
          q: "Comment changer de mosquée ?",
          a: "En haut de l'interface → Menu déroulant des mosquées → Sélectionnez la mosquée. Toutes les données changeront automatiquement."
        },
        {
          q: "Comment me déconnecter ?",
          a: "En haut à droite → Bouton **Déconnexion** → Confirmez."
        }
      ]
    }
  }
};

const SUGGESTED_QUESTIONS = [
  "Comment ajouter un article ?",
  "Comment générer les packs ?",
  "Comment valider un bénéficiaire ?",
  "Comment exporter la liste ?",
];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 **Bonjour ! Je suis votre assistant.**\n\nPosez-moi une question ou choisissez un sujet :"
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const findAnswer = (question) => {
    const q = question.toLowerCase().trim();
    
    for (const category of Object.values(FAQ_DATABASE.categories)) {
      for (const item of category.questions) {
        if (item.q.toLowerCase().includes(q) || q.includes(item.q.toLowerCase().slice(0, 15))) {
          return item.a;
        }
      }
    }
    return null;
  };

  const handleSendMessage = (messageText = null) => {
    const text = messageText || inputMessage.trim();
    if (!text) return;

    setInputMessage('');
    setShowSuggestions(false);
    
    const newMessages = [...messages, { role: 'user', content: text }];
    const answer = findAnswer(text);
    
    if (answer) {
      newMessages.push({ role: 'assistant', content: answer });
    } else {
      newMessages.push({ 
        role: 'assistant', 
        content: "🤔 Désolé, je n'ai pas trouvé de réponse.\n\nParcourez les catégories ci-dessous :"
      });
      setShowSuggestions(true);
    }
    
    setMessages(newMessages);
  };

  const handleCategoryClick = (categoryKey) => {
    const category = FAQ_DATABASE.categories[categoryKey];
    const questionsList = category.questions.map((item, idx) => 
      `${idx + 1}. ${item.q}`
    ).join('\n');
    
    setMessages([
      ...messages,
      { role: 'user', content: category.title },
      { role: 'assistant', content: `**${category.title}**\n\n${questionsList}\n\nCliquez sur une question !`}
    ]);
    setShowSuggestions(false);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-2xl hover:shadow-emerald-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center z-50 group"
        >
          <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
        </button>
      )}

      {isOpen && (
        <div className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl z-50 flex flex-col transition-all ${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'}`}>
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Assistant d'aide</h3>
                <p className="text-xs text-emerald-100">Toujours disponible</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/20 rounded-lg">
                {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-emerald-500 text-white rounded-br-none' : 'bg-white text-gray-800 shadow-md rounded-bl-none'}`}>
                      <div className="text-sm whitespace-pre-line">
                        {msg.content.split('**').map((part, i) => i % 2 === 0 ? part : <strong key={i}>{part}</strong>)}
                      </div>
                    </div>
                  </div>
                ))}

                {showSuggestions && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 font-semibold">CATÉGORIES</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(FAQ_DATABASE.categories).map(([key, cat]) => (
                        <button key={key} onClick={() => handleCategoryClick(key)} className="p-3 bg-white rounded-lg shadow hover:shadow-md hover:bg-emerald-50 transition text-sm font-medium">
                          {cat.title}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 font-semibold mt-4">QUESTIONS FRÉQUENTES</p>
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <button key={i} onClick={() => handleSendMessage(q)} className="w-full p-2 bg-white rounded-lg shadow hover:shadow-md hover:bg-emerald-50 transition text-left text-sm">
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t rounded-b-2xl">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Posez votre question..."
                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                  <button onClick={() => handleSendMessage()} disabled={!inputMessage.trim()} className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}