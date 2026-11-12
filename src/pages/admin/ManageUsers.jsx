import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Check,
  ShieldCheck,
  Mail,
  Phone,
} from "lucide-react";
import { userService } from "../../services/userService";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";

export function ManageUsers() {
  const cachedUsers = userService.getCachedUsers();
  const [users, setUsers] = useState(cachedUsers);
  const [loading, setLoading] = useState(cachedUsers.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "customer",
    status: "Active",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadUsers = async (silent = false) => {
    if (!silent && users.length === 0) setLoading(true);
    else setIsRefreshing(true);
    try {
      const list = await userService.getUsers();
      setUsers(list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers(cachedUsers.length > 0);
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      phone: "+1 (555) 000-0000",
      role: "customer",
      status: "Active",
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setIsEditing(true);
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role || "customer",
      status: user.status || "Active",
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenDelete = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Full name is required.";
    if (!formData.email.trim()) {
      errs.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = "Valid email is required.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      if (isEditing && selectedUser) {
        await userService.updateUser(selectedUser.id, formData);
        showNotification(`Account "${formData.name}" updated!`);
      } else {
        await userService.createUser(formData);
        showNotification(`Account "${formData.name}" added to Directory!`);
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await userService.deleteUser(selectedUser.id);
      showNotification(`Account "${selectedUser.name}" removed.`);
      setIsDeleteModalOpen(false);
      loadUsers();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "Patron / User",
      key: "name",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-900 text-[#D6FF00] font-black flex items-center justify-center text-xs shrink-0 shadow-2xs">
            {item.name ? item.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <strong className="block text-gray-900 text-xs sm:text-sm font-bold">{item.name}</strong>
            <span className="text-[11px] text-gray-500">{item.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Phone",
      key: "phone",
      render: (item) => <span className="text-xs text-gray-600 font-mono">{item.phone || "—"}</span>,
    },
    {
      title: "Role",
      key: "role",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
            item.role === "admin"
              ? "bg-neutral-900 text-[#D6FF00] border border-neutral-900"
              : "bg-gray-100 text-gray-700 border border-gray-200"
          }`}
        >
          {item.role === "admin" ? "Studio Admin" : "VIP Patron"}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
            item.status === "Active"
              ? "bg-emerald-100/70 text-emerald-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {item.status || "Active"}
        </span>
      ),
    },
    {
      title: "Member Since",
      key: "registeredDate",
      render: (item) => <span className="text-xs text-gray-500">{item.registeredDate || "2026"}</span>,
    },
  ];

  if (loading && users.length === 0) {
    return <Loader message="Loading registered patron directory..." />;
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-neutral-900 text-white border border-neutral-800 shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#D6FF00] shrink-0" />
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link to="/admin/dashboard" className="hover:text-black font-semibold">
              Admin
            </Link>
            <span>/</span>
            <span className="text-gray-800 font-bold">Patrons</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-gray-950 tracking-tight">
            Patron &amp; Administrator Accounts
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Maintain customer relationships, manage VIP tiers, and configure administrator access.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#111111] text-[#D6FF00] hover:bg-neutral-800 transition-all font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Account</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchKey="name"
        searchPlaceholder="Search patrons by name or email..."
        itemsPerPage={8}
        renderMobileCard={(item) => (
          <div className="space-y-3">
            {/* Top Row: Avatar + Name/Email + Role Badge */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-neutral-900 text-[#D6FF00] font-black flex items-center justify-center text-sm shrink-0 shadow-2xs">
                  {item.name ? item.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="min-w-0">
                  <strong className="block text-gray-900 text-sm font-bold truncate">
                    {item.name}
                  </strong>
                  <span className="text-[11px] text-gray-500 block truncate">
                    {item.email}
                  </span>
                </div>
              </div>

              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                  item.role === "admin"
                    ? "bg-neutral-900 text-[#D6FF00] border border-neutral-900"
                    : "bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                {item.role === "admin" ? "Studio Admin" : "VIP Patron"}
              </span>
            </div>

            {/* Middle Info Grid */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">
                  Phone
                </span>
                <span className="font-mono text-[11px] text-gray-700 truncate block">
                  {item.phone || "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">
                  Status
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    item.status === "Active"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {item.status || "Active"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">
                  Joined
                </span>
                <span className="text-[11px] text-gray-600 font-medium">
                  {item.registeredDate || "2026"}
                </span>
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handleOpenEdit(item)}
                className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Account</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenDelete(item)}
                className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        )}
        renderActions={(item) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 transition-colors cursor-pointer"
              title="Edit User"
              onClick={() => handleOpenEdit(item)}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
              title="Delete User"
              onClick={() => handleOpenDelete(item)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth={500}
        title={
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black text-[#D6FF00] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <span>{isEditing ? `Edit: ${selectedUser?.name}` : "Create Account"}</span>
          </div>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-[#D6FF00] hover:bg-neutral-800 font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
              <span>{isEditing ? "Save Account" : "Create Account"}</span>
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Camille Laurent"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="camille@atelier.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            required
          />

          <Input
            label="Phone Number"
            placeholder="+1 (555) 000-0000"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-gray-200 font-semibold"
              >
                <option value="customer">VIP Patron (Customer)</option>
                <option value="admin">Studio Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-gray-200 font-semibold"
              >
                <option value="Active">🟢 Active</option>
                <option value="Inactive">⚪ Inactive</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        maxWidth={440}
        title="Confirm Account Removal"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{saving ? "Deleting..." : "Delete Account"}</span>
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-800 font-medium">
              Are you sure you want to remove account{" "}
              <strong className="text-gray-950 font-bold">&ldquo;{selectedUser?.name}&rdquo;</strong>?
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ManageUsers;
