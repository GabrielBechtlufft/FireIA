import { Incident } from '../types';

export const fetchIncidents = async (): Promise<Incident[]> => {
    const res = await fetch('/api/incidents');
    return res.json();
};

export const createIncident = async (data: Partial<Incident>): Promise<Incident> => {
    const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
};

export const updateIncident = async (id: string, data: Partial<Incident>): Promise<Incident> => {
    const res = await fetch(`/api/incidents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
};

export const deleteIncident = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/incidents/${id}`, {
        method: 'DELETE'
    });
    return res.ok;
};

export const addNote = async (id: string, author: string, content: string) => {
    const res = await fetch(`/api/incidents/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, content })
    });
    return res.json();
};
