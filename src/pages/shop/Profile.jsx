import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { orderService } from "../../services/orderService";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";

function Profile() {
  const { user, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    country: user?.country || "",
  });

  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        country: user.country || "",
      });

      // Fetch customer orders
      const fetchOrders = async () => {
        try {
          const orders = await orderService.getOrdersByCustomer(user.email);
          setUserOrders(orders);
        } catch (e) {
          console.error("Failed to fetch customer orders", e);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("Name cannot be empty.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await updateProfile(formData);
      setSuccessMsg("Profile information updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      city: user?.city || "",
      country: user?.country || "",
    });
    setIsEditing(false);
    setErrorMsg("");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Delivered":
        return <span className="badge-custom badge-delivered">Delivered</span>;
      case "Shipped":
        return <span className="badge-custom badge-shipped">Shipped</span>;
      case "Processing":
        return <span className="badge-custom badge-pending">Processing</span>;
      case "Cancelled":
        return <span className="badge-custom badge-cancelled">Cancelled</span>;
      default:
        return <span className="badge-custom badge-pending">Pending</span>;
    }
  };

  return (
    <div className="container" style={{ padding: "40px 15px 60px" }}>
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <ol className="breadcrumb">
          <li><Link to="/">Home</Link></li>
          <li className="active">My Account &amp; Profile</li>
        </ol>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ fontSize: 13, marginBottom: 20 }}>
          <i className="fa fa-check-circle" style={{ marginRight: 6 }}></i>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger" style={{ fontSize: 13, marginBottom: 20 }}>
          <i className="fa fa-exclamation-triangle" style={{ marginRight: 6 }}></i>
          {errorMsg}
        </div>
      )}

      <div className="row">
        {/* Profile Card */}
        <div className="col-sm-4">
          <div style={{ background: "#fff", border: "1px solid #e8e8e0", borderRadius: 6, padding: "30px 20px", textAlign: "center", marginBottom: 24 }}>
            <img
              src={user?.avatar || "/admin/img/avatars/avatar-2.jpg"}
              alt="Avatar"
              style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", border: "3px solid #fe980f", marginBottom: 16 }}
            />
            <h3 style={{ margin: "0 0 6px 0", fontSize: 20, color: "#363432", fontWeight: 700 }}>
              {user?.name || "Customer User"}
            </h3>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 14 }}>{user?.email}</p>
            <span className="badge-custom badge-active" style={{ fontSize: 12 }}>
              {user?.role?.toUpperCase()} ACCOUNT
            </span>

            <div style={{ marginTop: 24, borderTop: "1px solid #eee", paddingTop: 16, textAlign: "left", fontSize: 13 }}>
              <p style={{ margin: "6px 0", color: "#666" }}>
                <i className="fa fa-phone" style={{ width: 20, color: "#fe980f" }}></i>
                {user?.phone || "Not provided"}
              </p>
              <p style={{ margin: "6px 0", color: "#666" }}>
                <i className="fa fa-map-marker" style={{ width: 20, color: "#fe980f" }}></i>
                {user?.address ? `${user.address}, ${user.city || ""}` : "No address saved"}
              </p>
              <p style={{ margin: "6px 0", color: "#666" }}>
                <i className="fa fa-calendar" style={{ width: 20, color: "#fe980f" }}></i>
                Member since {user?.registeredDate || "2025"}
              </p>
            </div>

            {!isEditing && (
              <button
                type="button"
                className="btn btn-default add-to-cart"
                onClick={() => setIsEditing(true)}
                style={{ width: "100%", marginTop: 20 }}
              >
                <i className="fa fa-pencil" style={{ marginRight: 6 }}></i>
                Edit Profile Details
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Edit Form or Details & Order History */}
        <div className="col-sm-8">
          {isEditing ? (
            <div style={{ background: "#fff", border: "1px solid #e8e8e0", borderRadius: 6, padding: "26px 28px", marginBottom: 30 }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: 18, fontWeight: 700, color: "#363432" }}>
                Update Personal Information
              </h3>

              <form onSubmit={handleSave}>
                <div className="row">
                  <div className="col-sm-6">
                    <Input
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-sm-6">
                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      disabled
                      helperText="Email cannot be modified in demo mode."
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-sm-6">
                    <Input
                      label="Phone Number"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-sm-6">
                    <Input
                      label="Country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-sm-8">
                    <Input
                      label="Street Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-sm-4">
                    <Input
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button
                    type="submit"
                    className="btn btn-default add-to-cart"
                    disabled={saving}
                    style={{ margin: 0 }}
                  >
                    {saving ? "Saving Changes..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-default"
                    onClick={handleCancel}
                    style={{ background: "#f5f5ed", color: "#696763" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {/* Past Orders Table */}
          <div style={{ background: "#fff", border: "1px solid #e8e8e0", borderRadius: 6, padding: "24px 26px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 700, color: "#363432" }}>
              My Order History ({userOrders.length})
            </h3>

            {loadingOrders ? (
              <Loader message="Loading order history..." />
            ) : userOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#888" }}>
                <i className="fa fa-shopping-bag" style={{ fontSize: 36, marginBottom: 12, display: "block" }}></i>
                <p>You have not placed any orders yet.</p>
                <Link to="/shop" className="btn btn-default add-to-cart">
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover" style={{ fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th>Order #</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userOrders.map((ord) => (
                      <tr key={ord.id}>
                        <td><strong>{ord.orderNumber}</strong></td>
                        <td>{ord.date}</td>
                        <td>{ord.items?.length || 0} product(s)</td>
                        <td style={{ fontWeight: 600, color: "#fe980f" }}>${ord.total}</td>
                        <td>{getStatusBadge(ord.orderStatus)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;

