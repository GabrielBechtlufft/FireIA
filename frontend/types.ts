export enum VehicleStatus {
  AVAILABLE = 'Disponível',
  DISPATCHED = 'Em Deslocamento',
  ON_SCENE = 'Em Missão',
  MAINTENANCE = 'Manutenção'
}

export enum IncidentPriority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta',
  CRITICAL = 'Crítica'
}

export enum IncidentStatus {
  NEW = 'Novo',
  IN_PROGRESS = 'Em Atendimento',
  RESOLVED = 'Encerrado',
  CLOSED = 'Fechado'
}

export enum PersonnelStatus {
  READY = 'Pronto',
  REST = 'Descanso',
  TRAINING = 'Treinamento',
  LEAVE = 'Férias'
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface Vehicle {
  id: string;
  type: string;
  status: VehicleStatus;
  location: Coordinates;
  driver: string;
  capacity: number;
  lastUpdate: string;
}

export interface Incident {
  id: string;
  type: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  location: Coordinates;
  address: string;
  assignedVehicles: string[];
  description: string;
  timestamp: string;
  notes: Note[];
}

export interface Note {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  attachmentUrl?: string;
}

export interface Personnel {
  id: string;
  name: string;
  role: string;
  status: PersonnelStatus;
  base: string;
  lastHealthCheck: string;
}

export interface User {
  id: string;
  name: string;
  role: 'COE_OPERATOR' | 'FIRE_CHIEF' | 'FIELD_TEAM';
  avatar?: string;
}