"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  Wrench,
  Calendar,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Paperclip,
  Camera,
} from "lucide-react";
import { api } from "../../lib/api.js";
import BookingFlow from "./BookingFlow";

export default function ChatAsistente({
  taller = {},
  triggerOpenMessage,
  setTriggerOpenMessage,
  openChat,
  setOpenChat,
}) {
  const nombreAgente = taller.config_agente?.nombre_agente || "Max";
  const [isOpen, setIsOpen] = useState(false);
  const [telefono, setTelefono] = useState("web_init");
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const [imagenesAdjuntas, setImagenesAdjuntas] = useState([]);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileNotification, setShowMobileNotification] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);

  // Client info loaded from DB
  const [clienteData, setClienteData] = useState({
    nombre: "",
    dni: "",
    telefono: "",
    vehiculo_marca: "",
    vehiculo_modelo: "",
    vehiculo_anio: "",
  });

  // Modal calendar states
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsDisponibles, setSlotsDisponibles] = useState([]);
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);

  // Booking Form states
  const [formNombre, setFormNombre] = useState("");
  const [formDni, setFormDni] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formServicio, setFormServicio] = useState("");
  const [formMarca, setFormMarca] = useState("");
  const [formModelo, setFormModelo] = useState("");
  const [formAnio, setFormAnio] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Inicializar identificador único de sesión web al montar
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(
        /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth <= 768,
      );
      let saved = localStorage.getItem("mecanica_web_session");
      if (!saved) {
        saved = `web_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem("mecanica_web_session", saved);
      }
      setTelefono(saved);

      // Auto-open logic after 5 seconds
      const autoOpenTimer = setTimeout(() => {
        if (
          /Mobi|Android/i.test(navigator.userAgent) ||
          window.innerWidth <= 768
        ) {
          setShowMobileNotification(true);
        } else {
          setIsOpen(true);
        }
      }, 5000);

      return () => clearTimeout(autoOpenTimer);
    }
  }, []);

  // Cargar servicios disponibles al montar
  useEffect(() => {
    const cargarServicios = async () => {
      try {
        const data = await api.getServicios();
        if (Array.isArray(data)) {
          setServiciosDisponibles(data);
        }
      } catch (err) {
        console.error("Error al cargar servicios:", err);
      }
    };
    cargarServicios();
  }, []);

  const chatEndRef = useRef(null);

  // Cargar mensajes desde backend (MongoDB)
  const cargarMensajes = async () => {
    if (typeof window !== "undefined" && telefono !== "web_init") {
      try {
        const res = await api.getHistorialPublico(telefono);
        if (res && res.ok) {
          setMensajes(res.mensajes || []);
          if (res.cliente) {
            const firstVehiculo =
              res.cliente.vehiculos && res.cliente.vehiculos[0]
                ? res.cliente.vehiculos[0]
                : {};
            setClienteData({
              nombre: res.cliente.nombre || "",
              dni: res.cliente.dni || "",
              telefono: res.cliente.numero_telefono || "",
              vehiculo_marca: firstVehiculo.marca || "",
              vehiculo_modelo: firstVehiculo.modelo || "",
              vehiculo_anio: firstVehiculo.anio || "",
            });
          }
        } else {
          setMensajes([]);
        }
      } catch (error) {
        console.error("Error al cargar mensajes desde backend:", error);
        setMensajes([]);
      }
    }
  };

  useEffect(() => {
    if (telefono !== "web_init") {
      cargarMensajes();
    }
  }, [telefono]);

  // Pre-rellenar formulario cuando se abre el calendario
  useEffect(() => {
    if (isCalendarOpen) {
      setFormNombre(clienteData.nombre || "");
      setFormDni(clienteData.dni || "");

      const isWebSession = telefono.startsWith("web_");
      setFormTelefono(isWebSession ? "" : telefono);

      setFormMarca(clienteData.vehiculo_marca || "");
      setFormModelo(clienteData.vehiculo_modelo || "");
      setFormAnio(clienteData.vehiculo_anio || "");

      setSelectedDateStr("");
      setSelectedTimeSlot("");
      setBookingError("");
    }
  }, [isCalendarOpen, clienteData, telefono]);

  useEffect(() => {
    if (triggerOpenMessage) {
      setIsOpen(true);
      setTimeout(() => {
        enviarMensaje(triggerOpenMessage);
        setTriggerOpenMessage("");
      }, 300);
    }
  }, [triggerOpenMessage]);

  useEffect(() => {
    if (openChat) {
      setIsOpen(true);
      setShowMobileNotification(false);
      if (setOpenChat) setOpenChat(false);
    }
  }, [openChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, escribiendo]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (imagenesAdjuntas.length + files.length > 2) {
      alert("Puedes adjuntar máximo 2 archivos por mensaje.");
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagenesAdjuntas((prev) => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = null; // reset
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items || [];
    const files = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (
          file &&
          (file.type.startsWith("image/") || file.type === "application/pdf")
        ) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      if (imagenesAdjuntas.length + files.length > 2) {
        alert("Puedes adjuntar máximo 2 archivos por mensaje.");
        return;
      }

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImagenesAdjuntas((prev) => [...prev, event.target.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const renderAdjunto = (adj, i) => {
    const isPDF =
      adj.startsWith("data:application/pdf") ||
      adj.toLowerCase().endsWith(".pdf");
    if (isPDF) {
      return (
        <a
          key={i}
          href={adj}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 p-2 bg-slate-100 text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-200 transition-colors w-full sm:w-auto"
          download="documento.pdf"
        >
          <svg
            className="w-5 h-5 shrink-0 text-red-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span className="text-xs font-bold truncate max-w-[150px]">
            Ver PDF
          </span>
        </a>
      );
    }
    return (
      <img
        key={i}
        src={adj}
        alt="adjunto"
        onClick={() => setExpandedImage(adj)}
        className="w-24 h-24 object-cover rounded-lg border border-white/20 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
      />
    );
  };

  const removeAdjunto = (index) => {
    setImagenesAdjuntas((prev) => prev.filter((_, i) => i !== index));
  };

  const enviarMensaje = async (textoOverride = "") => {
    const texto = (textoOverride || nuevoMensaje).trim();
    if (!texto && imagenesAdjuntas.length === 0) return;

    if (!textoOverride) setNuevoMensaje("");

    const adjuntosToSend = [...imagenesAdjuntas];
    setImagenesAdjuntas([]);

    const temporalId = `cliente-${Date.now()}`;
    const nuevoMsgCliente = {
      _id: temporalId,
      remitente: "cliente",
      contenido: texto || "📷 Imagen adjunta",
      recibido_en: new Date().toISOString(),
      adjuntos: adjuntosToSend,
    };

    setMensajes((prev) => [...prev, nuevoMsgCliente]);
    setEscribiendo(true);

    try {
      const res = await api.enviarMensajeSimulado(
        telefono,
        texto || "Analiza esta imagen",
        adjuntosToSend,
      );
      if (res && res.ok && res.respuesta) {
        const containsTrigger = res.respuesta.includes("[ABRIR_CALENDARIO]");
        const cleanRespuesta = res.respuesta
          .replace("[ABRIR_CALENDARIO]", "")
          .trim();

        const nuevoMsgAsistente = {
          _id: `asistente-${Date.now()}`,
          remitente: "asistente",
          contenido: cleanRespuesta,
          recibido_en: new Date().toISOString(),
        };

        // Si el backend migró el teléfono de la sesión web al número real
        if (
          res.cliente &&
          res.cliente.numero_telefono &&
          res.cliente.numero_telefono !== telefono
        ) {
          const nuevoTelefono = res.cliente.numero_telefono;

          if (typeof window !== "undefined") {
            localStorage.setItem("mecanica_web_session", nuevoTelefono);
          }

          setTelefono(nuevoTelefono); // Esto disparará cargarMensajes automáticamente
        } else {
          setMensajes((prev) => [...prev, nuevoMsgAsistente]);
        }

        if (containsTrigger) {
          setIsCalendarOpen(true);
        }
      } else {
        throw new Error("Respuesta inválida de la simulación");
      }
    } catch (err) {
      console.error("Error al enviar mensaje simulado:", err);
      setMensajes((prev) => [
        ...prev,
        {
          _id: `error-${Date.now()}`,
          remitente: "asistente",
          contenido:
            "🔧 Lo siento, tengo un problema para conectarme con el taller. Intenta de nuevo.",
          recibido_en: new Date().toISOString(),
        },
      ]);
    } finally {
      setEscribiendo(false);
    }
  };

  const handleQuickReply = (replyText) => {
    enviarMensaje(replyText);
  };

  // Calendar Helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const generateCalendarDays = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7;

    const days = [];
    for (let i = 0; i < startOffset; i++) {
      days.push({ day: null, dateStr: "" });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, "0");
      const dayStr = String(d).padStart(2, "0");
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
      days.push({ day: d, dateStr });
    }

    return days;
  };

  const handleSelectDay = async (dateStr) => {
    setSelectedDateStr(dateStr);
    setSelectedTimeSlot("");
    setLoadingSlots(true);
    try {
      const res = await api.getDisponibilidadPublica(dateStr);
      if (res && res.ok) {
        setSlotsDisponibles(res.horarios_disponibles || []);
      } else {
        setSlotsDisponibles([]);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      setSlotsDisponibles([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDateStr || !selectedTimeSlot) {
      setBookingError("Por favor selecciona una fecha y una hora.");
      return;
    }

    setBookingLoading(true);
    setBookingError("");

    try {
      const fechaHoraCita = `${selectedDateStr}T${selectedTimeSlot}:00`;

      const payload = {
        numero_telefono: formTelefono,
        nombre_cliente: formNombre,
        dni: formDni,
        servicio: formServicio,
        vehiculo_marca: formMarca,
        vehiculo_modelo: formModelo,
        vehiculo_anio: formAnio ? parseInt(formAnio) : undefined,
        fecha_cita: fechaHoraCita,
        _session_telefono: telefono,
      };

      const res = await api.agendarCitaPublica(payload);
      if (res && res.ok) {
        if (typeof window !== "undefined") {
          localStorage.setItem("mecanica_web_session", formTelefono);
        }

        setTelefono(formTelefono);
        setIsCalendarOpen(false);

        if (formTelefono === telefono) {
          cargarMensajes();
        }
      } else {
        throw new Error(res.error || "No se pudo reservar la cita.");
      }
    } catch (err) {
      console.error("Error al agendar cita pública:", err);
      setBookingError(err.message || "Error del servidor al agendar la cita.");
    } finally {
      setBookingLoading(false);
    }
  };

  const formatMarkdown = (text) => {
    if (!text) return "";
    let cleanText = text.replace("[ABRIR_CALENDARIO]", "").trim();
    // Normalizar enlaces markdown rotos por espacios o saltos de línea (por ejemplo: ] \n ()
    cleanText = cleanText.replace(/\]\s*\(/g, "](");
    // Eliminar negritas alrededor de los enlaces para evitar que se interpreten como texto plano: **[texto](url)** -> [texto](url)
    cleanText = cleanText.replace(/\*\*\[(.*?)\]\((.*?)\)\*\*/g, "[$1]($2)");
    const lines = cleanText.split("\n");
    return lines.map((line, idx) => {
      let isBullet = false;
      let cleanLine = line;

      if (line.trim().startsWith("- ")) {
        isBullet = true;
        cleanLine = line.trim().substring(2);
      } else if (line.trim().startsWith("* ")) {
        isBullet = true;
        cleanLine = line.trim().substring(2);
      }

      const parts = [];
      const regex = /(\*\*(.*?)\*\*|\[(.*?)\]\((.*?)\))/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(cleanLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(cleanLine.substring(lastIndex, match.index));
        }
        if (match[2] !== undefined) {
          parts.push(
            <strong key={match.index} className="font-semibold text-primary">
              {match[2]}
            </strong>,
          );
        } else if (match[3] !== undefined && match[4] !== undefined) {
          const url = match[4].trim();
          const text = match[3];

          const hashIndex = url.indexOf("#");
          if (
            hashIndex !== -1 &&
            (url.startsWith("/") ||
              url.startsWith("#") ||
              (typeof window !== "undefined" && !url.startsWith("http")))
          ) {
            const targetId = url.substring(hashIndex + 1).trim();
            parts.push(
              <a
                key={match.index}
                href={url}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(targetId);
                  if (element) {
                    element.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
                className="text-primary hover:text-primary-hover font-bold underline transition-colors cursor-pointer"
              >
                {text}
              </a>,
            );
          } else {
            const isInternal =
              url.startsWith("/") ||
              (typeof window !== "undefined" &&
                (url.startsWith("http://localhost") ||
                  url.includes(window.location.host)));
            if (isInternal) {
              parts.push(
                <a
                  key={match.index}
                  href={url}
                  className="text-primary hover:text-primary-hover font-bold underline transition-colors"
                >
                  {text}
                </a>,
              );
            } else {
              parts.push(
                <a
                  key={match.index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-hover font-bold underline transition-colors"
                >
                  {text}
                </a>,
              );
            }
          }
        }
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < cleanLine.length) {
        parts.push(cleanLine.substring(lastIndex));
      }

      const content = parts.length > 0 ? parts : cleanLine;

      if (isBullet) {
        return (
          <li key={idx} className="list-disc ml-4 my-1 pl-0.5">
            {content}
          </li>
        );
      }

      return (
        <span key={idx} className="block min-h-[1.2em]">
          {content}
        </span>
      );
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      enviarMensaje();
    }
  };

  const obtenerServicioElegido = () => {
    if (!Array.isArray(mensajes) || !Array.isArray(serviciosDisponibles))
      return "";
    // Escanear los mensajes de más nuevo a más antiguo
    for (let i = mensajes.length - 1; i >= 0; i--) {
      const m = mensajes[i];
      if (m.remitente === "cliente") {
        const contentLow = m.contenido.toLowerCase();
        // Intentar hacer match exacto de nombre de servicio
        for (const s of serviciosDisponibles) {
          if (contentLow.includes(s.nombre.toLowerCase())) {
            return s.nombre;
          }
        }
        // Buscar palabras clave comunes de servicios
        if (
          contentLow.includes("aceite") ||
          contentLow.includes("mantenimiento preventivo")
        ) {
          const match = serviciosDisponibles.find(
            (s) =>
              s.nombre.toLowerCase().includes("aceite") ||
              s.nombre.toLowerCase().includes("preventiva"),
          );
          if (match) return match.nombre;
        }
        if (contentLow.includes("freno")) {
          const match = serviciosDisponibles.find((s) =>
            s.nombre.toLowerCase().includes("freno"),
          );
          if (match) return match.nombre;
        }
        if (
          contentLow.includes("planchado") ||
          contentLow.includes("pintura")
        ) {
          const match = serviciosDisponibles.find(
            (s) =>
              s.nombre.toLowerCase().includes("planchado") ||
              s.nombre.toLowerCase().includes("pintura"),
          );
          if (match) return match.nombre;
        }
        if (
          contentLow.includes("detailing") ||
          contentLow.includes("cerámico") ||
          contentLow.includes("ceramico") ||
          contentLow.includes("tratamiento")
        ) {
          const match = serviciosDisponibles.find(
            (s) =>
              s.nombre.toLowerCase().includes("detailing") ||
              s.nombre.toLowerCase().includes("cerámico") ||
              s.nombre.toLowerCase().includes("ceramico"),
          );
          if (match) return match.nombre;
        }
      }
    }
    return "";
  };

  const handleBookingSuccess = (realTelefono) => {
    if (realTelefono) {
      if (typeof window !== "undefined") {
        localStorage.setItem("mecanica_web_session", realTelefono);
      }
      setTelefono(realTelefono);
    }
    // Cargar los mensajes para que aparezcan la solicitud y la confirmación en el chat
    setTimeout(() => {
      cargarMensajes();
    }, 500);
  };

  const ultimoMensaje = mensajes[mensajes.length - 1];
  const esPreguntaCalendario =
    ultimoMensaje &&
    ultimoMensaje.remitente === "asistente" &&
    (ultimoMensaje.contenido.toLowerCase().includes("abrirte un calendario") ||
      ultimoMensaje.contenido
        .toLowerCase()
        .includes("mostrarte las citas o las horas disponibles"));

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 font-sans">
      {/* Botón Flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 relative group cursor-pointer"
        >
          <MessageSquare className="w-7 h-7 fill-current" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
          </span>
          {/* Tooltip (hidden on mobile, visible on desktop) */}
          <div className="hidden sm:block absolute right-20 bg-navy border border-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none shadow-xl">
            ¿Quieres agendar una cita? Prueba a {nombreAgente} aquí 💬
          </div>
        </button>
      )}

      {/* Mobile Notification Push */}
      {!isOpen && showMobileNotification && isMobile && (
        <div className="absolute bottom-20 right-0 w-[280px] bg-white border border-gray-200 rounded-2xl p-4 shadow-2xl animate-fade-in-up">
          <button
            onClick={() => setShowMobileNotification(false)}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              {taller.config_agente?.avatar_url ? (
                <img
                  src={taller.config_agente.avatar_url}
                  className="w-10 h-10 rounded-full object-cover shadow-sm"
                  alt={nombreAgente}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-lg shadow-sm">
                  🤖
                </div>
              )}
            </div>
            <div>
              <h5 className="text-sm font-bold text-gray-800">
                ¡Hola! Soy {nombreAgente}
              </h5>
              <p className="text-xs text-gray-600 mt-1">
                Comunícate conmigo para obtener más información o agendar tu
                cita.
              </p>
              <button
                onClick={() => {
                  setIsOpen(true);
                  setShowMobileNotification(false);
                }}
                className="mt-2 text-xs font-bold text-primary hover:text-primary-hover"
              >
                Abrir chat →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ventana de Chat */}
{isOpen && (
  <div className="w-[calc(100vw-32px)] sm:w-[360px] h-[500px] max-h-[calc(100vh-60px)] rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-2xl flex flex-col transition-all duration-300">
    {/* Header (Versión Original Mejorada) */}
    <div className="bg-white border-b border-gray-200 relative flex flex-col rounded-t-3xl overflow-hidden">
      {/* Banner superior (Cover Photo) */}
      <div className="relative w-full h-20 bg-[#3f3f41] overflow-hidden shrink-0">
        {taller.config_agente?.banner_url ? (
          <img
            src={taller.config_agente.banner_url}
            alt="Banner"
            className={`w-full h-full object-cover ml-6 pr-6 ${
              taller.config_agente?.alineacion_avatar_chat === "Izquierda"
                ? "object-right"
                : taller.config_agente?.alineacion_avatar_chat ===
                    "Centro"
                  ? "object-center"
                  : "object-left"
            }`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-800 to-slate-900"></div>
        )}

        <button
          onClick={() => setIsOpen(false)}
          className={`absolute top-2.5 p-1.5 rounded-full text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors z-20 ${
            taller.config_agente?.alineacion_avatar_chat === "Derecha"
              ? "left-3"
              : "right-3"
          }`}
          title="Minimizar chat"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Contenido inferior (Fondo blanco compacto) */}
      <div
        className={`relative px-4 pt-0 pb-2 bg-white flex w-full gap-3 ${
          taller.config_agente?.alineacion_avatar_chat === "Centro"
            ? "flex-col items-center justify-center"
            : taller.config_agente?.alineacion_avatar_chat === "Derecha"
              ? "flex-row-reverse items-end justify-start"
              : "flex-row items-end justify-start"
        }`}
      >
        {/* Contenedor del Avatar y Tag */}
        <div className="relative flex flex-col items-center shrink-0 -mt-7">
          {/* Avatar */}
          <div className="relative">
            {taller.config_agente?.avatar_url ? (
              <img
                src={taller.config_agente.avatar_url}
                alt={nombreAgente}
                className="w-16 h-16 rounded-full object-cover border-[3px] border-white bg-white shadow-md"
                onError={(e) => {
                  e.target.src =
                    "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=100";
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full border-[3px] border-white bg-gradient-to-br from-primary to-blue-600 shadow-md flex items-center justify-center font-bold text-white text-lg">
                🤖
              </div>
            )}
          </div>

          {/* Name Tag pill flotando sobre el avatar */}
          <div className="bg-white rounded-xl px-3 py-[3px] shadow-sm border border-gray-100 -mt-2.5 z-10">
            <h4
              className="text-[11px] font-black leading-none tracking-tight text-center truncate max-w-[100px]"
              style={{
                color:
                  taller.config_agente?.color_nombre_agente || "#0f172a",
              }}
            >
              {nombreAgente}
            </h4>
          </div>
        </div>

        {/* Estado e Info adicional, junto al avatar en lugar de irse al extremo */}
        <div
          className={`flex flex-col justify-center pb-1 ${
            taller.config_agente?.alineacion_avatar_chat === "Centro"
              ? "items-center"
              : taller.config_agente?.alineacion_avatar_chat === "Derecha"
                ? "items-end"
                : "items-start"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[12px] font-semibold text-slate-500">
              Activo ahora
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* Body de Mensajes */}
    <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-light-panel">
      {mensajes.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2.5">
            <Wrench className="w-5 h-5" />
          </div>
          <p className="text-xs text-[#7A7A7A] px-8">
            ¡Hola! Envía un mensaje para iniciar tu reserva o resolver
            dudas. {nombreAgente} responderá al instante.
          </p>
        </div>
      )}

      {mensajes.map((m) => (
        <div
          key={m._id}
          className={`flex ${m.remitente === "cliente" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
              m.remitente === "cliente"
                ? "bg-primary text-white rounded-br-none"
                : "bg-white text-slate-800 border border-slate-200/60 rounded-bl-none shadow-sm"
            }`}
          >
            {m.adjuntos && m.adjuntos.length > 0 && (
              <div className="flex gap-2 mb-2 overflow-x-auto">
                {m.adjuntos.map((adj, i) => renderAdjunto(adj, i))}
              </div>
            )}
            <div className="whitespace-pre-wrap">
              {formatMarkdown(m.contenido)}
            </div>
            <span
              className={`block text-[8px] text-right mt-1 ${
                m.remitente === "cliente"
                  ? "text-blue-200"
                  : "text-[#7A7A7A]"
              }`}
            >
              {new Date(m.recibido_en).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      ))}

      {escribiendo && (
        <div className="flex justify-start">
          <div className="bg-white text-slate-450 rounded-2xl rounded-bl-none px-3.5 py-2.5 text-xs border border-slate-200/60 shadow-sm flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></span>
            <span
              className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></span>
            <span
              className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></span>
          </div>
        </div>
      )}

      {esPreguntaCalendario && (
        <div className="flex gap-2 justify-start pl-2">
          <button
            type="button"
            onClick={() => handleQuickReply("Sí, abrir calendario")}
            className="px-3 py-1.5 bg-blue-50 hover:bg-primary hover:text-white border border-primary/40 text-primary text-xs font-bold rounded-full transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            Sí, abrir calendario 📅
          </button>
          <button
            type="button"
            onClick={() => handleQuickReply("No, prefiero escribir")}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-200 border border-slate-350 text-slate-700 text-xs font-bold rounded-full transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            No, prefiero escribir ✍️
          </button>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>

    {/* Input */}
    <div className="bg-light-panel border-t border-gray-200 flex flex-col">
      {imagenesAdjuntas.length > 0 && (
        <div className="flex gap-2 p-2 border-b border-gray-100 overflow-x-auto bg-white/50">
          {imagenesAdjuntas.map((adj, idx) => {
            const isPDF =
              adj.startsWith("data:application/pdf") ||
              adj.toLowerCase().endsWith(".pdf");
            return (
              <div key={idx} className="relative inline-block shrink-0">
                {isPDF ? (
                  <div className="h-16 w-16 bg-slate-100 flex items-center justify-center rounded-lg border border-primary/20 shadow-sm">
                    <span className="text-xs font-bold text-red-500">
                      PDF
                    </span>
                  </div>
                ) : (
                  <img
                    src={adj}
                    alt="preview"
                    className="h-16 w-16 object-cover rounded-lg border border-primary/20 shadow-sm"
                  />
                )}
                <button
                  onClick={() => removeAdjunto(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className="p-2 flex items-center gap-1.5">
        <input
          type="file"
          accept="image/*,application/pdf"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer"
          title="Adjuntar galería"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        {isMobile && (
          <>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer"
              title="Tomar foto"
            >
              <Camera className="w-5 h-5" />
            </button>
          </>
        )}
        <input
          type="text"
          placeholder="Escribe un mensaje..."
          value={nuevoMensaje}
          onChange={(e) => setNuevoMensaje(e.target.value)}
          onKeyDown={handleKeyPress}
          onPaste={handlePaste}
          className="flex-1 bg-white border border-gray-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-primary outline-none shadow-sm min-w-0"
        />
        <button
          onClick={() => enviarMensaje()}
          className="p-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  </div>
)}

      {/* Modal de Calendario */}
      {isCalendarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <BookingFlow
            taller={taller}
            onClose={() => setIsCalendarOpen(false)}
            initialNombre={clienteData.nombre || ""}
            initialDni={clienteData.dni || ""}
            initialTelefono={telefono.startsWith("web_") ? "" : telefono}
            initialServicio={obtenerServicioElegido()}
            onSuccess={handleBookingSuccess}
          />
        </div>
      )}

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setExpandedImage(null)}
        >
          <button className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/50 p-2 rounded-full cursor-pointer transition-colors">
            <X className="w-6 h-6" />
          </button>
          <img
            src={expandedImage}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            alt="Expanded view"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
