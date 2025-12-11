import { Vehicle, VehicleStatus, Incident, IncidentPriority, IncidentStatus, Personnel, PersonnelStatus } from './types';

// Center point for "City" simulation (approx Sao Paulo downtown)
export const CITY_CENTER = { lat: -23.5505, lon: -46.6333 };

export const MOCK_VEHICLES: Vehicle[] = [
  { id: "V-01", type: "Auto Bomba", status: VehicleStatus.AVAILABLE, location: { lat: -23.5505, lon: -46.6333 }, driver: "Sgt. Silva", capacity: 4, lastUpdate: new Date().toISOString() },
  { id: "V-02", type: "Resgate", status: VehicleStatus.ON_SCENE, location: { lat: -23.562, lon: -46.650 }, driver: "Cb. Souza", capacity: 2, lastUpdate: new Date().toISOString() },
  { id: "V-03", type: "Auto Escada", status: VehicleStatus.DISPATCHED, location: { lat: -23.558, lon: -46.640 }, driver: "Sd. Oliveira", capacity: 3, lastUpdate: new Date().toISOString() },
  { id: "V-04", type: "Tanque", status: VehicleStatus.MAINTENANCE, location: { lat: -23.540, lon: -46.620 }, driver: "Mec. Costa", capacity: 1, lastUpdate: new Date().toISOString() },
  { id: "V-05", type: "Moto Resgate", status: VehicleStatus.AVAILABLE, location: { lat: -23.555, lon: -46.635 }, driver: "Sd. Lima", capacity: 1, lastUpdate: new Date().toISOString() },
];

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: "I-100",
    type: "Incêndio Estrutural",
    priority: IncidentPriority.CRITICAL,
    status: IncidentStatus.IN_PROGRESS,
    location: { lat: -23.562, lon: -46.650 },
    address: "Av. Paulista, 1000",
    assignedVehicles: ["V-02", "V-03"],
    description: "Fogo no 4º andar de edifício comercial. Evacuação em andamento.",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    notes: [
      { id: "n1", author: "Op. COE", content: "Chamado recebido via 193.", timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: "n2", author: "V-02", content: "Chegada ao local. Confirmado fogo visível.", timestamp: new Date(Date.now() - 3000000).toISOString() }
    ]
  },
  {
    id: "I-101",
    type: "Colisão Veicular",
    priority: IncidentPriority.HIGH,
    status: IncidentStatus.NEW,
    location: { lat: -23.545, lon: -46.625 },
    address: "Radial Leste, Km 2",
    assignedVehicles: [],
    description: "Colisão moto x carro com vítima ao solo.",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    notes: []
  },
  {
    id: "I-102",
    type: "Resgate Animal",
    priority: IncidentPriority.LOW,
    status: IncidentStatus.RESOLVED,
    location: { lat: -23.570, lon: -46.660 },
    address: "Rua Oscar Freire, 500",
    assignedVehicles: ["V-05"],
    description: "Gato em árvore.",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    notes: []
  }
];

export const MOCK_PERSONNEL: Personnel[] = [
  { id: "B-001", name: "Cap. Nascimento", role: "Comandante", status: PersonnelStatus.READY, base: "Base Central", lastHealthCheck: "2024-05-20" },
  { id: "B-002", name: "Ten. Ripley", role: "Líder de Equipe", status: PersonnelStatus.READY, base: "Base Sul", lastHealthCheck: "2024-05-21" },
  { id: "B-003", name: "Sgt. Foley", role: "Operador", status: PersonnelStatus.REST, base: "Base Central", lastHealthCheck: "2024-05-19" },
  { id: "B-004", name: "Sd. Ryan", role: "Resgatista", status: PersonnelStatus.TRAINING, base: "Academia", lastHealthCheck: "2024-05-22" },
  { id: "B-005", name: "Cb. Hicks", role: "Motorista", status: PersonnelStatus.READY, base: "Base Central", lastHealthCheck: "2024-05-20" },
];