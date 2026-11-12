import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  FolderTree,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Check,
  Layers,
  UploadCloud,
  Image as ImageIcon,
} from "lucide-react";
import { categoryService } from "../../services/categoryService";
import { productService } from "../../services/productService";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";

const DEFAULT_CATEGORY_IMAGE = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80";

export function ManageCategories() {
  const cachedCats = categoryService.getCachedCategories();
  const [categories, setCategories] = useState(cachedCats);
  const [loading, setLoading] = useState(cachedCats.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Active",
    image: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WEBP, GIF).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Image file size should not exceed 10MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const uploadedUrl = await productService.uploadImage(file);
      setFormData((prev) => ({ ...prev, image: uploadedUrl }));
      showNotification("Category image uploaded successfully!");
    } catch (err) {
      console.warn("Upload to backend media failed, falling back to local base64 preview:", err);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({ ...prev, image: e.target.result }));
        showNotification("Category image loaded successfully!");
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const loadCategories = async (silent = false) => {
    if (!silent && categories.length === 0) setLoading(true);
    else setIsRefreshing(true);
    try {
      const list = await categoryService.getCategories();
      setCategories(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCategories(cachedCats.length > 0);
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedCategory(null);
    setFormData({ name: "", description: "", status: "Active", image: "" });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setIsEditing(true);
    setSelectedCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || "",
      status: cat.status || "Active",
      image: cat.image || "",
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenDelete = (cat) => {
    setSelectedCategory(cat);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrors({ name: "Category name is required." });
      return;
    }

    setSaving(true);
    try {
      if (isEditing && selectedCategory) {
        await categoryService.updateCategory(selectedCategory.id, formData);
        showNotification(`Category "${formData.name}" updated!`);
      } else {
        await categoryService.createCategory(formData);
        showNotification(`Category "${formData.name}" created!`);
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    setSaving(true);
    try {
      await categoryService.deleteCategory(selectedCategory.id);
      showNotification(`Category "${selectedCategory.name}" deleted.`);
      setIsDeleteModalOpen(false);
      loadCategories();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "ID",
      key: "id",
      width: 90,
      render: (item, idx) => {
        const num = String((idx ?? 0) + 1).padStart(2, "0");
        return (
          <span
            title={`Supabase ID: ${item.id}`}
            className="font-mono text-[11px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md"
          >
            #CAT-{num}
          </span>
        );
      },
    },
    {
      title: "Category",
      key: "name",
      render: (item) => (
        <div className="flex items-center gap-3">
          <img
            src={item.image || DEFAULT_CATEGORY_IMAGE}
            alt={item.name}
            className="w-10 h-10 rounded-xl object-cover border border-gray-200 bg-gray-50 shadow-2xs shrink-0"
            onError={(e) => {
              e.target.src = DEFAULT_CATEGORY_IMAGE;
            }}
          />
          <div>
            <strong className="block text-gray-900 text-xs sm:text-sm font-bold">{item.name}</strong>
            <span className="text-[11px] text-gray-400 font-mono">slug: /{item.slug || item.name.toLowerCase()}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Description",
      key: "description",
      render: (item) => (
        <span className="text-xs text-gray-600 max-w-xs truncate block">
          {item.description || "No description provided"}
        </span>
      ),
    },
    {
      title: "Pieces Count",
      key: "itemCount",
      render: (item) => (
        <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
          {item.itemCount || 0} items
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
  ];

  if (loading && categories.length === 0) {
    return <Loader message="Loading categories catalog..." />;
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
            <span className="text-gray-800 font-bold">Categories</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-gray-950 tracking-tight">
            Product Categories
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Organize customer collections (Women, Men, Shoes, Bags, Accessories).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#111111] text-[#D6FF00] hover:bg-neutral-800 transition-all font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Category</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        searchKey="name"
        searchPlaceholder="Search categories..."
        itemsPerPage={8}
        renderMobileCard={(item, idx) => (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={item.image || DEFAULT_CATEGORY_IMAGE}
                  alt={item.name}
                  className="w-12 h-12 rounded-xl object-cover border border-gray-200 bg-gray-50 shrink-0"
                  onError={(e) => {
                    e.target.src = DEFAULT_CATEGORY_IMAGE;
                  }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      #CAT-{String((idx ?? 0) + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.status === "Active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.status || "Active"}
                    </span>
                  </div>
                  <strong className="block text-gray-900 text-sm font-bold truncate mt-0.5">
                    {item.name}
                  </strong>
                  <span className="text-[11px] text-gray-400 font-mono block truncate">
                    /{item.slug || item.name.toLowerCase()}
                  </span>
                </div>
              </div>

              <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
                {item.itemCount || 0} items
              </span>
            </div>

            {item.description && (
              <p className="text-xs text-gray-500 line-clamp-2 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                {item.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handleOpenEdit(item)}
                className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Category</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenDelete(item)}
                className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
        renderActions={(item) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 transition-colors cursor-pointer"
              title="Edit Category"
              onClick={() => handleOpenEdit(item)}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
              title="Delete Category"
              onClick={() => handleOpenDelete(item)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth={520}
        title={
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black text-[#D6FF00] flex items-center justify-center shrink-0">
              <FolderTree className="w-4 h-4" />
            </div>
            <span>{isEditing ? `Edit: ${selectedCategory?.name}` : "Create New Category"}</span>
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
              disabled={saving || uploadingImage}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-[#D6FF00] hover:bg-neutral-800 disabled:opacity-50 font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
              <span>{isEditing ? "Save Changes" : "Create Category"}</span>
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. Outerwear, Leather Accessories"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />

          {/* Category Image Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-800">
                Category Image
              </label>
              {formData.image && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Image Ready</span>
                </span>
              )}
            </div>

            {formData.image ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50/70 p-3 flex items-center gap-3.5">
                <img
                  src={formData.image}
                  alt="Category Preview"
                  className="w-16 h-16 rounded-xl object-cover border border-gray-200 bg-white shadow-xs shrink-0"
                  onError={(e) => {
                    e.target.src = DEFAULT_CATEGORY_IMAGE;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-gray-900 truncate">
                    Category Cover Photo Attached
                  </span>
                  <span className="text-[11px] text-gray-500 block truncate">
                    Ready to publish to storefront
                  </span>
                  <div className="flex items-center gap-2.5 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Replace Image
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-black bg-neutral-100"
                    : "border-gray-300 hover:border-black bg-gray-50/50 hover:bg-white"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-gray-700 mb-2">
                  {uploadingImage ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <UploadCloud className="w-5 h-5" />
                  )}
                </div>
                <div className="text-xs font-bold text-gray-900">
                  {uploadingImage ? "Uploading image..." : "Click to upload or drag & drop image"}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Select a category cover image from your computer
                </p>
                <span className="inline-block mt-2 px-2.5 py-1 rounded-md bg-neutral-100 text-[10px] font-bold text-neutral-700 uppercase tracking-wider">
                  PNG, JPG, WEBP (Max 10MB)
                </span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/15 font-semibold"
            >
              <option value="Active">🟢 Active (Visible)</option>
              <option value="Inactive">⚪ Inactive (Hidden)</option>
            </select>
          </div>

          <Input
            label="Description"
            placeholder="Brief editorial summary of this fashion department..."
            type="textarea"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        maxWidth={440}
        title="Confirm Category Deletion"
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
              <span>{saving ? "Deleting..." : "Delete Category"}</span>
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
              Are you sure you want to delete category{" "}
              <strong className="text-gray-950 font-bold">&ldquo;{selectedCategory?.name}&rdquo;</strong>?
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ManageCategories;
