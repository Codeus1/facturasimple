"use client";

import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2 } from 'lucide-react';
import { useClients, useMounted } from '@/src/hooks';
import type { Client } from '@/src/types';
import {
  Button,
  Input,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui';
import { ClientForm } from '@/src/components';

// ============================================================================
// CLIENTS PAGE
// ============================================================================

export const ClientsPage: React.FC = () => {
  const mounted = useMounted();
  const { clients, searchClients, saveClient, updateClient, deleteClient } = useClients();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  if (!mounted) {
    return <div className="p-8 text-muted-foreground">Cargando clientes...</div>;
  }

  const filteredClients = search ? searchClients(search) : clients;

  const handleSave = (clientData: Client) => {
    if (editingClient) {
      updateClient(clientData);
    } else {
      saveClient(clientData);
    }
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      deleteClient(id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gestión de cartera de clientes</p>
        </div>
        <Button icon={Plus} onClick={handleNew}>
          Nuevo Cliente
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-border flex items-center">
          <div className="relative max-w-sm w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <Input
              placeholder="Buscar por nombre..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>NIF</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  No hay clientes
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map(client => (
                <TableRow key={client.id} className="group">
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{client.nif}</TableCell>
                  <TableCell className="text-muted-foreground">{client.email}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
          </DialogHeader>
          <ClientForm
            client={editingClient}
            onSave={handleSave}
            onCancel={() => setIsModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsPage;
