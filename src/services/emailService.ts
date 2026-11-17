/**
 * ATELIER PARIS — HAUTE COUTURE TRANSACTIONAL CUSTOMER EMAIL SERVICE
 * Supports Resend, Brevo (Sendinblue), EmailJS, and Mailto Fallback.
 */

import { useStoreSettings } from "../store/useStoreSettings";

export interface EmailOrderPayload {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
    image?: string;
  }>;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  trackingUrl?: string;
  createdAt?: string;
}

export interface EmailSendResult {
  success: boolean;
  configured: boolean;
  provider?: "resend" | "brevo" | "emailjs" | "simulated" | "mailto";
  message: string;
  details?: string;
}

export const emailService = {
  /**
   * Generates a luxury responsive HTML email template for order confirmations.
   */
  generateReceiptHtml: (order: EmailOrderPayload): string => {
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://youngsteav.site";

    const trackingLink =
      order.trackingUrl || `${origin}/track?id=${encodeURIComponent(order.orderNumber)}`;

    const itemsHtml = (order.items || [])
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #EEEEEE;">
            <div style="font-weight: 700; font-size: 13px; color: #111111; text-transform: uppercase; letter-spacing: 0.5px;">
              ${item.name}
            </div>
            <div style="font-size: 11px; color: #777777; margin-top: 3px;">
              ${item.size ? `Size: ${item.size}` : ""} ${item.color ? `• Color: ${item.color}` : ""} • Qty: ${item.quantity}
            </div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #EEEEEE; text-align: right; font-weight: 700; font-size: 13px; color: #111111;">
            $${(Number(item.price) * (Number(item.quantity) || 1)).toFixed(2)}
          </td>
        </tr>
      `
      )
      .join("");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation #${order.orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F8F8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111111;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F8F8; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #EAEAEA;">
          
          <!-- Brand Header -->
          <tr>
            <td style="background-color: #111111; padding: 32px 40px; text-align: center;">
              <div style="color: #D6FF00; font-size: 24px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase;">
                ✦ ATELIER PARIS ✦
              </div>
              <div style="color: #A0A0A0; font-size: 10px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; margin-top: 6px;">
                Haute Couture • Flagship Studio
              </div>
            </td>
          </tr>

          <!-- Greeting & Order Status Banner -->
          <tr>
            <td style="padding: 36px 40px 24px 40px;">
              <div style="display: inline-block; padding: 4px 12px; background-color: #F0FDF4; border: 1px solid #DCFCE7; border-radius: 999px; color: #166534; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">
                ✓ Order Confirmed &amp; Dispatched to Atelier
              </div>
              <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 900; color: #111111; text-transform: uppercase; letter-spacing: 0.5px;">
                Thank You, ${order.customerName}!
              </h1>
              <p style="margin: 0; font-size: 13px; line-height: 20px; color: #555555;">
                Your runway acquisition has been accepted by our master craft atelier. Below is your official digital dispatch receipt and logistics voucher.
              </p>
            </td>
          </tr>

          <!-- Order Reference Block -->
          <tr>
            <td style="padding: 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAFAFA; border: 1px solid #EEEEEE; border-radius: 12px; padding: 16px;">
                <tr>
                  <td width="50%" style="font-size: 11px; color: #777777; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                    Order Identifier:
                    <div style="font-size: 14px; font-weight: 800; color: #111111; margin-top: 3px; font-family: monospace;">
                      #${order.orderNumber}
                    </div>
                  </td>
                  <td width="50%" style="font-size: 11px; color: #777777; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; text-align: right;">
                    Payment Mode:
                    <div style="font-size: 13px; font-weight: 800; color: #111111; margin-top: 3px;">
                      ${order.paymentMethod}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Itemized Pieces List -->
          <tr>
            <td style="padding: 28px 40px 10px 40px;">
              <div style="font-size: 11px; font-weight: 800; color: #999999; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
                Acquired Runway SKUs
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- Financial Totals -->
          <tr>
            <td style="padding: 10px 40px 24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 12px; color: #555555; line-height: 24px;">
                <tr>
                  <td>Catalog Subtotal:</td>
                  <td style="text-align: right; font-weight: 600; color: #111111;">$${Number(order.subtotal).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Worldwide Shipping:</td>
                  <td style="text-align: right; font-weight: 700; color: ${order.shippingFee === 0 ? "#16a34a" : "#111111"};">
                    ${order.shippingFee === 0 ? "COMPLIMENTARY ($0.00)" : `$${Number(order.shippingFee).toFixed(2)}`}
                  </td>
                </tr>
                ${
                  order.discount > 0
                    ? `
                <tr>
                  <td>Promo Privilege:</td>
                  <td style="text-align: right; font-weight: 700; color: #16a34a;">-$${Number(order.discount).toFixed(2)}</td>
                </tr>
                `
                    : ""
                }
                <tr style="border-top: 2px solid #111111; font-size: 16px; font-weight: 900; color: #111111;">
                  <td style="padding-top: 10px;">Grand Settlement:</td>
                  <td style="padding-top: 10px; text-align: right; color: #111111;">$${Number(order.total).toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Address -->
          <tr>
            <td style="padding: 0 40px 28px 40px;">
              <div style="background-color: #FAFAFA; border: 1px solid #EEEEEE; border-radius: 12px; padding: 16px;">
                <div style="font-size: 10px; font-weight: 800; color: #999999; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">
                  Delivery Destination
                </div>
                <div style="font-size: 12px; font-weight: 700; color: #111111;">
                  ${order.shippingAddress}
                </div>
              </div>
            </td>
          </tr>

          <!-- Live Tracking CTA -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="${trackingLink}" style="display: block; width: 100%; max-width: 320px; margin: 0 auto; background-color: #111111; color: #D6FF00; text-decoration: none; padding: 16px 24px; border-radius: 12px; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; text-align: center;">
                Track Runway Dispatch ➔
              </a>
              <div style="font-size: 11px; color: #888888; margin-top: 12px;">
                Live 5-stage logistics tracking and digital invoice generation available 24/7.
              </div>
            </td>
          </tr>

          <!-- Footer & Concierge -->
          <tr>
            <td style="background-color: #F8F8F8; border-top: 1px solid #EAEAEA; padding: 24px 40px; text-align: center; font-size: 11px; color: #777777; line-height: 18px;">
              <div style="font-weight: 700; color: #111111; margin-bottom: 4px;">
                ATELIER PARIS CONCIERGE &amp; CLIENT SERVICES
              </div>
              <div>Phone: +855 96 835 0317 • Email: concierge@atelier.com</div>
              <div style="margin-top: 10px; color: #AAAAAA; font-size: 10px;">
                © ${new Date().getFullYear()} ATELIER PARIS. All Rights Reserved. VAT REG: KH-8840291-A
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  },

  /**
   * Generates a mailto: link prefilled with order details to send via the user's default email client.
   */
  generateMailtoUrl: (order: EmailOrderPayload): string => {
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://youngsteav.site";
    const trackingLink = `${origin}/track?id=${encodeURIComponent(order.orderNumber)}`;
    const subject = encodeURIComponent(
      `✦ Order Confirmation #${order.orderNumber} — ATELIER PARIS`
    );
    const body = encodeURIComponent(
      `Dear ${order.customerName},\n\n` +
        `Thank you for your order with ATELIER PARIS.\n\n` +
        `Order Number: #${order.orderNumber}\n` +
        `Payment Method: ${order.paymentMethod}\n` +
        `Total: $${Number(order.total).toFixed(2)}\n` +
        `Shipping Address: ${order.shippingAddress}\n\n` +
        `Track your runway order in real-time:\n` +
        `${trackingLink}\n\n` +
        `Best regards,\n` +
        `ATELIER PARIS Concierge`
    );
    return `mailto:${order.customerEmail}?subject=${subject}&body=${body}`;
  },

  /**
   * Dispatches the automated customer confirmation email using the best configured provider:
   * 1. Brevo (Sendinblue) Direct REST API (300 free emails/day)
   * 2. EmailJS REST API (200 free emails/month, 0 CORS)
   * 3. Resend API (via local proxy or direct)
   */
  sendCustomerOrderConfirmation: async (
    order: EmailOrderPayload
  ): Promise<EmailSendResult> => {
    const env = (import.meta as any).env || {};
    const settings = useStoreSettings.getState() || {};

    const resendKey =
      String(settings.resendApiKey || env.VITE_RESEND_API_KEY || "").trim();
    const brevoKey =
      String(settings.brevoApiKey || env.VITE_BREVO_API_KEY || "").trim();
    const emailJsService =
      String(settings.emailJsServiceId || env.VITE_EMAILJS_SERVICE_ID || "").trim();
    const emailJsTemplate =
      String(settings.emailJsTemplateId || env.VITE_EMAILJS_TEMPLATE_ID || "").trim();
    const emailJsKey =
      String(settings.emailJsPublicKey || env.VITE_EMAILJS_PUBLIC_KEY || "").trim();

    const htmlContent = emailService.generateReceiptHtml(order);

    // 1. Try Brevo (Sendinblue) Transactional API (Supports direct browser fetch with API Key)
    if (brevoKey) {
      try {
        const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": brevoKey,
          },
          body: JSON.stringify({
            sender: {
              name: settings.storeName || "ATELIER PARIS",
              email: settings.storeEmail || "concierge@atelier.com",
            },
            to: [{ email: order.customerEmail, name: order.customerName }],
            subject: `✦ Runway Order Confirmation #${order.orderNumber} | ATELIER PARIS`,
            htmlContent: htmlContent,
          }),
        });

        if (resp.ok) {
          return {
            success: true,
            configured: true,
            provider: "brevo",
            message: `Official confirmation email delivered to ${order.customerEmail} via Brevo!`,
          };
        } else {
          const errData = await resp.json().catch(() => ({}));
          console.warn("[Email Brevo Error]:", errData);
        }
      } catch (err: any) {
        console.warn("[Email Brevo Fetch Error]:", err?.message || err);
      }
    }

    // 2. Try EmailJS (Built for client-side JavaScript)
    if (emailJsService && emailJsTemplate && emailJsKey) {
      try {
        const origin =
          typeof window !== "undefined" && window.location.origin
            ? window.location.origin
            : "https://youngsteav.site";

        const resp = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service_id: emailJsService,
            template_id: emailJsTemplate,
            user_id: emailJsKey,
            template_params: {
              to_name: order.customerName,
              to_email: order.customerEmail,
              order_number: order.orderNumber,
              total: `$${Number(order.total).toFixed(2)}`,
              shipping_address: order.shippingAddress,
              tracking_url: `${origin}/track?id=${encodeURIComponent(order.orderNumber)}`,
            },
          }),
        });

        if (resp.ok) {
          return {
            success: true,
            configured: true,
            provider: "emailjs",
            message: `Confirmation email delivered to ${order.customerEmail} via EmailJS!`,
          };
        }
      } catch (err: any) {
        console.warn("[Email EmailJS Error]:", err?.message || err);
      }
    }

    // 3. Try Resend (supports /resend-api in development or direct)
    if (resendKey) {
      try {
        const endpoint =
          typeof window !== "undefined" &&
          (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1")
            ? "/resend-api/emails"
            : "https://api.resend.com/emails";

        const resp = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "ATELIER Concierge <onboarding@resend.dev>",
            to: [order.customerEmail],
            subject: `✦ Runway Order Confirmation #${order.orderNumber} | ATELIER PARIS`,
            html: htmlContent,
          }),
        });

        if (resp.ok) {
          return {
            success: true,
            configured: true,
            provider: "resend",
            message: `Confirmation email dispatched to ${order.customerEmail} via Resend!`,
          };
        } else {
          const errData = await resp.json().catch(() => ({}));
          console.warn("[Email Resend Note]:", errData);
        }
      } catch (err: any) {
        console.warn("[Email Resend Fetch Error]:", err?.message || err);
      }
    }

    // 4. Fallback: Provider not configured yet
    console.log(
      `%c[Email Service Notice] Customer email not delivered: No Email API Key (Resend, Brevo, or EmailJS) is configured in Admin Settings or .env.`,
      "color: #f59e0b; font-weight: bold; padding: 4px;"
    );

    return {
      success: false,
      configured: false,
      provider: "simulated",
      message: `Email dispatch pending: Please configure an Email Provider (Brevo, Resend, or EmailJS) in Admin Settings.`,
      details: emailService.generateMailtoUrl(order),
    };
  },
};
