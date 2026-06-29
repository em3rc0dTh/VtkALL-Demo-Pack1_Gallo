"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Send, X, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function ProblemaModal({ isOpen, onClose, onSend, tallerNombre }) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState(true);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const textRef = useRef("");

  // Mantener el ref sincronizado con el estado
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    // Inicializar Speech Recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "es-ES";

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          if (event.error !== "no-speech") {
            setError("Error al reconocer voz: " + event.error);
          }
        };
      } else {
        setHasSpeechRecognition(false);
      }
    }
  }, []);

  const handleStartRecording = async () => {
    try {
      setError(null);
      setIsRecording(true);
      
      // NO limpiamos el texto, simplemente guardamos la base
      const baseText = textRef.current;

      // Iniciar SpeechRecognition ANTES de getUserMedia (evita problemas de gestos de usuario)
      if (recognitionRef.current) {
        recognitionRef.current.onresult = (event) => {
          let sessionTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            sessionTranscript += event.results[i][0].transcript;
          }
          // Unir el texto que ya estaba con lo nuevo que va escuchando
          setText(baseText ? baseText + " " + sessionTranscript : sessionTranscript);
        };
        
        // Reiniciar automáticamente si se detiene por silencio mientras seguimos grabando
        recognitionRef.current.onend = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // ignore
            }
          }
        };
        
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Recognition already started or error:", e);
        }
      }

      // Request mic access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioUrl(reader.result);
        };
      };

      mediaRecorderRef.current.start();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setIsRecording(false);
      setError("No se pudo acceder al micrófono. Por favor, permite el acceso o escribe tu problema.");
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    if (recognitionRef.current) {
      // Removemos el onend para que no intente reiniciar
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition", e);
      }
    }
  };

  const handleSubmit = () => {
    if (!text.trim() && !audioUrl) return;
    setIsProcessing(true);
    
    // Preparar el texto completo
    let finalMsg = `Hola ${tallerNombre}, no sé exactamente qué servicio necesito, pero mi vehículo presenta este problema: ${text.trim()}`;
    
    // Si no hay texto pero hay audio (caso raro donde no soporte SpeechRecognition)
    if (!text.trim() && audioUrl) {
      finalMsg = `Hola ${tallerNombre}, te envío un audio describiendo mi problema.`;
    }
    
    const payload = {
      texto: finalMsg,
      audio: audioUrl // base64 string or null
    };

    onSend(payload);
    
    // Limpiar estado y cerrar
    setTimeout(() => {
      setText("");
      setAudioUrl(null);
      setIsProcessing(false);
      onClose();
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-white border-0 shadow-2xl">
        <DialogTitle className="text-xl font-black text-navy font-['Readex_Pro']">
          Describir mi problema
        </DialogTitle>
        <DialogDescription className="text-sm text-slate-500 mt-2 mb-4">
          Escribe el problema de tu vehículo o usa el micrófono para contárnoslo. Iris lo analizará.
        </DialogDescription>

        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ej: Siento que el timón vibra al pasar de 80 km/h y hace un chillido al frenar..."
            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none placeholder:text-slate-400"
            disabled={isProcessing}
          ></textarea>
          
          {isRecording && (
            <div className="absolute inset-0 bg-primary/5 rounded-2xl flex flex-col items-center justify-center border border-primary/20 z-10 backdrop-blur-[1px]">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2 animate-pulse">
                <Mic className="w-6 h-6 text-primary" />
              </div>
              <span className="text-primary font-bold text-sm tracking-wide">
                {hasSpeechRecognition ? "Escuchando..." : "Grabando audio..."}
              </span>
              {hasSpeechRecognition && (
                <span className="text-xs text-slate-500 mt-1 max-w-[80%] text-center line-clamp-2">"{text.slice(-50)}"</span>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 mt-3 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 transition-all shadow-sm ${
              isRecording
                ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/30"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
            title={isRecording ? "Detener grabación" : "Grabar audio"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={(!text.trim() && !audioUrl && !isRecording) || isProcessing}
            className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black text-sm transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Enviando..." : "Enviar a Iris"}
            <Send className="w-4 h-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
