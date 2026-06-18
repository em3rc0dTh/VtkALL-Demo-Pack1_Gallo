"use client";

import { useState, useEffect } from "react";
import { api } from "../../lib/api.js";
import LoadingSpinner from "../ui/LoadingSpinner.js";
import {
  Search,
  User,
  Car,
  Plus,
  Trash2,
  Calendar,
  Clipboard,
  Filter,
  Wrench,
  Check,
  MessageCircle,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Activity,
  Star,
} from "lucide-react";
import EstadoBadge from "../ui/EstadoBadge.js";
import Swal from "sweetalert2";

const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMins < 1) return "Hace un momento";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24)
    return `Hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
  if (diffDays < 30)
    return `Hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
  if (diffMonths < 12)
    return `Hace ${diffMonths} ${diffMonths === 1 ? "mes" : "meses"}`;
  return `Hace ${diffYears} ${diffYears === 1 ? "año" : "años"}`;
};

export default function TabClientes() {
  const [clientes, setClientes] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  // Filtros UI
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroDni, setFiltroDni] = useState("todos");
  const [filtroOrden, setFiltroOrden] = useState("recientes");

  // Detalle Modal
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [citasHistorial, setCitasHistorial] = useState([]);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [datosAbiertos, setDatosAbiertos] = useState(false);

  // Editar Modal
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editNombre, setEditNombre] = useState("");
  const [editDni, setEditDni] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editVehiculos, setEditVehiculos] = useState([]);
  const [editNotas, setEditNotas] = useState("");
  const [editTotalGastado, setEditTotalGastado] = useState(0);
  const [editDeudaActual, setEditDeudaActual] = useState(0);
  const [errorEdit, setErrorEdit] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Detalles Adicionales temp form
  const [vMarca, setVMarca] = useState("");
  const [vModelo, setVModelo] = useState("");
  const [vAnio, setVAnio] = useState("");
  const [vPatente, setVPatente] = useState("");
  const [vAlias, setVAlias] = useState("");

  // Historial Clínico & Mantenimiento states
  const [activeHistoryTab, setActiveHistoryTab] = useState("personales");
  const [mensajesHistorial, setMensajesHistorial] = useState([]);
  const [reparacionVehiculoActivo, setReparacionVehiculoActivo] =
    useState(null);
  const [modalRepairDetail, setModalRepairDetail] = useState(null);
  const [modalThreadOpen, setModalThreadOpen] = useState(false);
  const [modalVehiculoDetailOpen, setModalVehiculoDetailOpen] = useState(false);
  const [selectedVehiculoDetail, setSelectedVehiculoDetail] = useState(null);

  const [modalReparacionOpen, setModalReparacionOpen] = useState(false);
  const [repTitulo, setRepTitulo] = useState("");
  const [selectedThread, setSelectedThread] = useState(null);
  const [repKilometraje, setRepKilometraje] = useState("");
  const [repPiezas, setRepPiezas] = useState("");
  const [repImagenAntes, setRepImagenAntes] = useState("");
  const [repImagenDespues, setRepImagenDespues] = useState("");
  const [repComentarios, setRepComentarios] = useState("");
  const [repEstado, setRepEstado] = useState("OK");

  const [modalMantenimientoOpen, setModalMantenimientoOpen] = useState(false);
  const [mantKilometraje, setMantKilometraje] = useState("");
  const [mantFechaEstimada, setMantFechaEstimada] = useState("");
  const [mantSugerencia, setMantSugerencia] = useState("");

  const [subiendoImg, setSubiendoImg] = useState(false);

  const handleUploadImage = async (clienteId, patente, file) => {
    if (!file) return;
    setSubiendoImg(true);
    const formData = new FormData();
    formData.append("imagen", file);
    formData.append("descripcion", "Imagen subida desde Admin Dashboard");

    try {
      const baseUrl =
        typeof window !== "undefined" &&
        window.location.hostname === "localhost"
          ? "http://localhost:4000/api"
          : "/api";
      const url = `${baseUrl}/upload/vehiculo/${clienteId}/${encodeURIComponent(patente)}`;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al subir");
      }
      handleVerDetalle(clienteId);
      Swal.fire({
        icon: "success",
        title: "Imagen vinculada",
        background: "#111827",
        color: "#fff",
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
        background: "#111827",
        color: "#fff",
      });
    } finally {
      setSubiendoImg(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, [busqueda, pagina]);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const res = await api.getClientes(busqueda, pagina, 15);
      if (res && res.clientes) {
        setClientes(res.clientes);
        setTotal(res.total);
      }
    } catch (err) {
      console.error("Error cargando clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado local básico para el Mockup
  const clientesFiltrados = clientes
    .filter((c) => {
      if (
        filtroTipo === "con_vehiculo" &&
        (!c.vehiculos || c.vehiculos.length === 0)
      )
        return false;
      if (
        filtroTipo === "sin_vehiculo" &&
        c.vehiculos &&
        c.vehiculos.length > 0
      )
        return false;
      if (filtroDni === "con_dni" && !c.dni) return false;
      if (filtroDni === "sin_dni" && c.dni) return false;
      return true;
    })
    .sort((a, b) => {
      if (filtroOrden === "citas")
        return (b.total_citas || 0) - (a.total_citas || 0);
      if (filtroOrden === "alfabetico")
        return (a.nombre || "").localeCompare(b.nombre || "");
      return 0; // 'recientes' (default by API)
    });

  const handleVerDetalle = async (id) => {
    try {
      const res = await api.getClienteDetalle(id);
      if (res) {
        setClienteDetalle(res.cliente);
        setCitasHistorial(res.citas || []);
        setDatosAbiertos(false);

        // Cargar historial de notificaciones (mensajes de WhatsApp)
        try {
          const resMsgs = await api.getMensajes(res.cliente.numero_telefono);
          if (resMsgs && resMsgs.mensajes) {
            setMensajesHistorial(resMsgs.mensajes);
          } else {
            setMensajesHistorial([]);
          }
        } catch (msgErr) {
          console.error("Error al cargar mensajes:", msgErr);
          setMensajesHistorial([]);
        }

        setModalDetalleOpen(true);
      }
    } catch (error) {
      console.error("Error al cargar detalle:", error);
    }
  };

  const handleOpenReparacion = (vehiculo) => {
    setReparacionVehiculoActivo(vehiculo);
    setRepTitulo("");
    setRepKilometraje("");
    setRepPiezas("");
    setRepImagenAntes("");
    setRepImagenDespues("");
    setRepComentarios("");
    setRepEstado("OK");
    setModalReparacionOpen(true);
  };

  const handleOpenMantenimiento = (vehiculo) => {
    setReparacionVehiculoActivo(vehiculo);
    setMantKilometraje(vehiculo.proximo_mantenimiento?.kilometraje || "");
    setMantFechaEstimada(vehiculo.proximo_mantenimiento?.fecha_estimada || "");
    setMantSugerencia(vehiculo.proximo_mantenimiento?.sugerencia || "");
    setModalMantenimientoOpen(true);
  };

  const handleOpenVehicleDetail = (vehiculo) => {
    setSelectedVehiculoDetail(vehiculo);
    setModalVehiculoDetailOpen(true);
  };

  const handleSubirImagenReparacion = async (tipo, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("imagen", file);
    try {
      const res = await fetch("/api/upload/general", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Error al subir imagen");
      const data = await res.json();
      if (tipo === "antes") {
        setRepImagenAntes(data.imageUrl);
      } else {
        setRepImagenDespues(data.imageUrl);
      }
      Swal.fire({
        icon: "success",
        title: "Imagen subida",
        background: "#111827",
        color: "#fff",
        toast: true,
        position: "top-end",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
        background: "#111827",
        color: "#fff",
      });
    }
  };

  const handleGuardarReparacion = async (e) => {
    e.preventDefault();
    if (!repTitulo) return;
    try {
      const piezasArray = repPiezas
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p);
      await api.agregarReparacion(
        clienteDetalle._id,
        reparacionVehiculoActivo.patente,
        {
          titulo: repTitulo,
          kilometraje: repKilometraje ? Number(repKilometraje) : undefined,
          piezas_cambiadas: piezasArray,
          imagen_antes: repImagenAntes,
          imagen_despues: repImagenDespues,
          comentarios: repComentarios,
          estado: repEstado,
        },
      );
      setModalReparacionOpen(false);
      handleVerDetalle(clienteDetalle._id);
      Swal.fire({
        icon: "success",
        title: "Reparación guardada",
        background: "#111827",
        color: "#fff",
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
        background: "#111827",
        color: "#fff",
      });
    }
  };

  const handleGuardarMantenimiento = async (e) => {
    e.preventDefault();
    try {
      await api.actualizarMantenimiento(
        clienteDetalle._id,
        reparacionVehiculoActivo.patente,
        {
          kilometraje: mantKilometraje ? Number(mantKilometraje) : undefined,
          fecha_estimada: mantFechaEstimada,
          sugerencia: mantSugerencia,
        },
      );
      setModalMantenimientoOpen(false);
      handleVerDetalle(clienteDetalle._id);
      Swal.fire({
        icon: "success",
        title: "Mantenimiento actualizado",
        background: "#111827",
        color: "#fff",
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
        background: "#111827",
        color: "#fff",
      });
    }
  };

  const handleOpenEdit = async (cliente) => {
    try {
      // Fetch latest client data from the API to avoid editing stale cached data
      const res = await api.getClienteDetalle(cliente._id);
      const latestCliente = res ? res.cliente : cliente;

      setEditId(latestCliente._id);
      setEditNombre(latestCliente.nombre || "");
      setEditDni(latestCliente.dni || "");
      setEditTelefono(latestCliente.numero_telefono || "");
      setEditEmail(latestCliente.email || "");

      // Normalize plates to uppercase for consistent validation
      const vehiculosNormalizados = (latestCliente.vehiculos || []).map(
        (v) => ({
          ...v,
          patente: v.patente?.trim().toUpperCase() || "",
        }),
      );
      setEditVehiculos(vehiculosNormalizados);

      setEditNotas(latestCliente.notas || "");
      setEditTotalGastado(latestCliente.total_gastado || 0);
      setEditDeudaActual(latestCliente.deuda_actual || 0);
      setErrorEdit("");
      setModalEditOpen(true);
    } catch (err) {
      console.error("Error al cargar detalles del cliente para editar:", err);
      // Fallback a los datos locales si falla el fetch
      setEditId(cliente._id);
      setEditNombre(cliente.nombre || "");
      setEditDni(cliente.dni || "");
      setEditTelefono(cliente.numero_telefono || "");
      setEditEmail(cliente.email || "");

      const vehiculosNormalizados = (cliente.vehiculos || []).map((v) => ({
        ...v,
        patente: v.patente?.trim().toUpperCase() || "",
      }));
      setEditVehiculos(vehiculosNormalizados);

      setEditNotas(cliente.notas || "");
      setEditTotalGastado(cliente.total_gastado || 0);
      setEditDeudaActual(cliente.deuda_actual || 0);
      setErrorEdit("");
      setModalEditOpen(true);
    }
  };

  const handleAddVehiculoEdit = () => {
    if (!vMarca || !vModelo) return;

    const patenteLimpia = vPatente.trim().toUpperCase();
    if (patenteLimpia) {
      const patenteDuplicada = editVehiculos.some(
        (v) => v.patente?.trim().toUpperCase() === patenteLimpia,
      );
      if (patenteDuplicada) {
        Swal.fire({
          icon: "error",
          title: "Placa duplicada",
          text: `La placa "${patenteLimpia}" ya existe en la lista de detalles adicionales de este cliente.`,
          background: "#111827",
          color: "#fff",
          confirmButtonColor: "#3b82f6",
        });
        return;
      }
    }

    setEditVehiculos((prev) => [
      ...prev,
      {
        marca: vMarca,
        modelo: vModelo,
        anio: vAnio ? parseInt(vAnio) : null,
        patente: patenteLimpia,
        alias: vAlias || "",
      },
    ]);
    setVMarca("");
    setVModelo("");
    setVAnio("");
    setVPatente("");
    setVAlias("");
  };

  const handleRemoveVehiculoEdit = (idx) => {
    setEditVehiculos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGuardarCliente = async (e) => {
    e.preventDefault();
    setErrorEdit("");
    setGuardando(true);

    try {
      const payload = {
        nombre: editNombre,
        dni: editDni,
        numero_telefono: editTelefono,
        email: editEmail,
        vehiculos: editVehiculos,
        notes: editNotas,
      };

      // Ensure notes key matches schema (notas or notes? Let's check: the schema uses 'notas', payload line 330 previously had 'notas: editNotas')
      // Ah! Payload line 330 had: 'notas: editNotas'. Let me keep 'notas: editNotas' instead of 'notes: editNotas'.
      const actualPayload = {
        nombre: editNombre,
        dni: editDni,
        numero_telefono: editTelefono,
        email: editEmail,
        vehiculos: editVehiculos,
        notas: editNotas,
        total_gastado: Number(editTotalGastado),
        deuda_actual: Number(editDeudaActual),
      };

      await api.actualizarCliente(editId, actualPayload);
      setModalEditOpen(false);
      cargarClientes();
      if (clienteDetalle && clienteDetalle._id === editId) {
        handleVerDetalle(editId); // Recargar panel de detalles si estaba abierto
      }
    } catch (err) {
      setErrorEdit(err.message || "Error al guardar cambios");
      if (err.status === 409 || err.status === 400) {
        Swal.fire({
          icon: "error",
          title: "Error de validación",
          text: err.message,
          background: "#111827",
          color: "#fff",
          confirmButtonColor: "#3b82f6",
        });
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarCliente = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar cliente?",
      text: "¿Seguro que quieres eliminar este cliente? Se borrarán también todas sus citas asociadas.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#374151",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      background: "#111827",
      color: "#fff",
    });
    if (!result.isConfirmed) return;
    try {
      await api.eliminarCliente(id);
      setModalDetalleOpen(false);
      cargarClientes();
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: "Solo los administradores pueden borrar clientes.",
        icon: "error",
        background: "#111827",
        color: "#fff",
        confirmButtonColor: "#3b82f6",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Buscador y Filtros */}
      <div className="flex flex-col gap-4 bg-dark-card/40 p-4 rounded-2xl border border-gray-800">
        <div className="flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o patente..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              className="block w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-950 border border-gray-850 text-white placeholder-gray-500 text-xs focus:ring-1 focus:ring-primary outline-none transition-all duration-200"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500 font-medium">
              Total: {clientesFiltrados.length} listados de {total}
            </div>
            <button
              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-400 border border-gray-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-not-allowed"
              title="Próximamente"
            >
              <Clipboard className="w-3.5 h-3.5" /> Descargar CSV
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-gray-950 border border-gray-850 text-gray-300 rounded-xl px-3 py-1.5 text-[11px] font-bold outline-none focus:border-primary cursor-pointer hover:bg-gray-800 transition-colors"
          >
            <option value="todos">Todos (Leads y Clientes)</option>
            <option value="con_vehiculo">
              Solo Clientes (Con Detalles Adicionales)
            </option>
            <option value="sin_vehiculo">
              Solo Leads (Sin Detalles Adicionales)
            </option>
          </select>
          <select
            value={filtroDni}
            onChange={(e) => setFiltroDni(e.target.value)}
            className="bg-gray-950 border border-gray-850 text-gray-300 rounded-xl px-3 py-1.5 text-[11px] font-bold outline-none focus:border-primary cursor-pointer hover:bg-gray-800 transition-colors"
          >
            <option value="todos">Cualquier Estado DNI</option>
            <option value="con_dni">Con DNI Registrado</option>
            <option value="sin_dni">Sin DNI</option>
          </select>
          <select
            value={filtroOrden}
            onChange={(e) => setFiltroOrden(e.target.value)}
            className="bg-gray-950 border border-gray-850 text-gray-300 rounded-xl px-3 py-1.5 text-[11px] font-bold outline-none focus:border-primary cursor-pointer hover:bg-gray-800 transition-colors"
          >
            <option value="recientes">Más Recientes (Defecto)</option>
            <option value="citas">Mayor Cantidad de Citas</option>
            <option value="alfabetico">Orden Alfabético</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-x-auto border border-gray-850 rounded-2xl bg-gray-950/20">
          {clientes.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-500">
              No se encontraron clientes.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-850 text-left text-xs">
              <thead className="bg-dark-card/40 text-gray-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Celular</th>
                  <th className="px-6 py-4">Detalles Adicionales</th>
                  <th className="px-6 py-4">Total Gastado</th>
                  <th className="px-6 py-4">Deuda / Crédito</th>
                  <th className="px-6 py-4">Total Citas</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850/60 text-gray-300 font-light">
                {clientesFiltrados.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-gray-900/10 cursor-pointer"
                    onClick={() => handleVerDetalle(c._id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-450 font-bold">
                          {c.nombre?.charAt(0) || "C"}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-baseline gap-1.5">
                            <span className="font-bold text-white text-sm">
                              {c.nombre || "Cliente Nuevo"}
                            </span>
                            {c.alias && c.alias.length > 0 && (
                              <span className="text-gray-400 text-[10px] font-normal italic">
                                (asociado a: {c.alias.join(", ")})
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 text-gray-500 text-[10px]">
                            <span>{c.email || "Sin correo"}</span>
                            {c.dni && <span>• DNI: {c.dni}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-400">
                      {c.numero_telefono}
                    </td>
                    <td
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {c.vehiculos &&
                          c.vehiculos.map((v, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-[10px] text-gray-300 font-medium"
                            >
                              <Car className="w-3 h-3 text-primary/80" />{" "}
                              {v.marca} {v.modelo}
                            </span>
                          ))}
                        {(!c.vehiculos || c.vehiculos.length === 0) && (
                          <span className="text-gray-500">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-400 font-mono">
                      S/.{" "}
                      {(c.total_gastado || 0).toLocaleString("es-PE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {c.deuda_actual > 0 ? (
                        <span className="text-red-400 font-bold">
                          S/.{" "}
                          {c.deuda_actual.toLocaleString("es-PE", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      ) : c.deuda_actual < 0 ? (
                        <span className="text-blue-400 font-bold">
                          S/.{" "}
                          {Math.abs(c.deuda_actual).toLocaleString("es-PE", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          (Favor)
                        </span>
                      ) : (
                        <span className="text-gray-500">S/. 0.00</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-400">
                      {c.total_citas}
                    </td>
                    <td
                      className="px-6 py-4 text-right space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleVerDetalle(c._id)}
                        className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 text-[10px] font-bold cursor-pointer"
                      >
                        Ver Perfil
                      </button>
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary text-[10px] font-bold cursor-pointer"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Control de Pagina */}
          {total > 15 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-850 bg-dark-card/20 text-xs">
              <button
                onClick={() => setPagina((prev) => Math.max(prev - 1, 1))}
                disabled={pagina === 1}
                className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1 font-semibold"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
              </button>
              <span className="text-gray-400 font-medium">
                Página <span className="text-white font-bold">{pagina}</span> de{" "}
                <span className="text-white font-bold">
                  {Math.ceil(total / 15)}
                </span>
              </span>
              <button
                onClick={() =>
                  setPagina((prev) => Math.min(prev + 1, Math.ceil(total / 15)))
                }
                disabled={pagina >= Math.ceil(total / 15)}
                className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1 font-semibold"
              >
                Siguiente <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL DETALLE DE CLIENTE */}
      {modalDetalleOpen && clienteDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-dark-panel border border-gray-800 shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-gray-850 pb-4 mb-6">
              <div className="flex flex-wrap md:flex-nowrap items-center justify-between w-full pr-4 gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {clienteDetalle.nombre || "Cliente Nuevo"}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-1">
                      {clienteDetalle.numero_telefono}{" "}
                      <span className="mx-2 text-gray-700">•</span> DNI:{" "}
                      {clienteDetalle.dni || "No registrado"}
                    </p>
                  </div>
                </div>
                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 border-b border-gray-800 pb-1">
                  Scoring 5 <br></br>
                  <Star className="w-3 h-3 text-yellow-400 inline-block" />
                  <Star className="w-3 h-3 text-yellow-400 inline-block" />
                  <Star className="w-3 h-3 text-yellow-400 inline-block" />
                  <Star className="w-3 h-3 text-yellow-400 inline-block" />
                  <Star className="w-3 h-3 text-yellow-400 inline-block" />
                </span>
              </div>

              <button
                onClick={() => setModalDetalleOpen(false)}
                className="p-1 rounded-lg border border-radius text-gray-200 cursor-pointer hover:text-white hover:bg-gray-800 shrink-0"
              >
                ✕
              </button>
            </div>
            {/* Estadísticas */}
            <div className="w-full items-center text-center rounded-xl border border-gray-800 bg-gray-950/50 p-3 shrink-0">
              <div className="flex gap-6 mt-2  items-center text-center justify-center">
                <span className="font-bold text-white block text-[9px] uppercase tracking-widest mb-1.5 border-b border-gray-800 pb-1">
                  Resumen Financiero
                </span>
                <div>
                  <span className="block text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">
                    Citas Agendadas
                  </span>
                  <span className="text-sm font-bold text-blue-400">
                    {clienteDetalle.total_citas}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">
                    Total Gastado
                  </span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    S/.{" "}
                    {(clienteDetalle.total_gastado || 0).toLocaleString(
                      "es-PE",
                      { minimumFractionDigits: 2 },
                    )}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">
                    {clienteDetalle.deuda_actual > 0
                      ? "Deuda Pendiente"
                      : clienteDetalle.deuda_actual < 0
                        ? "Saldo a Favor"
                        : "Sin Deudas"}
                  </span>
                  <span
                    className={`text-sm font-bold font-mono ${clienteDetalle.deuda_actual > 0 ? "text-red-400" : clienteDetalle.deuda_actual < 0 ? "text-blue-400" : "text-gray-500"}`}
                  >
                    S/.{" "}
                    {Math.abs(clienteDetalle.deuda_actual || 0).toLocaleString(
                      "es-PE",
                      { minimumFractionDigits: 2 },
                    )}
                  </span>
                </div>
              </div>
            </div>
            {/* TABS DE NAVEGACIÓN */}
            <div className="mt-4">
              <div className="flex gap-6 border-b border-white/10 mb-6 overflow-x-auto custom-scrollbar px-2">
                <button
                  onClick={() => setActiveHistoryTab("personales")}
                  className={`py-2 text-[11px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
                    activeHistoryTab === "personales"
                      ? "border-white text-white"
                      : "text-gray-500 hover:text-gray-300 border-transparent"
                  }`}
                >
                  Perfil
                </button>
                <button
                  onClick={() => setActiveHistoryTab("vehiculos")}
                  className={`py-2 text-[11px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
                    activeHistoryTab === "vehiculos"
                      ? "border-white text-white"
                      : "text-gray-500 hover:text-gray-300 border-transparent"
                  }`}
                >
                  Vehículos
                </button>
                <button
                  onClick={() => setActiveHistoryTab("clinico")}
                  className={`py-2 text-[11px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
                    activeHistoryTab === "clinico"
                      ? "border-white text-white"
                      : "text-gray-500 hover:text-gray-300 border-transparent"
                  }`}
                >
                  Historial
                </button>

                <button
                  onClick={() => setActiveHistoryTab("notificaciones")}
                  className={`py-2 text-[11px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
                    activeHistoryTab === "notificaciones"
                      ? "border-white text-white"
                      : "text-gray-500 hover:text-gray-300 border-transparent"
                  }`}
                >
                  Notificaciones
                </button>
              </div>

              <div className="pt-2">
                {activeHistoryTab === "personales" && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">
                          Número Celular
                        </span>
                        <span className="font-medium text-white font-mono text-sm">
                          {clienteDetalle.numero_telefono}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">
                          DNI
                        </span>
                        <span className="font-medium text-white font-mono text-sm">
                          {clienteDetalle.dni || "No registrado"}
                        </span>
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">
                          Correo Electrónico
                        </span>
                        <span className="font-medium text-white text-sm">
                          {clienteDetalle.email || "No registrado"}
                        </span>
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">
                          Notas / Comentarios Internos
                        </span>
                        <p className="text-sm text-gray-400 bg-black/20 p-4 rounded-lg border border-white/5">
                          {clienteDetalle.notas ||
                            "No hay notas sobre este cliente."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeHistoryTab === "vehiculos" && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 gap-3">
                      {clienteDetalle.vehiculos &&
                        clienteDetalle.vehiculos.map((v, i) => (
                          <div
                            key={i}
                            onDoubleClick={() => handleOpenVehicleDetail(v)}
                            className="p-4 rounded-xl bg-gradient-to-r from-white/[0.03] to-transparent border border-white/5 flex flex-col gap-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex justify-between items-center w-full md:w-auto gap-4">
                                <div className="flex items-center gap-3">
                                  {v.historial_imagenes &&
                                  v.historial_imagenes.length > 0 ? (
                                    <div
                                      className="w-10 h-10 rounded-xl overflow-hidden border border-primary/30 shrink-0 cursor-zoom-in hover:opacity-80 transition-opacity"
                                      onClick={() =>
                                        window.open(
                                          v.historial_imagenes[0].url,
                                          "_blank",
                                        )
                                      }
                                      title="Ver imagen"
                                    >
                                      <img
                                        src={v.historial_imagenes[0].url}
                                        alt={`${v.marca} ${v.modelo}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20 shrink-0">
                                      <Car className="w-5 h-5" />
                                    </div>
                                  )}
                                  <div className="text-xs">
                                    <span className="block text-sm font-bold text-white whitespace-nowrap flex items-center gap-2">
                                      <span>
                                        {v.marca} {v.modelo}
                                      </span>
                                      {v.alias && (
                                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                          {v.alias}
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap block mt-1">
                                      Año: {v.anio || "N/C"} | Patente:{" "}
                                      <b className="uppercase">
                                        {v.patente || "S/P"}
                                      </b>
                                    </span>
                                  </div>
                                </div>
                                {/* Botón de subida de imagen */}
                                {v.patente && (
                                  <label
                                    className={`cursor-pointer p-2 flex-shrink-0 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors ${subiendoImg ? "opacity-50 pointer-events-none" : ""}`}
                                  >
                                    <input
                                      type="file"
                                      accept="image/png, image/jpeg, image/webp"
                                      className="hidden"
                                      onChange={(e) =>
                                        handleUploadImage(
                                          clienteDetalle.id ||
                                            clienteDetalle._id,
                                          v.patente,
                                          e.target.files[0],
                                        )
                                      }
                                    />
                                    <ImagePlus className="w-4 h-4" />
                                  </label>
                                )}
                              </div>

                              {/* Botones de Acción para Historial Clínico & Mantenimiento */}
                              {v.patente && (
                                <div className="flex flex-wrap justify-start md:justify-end gap-2 w-full mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-800/60">
                                  <button
                                    onClick={() =>
                                      window.open(
                                        `/mission-control/${v.patente}?clienteId=${clienteDetalle.id || clienteDetalle._id}`,
                                        "_blank",
                                      )
                                    }
                                    className="flex w-full sm:w-auto flex-1 md:flex-none py-2 px-3 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white border border-blue-500/20 hover:border-blue-500 text-[10px] font-bold items-center justify-center gap-1.5 transition-all whitespace-nowrap"
                                  >
                                    <Activity className="w-3 h-3 shrink-0" />{" "}
                                    Mission Control
                                  </button>
                                  {v.historial_imagenes &&
                                    v.historial_imagenes.length > 0 && (
                                      <button
                                        onClick={() =>
                                          window.open(
                                            v.historial_imagenes[0].url,
                                            "_blank",
                                          )
                                        }
                                        className="flex w-full sm:w-auto flex-1 md:flex-none py-2 px-3 rounded-lg bg-gray-500/10 hover:bg-gray-500 text-gray-400 hover:text-white border border-gray-500/20 hover:border-gray-500 text-[10px] font-bold items-center justify-center gap-1.5 transition-all whitespace-nowrap"
                                      >
                                        <ImagePlus className="w-3 h-3 shrink-0" />{" "}
                                        Ver Imágenes
                                      </button>
                                    )}
                                  {/* <button
                                    onClick={() => handleOpenReparacion(v)}
                                    className="flex w-full sm:w-auto flex-1 md:flex-none py-2 px-3 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary text-[10px] font-bold items-center justify-center gap-1.5 transition-all whitespace-nowrap"
                                  >
                                    <Wrench className="w-3 h-3 shrink-0" /> +
                                    Reparación
                                  </button>
                                  <button
                                    onClick={() => handleOpenMantenimiento(v)}
                                    className="flex w-full sm:w-auto flex-1 md:flex-none py-2 px-3 rounded-lg bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-white border border-yellow-500/20 hover:border-yellow-500 text-[10px] font-bold items-center justify-center gap-1.5 transition-all whitespace-nowrap"
                                  >
                                    <Calendar className="w-3 h-3 shrink-0" />{" "}
                                    Mantenimiento
                                  </button> */}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      {(!clienteDetalle.vehiculos ||
                        clienteDetalle.vehiculos.length === 0) && (
                        <p className="text-xs text-gray-500 col-span-2">
                          Este cliente no posee detalles adicionales
                          registrados.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {activeHistoryTab === "clinico" && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mt-[-10px] mb-3">
                      <Wrench className="w-4 h-4 text-primary" /> Servicios
                    </h4>

                    {(() => {
                      const obtenerTodasLasReparaciones = () => {
                        const reps = [];

                        if (clienteDetalle && clienteDetalle.vehiculos) {
                          clienteDetalle.vehiculos.forEach((v) => {
                            if (v.reparaciones && v.reparaciones.length > 0) {
                              v.reparaciones.forEach((r) => {
                                reps.push({
                                  ...r,
                                  vehiculoMarca: v.marca,
                                  vehiculoModelo: v.modelo,
                                  vehiculoPatente: v.patente,
                                });
                              });
                            }
                          });
                        }

                        // Inyectar citas agendadas/pendientes que aún no están en el historial finalizado
                        if (citasHistorial && citasHistorial.length > 0) {
                          citasHistorial.forEach((cita) => {
                            const yaExiste = reps.some(
                              (r) =>
                                (r.cita_id &&
                                  r.cita_id.toString() ===
                                    cita._id.toString()) ||
                                (r._id &&
                                  r._id.toString() === cita._id.toString()),
                            );

                            if (!yaExiste) {
                              reps.push({
                                _id: cita._id,
                                cita_id: cita._id,
                                titulo: cita.servicio || "Servicio Agendado",
                                fecha: cita.fecha_cita,
                                estado:
                                  cita.estado_trabajo === "en_curso"
                                    ? "En Progreso"
                                    : cita.estado_trabajo === "pendiente"
                                      ? "Pendiente"
                                      : cita.estado_trabajo,
                                vehiculoMarca:
                                  cita.vehiculo?.marca || "Vehículo",
                                vehiculoModelo: cita.vehiculo?.modelo || "",
                                vehiculoPatente: cita.vehiculo?.patente || "",
                                comentarios:
                                  cita.descripcion_trabajo ||
                                  cita.notas_mecanico ||
                                  "",
                                imagen_antes:
                                  cita.imagenes && cita.imagenes.length > 0
                                    ? cita.imagenes[0]
                                    : null,
                                imagen_despues: null,
                                piezas_cambiadas: [],
                              });
                            }
                          });
                        }

                        return reps.sort(
                          (a, b) => new Date(b.fecha) - new Date(a.fecha),
                        );
                      };

                      const todasLasReparaciones =
                        obtenerTodasLasReparaciones();

                      if (todasLasReparaciones.length === 0) {
                        return (
                          <div className="text-center py-8 text-xs text-gray-550">
                            No hay reparaciones registradas en el historial
                            clínico.
                          </div>
                        );
                      }

                      return (
                        <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-1 px-2 snap-x mb-4">
                          {todasLasReparaciones.map((rep, idx) => (
                            <div
                              key={idx}
                              className="min-w-[300px] max-w-[350px] relative flex flex-col group snap-start"
                            >
                              {/* Connector line */}
                              {idx < todasLasReparaciones.length - 1 && (
                                <div className="absolute top-5 left-10 w-[calc(100%+1.5rem)] h-0.5 bg-gray-800 z-0"></div>
                              )}
                              <div className="flex items-center gap-4 mb-2 z-10 relative">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-dark-card bg-primary text-white shadow shrink-0">
                                  {rep.estado === "OK" ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Clipboard className="w-4 h-4" />
                                  )}
                                </div>
                                <span className="text-[10px] font-bold text-blue-400 bg-gray-900 px-2 py-1 rounded-lg border border-gray-800">
                                  {formatRelativeTime(rep.fecha)}
                                </span>
                              </div>

                              <div
                                className="px-4 py-3 rounded-2xl bg-gray-900 border border-gray-850 shadow-sm cursor-zoom-in hover:border-primary/50 transition-all select-none flex-1"
                                onDoubleClick={() => setModalRepairDetail(rep)}
                                title="Doble clic para ver detalles y fotos de evaluación/ejecución"
                              >
                                <div className="flex justify-between items-start mb-3 gap-2">
                                  <div>
                                    <h4 className="font-bold text-white text-xs mb-1">
                                      {rep.titulo}
                                    </h4>
                                    <p className="text-[10px] text-gray-400">
                                      {rep.vehiculoMarca} {rep.vehiculoModelo} (
                                      {rep.vehiculoPatente})
                                      {rep.kilometraje ? ` • ` : ""}
                                      {rep.kilometraje ? (
                                        <span className="font-mono text-gray-500">
                                          {rep.kilometraje.toLocaleString()} km
                                        </span>
                                      ) : (
                                        ""
                                      )}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() =>
                                      window.open(
                                        `/mission-control/${rep.vehiculoPatente}?clienteId=${clienteDetalle.id || clienteDetalle._id}`,
                                        "_blank",
                                      )
                                    }
                                    className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white border border-blue-500/20 transition-colors shrink-0"
                                    title="Ir a Mission Control"
                                  >
                                    <Activity className="w-3 h-3" />
                                  </button>
                                </div>

                                {rep.piezas_cambiadas &&
                                  rep.piezas_cambiadas.length > 0 && (
                                    <div className="space-y-2 border-t border-gray-800 pt-3">
                                      <p className="text-[10px] text-gray-300 font-semibold uppercase">
                                        Piezas Cambiadas:
                                      </p>
                                      <ul className="text-[10px] text-gray-500 list-disc pl-4">
                                        {rep.piezas_cambiadas.map(
                                          (pieza, pIdx) => (
                                            <li key={pIdx}>{pieza}</li>
                                          ),
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                {(rep.imagen_antes || rep.imagen_despues) && (
                                  <div className="mt-3 flex gap-2">
                                    {rep.imagen_antes && (
                                      <div className="w-12 h-12 rounded-lg bg-gray-800 overflow-hidden border border-gray-700 relative group">
                                        <img
                                          src={rep.imagen_antes}
                                          className="w-full h-full object-cover opacity-75"
                                          alt="Antes"
                                        />
                                      </div>
                                    )}
                                    {rep.imagen_despues && (
                                      <div className="w-12 h-12 rounded-lg bg-gray-800 overflow-hidden border border-primary/50 relative group">
                                        <img
                                          src={rep.imagen_despues}
                                          className="w-full h-full object-cover"
                                          alt="Después"
                                        />
                                        <span className="absolute bottom-0 right-0 bg-primary text-[8px] font-bold text-white px-1 rounded-tl">
                                          OK
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3 border-t border-gray-800 pt-3">
                      <Clipboard className="w-4 h-4 text-emerald-500" />{" "}
                      Evaluaciones
                    </h4>
                    {(() => {
                      if (citasHistorial.length === 0) {
                        return (
                          <p className="text-xs text-gray-500 text-center py-6">
                            No hay evaluaciones o citas registradas.
                          </p>
                        );
                      }

                      const citasAgrupadas = citasHistorial.reduce(
                        (acc, cita) => {
                          const dateStr = new Date(
                            cita.fecha_cita,
                          ).toLocaleDateString();
                          if (!acc[dateStr]) acc[dateStr] = [];
                          acc[dateStr].push(cita);
                          return acc;
                        },
                        {},
                      );

                      const citasEntries = Object.entries(citasAgrupadas);

                      return (
                        <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-1 px-2 snap-x">
                          {citasEntries.map(([fecha, citas], idx) => (
                            <div
                              key={idx}
                              className="min-w-[300px] max-w-[350px] relative flex flex-col group snap-start bg-gray-900/40 rounded-2xl border border-gray-850 px-5 py-2"
                            >
                              {/* Connector line */}
                              {idx < citasEntries.length - 1 && (
                                <div className="absolute top-10 left-10 w-[calc(100%+1.5rem)] h-0.5 bg-gray-800 z-0"></div>
                              )}

                              <div className="flex items-center gap-3 mb-2 border-b border-gray-800/80 pb-3 relative z-10">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-dark-card bg-emerald-500/20 text-emerald-500 shadow shrink-0">
                                  <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="block text-sm font-bold text-white">
                                    {fecha}
                                  </span>
                                  <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full inline-block mt-1">
                                    {citas.length} servicio
                                    {citas.length > 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-4 flex-1">
                                {citas.map((cita, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="p-4 rounded-xl bg-gray-950 border border-gray-800 hover:border-emerald-500/30 transition-colors shadow-sm"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-bold text-emerald-400 text-xs mb-2">
                                        {cita.servicio || "Servicio General"}
                                      </h4>
                                      <div className="text-[10px] text-gray-400 mb-2 flex items-center gap-2">
                                        <EstadoBadge estado={cita.estado} />
                                      </div>
                                    </div>
                                    <div>
                                      {cita.vehiculo && (
                                        <p className="text-[10px] text-gray-400">
                                          <Car className="inline-block w-3 h-3 mr-1 mb-0.5" />
                                          {cita.vehiculo.marca}{" "}
                                          {cita.vehiculo.modelo} (
                                          {cita.vehiculo.patente})
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Próximo Mantenimiento Recomendado */}
                    {(() => {
                      const vehiculosConMant =
                        clienteDetalle.vehiculos?.filter(
                          (v) =>
                            v.proximo_mantenimiento &&
                            (v.proximo_mantenimiento.kilometraje ||
                              v.proximo_mantenimiento.fecha_estimada ||
                              v.proximo_mantenimiento.sugerencia),
                        ) || [];
                      if (vehiculosConMant.length === 0) return null;

                      return (
                        <div className="mt-6 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                          <h4 className="text-[10px] font-bold text-yellow-500 uppercase flex items-center gap-2 mb-2">
                            <Calendar className="w-3 h-3" /> Próximos
                            Mantenimientos Recomendados
                          </h4>
                          <div className="space-y-2">
                            {vehiculosConMant.map((v, i) => (
                              <div key={i} className="text-xs text-gray-300">
                                <span className="font-bold text-white">
                                  {v.marca} {v.modelo} ({v.patente}):
                                </span>{" "}
                                {v.proximo_mantenimiento.sugerencia && (
                                  <span className="text-yellow-400">
                                    "{v.proximo_mantenimiento.sugerencia}"
                                  </span>
                                )}
                                {v.proximo_mantenimiento.kilometraje && (
                                  <span>
                                    {" "}
                                    a los{" "}
                                    {v.proximo_mantenimiento.kilometraje.toLocaleString()}{" "}
                                    km
                                  </span>
                                )}
                                {v.proximo_mantenimiento.fecha_estimada && (
                                  <span>
                                    {" "}
                                    (Aprox.{" "}
                                    {new Date(
                                      v.proximo_mantenimiento.fecha_estimada,
                                    ).toLocaleDateString()}
                                    )
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {activeHistoryTab === "notificaciones" && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                      <MessageCircle className="w-4 h-4 text-purple-500" />{" "}
                      Historial de Comunicaciones
                    </h4>
                    {(() => {
                      if (mensajesHistorial.length === 0) {
                        return (
                          <p className="text-xs text-gray-500 text-center py-6">
                            No hay mensajes registrados.
                          </p>
                        );
                      }

                      // Ordenar cronológicamente (más antiguo primero)
                      const mensajesOrdenados = [...mensajesHistorial].sort(
                        (a, b) =>
                          new Date(a.fecha || a.recibido_en) -
                          new Date(b.fecha || b.recibido_en),
                      );

                      const conversaciones = [];
                      let currentConv = [];

                      mensajesOrdenados.forEach((msg) => {
                        if (currentConv.length === 0) {
                          currentConv.push(msg);
                        } else {
                          const prevMsg = currentConv[currentConv.length - 1];
                          const prevDate = new Date(
                            prevMsg.fecha || prevMsg.recibido_en,
                          );
                          const currDate = new Date(
                            msg.fecha || msg.recibido_en,
                          );
                          const diffTime = Math.abs(currDate - prevDate);
                          const diffDays = diffTime / (1000 * 60 * 60 * 24);

                          if (diffDays <= 3) {
                            currentConv.push(msg);
                          } else {
                            conversaciones.push(currentConv);
                            currentConv = [msg];
                          }
                        }
                      });
                      if (currentConv.length > 0) {
                        conversaciones.push(currentConv);
                      }

                      // Invertir para que la conversación más reciente esté primero
                      conversaciones.reverse();

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {conversaciones.map((conv, cIdx) => {
                            const firstMsg = conv[0];
                            const lastMsg = conv[conv.length - 1];
                            const lastSender =
                              lastMsg.origen === "sistema" ||
                              lastMsg.remitente !== "cliente"
                                ? "Sistema"
                                : "Cliente";

                            const topic =
                              firstMsg.asunto ||
                              firstMsg.cuerpo ||
                              firstMsg.contenido ||
                              "Sin asunto";
                            const snippet =
                              lastMsg.cuerpo ||
                              lastMsg.contenido ||
                              "Sin contenido";

                            return (
                              <div
                                key={cIdx}
                                className="bg-gray-900/40 rounded-2xl border border-gray-850 p-4 hover:border-purple-500/30 transition-colors shadow-sm flex flex-col cursor-zoom-in select-none"
                                onDoubleClick={() => {
                                  setSelectedThread({
                                    mensajes: conv,
                                    id: conversaciones.length - cIdx,
                                    topic,
                                  });
                                  setModalThreadOpen(true);
                                }}
                                title="Doble clic para ver el hilo completo"
                              >
                                <div className="flex items-center justify-between mb-3 border-b border-gray-800/80 pb-2">
                                  <div className="flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4 text-purple-500" />
                                    <span className="text-xs font-bold text-white">
                                      Hilo {conversaciones.length - cIdx}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                                    {conv.length} msg
                                    {conv.length > 1 ? "s" : ""}
                                  </span>
                                </div>

                                <div className="flex flex-col gap-1.5 mb-3 flex-1">
                                  <span
                                    className="text-[10px] text-gray-300 line-clamp-1"
                                    title={topic}
                                  >
                                    <b className="text-gray-400">Tema:</b>{" "}
                                    {topic}
                                  </span>
                                  <div className="text-[10px] text-gray-500 italic line-clamp-2 bg-gray-950/50 p-2 rounded border border-gray-800/30">
                                    "{snippet}"
                                  </div>
                                </div>

                                <div className="space-y-1.5 text-[10px] text-gray-400 mt-auto">
                                  <div className="flex justify-between">
                                    <span>Inicio:</span>
                                    <span className="text-gray-300">
                                      {new Date(
                                        firstMsg.fecha || firstMsg.recibido_en,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Fin:</span>
                                    <span className="text-gray-300">
                                      {new Date(
                                        lastMsg.fecha || lastMsg.recibido_en,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center border-t border-gray-800/50 pt-1.5 mt-1.5">
                                    <span>Último en hablar:</span>
                                    <span
                                      className={`font-bold px-1.5 py-0.5 rounded ${lastSender === "Sistema" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"}`}
                                    >
                                      {lastSender}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Botones de acción inferior */}
            <div className="pt-6 mt-8 border-t border-gray-850 flex justify-between items-center">
              <button
                onClick={() => handleEliminarCliente(clienteDetalle._id)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500 cursor-pointer"
              >
                Eliminar Cliente
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setModalDetalleOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setModalDetalleOpen(false);
                    handleOpenEdit(clienteDetalle);
                  }}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover cursor-pointer"
                >
                  Editar Perfil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR CLIENTE */}
      {modalEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-dark-panel border border-gray-800 shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
              <h3 className="text-lg font-bold text-white">
                Editar Perfil del Cliente
              </h3>
              <button
                onClick={() => setModalEditOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            {errorEdit && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl mb-4 font-semibold">
                {errorEdit}
              </div>
            )}

            <form onSubmit={handleGuardarCliente} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    required
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">
                    DNI
                  </label>
                  <input
                    type="text"
                    value={editDni}
                    onChange={(e) => setEditDni(e.target.value)}
                    pattern="^\d{8}$"
                    title="El DNI debe contener exactamente 8 números."
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">
                    Total Gastado (S/.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editTotalGastado}
                    onChange={(e) => setEditTotalGastado(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">
                    Deuda / Crédito (S/.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej. 100 o -50"
                    value={editDeudaActual}
                    onChange={(e) => setEditDeudaActual(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                  <span className="text-[9px] text-gray-500 mt-1 block">
                    Positivo = Deuda, Negativo = Saldo a Favor.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">
                  Notas Internas
                </label>
                <textarea
                  value={editNotas}
                  onChange={(e) => setEditNotas(e.target.value)}
                  rows="3"
                  placeholder="Observaciones de pago, comportamiento, o detalles del cliente..."
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Edición de Detalles Adicionales */}
              <div className="p-4 rounded-2xl bg-gray-950/40 border border-gray-850 space-y-3">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">
                  Gestionar Detalles Adicionales
                </span>

                {/* Listado actual */}
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {editVehiculos.map((v, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-2 rounded-xl bg-gray-900 border border-gray-800 text-xs"
                    >
                      <span className="text-xs">
                        {v.alias && (
                          <span className="text-emerald-400 font-bold mr-1">
                            [{v.alias}]
                          </span>
                        )}
                        <b className="text-gray-300">
                          {v.marca} {v.modelo}
                        </b>{" "}
                        <span className="text-gray-500">
                          ({v.patente || "S/P"})
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVehiculoEdit(i)}
                        className="text-red-500 hover:text-red-400 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {editVehiculos.length === 0 && (
                    <p className="text-[10px] text-gray-500 italic">
                      No hay detalles adicionales agregados.
                    </p>
                  )}
                </div>

                {/* Formulario rápido para agregar */}
                <div className="h-px bg-gray-850 my-1" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                  <input
                    type="text"
                    placeholder="Marca"
                    value={vMarca}
                    onChange={(e) => setVMarca(e.target.value)}
                    className="bg-gray-900 border border-gray-800 text-white px-2.5 py-1.5 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Modelo"
                    value={vModelo}
                    onChange={(e) => setVModelo(e.target.value)}
                    className="bg-gray-900 border border-gray-800 text-white px-2.5 py-1.5 rounded-lg outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Año"
                    value={vAnio}
                    onChange={(e) => setVAnio(e.target.value)}
                    className="bg-gray-900 border border-gray-800 text-white px-2.5 py-1.5 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Patente"
                    value={vPatente}
                    onChange={(e) => setVPatente(e.target.value)}
                    className="bg-gray-900 border border-gray-800 text-white px-2.5 py-1.5 rounded-lg outline-none uppercase"
                  />
                  <input
                    type="text"
                    placeholder="Alias (ej. Auto Personal)"
                    value={vAlias}
                    onChange={(e) => setVAlias(e.target.value)}
                    className="bg-gray-900 border border-gray-800 text-white px-2.5 py-1.5 rounded-lg outline-none sm:col-span-2"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddVehiculoEdit}
                  className="w-full py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary hover:text-white transition-all cursor-pointer"
                >
                  Agregar Detalles Adicionales
                </button>
              </div>

              <div className="pt-4 border-t border-gray-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalEditOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover cursor-pointer"
                >
                  {guardando ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR REPARACION */}
      {modalReparacionOpen && reparacionVehiculoActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-dark-panel border border-gray-800 shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" /> Registrar
                  Reparación
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Detalles Adicionales: {reparacionVehiculoActivo.marca}{" "}
                  {reparacionVehiculoActivo.modelo} (
                  {reparacionVehiculoActivo.patente})
                </p>
              </div>
              <button
                onClick={() => setModalReparacionOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarReparacion} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">
                  Título de la Reparación *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Alineamiento y Balanceo, Cambio de Aceite..."
                  value={repTitulo}
                  onChange={(e) => setRepTitulo(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">
                    Kilometraje (km)
                  </label>
                  <input
                    type="number"
                    placeholder="Ej. 45000"
                    value={repKilometraje}
                    onChange={(e) => setRepKilometraje(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">
                    Estado de Reparación
                  </label>
                  <select
                    value={repEstado}
                    onChange={(e) => setRepEstado(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="OK">OK (Reparado)</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">
                  Piezas Cambiadas (separadas por coma)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Pastillas de freno, Filtro de aceite, Bujías..."
                  value={repPiezas}
                  onChange={(e) => setRepPiezas(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1 font-semibold">
                  Comentarios / Notas
                </label>
                <textarea
                  value={repComentarios}
                  onChange={(e) => setRepComentarios(e.target.value)}
                  rows="3"
                  placeholder="Detalles sobre el procedimiento, observaciones técnicas..."
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Upload general images (antes/despues) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Imagen Antes
                  </label>
                  <div className="flex flex-col gap-2">
                    {repImagenAntes ? (
                      <div className="relative w-full h-24 rounded-xl overflow-hidden border border-gray-800">
                        <img
                          src={repImagenAntes}
                          className="w-full h-full object-cover"
                          alt="Antes preview"
                        />
                        <button
                          type="button"
                          onClick={() => setRepImagenAntes("")}
                          className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 text-[10px] hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-24 rounded-xl border border-dashed border-gray-800 hover:border-primary/50 bg-gray-900/40 hover:bg-gray-900/60 cursor-pointer transition-all">
                        <ImagePlus className="w-5 h-5 text-gray-500 mb-1" />
                        <span className="text-[10px] text-gray-500">
                          Subir Antes
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleSubirImagenReparacion(
                              "antes",
                              e.target.files[0],
                            )
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Imagen Después (OK)
                  </label>
                  <div className="flex flex-col gap-2">
                    {repImagenDespues ? (
                      <div className="relative w-full h-24 rounded-xl overflow-hidden border border-gray-850">
                        <img
                          src={repImagenDespues}
                          className="w-full h-full object-cover"
                          alt="Después preview"
                        />
                        <button
                          type="button"
                          onClick={() => setRepImagenDespues("")}
                          className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 text-[10px] hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-24 rounded-xl border border-dashed border-gray-800 hover:border-primary/50 bg-gray-900/40 hover:bg-gray-900/60 cursor-pointer transition-all">
                        <ImagePlus className="w-5 h-5 text-gray-500 mb-1" />
                        <span className="text-[10px] text-gray-500">
                          Subir Después
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleSubirImagenReparacion(
                              "despues",
                              e.target.files[0],
                            )
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalReparacionOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover cursor-pointer"
                >
                  Guardar Reparación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAR MANTENIMIENTO */}
      {modalMantenimientoOpen && reparacionVehiculoActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-dark-panel border border-gray-800 shadow-2xl p-6 md:p-8">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-yellow-500" /> Planificar
                  Mantenimiento
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Detalles Adicionales: {reparacionVehiculoActivo.marca}{" "}
                  {reparacionVehiculoActivo.modelo} (
                  {reparacionVehiculoActivo.patente})
                </p>
              </div>
              <button
                onClick={() => setModalMantenimientoOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarMantenimiento} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">
                  Kilometraje Estimado (km)
                </label>
                <input
                  type="number"
                  placeholder="Ej. 55000"
                  value={mantKilometraje}
                  onChange={(e) => setMantKilometraje(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">
                  Fecha Estimada / Mes
                </label>
                <input
                  type="text"
                  placeholder="Ej. Noviembre 2026, Septiembre 2026..."
                  value={mantFechaEstimada}
                  onChange={(e) => setMantFechaEstimada(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1 font-semibold">
                  Mantenimiento Sugerido
                </label>
                <textarea
                  value={mantSugerencia}
                  onChange={(e) => setMantSugerencia(e.target.value)}
                  rows="3"
                  placeholder="Ej. Se sugiere programar Cambio de Faja de Distribución, Filtro de Aire y Revisión de niveles..."
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-4 border-t border-gray-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalMantenimientoOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover cursor-pointer"
                >
                  Guardar Planificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE REPARACION CLINICA */}
      {modalRepairDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl p-6 relative">
            <button
              onClick={() => setModalRepairDetail(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                Historial Clínico • Reparación
              </span>
              <h3 className="text-lg font-bold text-white mt-3">
                {modalRepairDetail.titulo}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Realizado el{" "}
                {new Date(modalRepairDetail.fecha).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
                {modalRepairDetail.kilometraje
                  ? ` • ${modalRepairDetail.kilometraje.toLocaleString()} km`
                  : ""}
              </p>
            </div>

            <div className="space-y-4">
              {/* Piezas Cambiadas */}
              {modalRepairDetail.piezas_cambiadas &&
                modalRepairDetail.piezas_cambiadas.length > 0 && (
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-850">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase mb-2">
                      Piezas / Repuestos Cambiados
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {modalRepairDetail.piezas_cambiadas.map((pieza, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-[10px] text-gray-300 font-medium"
                        >
                          {pieza}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Comentarios del Trabajo */}
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-850">
                <span className="block text-[10px] font-bold text-gray-450 uppercase mb-2">
                  Comentarios y Diagnóstico
                </span>
                <p className="text-xs text-gray-300 font-light leading-relaxed">
                  {modalRepairDetail.comentarios ||
                    "Sin comentarios registrados para este trabajo."}
                </p>
              </div>

              {/* Evidencias fotográficas (Antes / Después) */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-gray-450 uppercase">
                  Evidencias Fotográficas
                </span>

                <div className="grid grid-cols-2 gap-4">
                  {/* Antes (Evaluación) */}
                  <div className="bg-gray-950 p-3 rounded-xl border border-gray-850 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-gray-400 mb-2 uppercase">
                      Antes (Evaluación)
                    </span>
                    {modalRepairDetail.imagen_antes ? (
                      <div className="w-full aspect-video rounded-lg overflow-hidden border border-gray-800 relative group">
                        <img
                          src={modalRepairDetail.imagen_antes}
                          className="w-full h-full object-cover"
                          alt="Antes"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <a
                            href={modalRepairDetail.imagen_antes}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-white bg-primary px-3 py-1 rounded font-bold"
                          >
                            Ver Completa
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-video rounded-lg border border-dashed border-gray-800 flex items-center justify-center text-gray-650 text-[10px]">
                        Sin foto de evaluación
                      </div>
                    )}
                  </div>

                  {/* Después (Ejecución) */}
                  <div className="bg-gray-950 p-3 rounded-xl border border-gray-850 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-gray-400 mb-2 uppercase">
                      Después (Ejecución)
                    </span>
                    {modalRepairDetail.imagen_despues ? (
                      <div className="w-full aspect-video rounded-lg overflow-hidden border border-gray-800 relative group">
                        <img
                          src={modalRepairDetail.imagen_despues}
                          className="w-full h-full object-cover"
                          alt="Después"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <a
                            href={modalRepairDetail.imagen_despues}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-white bg-emerald-600 px-3 py-1 rounded font-bold"
                          >
                            Ver Completa
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-video rounded-lg border border-dashed border-gray-800 flex items-center justify-center text-gray-650 text-[10px]">
                        Sin foto de finalización
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Historial completo de fotos de avance */}
              {(() => {
                const associatedCita = modalRepairDetail.cita_id
                  ? citasHistorial.find(
                      (c) =>
                        c.id === modalRepairDetail.cita_id ||
                        c._id === modalRepairDetail.cita_id,
                    )
                  : null;

                if (
                  !associatedCita ||
                  !associatedCita.imagenes ||
                  associatedCita.imagenes.length === 0
                )
                  return null;

                return (
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-850">
                    <span className="block text-[10px] font-bold text-gray-450 uppercase mb-2">
                      Línea de Tiempo del Progreso (
                      {associatedCita.imagenes.length} Fotos)
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {associatedCita.imagenes.map((img, imgIdx) => (
                        <a
                          key={imgIdx}
                          href={img}
                          target="_blank"
                          rel="noreferrer"
                          className="aspect-square rounded-lg overflow-hidden border border-gray-800 relative group block"
                        >
                          <img
                            src={img}
                            className="w-full h-full object-cover"
                            alt={`Paso ${imgIdx + 1}`}
                          />
                          <span className="absolute bottom-1 left-1 bg-black/60 px-1 py-0.5 rounded text-[8px] text-gray-300">
                            {imgIdx === 0
                              ? "Evaluación"
                              : imgIdx === associatedCita.imagenes.length - 1
                                ? "Entrega"
                                : `Avance #${imgIdx}`}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="pt-6 mt-6 border-t border-gray-850 flex justify-end">
              <button
                onClick={() => setModalRepairDetail(null)}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-white cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Thread Detail */}
      {modalThreadOpen && selectedThread && selectedThread.mensajes && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1916] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-800">
            {/* Header */}
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-purple-500" />
                  Hilo {selectedThread.id}
                </h3>
                <p className="text-[10px] text-gray-400 mt-1 max-w-sm truncate">
                  Tema: {selectedThread.topic}
                </p>
              </div>
              <button
                onClick={() => setModalThreadOpen(false)}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {/* Content / Chat Log */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4 bg-[#141414]">
              {selectedThread.mensajes.map((msg, mIdx) => {
                const isSystem =
                  msg.origen === "sistema" || msg.remitente !== "cliente";
                return (
                  <div
                    key={mIdx}
                    className={`flex flex-col ${isSystem ? "items-start" : "items-end"}`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl ${isSystem ? "bg-purple-500/10 border border-purple-500/20 rounded-tl-none" : "bg-blue-500/10 border border-blue-500/20 rounded-tr-none"}`}
                    >
                      <h4
                        className={`font-bold text-[10px] mb-2 ${isSystem ? "text-purple-400" : "text-blue-400"}`}
                      >
                        {msg.asunto || (isSystem ? "Sistema" : "Cliente")}
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-light">
                        {msg.cuerpo || msg.contenido}
                      </p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800/50 gap-4">
                        <span className="text-[9px] text-gray-500">
                          {formatRelativeTime(msg.fecha || msg.recibido_en)}
                        </span>
                        {msg.estado && (
                          <span
                            className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${msg.estado === "enviado" ? "text-emerald-500 bg-emerald-500/10" : "text-gray-500 bg-gray-800"}`}
                          >
                            {msg.estado}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Modal Vehículo Detail */}
      {modalVehiculoDetailOpen && selectedVehiculoDetail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1A1916] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col shadow-2xl border border-gray-800">
            {/* Header */}
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 sticky top-0 z-10 backdrop-blur-md">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" />
                  {selectedVehiculoDetail.marca} {selectedVehiculoDetail.modelo}
                </h3>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                  Patente:{" "}
                  <b className="text-white">
                    {selectedVehiculoDetail.patente || "S/P"}
                  </b>
                </p>
              </div>
              <button
                onClick={() => setModalVehiculoDetailOpen(false)}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col gap-6 bg-[#141414] flex-1">
              {/* Información Básica */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800/60">
                  <span className="text-[10px] text-gray-500 uppercase block mb-1">
                    Marca
                  </span>
                  <p className="text-sm font-semibold text-white">
                    {selectedVehiculoDetail.marca || "-"}
                  </p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800/60">
                  <span className="text-[10px] text-gray-500 uppercase block mb-1">
                    Modelo
                  </span>
                  <p className="text-sm font-semibold text-white">
                    {selectedVehiculoDetail.modelo || "-"}
                  </p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800/60">
                  <span className="text-[10px] text-gray-500 uppercase block mb-1">
                    Año
                  </span>
                  <p className="text-sm font-semibold text-white">
                    {selectedVehiculoDetail.anio || "-"}
                  </p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800/60">
                  <span className="text-[10px] text-gray-500 uppercase block mb-1">
                    Alias
                  </span>
                  <p className="text-sm font-semibold text-emerald-400">
                    {selectedVehiculoDetail.alias || "Sin alias"}
                  </p>
                </div>
              </div>

              {/* Mantenimiento */}
              {selectedVehiculoDetail.proximo_mantenimiento && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-yellow-500" /> Próximo
                    Mantenimiento
                  </h4>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase block mb-1">
                          Kilometraje Estimado
                        </span>
                        <p className="text-sm font-semibold text-white">
                          {selectedVehiculoDetail.proximo_mantenimiento
                            .kilometraje || "-"}{" "}
                          km
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase block mb-1">
                          Fecha Estimada
                        </span>
                        <p className="text-sm font-semibold text-white">
                          {selectedVehiculoDetail.proximo_mantenimiento
                            .fecha_estimada
                            ? formatRelativeTime(
                                selectedVehiculoDetail.proximo_mantenimiento
                                  .fecha_estimada,
                              )
                            : "-"}
                        </p>
                      </div>
                      <div className="col-span-1 sm:col-span-2 mt-2">
                        <span className="text-[10px] text-gray-500 uppercase block mb-1">
                          Sugerencia
                        </span>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          {selectedVehiculoDetail.proximo_mantenimiento
                            .sugerencia || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Galería de Imágenes */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                  <ImagePlus className="w-4 h-4 text-blue-500" /> Galería de
                  Imágenes
                </h4>
                {selectedVehiculoDetail.historial_imagenes &&
                selectedVehiculoDetail.historial_imagenes.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selectedVehiculoDetail.historial_imagenes.map(
                      (img, idx) => (
                        <div
                          key={idx}
                          className="group relative aspect-square rounded-xl overflow-hidden border border-gray-800 cursor-zoom-in bg-black"
                          onClick={() => window.open(img.url, "_blank")}
                        >
                          <img
                            src={img.url}
                            alt="Vehículo"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                          />
                          {img.descripcion && (
                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                              <p className="text-[9px] text-white truncate">
                                {img.descripcion}
                              </p>
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-900/30 border border-gray-800/50 rounded-xl p-8 text-center flex flex-col items-center justify-center">
                    <Car className="w-8 h-8 text-gray-700 mb-2" />
                    <p className="text-xs text-gray-500">
                      No hay imágenes registradas para este vehículo.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-800/60 flex justify-end">
                <button
                  onClick={() => {
                    setModalVehiculoDetailOpen(false);
                    window.open(
                      `/mission-control/${selectedVehiculoDetail.patente}?clienteId=${clienteDetalle.id || clienteDetalle._id}`,
                      "_blank",
                    );
                  }}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                >
                  <Activity className="w-4 h-4" /> Abrir Mission Control
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
