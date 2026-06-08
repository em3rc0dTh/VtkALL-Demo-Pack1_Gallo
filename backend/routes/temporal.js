import express from 'express';
import { Connection, Client } from '@temporalio/client';
import Cita from '../models/Cita.js'; // Model para pedidos

const router = express.Router();

let temporalClient = null;

async function getTemporalClient() {
  if (!temporalClient) {
    const connection = await Connection.connect({ address: process.env.TEMPORAL_ADDRESS || 'localhost:7233' });
    temporalClient = new Client({ connection });
  }
  return temporalClient;
}

// Iniciar el workflow (llamado por la IA cuando capta el lead)
router.post('/start', async (req, res) => {
  try {
    const { clienteNombre, numeroWhatsApp, descripcionInicial } = req.body;

    if (!numeroWhatsApp || !clienteNombre || !descripcionInicial) {
      return res.status(400).json({ ok: false, error: 'Faltan datos obligatorios' });
    }

    // 1. Crear el pedido en la BD (estado: revision_maestro)
    const nuevoPedido = new Cita({
      nombre_cliente: clienteNombre,
      telefono_cliente: numeroWhatsApp,
      descripcion_trabajo: descripcionInicial,
      estado: 'revision_maestro',
      fecha_cita: new Date()
    });
    await nuevoPedido.save();

    // 2. Iniciar workflow de Temporal
    const client = await getTemporalClient();
    const handle = await client.workflow.start('pastryOrderWorkflow', {
      taskQueue: 'pasteleria-pedidos',
      workflowId: `pedido-${nuevoPedido._id}`,
      args: [{
        pedidoId: nuevoPedido._id.toString(),
        numeroWhatsApp,
        clienteNombre,
        descripcionInicial
      }]
    });

    res.json({ ok: true, pedidoId: nuevoPedido._id, workflowId: handle.workflowId });
  } catch (error) {
    console.error('Error al iniciar workflow:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// El pastelero aprueba y manda la cotización
router.post('/baker-quote', async (req, res) => {
  try {
    const { pedidoId, precioFinal, ingredientes, fechaEntrega, imagenUrl } = req.body;

    if (!pedidoId || !precioFinal || !ingredientes || !fechaEntrega) {
      return res.status(400).json({ ok: false, error: 'Faltan datos de la cotización' });
    }

    // Actualizar datos en BD por si acaso
    await Cita.findByIdAndUpdate(pedidoId, {
      precio_estimado: precioFinal,
      precio_final: precioFinal,
      notas_mecanico: ingredientes, // Reutilizando campo
      imagenes: imagenUrl ? [imagenUrl] : []
    });

    // Enviar señal a Temporal
    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(`pedido-${pedidoId}`);
    
    // El nombre de la señal debe coincidir con `bakerReviewSignal`
    await handle.signal('bakerReview', {
      precioFinal: Number(precioFinal),
      ingredientes,
      fechaEntrega,
      imagenUrl
    });

    res.json({ ok: true, message: 'Señal enviada a Temporal' });
  } catch (error) {
    console.error('Error enviando baker-quote:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// El cliente aprueba (vía webhook de WhatsApp)
router.post('/client-approve', async (req, res) => {
  try {
    const { pedidoId, approved } = req.body;

    if (!pedidoId || typeof approved !== 'boolean') {
      return res.status(400).json({ ok: false, error: 'Faltan datos' });
    }

    // Enviar señal a Temporal
    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(`pedido-${pedidoId}`);
    
    await handle.signal('clientApproval', approved);

    res.json({ ok: true, message: 'Señal enviada a Temporal' });
  } catch (error) {
    console.error('Error enviando client-approve:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
