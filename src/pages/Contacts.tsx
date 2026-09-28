import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Users, Pencil, Trash2, Mail, Building2, ArrowRight } from 'lucide-react';
import { fetchContacts, createContact, updateContact, deleteContact } from '@/lib/contacts';
import { getInitials } from '@/lib/utils';
import type { Contact } from '@/types';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { ListSkeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

const emptyForm = {
  name: '',
  email: '',
  company: '',
  role: '',
  relationship_type: 'Contact',
  notes: '',
};

const relationshipTypes = ['Contact', 'Project Collaborator', 'Manager', 'Client', 'Vendor', 'Colleague', 'Mentor', 'Direct Report'];

export default function Contacts() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchContacts(search || undefined);
      setContacts(data);
    } catch {
      showToast('Failed to load contacts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setForm({
      name: contact.name,
      email: contact.email ?? '',
      company: contact.company ?? '',
      role: contact.role ?? '',
      relationship_type: contact.relationship_type,
      notes: contact.notes ?? '',
    });
    setEditId(contact.id);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await updateContact(editId, form);
        showToast('Contact updated', 'success');
      } else {
        await createContact(form);
        showToast('Contact created', 'success');
      }
      setModalOpen(false);
      load();
    } catch {
      showToast('Failed to save contact', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteContact(deleteId);
      showToast('Contact deleted', 'success');
      setDeleteId(null);
      load();
    } catch {
      showToast('Failed to delete contact', 'error');
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Contacts</h1>
          <p className="text-neutral-500 mt-1">Manage people you meet with</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <UserPlus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-11"
          placeholder="Search by name, company, or role..."
        />
      </div>

      {loading ? (
        <ListSkeleton count={4} />
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No contacts found' : 'No contacts yet'}
          description={search ? 'Try a different search term.' : 'Add your first contact to start building meeting context.'}
          action={!search && <button onClick={openCreate} className="btn-primary"><UserPlus className="w-4 h-4" />Add Contact</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => navigate(`/contacts/${contact.id}`)}
              className="card p-5 hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-base font-semibold shrink-0">
                  {getInitials(contact.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 truncate">{contact.name}</h3>
                  <p className="text-sm text-neutral-500 truncate">{contact.role || 'No role set'}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(contact); }}
                    className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(contact.id); }}
                    className="p-1.5 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-neutral-500">
                {contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">{contact.company}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
                <span className="badge-primary">{contact.relationship_type}</span>
                <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Contact' : 'Add Contact'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="Rahul Sharma"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              placeholder="rahul@example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Company</label>
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="input"
                placeholder="Acme Technologies"
              />
            </div>
            <div>
              <label className="label">Role</label>
              <input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="input"
                placeholder="Backend Lead"
              />
            </div>
          </div>
          <div>
            <label className="label">Relationship Type</label>
            <select
              value={form.relationship_type}
              onChange={(e) => setForm({ ...form, relationship_type: e.target.value })}
              className="input"
            >
              {relationshipTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input min-h-[80px] resize-y"
              placeholder="Any context about this person..."
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Contact"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-neutral-600 mb-6">
          Are you sure you want to delete this contact? All related meetings and commitments will also be deleted. This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} className="btn-danger">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
