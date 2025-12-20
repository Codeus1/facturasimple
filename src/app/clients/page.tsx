'use client';

import { ClientForm, ConfirmDialog, EmptyState, PageHeader, PageLoading } from '@/components';
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { useClients, useMounted } from '@/hooks';
import type { Client } from '@/types';
import { Edit2, Plus, Search, Table, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  if (!mounted) {
    return <PageLoading message="Cargando clientes..." />;
  }

  const filteredClients = search ? searchClients(search) : clients;

  // Pagination Logic
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Button>
        }
      />

      <Card>
        <SearchBar value={search} onChange={setSearch} />
        <ClientsTable clients={paginatedClients} onEdit={handleEdit} onDelete={handleDeleteClick} />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
              {Math.min(currentPage * itemsPerPage, filteredClients.length)} de{' '}
              {filteredClients.length} clientes
            </div>

            <Pagination className="w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={
                      currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                    }
                  />
                </PaginationItem>

                <PaginationItem>
                  <span className="text-sm font-medium px-4">
                    Página {currentPage} de {totalPages}
                  </span>
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={
                      currentPage === totalPages
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* Client Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
            <DialogDescription>
              {editingClient
                ? 'Modifica los datos del cliente.'
                : 'Introduce los datos del nuevo cliente.'}
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
          <ClientRow key={client.id} client={client} onEdit={onEdit} onDelete={onDelete} />
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
      <div className="flex justify-end gap-2">
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
