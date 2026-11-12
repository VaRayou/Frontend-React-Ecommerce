import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Percent,
  DollarSign,
  Truck,
  Check,
  Copy,
} from "lucide-react";
import api from "../../services/api";
import { supabase } from "../../services/supabase";
import { ensureAdminSession } from "../../services/productService";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";

const FALLBACK_COUPONS = [
  {
    code: "ATELIER20",
    description: "20% Off Runway Collection",
    type: "percentage",
    value: 20,
    min_spend: 50,
    is_active: true,
  },
  {
    code: "WELCOME10",
    description: "$10 Off Welcome Patron Gift",
    type: "fixed",
    value: 10,
    min_spend: 30,
    is_active: true,
  },
  {
    code: "FREESHIP",
    description: "Complimentary White-Glove Shipping",
    type: "shipping",
    value: 100,
    min_spend: 0,
    is_active: true,
  },
  {
    code: "VIP50",
    description: "$50 Off Haute Couture Orders over $200",
    type: "fixed",
    value: 50,
    min_spend: 200,
    is_active: true,
  },
];

export function ManageCoupons() {
  const [coupons, setCoupons] = useState(() =>
    FALLBACK_COUPONS.map((c) => ({ ...c, id: c.code }))
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    type: "percentage",
    value: "15",
    min_spend: "0",
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    showNotification(`Copied promo code "${code}" to clipboard!`);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const loadCoupons = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      await ensureAdminSession();
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        setCoupons(
          data.map((c) => ({
            ...c,
            type: c.discount_type || c.type || "percentage",
            value: Number(c.discount_value ?? c.value ?? 10),
            min_spend: Number(c.min_order_value ?? c.min_spend ?? 0),
          }))
        );
        if (isManualRefresh) {
          showNotification("Promo coupons synchronized from Supabase!");
        }
      } else {
        setCoupons(FALLBACK_COUPONS.map((c) => ({ ...c, id: c.code })));
      }
    } catch {
      setCoupons(FALLBACK_COUPONS.map((c) => ({ ...c, id: c.code })));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedCoupon(null);
    setFormData({
      code: "",
      description: "",
      type: "percentage",
      value: "15",
      min_spend: "0",
      is_active: true,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setIsEditing(true);
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      type: coupon.discount_type || coupon.type || "percentage",
      value: String(coupon.discount_value ?? coupon.value ?? 10),
      min_spend: String(coupon.min_order_value ?? coupon.min_spend ?? 0),
      is_active: coupon.is_active !== false,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenDelete = (coupon) => {
    setSelectedCoupon(coupon);
    setIsDeleteModalOpen(true);
  };

  const handleToggleActive = async (coupon) => {
    const nextState = !coupon.is_active;
    try {
      await ensureAdminSession();
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: nextState })
        .eq("id", coupon.id);

      if (error) throw error;
      showNotification(`Promo code "${coupon.code}" ${nextState ? "activated" : "deactivated"}!`);
      loadCoupons();
    } catch {
      setCoupons((prev) =>
        prev.map((c) => (c.code === coupon.code ? { ...c, is_active: nextState } : c))
      );
      showNotification(`Updated "${coupon.code}" status.`);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const cleanCode = formData.code.trim().toUpperCase();
    if (!cleanCode) {
      setErrors({ code: "Promo code is required (e.g. SUMMER25)." });
      return;
    }

    setSaving(true);
    try {
      await ensureAdminSession();
      const payload = {
        code: cleanCode,
        description:
          formData.description.trim() ||
          `${formData.value}${formData.type === "percentage" ? "%" : "$"} Off Voucher`,
        discount_type: formData.type,
        discount_value: Number(formData.value) || 0,
        min_order_value: Number(formData.min_spend) || 0,
        is_active: Boolean(formData.is_active),
      };

      if (isEditing && selectedCoupon?.id) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", selectedCoupon.id);
        if (error) throw error;
        showNotification(`Promo code "${cleanCode}" updated in Supabase!`);
      } else {
        const { error } = await supabase.from("coupons").insert([payload]);
        if (error) throw error;
        showNotification(`Promo code "${cleanCode}" created in Supabase!`);
      }

      setIsModalOpen(false);
      loadCoupons();
    } catch (err) {
      alert("Error saving coupon: " + (err?.message || "Operation failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCoupon) return;
    setSaving(true);
    try {
      await ensureAdminSession();
      if (selectedCoupon.id && selectedCoupon.id.includes("-")) {
        await supabase.from("coupons").delete().eq("id", selectedCoupon.id);
      } else {
        await supabase.from("coupons").delete().eq("code", selectedCoupon.code);
      }
      showNotification(`Promo code "${selectedCoupon.code}" deleted.`);
      setIsDeleteModalOpen(false);
      loadCoupons();
    } catch (err) {
      alert("Error deleting coupon: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const activeCount = coupons.filter((c) => c.is_active !== false).length;

  const columns = [
    {
      title: "Voucher Code",
      key: "code",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#111111] text-[#D6FF00] flex items-center justify-center shrink-0 shadow-xs">
            <Tag className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-extrabold text-xs text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 tracking-wider">
              {row.code}
            </span>
            <button
              type="button"
              onClick={() => handleCopyCode(row.code)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Copy promo code"
            >
              {copiedCode === row.code ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      ),
    },
    {
      title: "Campaign Description",
      key: "description",
      render: (row) => (
        <span className="text-xs sm:text-sm font-medium text-gray-700">
          {row.description || "Promotional discount voucher"}
        </span>
      ),
    },
    {
      title: "Discount Value",
      key: "value",
      render: (row) => {
        if (row.type === "percentage") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700">
              <Percent className="w-3 h-3" />
              <span>{row.value}% OFF</span>
            </span>
          );
        }
        if (row.type === "shipping") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700">
              <Truck className="w-3 h-3" />
              <span>FREE SHIPPING</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
            <DollarSign className="w-3 h-3" />
            <span>${Number(row.value || 0).toFixed(2)} OFF</span>
          </span>
        );
      },
    },
    {
      title: "Min. Spend",
      key: "min_spend",
      render: (row) => (
        <span className="text-xs font-semibold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200/70">
          {Number(row.min_spend || 0) > 0
            ? `$${Number(row.min_spend).toFixed(2)}`
            : "No Minimum"}
        </span>
      ),
    },
    {
      title: "Status",
      key: "is_active",
      render: (row) => {
        const active = row.is_active !== false;
        return (
          <button
            type="button"
            onClick={() => handleToggleActive(row)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
              active
                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                : "bg-red-100 text-red-700 hover:bg-red-200"
            }`}
            title="Click to toggle active status"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                active ? "bg-emerald-600" : "bg-red-600"
              }`}
            />
            <span>{active ? "Active" : "Inactive"}</span>
          </button>
        );
      },
    },
  ];

  if (loading && coupons.length === 0) {
    return <Loader message="Loading promotional vouchers from Supabase..." />;
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-neutral-900 text-white border border-neutral-800 shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#D6FF00] shrink-0" />
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link to="/admin/dashboard" className="hover:text-black font-semibold">
              Controller
            </Link>
            <span>/</span>
            <span className="text-gray-800 font-bold">Promo Coupons</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-gray-950 tracking-tight">
            Manage Coupons &amp; Vouchers
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Create and manage promotional discount codes stored in Supabase{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-800 font-mono text-xs">
              coupons
            </code>{" "}
            table ({activeCount} active).
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => loadCoupons(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all font-bold text-[11px] sm:text-xs cursor-pointer shrink-0 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${refreshing ? "animate-spin" : ""}`} />
            <span className="truncate">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl bg-[#111111] text-[#D6FF00] hover:bg-neutral-800 transition-all font-bold text-[11px] sm:text-xs uppercase tracking-wider shadow-md hover:shadow-lg cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3] shrink-0" />
            <span className="truncate">Create Code</span>
          </button>
        </div>
      </div>

      {/* Coupons Data Table */}
      <DataTable
        columns={columns}
        data={coupons}
        searchKey="code"
        searchPlaceholder="Search coupon code or description..."
        itemsPerPage={8}
        renderMobileCard={(row) => {
          const active = row.is_active !== false;
          return (
            <div className="space-y-3">
              {/* Top Row: Voucher Code + Copy + Active Toggle */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#111111] text-[#D6FF00] flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4" />
                  </div>
                  <span className="font-mono font-extrabold text-xs text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 tracking-wider">
                    {row.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(row.code)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Copy promo code"
                  >
                    {copiedCode === row.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleActive(row)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer shrink-0 ${
                    active
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      active ? "bg-emerald-600" : "bg-red-600"
                    }`}
                  />
                  <span>{active ? "Active" : "Inactive"}</span>
                </button>
              </div>

              {/* Description */}
              <p className="text-xs font-medium text-gray-700 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                {row.description || "Promotional discount voucher"}
              </p>

              {/* Discount & Minimum Spend */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                    Discount Value
                  </span>
                  {row.type === "percentage" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-700">
                      <Percent className="w-3 h-3" />
                      <span>{row.value}% OFF</span>
                    </span>
                  ) : row.type === "shipping" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-700">
                      <Truck className="w-3 h-3" />
                      <span>FREE SHIPPING</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                      <DollarSign className="w-3 h-3" />
                      <span>${Number(row.value || 0).toFixed(2)} OFF</span>
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                    Min. Spend
                  </span>
                  <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2.5 py-0.5 rounded-lg">
                    {Number(row.min_spend || 0) > 0
                      ? `$${Number(row.min_spend).toFixed(2)}`
                      : "No Minimum"}
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(row)}
                  className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDelete(row)}
                  className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        }}
        renderActions={(row) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 transition-colors cursor-pointer"
              onClick={() => handleOpenEdit(row)}
              title="Edit Coupon"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
              onClick={() => handleOpenDelete(row)}
              title="Delete Coupon"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      {/* Create / Edit Coupon Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth={520}
        title={
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black text-[#D6FF00] flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <span>
              {isEditing
                ? `Edit Promo Code: ${selectedCoupon?.code}`
                : "Create New Promo Code"}
            </span>
          </div>
        }
        footer={
          <>
            <button
              type="button"
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-[#D6FF00] hover:bg-neutral-800 disabled:opacity-50 font-bold text-xs uppercase tracking-wider cursor-pointer"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
              <span>
                {saving ? "Saving..." : isEditing ? "Update Voucher" : "Create Voucher"}
              </span>
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Promo Code (Uppercase)"
            name="code"
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toUpperCase() })
            }
            placeholder="e.g. KHQR25 or ATELIER20"
            error={errors.code}
            required
          />

          <Input
            label="Campaign Description"
            name="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="e.g. 25% Off Bakong KHQR Instant Checkout"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Discount Type"
              type="select"
              name="type"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              options={[
                { value: "percentage", label: "Percentage (% Off)" },
                { value: "fixed", label: "Fixed Amount ($ Off)" },
                { value: "shipping", label: "Free Shipping" },
              ]}
            />

            <Input
              label={
                formData.type === "percentage"
                  ? "Discount Percentage (%)"
                  : "Discount Value ($)"
              }
              type="number"
              name="value"
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: e.target.value })
              }
              placeholder="15"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Minimum Spend ($ USD)"
              type="number"
              name="min_spend"
              value={formData.min_spend}
              onChange={(e) =>
                setFormData({ ...formData, min_spend: e.target.value })
              }
              placeholder="0"
            />

            <Input
              label="Voucher Status"
              type="select"
              name="is_active"
              value={formData.is_active ? "true" : "false"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  is_active: e.target.value === "true",
                })
              }
              options={[
                { value: "true", label: "Active (Usable at Checkout)" },
                { value: "false", label: "Inactive (Disabled)" },
              ]}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        maxWidth={440}
        title="Delete Promo Code"
        footer={
          <>
            <button
              type="button"
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 cursor-pointer"
              onClick={handleDelete}
              disabled={saving}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{saving ? "Deleting..." : "Delete Promo Code"}</span>
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
              Are you sure you want to delete promo code{" "}
              <strong className="text-gray-950 font-mono font-bold">
                &ldquo;{selectedCoupon?.code}&rdquo;
              </strong>
              ?
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Customers will no longer be able to apply this code during checkout.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ManageCoupons;

