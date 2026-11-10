import React, { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../../components/common/Input";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Valid email is required.";
    }
    if (!formData.subject.trim()) newErrors.subject = "Subject is required.";
    if (!formData.message.trim()) newErrors.message = "Message cannot be empty.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 600);
  };

  return (
    <div id="contact-page" className="container" style={{ padding: "30px 15px 60px" }}>
      <div className="bg">
        {/* Header */}
        <div className="row">
          <div className="col-sm-12">
            <h2 className="title text-center">Contact <strong>Us</strong></h2>
            <div
              style={{
                height: 240,
                backgroundColor: "#e8ecef",
                borderRadius: 6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 35,
                color: "#6c757d",
                border: "1px solid #dee2e6",
              }}
            >
              <i className="fa fa-map-marker" style={{ fontSize: 36, color: "#fe980f", marginBottom: 10 }}></i>
              <h4 style={{ margin: 0, fontWeight: 600 }}>E-Shopper Global Headquarters</h4>
              <p style={{ margin: "4px 0 0", fontSize: 13 }}>935 W. Webster Ave New Streets, Chicago, IL 60614, United States</p>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Contact Form */}
          <div className="col-sm-8">
            <div className="contact-form">
              <h2 className="title text-center">Get In Touch</h2>

              {submitted && (
                <div className="status alert alert-success" style={{ display: "block", marginBottom: 20 }}>
                  <i className="fa fa-check-circle" style={{ marginRight: 6 }}></i>
                  Thank you for reaching out! Your message has been sent successfully. We will get back to you shortly.
                </div>
              )}

              <form onSubmit={handleSubmit} className="contact-form row">
                <div className="col-md-6">
                  <Input
                    name="name"
                    placeholder="Your Name *"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                  />
                </div>
                <div className="col-md-6">
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email Address *"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                  />
                </div>
                <div className="col-md-12">
                  <Input
                    name="subject"
                    placeholder="Subject *"
                    value={formData.subject}
                    onChange={handleChange}
                    error={errors.subject}
                  />
                </div>
                <div className="col-md-12">
                  <Input
                    name="message"
                    type="textarea"
                    rows={6}
                    placeholder="Your Message Here *"
                    value={formData.message}
                    onChange={handleChange}
                    error={errors.message}
                  />
                </div>
                <div className="col-md-12">
                  <button
                    type="submit"
                    className="btn btn-primary pull-right"
                    disabled={submitting}
                    style={{ backgroundColor: "#fe980f", border: "none", padding: "10px 28px", borderRadius: 0, fontWeight: 600 }}
                  >
                    {submitting ? "Sending..." : "Submit Message"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="col-sm-4">
            <div className="contact-info">
              <h2 className="title text-center">Contact Info</h2>
              <address style={{ lineHeight: 1.8, color: "#696763", fontSize: 14 }}>
                <p style={{ fontWeight: 700, color: "#363432", margin: "0 0 6px 0" }}>E-Shopper Inc.</p>
                <p style={{ margin: "2px 0" }}>935 W. Webster Ave New Streets</p>
                <p style={{ margin: "2px 0" }}>Chicago, IL 60614, NY</p>
                <p style={{ margin: "2px 0" }}>New York, United States</p>
                <p style={{ margin: "6px 0 2px" }}><strong>Mobile:</strong> +2346 17 38 93</p>
                <p style={{ margin: "2px 0" }}><strong>Fax:</strong> 1-714-252-0026</p>
                <p style={{ margin: "2px 0" }}><strong>Email:</strong> info@e-shopper.com</p>
              </address>

              <div className="social-networks" style={{ marginTop: 25 }}>
                <h2 className="title text-center">Social Networking</h2>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", gap: 12, justifyContent: "center" }}>
                  <li>
                    <a href="#facebook" style={{ width: 36, height: 36, background: "#f5f5ed", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#696763", borderRadius: 4 }}>
                      <i className="fa fa-facebook"></i>
                    </a>
                  </li>
                  <li>
                    <a href="#twitter" style={{ width: 36, height: 36, background: "#f5f5ed", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#696763", borderRadius: 4 }}>
                      <i className="fa fa-twitter"></i>
                    </a>
                  </li>
                  <li>
                    <a href="#google-plus" style={{ width: 36, height: 36, background: "#f5f5ed", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#696763", borderRadius: 4 }}>
                      <i className="fa fa-google-plus"></i>
                    </a>
                  </li>
                  <li>
                    <a href="#youtube" style={{ width: 36, height: 36, background: "#f5f5ed", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#696763", borderRadius: 4 }}>
                      <i className="fa fa-youtube"></i>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;

