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
  DialogDescription,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui';
import { ClientForm, PageHeader, PageLoading, EmptyState, ConfirmDialog } from '@/src/components';

// ============================================================================
// CLIENTS PAGE
// ============================================================================

export default function ClientsPage() {
  const mounted = useMounted();
  const { clients, searchClients, saveClient, updateClient, deleteClient } = useClients();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (!mounted) {
    return <PageLoading message="Cargando clientes..." />;
  }

  const filteredClients = search ? searchClients(search) : clients;

  // ========== HANDLERS ==========

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

  const handleDeleteClick = (id: string) => setDeleteConfirm(id);

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteClient(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  // ========== RENDER ==========

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Clientes"
        description="Gestión de cartera de clientes"
        actions={
          <Button icon={Plus} onClick={handleNew}>
            Nuevo Cliente
          </Button>
        }
      />

      <Card>
        <SearchBar value={search} onChange={setSearch} />
        <ClientsTable
          clients={filteredClients}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </Card>

      {/* Client Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
            <DialogDescription>
              {editingClient ? 'Modifica los datos del cliente.' : 'Introduce los datos del nuevo cliente.'}
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            client={editingClient}
            onSave={handleSave}
            onCancel={() => setIsModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
        title="Eliminar Cliente"
        description="¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}

// ============================================================================
// INTERNAL COMPONENTS (Private to this route)
// ============================================================================

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => (
  <div className="p-4 border-b border-border flex items-center">
    <div className="relative max-w-sm w-full">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        size={16}
      />
      <Input
        placeholder="Buscar por nombre..."
        className="pl-9"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  </div>
);

interface ClientsTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

const ClientsTable: React.FC<ClientsTableProps> = ({ clients, onEdit, onDelete }) => (
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
      {clients.length === 0 ? (
        <EmptyState message="No hay clientes" colSpan={4} />
      ) : (
        clients.map(client => (
          <ClientRow
            key={client.id}
            client={client}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </TableBody>
  </Table>
);

interface ClientRowProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

const ClientRow: React.FC<ClientRowProps> = ({ client, onEdit, onDelete }) => (
  <TableRow className="group">
    <TableCell className="font-medium">{client.name}</TableCell>
    <TableCell className="font-mono text-muted-foreground">{client.nif}</TableCell>
    <TableCell className="text-muted-foreground">{client.email}</TableCell>
    <TableCell className="text-right">
      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={() => onEdit(client)}>
          <Edit2 size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(client.id)}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </TableCell>
  </TableRow>
);
