'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { generateId } from '@/lib/utils';
import { ClientFormData, ClientSchema } from '@/schemas';
import type { Client } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

// ============================================================================
// CLIENT FORM COMPONENT
// ============================================================================

interface ClientFormProps {
  client?: Client | null;
  onSave: (data: Client) => void;
  onCancel: () => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ client, onSave, onCancel }) => {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(ClientSchema),
    defaultValues: {
      name: '',
      nif: '',
      email: '',
      address: '',
    },
  });

  useEffect(() => {
    if (client) {
      form.reset(client);
    } else {
      form.reset({ name: '', nif: '', email: '', address: '' });
    }
  }, [client, form]);

  const onSubmit = (data: ClientFormData) => {
    onSave({
      id: client?.id || generateId(),
      createdAt: client?.createdAt || Date.now(),
      name: data.name,
      nif: data.nif,
      email: data.email || '',
      address: data.address || '',
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre / Razón Social</FormLabel>
              <FormControl>
                <Input placeholder="Empresa S.L." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nif"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NIF / CIF</FormLabel>
              <FormControl>
                <Input placeholder="B-12345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="contacto@empresa.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección Fiscal</FormLabel>
              <FormControl>
                <Input placeholder="Calle Principal 123, 28001 Madrid" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" className="w-full" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
