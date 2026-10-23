
const instagramUrl =
  "https://www.instagram.com/tirtheshchocolates.in/";

const facebookUrl =
  "https://www.facebook.com/profile.php?id=61595625515853";

const whatsappUrl =
  "https://wa.me/918668408041?text=" +
  encodeURIComponent(
    "Hello Tirthesh Chocolates! I'd like to know more about your chocolates and available products."
  );

const iconStyle = {
  width: 22,
  height: 22,
  display: "block",
};

export function SocialLinks() {
  return (
    <div className="social-links" aria-label="Follow Tirthesh Chocolates">
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        title="Follow us on Instagram"
      >
        <svg viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.5" cy="6.7" r="1" fill="currentColor" />
        </svg>
      </a>

      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook"
        title="Follow us on Facebook"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
          <path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.2v2.2H7.7V13h2.7v8h3.1Z" />
        </svg>
      </a>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        title="Chat with us on WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="none" style={iconStyle}>
          <path d="M20 11.7a8 8 0 0 1-11.8 7L4 20l1.3-4A8 8 0 1 1 20 11.7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 8.5c.3-.5.6-.5.9-.5l.6 1.5-.7.9c.5 1 1.3 1.8 2.4 2.3l.8-.8 1.5.7c.1.1.1.6-.2 1-.4.5-1 .7-1.6.6-2.6-.5-4.8-2.7-5.3-5.1-.1-.3.3-.9.6-1.1Z" fill="currentColor" />
        </svg>
      </a>
    </div>
  );
}

export function FloatingWhatsApp() {
  return (
    <a
      className="floating-whatsapp"
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Tirthesh Chocolates on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      <svg viewBox="0 0 24 24" fill="none" width="27" height="27">
        <path d="M20 11.7a8 8 0 0 1-11.8 7L4 20l1.3-4A8 8 0 1 1 20 11.7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 8.5c.3-.5.6-.5.9-.5l.6 1.5-.7.9c.5 1 1.3 1.8 2.4 2.3l.8-.8 1.5.7c.1.1.1.6-.2 1-.4.5-1 .7-1.6.6-2.6-.5-4.8-2.7-5.3-5.1-.1-.3.3-.9.6-1.1Z" fill="currentColor" />
      </svg>
    </a>
  );
}
