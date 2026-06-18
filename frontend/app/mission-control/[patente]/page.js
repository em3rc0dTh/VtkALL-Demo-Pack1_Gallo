'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, AlertTriangle, Activity, Settings, 
  ChevronLeft, Smartphone, Bell, CarFront, Gauge, Wrench, Thermometer,
  Calendar, CheckCircle, Clock, MapPin, Navigation, Video
} from 'lucide-react';
import { api } from '../../../lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line
} from 'recharts';

const CircularProgress = ({ value, title, status, color, size = 100, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white">{value}</span>
          <span className="text-[9px] text-gray-500">/100</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <p className="text-xs font-bold text-gray-300 mb-0.5">{title}</p>
        <p className="text-[10px] font-medium" style={{ color }}>{status}</p>
      </div>
    </div>
  );
};

export default function MissionControl() {
  const params = useParams();
  const searchParams = useSearchParams();
  const patente = params.patente;
  const clienteId = searchParams.get('clienteId');

  const [cliente, setCliente] = useState(null);
  const [vehiculo, setVehiculo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clienteId) {
      api.getClienteDetalle(clienteId).then(res => {
        setCliente(res);
        if (res.vehiculos) {
          const v = res.vehiculos.find(veh => veh.patente === patente);
          if (v) setVehiculo(v);
        }
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [clienteId, patente]);

  // Mocked Data for the UI
  const costData = [
    { name: 'M', value: 200 }, { name: 'J', value: 150 }, { name: 'J', value: 400 },
    { name: 'A', value: 300 }, { name: 'S', value: 500 }, { name: 'O', value: 800 },
    { name: 'N', value: 200 }, { name: 'D', value: 100 }, { name: 'E', value: 600 },
    { name: 'F', value: 400 }, { name: 'M', value: 350 }, { name: 'A', value: 250 },
  ];

  const trendData = [
    { name: 'W1', v: 80 }, { name: 'W2', v: 82 }, { name: 'W3', v: 85 },
    { name: 'W4', v: 86 }, { name: 'W5', v: 84 }, { name: 'W6', v: 88 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f18] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const vData = vehiculo || {
    marca: 'Desconocido',
    modelo: 'Vehículo',
    anio: '2020',
    patente: patente || 'XXX-000'
  };

  return (
    <div className="min-h-screen bg-[#080b12] text-gray-300 font-sans selection:bg-emerald-500/30 overflow-x-hidden flex">
      
      {/* Left Sidebar (Decorative) */}
      <div className="w-64 border-r border-gray-800/60 bg-[#0a0e17] flex flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6 border-b border-gray-800/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="font-black text-white text-sm leading-tight tracking-wide uppercase">Ground Control</h1>
            <p className="text-[9px] text-gray-500 tracking-widest uppercase">Mission Operations</p>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <div className="mb-6">
            <p className="text-[10px] font-bold text-gray-600 mb-3 uppercase tracking-widest px-2">Operation Tree</p>
            <div className="space-y-1">
              <div className="px-3 py-2 rounded-lg bg-gray-800/50 text-white text-xs font-medium flex justify-between items-center cursor-pointer">
                <span className="flex items-center gap-2"><CarFront className="w-3.5 h-3.5 text-emerald-500" /> Vehículos</span>
              </div>
              <div className="px-3 py-2 rounded-lg hover:bg-gray-800/30 text-gray-400 hover:text-gray-200 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors">
                <ShieldCheck className="w-3.5 h-3.5" /> Dashboard
              </div>
              <div className="px-3 py-2 rounded-lg hover:bg-gray-800/30 text-gray-400 hover:text-gray-200 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors">
                <Settings className="w-3.5 h-3.5" /> Ajustes
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-[10px] font-bold text-gray-600 mb-3 uppercase tracking-widest px-2">Feed Controls</p>
            <div className="space-y-3 px-3">
              {['WhatsApp', 'Calendar', 'AI Doctor', 'OBD Telemetry'].map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">{item}</span>
                  <div className="w-7 h-4 rounded-full bg-emerald-500/20 relative">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 absolute right-0.5 top-0.5"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-gray-800/60 bg-[#0a0e17]/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => window.close()} className="p-1.5 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Vertikall Vehicle Health</span>
            </div>
          </div>

          <div className="text-center flex flex-col items-center">
            <span className="text-lg font-mono font-bold text-white tracking-wider">17:42:36</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest">May 12, 2026</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold text-emerald-500">All Systems Operational</span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                <Video className="w-4 h-4 text-white" />
              </div>
              <div className="text-xs">
                <p className="text-white font-medium leading-none mb-1">AI Agent</p>
                <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Online</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
            <h2 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Mon-View / Stable Awareness Surface</h2>
          </div>

          {/* Top Dash: Health & Gauges */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* Main Health Score */}
            <div className="lg:col-span-3 bg-gradient-to-b from-[#111726] to-[#0a0e17] border border-gray-800/60 rounded-2xl p-6 flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 opacity-50"></div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest w-full text-left mb-6">Vehicle Health Score</p>
              
              <div className="relative mb-6">
                <CircularProgress value={86} size={160} strokeWidth={10} color="#10b981" title="" status="" />
              </div>
              
              <p className="text-emerald-500 font-bold uppercase tracking-widest text-sm mb-2">Good Health</p>
              <p className="text-[10px] text-gray-500 font-medium">+4 points vs last 90 days</p>
            </div>

            {/* Health By System */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div className="bg-[#111726] border border-gray-800/60 rounded-2xl p-6 flex-1">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">Health By System</p>
                <div className="flex justify-between items-end h-full pb-2">
                  <CircularProgress value={82} title="Engine" status="Good" color="#10b981" size={85} />
                  <CircularProgress value={91} title="Brakes" status="Excellent" color="#10b981" size={85} />
                  <CircularProgress value={95} title="Electrical" status="Excellent" color="#10b981" size={85} />
                  <CircularProgress value={76} title="Suspension" status="Fair" color="#eab308" size={85} />
                  <CircularProgress value={88} title="Transmission" status="Good" color="#10b981" size={85} />
                </div>
              </div>

              {/* Mini Stats row */}
              <div className="grid grid-cols-3 gap-6 h-28">
                <div className="bg-[#111726] border border-gray-800/60 rounded-2xl p-4 flex flex-col justify-between">
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1"><Wrench className="w-3 h-3"/> Next Service</p>
                  <div>
                    <p className="text-xl font-bold text-white mb-0.5">3,500 <span className="text-xs text-gray-500 font-normal">km</span></p>
                    <p className="text-[10px] text-gray-500">or in 45 days</p>
                  </div>
                </div>
                <div className="bg-[#111726] border border-gray-800/60 rounded-2xl p-4 flex flex-col justify-between">
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Risk Level</p>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <p className="text-sm font-bold text-yellow-500 uppercase tracking-widest">Medium</p>
                  </div>
                  <p className="text-[10px] text-gray-500">1 system at high risk</p>
                </div>
                <div className="bg-[#111726] border border-gray-800/60 rounded-2xl p-4 flex flex-col justify-between">
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1"><Activity className="w-3 h-3"/> Reliability Trend</p>
                  <div className="h-10 w-full mt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-emerald-500 text-right mt-1 font-bold">Stable</p>
                </div>
              </div>
            </div>

            {/* AI Vehicle Doctor */}
            <div className="lg:col-span-3 bg-[#111726] border border-gray-800/60 rounded-2xl p-6 relative flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[11px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> AI Vehicle Doctor
                </h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">AI</span>
              </div>

              <div className="text-sm text-gray-300 leading-relaxed flex-1">
                <p className="mb-3">Overall health is <strong className="text-emerald-500">GOOD.</strong></p>
                <p className="mb-3">Main concern: <strong className="text-yellow-500">Front Suspension.</strong> Wear detected in shock absorbers and front mounting.</p>
                <p className="text-emerald-400/80 italic text-xs mb-6">Recommended action in 2,000 km.</p>

                <div className="mb-4">
                  <div className="flex justify-between text-[10px] mb-1.5">
                    <span className="text-gray-400">Probability of failure (next 20k km)</span>
                    <span className="text-yellow-500 font-bold">63%</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 w-[63%]"></div>
                  </div>
                  <p className="text-xs text-white font-medium mt-1.5">Front Suspension</p>
                </div>
              </div>

              <button className="w-full py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border border-blue-500/20 mt-4">
                View Full Diagnosis →
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 mt-8">
            <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
            <h2 className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em]">Work-View / Operational Manipulation Surface</h2>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Vehicle Card */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="bg-[#111726] border border-gray-800/60 rounded-2xl p-5">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-800 rounded-xl overflow-hidden shrink-0">
                    <img src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=200&auto=format&fit=crop" alt="Car" className="w-full h-full object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg leading-tight mb-1">{vData.marca} {vData.modelo}</h3>
                    <p className="text-gray-500 text-sm mb-2">{vData.anio}</p>
                    <div className="inline-flex items-center gap-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-xs font-bold uppercase">
                      {vData.patente}
                    </div>
                  </div>
                </div>
                <div className="mt-6 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-gray-800/60 pb-2">
                    <span className="text-gray-500">VIN</span>
                    <span className="text-gray-300 font-mono">JTDBR32E920123456</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800/60 pb-2">
                    <span className="text-gray-500">Mileage</span>
                    <span className="text-gray-300">78,450 km</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <span className="px-2 py-1 bg-gray-800 rounded text-[10px] text-gray-400">Gasoline</span>
                    <span className="px-2 py-1 bg-gray-800 rounded text-[10px] text-gray-400">Automatic</span>
                  </div>
                </div>
              </div>

              {/* Anatomy Placeholder */}
              <div className="bg-[#111726] border border-gray-800/60 rounded-2xl p-5 flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest absolute top-5 left-5">Vehicle Anatomy</p>
                <CarFront className="w-32 h-32 text-gray-700/50" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-500 rounded-full animate-ping opacity-50"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_10px_#eab308]"></div>
                <p className="text-[10px] text-gray-500 absolute bottom-5">Click on a system to see details</p>
              </div>
            </div>

            {/* Timeline & Diagnostics */}
            <div className="lg:col-span-3 bg-[#111726] border border-gray-800/60 rounded-2xl overflow-hidden flex flex-col">
              <div className="flex border-b border-gray-800/60 bg-[#0d121c]">
                {['Clinical History', 'Diagnostics', 'Services', 'Costs', 'Documents'].map((tab, i) => (
                  <button key={i} className={`px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${i === 0 ? 'text-white border-b-2 border-emerald-500 bg-[#111726]' : 'text-gray-500 hover:text-gray-300'}`}>
                    {tab}
                  </button>
                ))}
              </div>
              
              <div className="p-6 flex gap-8 flex-1">
                {/* Timeline */}
                <div className="flex-1 border-r border-gray-800/60 pr-8">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Clinical Timeline</p>
                  <div className="relative border-l-2 border-gray-800 ml-3 space-y-6">
                    <div className="relative pl-6">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-yellow-500 ring-4 ring-[#111726]"></div>
                      <p className="text-[10px] text-gray-500 font-mono mb-1">May 12, 2026</p>
                      <p className="text-sm text-yellow-500 font-bold mb-0.5">AI Risk Alert</p>
                      <p className="text-xs text-gray-400">Front suspension risk detected</p>
                    </div>
                    <div className="relative pl-6">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-[#111726]"></div>
                      <p className="text-[10px] text-gray-500 font-mono mb-1">Apr 28, 2026</p>
                      <p className="text-sm text-white font-bold mb-0.5">Suspension Inspection</p>
                      <p className="text-xs text-gray-400">Front shocks wear detected</p>
                    </div>
                    <div className="relative pl-6">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-[#111726]"></div>
                      <p className="text-[10px] text-gray-500 font-mono mb-1">Feb 15, 2026</p>
                      <p className="text-sm text-white font-bold mb-0.5">Brake Service</p>
                      <p className="text-xs text-gray-400">Brake pads and fluid replaced</p>
                    </div>
                  </div>
                  <button className="text-xs text-blue-400 font-bold mt-8 flex items-center gap-1 hover:text-blue-300">View full history <ChevronLeft className="w-3 h-3 rotate-180" /></button>
                </div>

                {/* Diagnostics */}
                <div className="flex-1 pr-8">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Latest Diagnostics</p>
                  <div className="space-y-4">
                    <div className="bg-gray-800/30 border border-gray-800/60 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-mono font-bold text-white">P0171</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-bold uppercase">Pending</span>
                      </div>
                      <p className="text-xs text-gray-300 mb-1">System Too Lean (Bank 1)</p>
                      <p className="text-[10px] text-gray-500">Detected: Apr 28, 2026</p>
                    </div>
                    <div className="bg-gray-800/30 border border-gray-800/60 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-mono font-bold text-white">P0420</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase">Monitor</span>
                      </div>
                      <p className="text-xs text-gray-300 mb-1">Catalyst System Efficiency</p>
                      <p className="text-[10px] text-gray-500">Detected: Apr 28, 2026</p>
                    </div>
                  </div>
                </div>

                {/* Cost Analysis */}
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Cost Analysis (12M)</p>
                  <div className="mb-4">
                    <p className="text-2xl font-black text-white">S/ 3,850</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total spent</p>
                  </div>
                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={costData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                        <Tooltip cursor={{fill: '#1f2937'}} contentStyle={{ backgroundColor: '#111726', borderColor: '#374151', fontSize: '12px' }} />
                        <Bar dataKey="value" fill="#ec4899" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-gray-400">Maintenance</span><span className="text-white font-medium">42%</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Suspension</span><span className="text-white font-medium">28%</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>

      {/* Right Sidebar - Notifications */}
      <div className="w-72 border-l border-gray-800/60 bg-[#0a0e17] flex flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6 border-b border-gray-800/60 flex justify-between items-center">
          <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Notifications</h2>
          <Settings className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer transition-colors" />
        </div>
        
        <div className="flex border-b border-gray-800/60 px-4">
          <button className="flex-1 py-3 text-[10px] font-bold text-white border-b-2 border-emerald-500">All</button>
          <button className="flex-1 py-3 text-[10px] font-bold text-gray-500 hover:text-gray-300">Critical (2)</button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          <div className="bg-[#111726] border border-gray-800/60 rounded-xl p-3 flex gap-3 relative overflow-hidden group hover:border-gray-700 transition-colors cursor-pointer">
            <div className="w-1 bg-emerald-500 absolute left-0 top-0 bottom-0"></div>
            <div className="mt-1"><Smartphone className="w-4 h-4 text-emerald-500" /></div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-white">WhatsApp</span>
                <span className="text-[9px] text-gray-500">17:21</span>
              </div>
              <p className="text-xs text-gray-300">Customer replied</p>
              <p className="text-[10px] text-gray-500 truncate mt-1 italic">Quote #Q-250512 approved.</p>
            </div>
          </div>

          <div className="bg-[#111726] border border-red-900/50 rounded-xl p-3 flex gap-3 relative overflow-hidden group hover:border-red-900 transition-colors cursor-pointer">
            <div className="w-1 bg-red-500 absolute left-0 top-0 bottom-0"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-red-500/5 pointer-events-none"></div>
            <div className="mt-1"><AlertTriangle className="w-4 h-4 text-red-500" /></div>
            <div className="relative z-10 w-full">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-red-400">AI Doctor Alert</span>
                <span className="text-[9px] text-red-500/70">17:33</span>
              </div>
              <p className="text-xs text-red-300">Risk threshold exceeded</p>
              <p className="text-[10px] text-red-400/70 truncate mt-1">Front Suspension</p>
            </div>
          </div>
          
          <div className="bg-[#111726] border border-gray-800/60 rounded-xl p-3 flex gap-3 relative overflow-hidden group hover:border-gray-700 transition-colors cursor-pointer">
            <div className="w-1 bg-blue-500 absolute left-0 top-0 bottom-0"></div>
            <div className="mt-1"><Calendar className="w-4 h-4 text-blue-500" /></div>
            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-white">Calendar</span>
                <span className="text-[9px] text-gray-500">17:40</span>
              </div>
              <p className="text-xs text-gray-300">Follow-up meeting</p>
              <p className="text-[10px] text-gray-500 truncate mt-1">Tomorrow 10:00 AM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
